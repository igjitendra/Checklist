// Cloudflare Pages Function: POST /api/download
// 1) Verifies Cloudflare Turnstile token (bot protection)
// 2) Logs the lead (incl. WhatsApp) to a Google Sheet (via Apps Script webhook)
// 3) Returns a short-lived signed URL to /api/file for the chosen format (pdf|jpg)
//
// Bindings & env vars (Cloudflare Pages dashboard):
//   TEMPLATES        -> R2 bucket binding (holds "<fileBase>.pdf" and "<fileBase>.jpg")
//   TURNSTILE_SECRET -> Turnstile secret key
//   GSHEET_WEBHOOK   -> Google Apps Script Web App URL
//   PUBLIC_BASE      -> site origin, e.g. https://checklist.example.com

interface Env {
  TEMPLATES: R2Bucket;
  TURNSTILE_SECRET: string;
  GSHEET_WEBHOOK: string;
  PUBLIC_BASE: string;
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  let body: any;
  try { body = await request.json(); } catch { return json({ error: 'Invalid request.' }, 400); }

  const { name, email, whatsapp, purpose, fileBase, template, turnstile } = body || {};
  const format = (body?.format === 'jpg' ? 'jpg' : 'pdf');
  if (!name || !email || !whatsapp || !fileBase) return json({ error: 'Name, email, WhatsApp and template are required.' }, 400);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: 'Please enter a valid email.' }, 400);
  if ((String(whatsapp).replace(/\D/g, '')).length < 8) return json({ error: 'Please enter a valid WhatsApp number.' }, 400);

  const fileKey = `${fileBase}.${format}`;

  // 1) Verify Turnstile
  if (env.TURNSTILE_SECRET) {
    const form = new FormData();
    form.append('secret', env.TURNSTILE_SECRET);
    form.append('response', turnstile || '');
    const ip = request.headers.get('CF-Connecting-IP');
    if (ip) form.append('remoteip', ip);
    const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form });
    const outcome: any = await verify.json();
    if (!outcome.success) return json({ error: 'Bot verification failed. Please try again.' }, 403);
  }

  // 2) Log lead to Google Sheet
  if (env.GSHEET_WEBHOOK) {
    try {
      await fetch(env.GSHEET_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, email, whatsapp, purpose: purpose || '', template: template || fileBase,
          fileKey, format, date: new Date().toISOString(),
          ip: request.headers.get('CF-Connecting-IP') || '',
        }),
      });
    } catch (e) { console.error('Sheet log failed', e); }
  }

  // 3) Signed, expiring link to /api/file
  const exp = Date.now() + 5 * 60 * 1000; // 5 minutes
  const token = await sign(`${fileKey}:${exp}`, env.TURNSTILE_SECRET || 'dev-secret');
  const base = env.PUBLIC_BASE || new URL(request.url).origin;
  const url = `${base}/api/file?key=${encodeURIComponent(fileKey)}&exp=${exp}&sig=${token}`;
  return json({ url });
};

async function sign(data: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sigBuf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

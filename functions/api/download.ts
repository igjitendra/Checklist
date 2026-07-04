// Cloudflare Pages Function: POST /api/download
// 1) Verifies Cloudflare Turnstile token (bot protection)
// 2) Logs the lead to a Google Sheet (via Google Apps Script webhook)
// 3) Returns a one-time download URL for the gated template file (from R2)
//
// Bindings & env vars to set in Cloudflare Pages dashboard:
//   TEMPLATES        -> R2 bucket binding holding your private template files
//   TURNSTILE_SECRET -> Turnstile secret key (server-side)
//   GSHEET_WEBHOOK   -> Google Apps Script Web App URL (logs leads to your sheet)
//   PUBLIC_BASE      -> your site origin, e.g. https://checklist.example.com

interface Env {
  TEMPLATES: R2Bucket;
  TURNSTILE_SECRET: string;
  GSHEET_WEBHOOK: string;
  PUBLIC_BASE: string;
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request.' }, 400);
  }

  const { name, email, purpose, fileKey, template, turnstile } = body || {};
  if (!name || !email || !fileKey) {
    return json({ error: 'Name, email and file are required.' }, 400);
  }
  // basic email sanity check
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return json({ error: 'Please enter a valid email.' }, 400);
  }

  // 1) Verify Turnstile (skip only if not configured)
  if (env.TURNSTILE_SECRET) {
    const form = new FormData();
    form.append('secret', env.TURNSTILE_SECRET);
    form.append('response', turnstile || '');
    const ip = request.headers.get('CF-Connecting-IP');
    if (ip) form.append('remoteip', ip);
    const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: form,
    });
    const outcome: any = await verify.json();
    if (!outcome.success) {
      return json({ error: 'Bot verification failed. Please try again.' }, 403);
    }
  }

  // 2) Log lead to Google Sheet (non-blocking failure is tolerated)
  if (env.GSHEET_WEBHOOK) {
    try {
      await fetch(env.GSHEET_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          purpose: purpose || '',
          template: template || fileKey,
          fileKey,
          date: new Date().toISOString(),
          ip: request.headers.get('CF-Connecting-IP') || '',
        }),
      });
    } catch (e) {
      // Do not block the download if logging fails; you may log to console.
      console.error('Sheet log failed', e);
    }
  }

  // 3) Serve the gated file from R2 via a short-lived signed link (our own token route)
  // We create a signed, expiring token and return a URL to /api/file that streams it.
  const exp = Date.now() + 5 * 60 * 1000; // 5 minutes
  const token = await sign(`${fileKey}:${exp}`, env.TURNSTILE_SECRET || 'dev-secret');
  const base = env.PUBLIC_BASE || new URL(request.url).origin;
  const url = `${base}/api/file?key=${encodeURIComponent(fileKey)}&exp=${exp}&sig=${token}`;

  return json({ url });
};

// Simple HMAC-SHA256 signing using Web Crypto (available in Workers runtime)
async function sign(data: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sigBuf)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

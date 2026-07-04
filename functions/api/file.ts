// Cloudflare Pages Function: GET /api/file?key=...&exp=...&sig=...
// Validates the short-lived signature, then streams the gated file (pdf or jpg)
// from the private R2 bucket. Keeps full-quality files OUT of the public site.

interface Env {
  TEMPLATES: R2Bucket;
  TURNSTILE_SECRET: string;
}

const MIME: Record<string, string> = { pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg' };

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const key = url.searchParams.get('key') || '';
  const exp = Number(url.searchParams.get('exp') || '0');
  const sig = url.searchParams.get('sig') || '';

  if (!key || !exp || !sig) return new Response('Bad request', { status: 400 });
  if (Date.now() > exp) return new Response('Link expired', { status: 410 });

  const expected = await sign(`${key}:${exp}`, env.TURNSTILE_SECRET || 'dev-secret');
  if (expected !== sig) return new Response('Invalid signature', { status: 403 });

  const obj = await env.TEMPLATES.get(key);
  if (!obj) return new Response('File not found', { status: 404 });

  const ext = key.split('.').pop()?.toLowerCase() || 'pdf';
  const headers = new Headers();
  headers.set('Content-Type', obj.httpMetadata?.contentType || MIME[ext] || 'application/octet-stream');
  headers.set('Content-Disposition', `attachment; filename="${key}"`);
  headers.set('Cache-Control', 'no-store');
  return new Response(obj.body, { headers });
};

async function sign(data: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sigBuf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

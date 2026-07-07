// Cloudflare Pages Function: POST /api/download
// Handles gated download form submission.
//
// Required env/secrets:
//   GSHEET_WEBHOOK           -> Google Apps Script Web App URL
//   TURNSTILE_SECRET         -> Cloudflare Turnstile Secret Key
//
// Optional:
//   If TURNSTILE_SECRET is missing, this returns a clear JSON error instead of crashing.

interface Env {
  GSHEET_WEBHOOK?: string;
  TURNSTILE_SECRET?: string;
}

type DownloadInput = {
  name?: string;
  email?: string;
  whatsapp?: string;
  purpose?: string;
  format?: string;
  fileBase?: string;
  template?: string;
  turnstile?: string;
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });

function cleanText(input: unknown, max = 500): string {
  return String(input || '').trim().slice(0, max);
}

function slugify(input: unknown): string {
  return String(input || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function normalizeFormat(input: unknown): 'pdf' | 'jpg' {
  const f = String(input || '').toLowerCase().trim();
  if (f === 'jpg' || f === 'jpeg') return 'jpg';
  return 'pdf';
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function verifyTurnstile(secret: string, token: string, ip: string) {
  const body = new FormData();
  body.append('secret', secret);
  body.append('response', token);
  if (ip) body.append('remoteip', ip);

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body,
  });

  return res.json() as Promise<{
    success: boolean;
    'error-codes'?: string[];
  }>;
}

async function sendToGoogleSheet(webhook: string, payload: Record<string, unknown>) {
  const res = await fetch(webhook, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  // Google Apps Script often returns 200 with JSON.
  // If not JSON, don't crash.
  let out: unknown = null;
  try {
    out = await res.json();
  } catch {
    out = await res.text().catch(() => '');
  }

  return {
    ok: res.ok,
    status: res.status,
    response: out,
  };
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    if (!env.GSHEET_WEBHOOK) {
      return json(
        {
          error: 'GSHEET_WEBHOOK is missing in Cloudflare Variables and secrets.',
        },
        500
      );
    }

    if (!env.TURNSTILE_SECRET) {
      return json(
        {
          error: 'TURNSTILE_SECRET is missing in Cloudflare Variables and secrets.',
        },
        500
      );
    }

    let input: DownloadInput;

    try {
      input = (await request.json()) as DownloadInput;
    } catch {
      return json({ error: 'Invalid JSON body.' }, 400);
    }

    const name = cleanText(input.name, 120);
    const email = cleanText(input.email, 180).toLowerCase();
    const whatsapp = cleanText(input.whatsapp, 60);
    const purpose = cleanText(input.purpose, 120);
    const template = cleanText(input.template, 300);
    const fileBase = slugify(input.fileBase);
    const format = normalizeFormat(input.format);
    const turnstile = cleanText(input.turnstile, 3000);

    if (!name) return json({ error: 'Name is required.' }, 400);
    if (!email || !isValidEmail(email)) return json({ error: 'Valid email is required.' }, 400);
    if (!whatsapp || whatsapp.replace(/\D/g, '').length < 8) {
      return json({ error: 'Valid WhatsApp number is required.' }, 400);
    }
    if (!fileBase) return json({ error: 'fileBase is required.' }, 400);
    if (!turnstile) return json({ error: 'Turnstile verification is required.' }, 400);

    const ip =
      request.headers.get('CF-Connecting-IP') ||
      request.headers.get('X-Forwarded-For') ||
      '';

    const turnstileResult = await verifyTurnstile(env.TURNSTILE_SECRET, turnstile, ip);

    if (!turnstileResult.success) {
      return json(
        {
          error: 'Turnstile verification failed.',
          codes: turnstileResult['error-codes'] || [],
        },
        403
      );
    }

    const fileKey = `${fileBase}.${format}`;

    const leadPayload = {
      date: new Date().toISOString(),
      name,
      email,
      whatsapp,
      purpose,
      template,
      format,
      fileKey,
      ip,
    };

    const sheetResult = await sendToGoogleSheet(env.GSHEET_WEBHOOK, leadPayload);

    if (!sheetResult.ok) {
      return json(
        {
          error: 'Google Sheet webhook failed.',
          detail: sheetResult,
        },
        502
      );
    }

    const url = `/api/file?key=${encodeURIComponent(fileKey)}`;

    return json({
      ok: true,
      url,
      fileKey,
    });
  } catch (err) {
    return json(
      {
        error: 'Server error in /api/download.',
        detail: err instanceof Error ? err.message : String(err),
      },
      500
    );
  }
};

export const onRequestGet: PagesFunction = async () =>
  json({ error: 'Use POST for /api/download.' }, 405);

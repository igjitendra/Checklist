// Cloudflare Pages Function: GET /api/file?key=<file-name>
// Serves private template files from R2.
//
// Required binding:
//   TEMPLATES -> R2 bucket binding

interface Env {
  TEMPLATES: R2Bucket;
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });

function isAllowedKey(key: string): boolean {
  // Only allow root-level safe file names:
  // branding-checklist.pdf
  // branding-checklist.jpg
  return /^[a-z0-9][a-z0-9-]*\.(pdf|jpg)$/i.test(key);
}

function contentTypeFor(key: string): string {
  const lower = key.toLowerCase();
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.jpg')) return 'image/jpeg';
  return 'application/octet-stream';
}

function safeDownloadName(key: string): string {
  return key.replace(/[^a-zA-Z0-9._-]/g, '');
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    if (!env.TEMPLATES) {
      return json(
        {
          error: 'R2 binding TEMPLATES is missing.',
        },
        500
      );
    }

    const url = new URL(request.url);
    const key = String(url.searchParams.get('key') || '').trim();

    if (!key) {
      return json({ error: 'Missing file key.' }, 400);
    }

    if (!isAllowedKey(key)) {
      return json({ error: 'Invalid file key.' }, 400);
    }

    const object = await env.TEMPLATES.get(key);

    if (!object) {
      return json(
        {
          error: 'File not found in R2.',
          key,
        },
        404
      );
    }

    const headers = new Headers();

    object.writeHttpMetadata(headers);

    headers.set('Content-Type', headers.get('Content-Type') || contentTypeFor(key));
    headers.set('Content-Length', String(object.size));
    headers.set('Cache-Control', 'private, no-store');
    headers.set('Content-Disposition', `attachment; filename="${safeDownloadName(key)}"`);

    return new Response(object.body, {
      status: 200,
      headers,
    });
  } catch (err) {
    return json(
      {
        error: 'Server error in /api/file.',
        detail: err instanceof Error ? err.message : String(err),
      },
      500
    );
  }
};

export const onRequestPost: PagesFunction = async () =>
  json({ error: 'Use GET for /api/file.' }, 405);

// Cloudflare Pages Function: POST /api/r2-upload
// Private admin uploader for template files into R2.
//
// Required env/bindings:
//   TEMPLATES        -> R2 bucket binding
//   ADMIN_UPLOAD_KEY -> Secret key used by /r2-upload page

interface Env {
  TEMPLATES: R2Bucket;
  ADMIN_UPLOAD_KEY: string;
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });

const allowedTypes = new Set(['pdf', 'jpg']);

function slugify(input: string): string {
  return (input || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function contentTypeFor(ext: string): string {
  if (ext === 'pdf') return 'application/pdf';
  if (ext === 'jpg') return 'image/jpeg';
  return 'application/octet-stream';
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    if (!env.TEMPLATES) {
      return json({ error: 'R2 binding TEMPLATES is missing.' }, 500);
    }

    if (!env.ADMIN_UPLOAD_KEY) {
      return json({ error: 'ADMIN_UPLOAD_KEY secret is missing.' }, 500);
    }

    const form = await request.formData();

    const adminKey = String(form.get('adminKey') || '');
    const fileBase = slugify(String(form.get('fileBase') || ''));
    const fileType = String(form.get('fileType') || '').toLowerCase();
    const file = form.get('file');

    if (adminKey !== env.ADMIN_UPLOAD_KEY) {
      return json({ error: 'Invalid admin key.' }, 401);
    }

    if (!fileBase) {
      return json({ error: 'fileBase/slug is required.' }, 400);
    }

    if (!allowedTypes.has(fileType)) {
      return json({ error: 'Invalid file type. Use pdf or jpg.' }, 400);
    }

    if (!(file instanceof File)) {
      return json({ error: 'File is required.' }, 400);
    }

    const maxBytes = 25 * 1024 * 1024; // 25 MB

    if (file.size > maxBytes) {
      return json({ error: 'File too large. Max 25 MB.' }, 413);
    }

    const key = `${fileBase}.${fileType}`;

    await env.TEMPLATES.put(key, file.stream(), {
      httpMetadata: {
        contentType: contentTypeFor(fileType),
      },
      customMetadata: {
        uploadedAt: new Date().toISOString(),
        originalName: file.name,
      },
    });

    return json({
      ok: true,
      key,
      size: file.size,
      contentType: contentTypeFor(fileType),
    });
  } catch (err) {
    return json(
      {
        error: err instanceof Error ? err.message : String(err),
      },
      500
    );
  }
};

export const onRequestGet: PagesFunction = async () =>
  json({ error: 'Use POST with multipart/form-data.' }, 405);

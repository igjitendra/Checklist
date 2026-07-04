import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';

// Custom, reliable sitemap (replaces the buggy @astrojs/sitemap integration).
// Generates /sitemap.xml at build time from all pages + content collections.
export async function GET(context: APIContext) {
  const base = (context.site ?? new URL('https://checklist.example.com')).origin;

  const staticPaths = ['', 'templates', 'blog', 'maker', 'about', 'privacy', 'terms'];
  const templates = await getCollection('templates');
  const posts = (await getCollection('blog')).filter((p) => !p.data.draft);

  const urls = [
    ...staticPaths.map((p) => `${base}/${p}`),
    ...templates.map((t) => `${base}/templates/${t.slug}`),
    ...posts.map((p) => `${base}/blog/${p.slug}`),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${u}</loc></url>`)
    .join('\n')}\n</urlset>\n`;

  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
}

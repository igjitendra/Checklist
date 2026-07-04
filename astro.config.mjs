import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

// IMPORTANT: apna final domain yahan daalein (SEO + sitemap ke liye zaroori)
const SITE = 'https://checklist.example.com';

export default defineConfig({
  site: SITE,
  output: 'static',
  integrations: [mdx()],
  build: { inlineStylesheets: 'auto' },
});

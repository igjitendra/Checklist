import { defineCollection, z } from 'astro:content';

const templates = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    emoji: z.string().default('📋'),
    category: z.enum(['business', 'personal', 'travel', 'home', 'event', 'finance', 'health', 'seo']),
    tags: z.array(z.string()).default([]),
    // Base file name (NO extension). App serves "<fileBase>.pdf" and "<fileBase>.jpg" from R2.
    fileBase: z.string(),
    // Public preview image (watermarked webp) shown on the template page.
    preview: z.string(),
    formats: z.array(z.enum(['pdf', 'jpg'])).default(['pdf', 'jpg']),
    items: z.number().default(0),
    featured: z.boolean().default(false),
    // PRO template -> visitor must complete follow tasks (see src/config/site.ts) to unlock.
    pro: z.boolean().default(false),
    updatedDate: z.coerce.date(),
  }),
});

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    emoji: z.string().default('📝'),
    author: z.string().default('Checklist Team'),
    pubDate: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { templates, blog };

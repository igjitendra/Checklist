import { defineCollection, z } from 'astro:content';

const templates = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    emoji: z.string().default('📋'),
    category: z.enum(['business', 'personal', 'travel', 'home', 'event', 'finance', 'health', 'seo']),
    tags: z.array(z.string()).default([]),
    // file (R2 object key) that user downloads after filling the form
    fileKey: z.string(),
    // number of items (for display)
    items: z.number().default(0),
    featured: z.boolean().default(false),
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

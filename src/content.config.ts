import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const optionalImage = z.preprocess(
  (v) => (typeof v === 'string' && !v.trim() ? undefined : typeof v === 'string' ? v.trim() : v),
  z.string().optional(),
);

const blog = defineCollection({
  loader: glob({
    base: './src/content/blog',
    pattern: '**/*.{md,mdx}',
  }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().optional(),
    categories: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    /** Cover images from Payload / WP migration / R2. */
    featuredImage: optionalImage,
    heroImage: optionalImage,
    image: optionalImage,
  }),
});

export const collections = { blog };

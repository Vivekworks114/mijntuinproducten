import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { remarkStripFeaturedDuplicate } from './scripts/remark-strip-featured-duplicate.mjs';

const remarkPlugins = [remarkStripFeaturedDuplicate];

export default defineConfig({
  trailingSlash: 'always',
  site: 'https://mijntuinproducten.nl',
  integrations: [
    mdx({
      remarkPlugins,
    }),
    sitemap(),
  ],
  markdown: {
    remarkPlugins,
  },
});

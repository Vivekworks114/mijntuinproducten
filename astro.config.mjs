import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

export default defineConfig({
  trailingSlash: 'always',
  site: 'https://mijntuinproducten.nl',
  integrations: [mdx()],
});

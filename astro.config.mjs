// @ts-check
import { defineConfig, envField } from 'astro/config';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // TODO(deploy): ganti dengan domain final sebelum deploy.
  // Dipakai untuk canonical URL, og:url, robots.txt, dan sitemap.xml.
  site: 'https://mahdihabibi.example',
  integrations: [sitemap()],
  // Node adapter: on-demand API routes (AI chat assistant) while
  // all pages remain statically prerendered.
  adapter: node({ mode: 'standalone' }),
  env: {
    // Runtime secrets for the AI chat. Declared here so Astro reads
    // them from the host environment at runtime instead of inlining
    // values into the build output. Set them in .env for dev, and as
    // environment variables on the hosting platform for deploy.
    schema: {
      OPENAI_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      OPENAI_BASE_URL: envField.string({ context: 'server', access: 'secret', optional: true }),
      CHAT_MODEL: envField.string({ context: 'server', access: 'secret', optional: true }),
    },
  },
});

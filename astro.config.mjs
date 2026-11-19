// @ts-check
import { defineConfig, envField } from 'astro/config';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://mahdihabibi.vercel.app',
  integrations: [sitemap()],
  // Vercel adapter: static prerendered pages + serverless /api/chat route.
  adapter: vercel(),
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

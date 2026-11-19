import type { APIRoute } from 'astro';

// robots.txt dinamis: URL sitemap selalu mengikuti `site` di astro.config.mjs,
// jadi tidak perlu diedit manual saat domain final dipasang.
export const GET: APIRoute = ({ site }) => {
  const base = site ?? new URL('https://mahdihabibi.example');
  const body = [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${new URL('sitemap-index.xml', base).href}`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};

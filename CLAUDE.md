## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## Deployment & Pre-Push Gate (Vercel)

- **Hosting target:** Production deploys to Vercel (`https://mahdihabibi.vercel.app`) via `@astrojs/vercel` (`adapter: vercel()` in `astro.config.mjs`). Do not switch back to `@astrojs/node` or another runtime adapter without updating hosting configuration, because Vercel serves `.vercel/output/static/` and `.vercel/output/functions/` rather than `dist/client/`.
- **Build & test before every push:** Always run `npx astro check`, `npm run build`, and `npm test` in the repository root (`D:\HBB\WEBPORTOPROJEK`) after any merge or config edit, and verify `.vercel/output/config.json`, `.vercel/output/static/index.html`, and `.vercel/output/functions/_render.func` are produced cleanly.
- **Root exclusions in `tsconfig.json`:** Keep scratch/reference folders (`dist`, `.vercel`, `versi2`, `referencia`, `.worktrees`, `skills`, `scripts`) excluded so `npx astro check` stays at 0 errors cleanly on the root workspace.
- **Secrets:** Keep `OPENAI_API_KEY`, `OPENAI_BASE_URL`, and `CHAT_MODEL` in Vercel Environment Variables (and untracked `.env` locally); never commit real keys.

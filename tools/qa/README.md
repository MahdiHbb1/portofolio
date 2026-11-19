# QA suites

Playwright-based verification suites for the portfolio. Every suite runs
against a live server; by default they expect the dev server at
`http://localhost:4321` (start it from the repo root with
`npx astro dev --background`).

## Setup

- Python 3.10+ with Playwright:
  ```
  pip install playwright
  python -m playwright install chromium firefox webkit
  ```
- Point the suites at another origin with the `PORTFOLIO_BASE` environment
  variable, e.g. the production build (`$env:PORT=4322; node dist/server/entry.mjs`):
  ```
  $env:PORTFOLIO_BASE="http://localhost:4322"; python tools/qa/portfolio_test.py
  ```
- Screenshots are written to `tools/qa/shots/` (gitignored).

## Suites

| Script | Covers |
|---|---|
| `portfolio_test.py` | main desktop + mobile flows: splash, hero particles, command palette, section transition, chat |
| `crossbrowser_test.py` | core flows on Chromium, Firefox and WebKit |
| `terminal_crossbrowser.py` | terminal shells on all three engines: inline boot, modal open, commands, Escape, flag |
| `verify_terminal.py` | modal terminal: all commands incl. `ls writeups` + `cat writeups/<id>`, sudo joke, tab completion, history, palette entry |
| `verify_terminal_home.py` | homepage inline shell: visibility, focus, flag hunt, coexistence with the modal, mobile fit |
| `verify_flag.py` | hidden flag hunt end to end, confetti cleanup, repeat-visit memory |
| `fix_check.py` | runtime-created DOM styles (palette, terminal, toast, chat bubbles) |
| `mobile_nav_check.py` | bottom nav at 390/360/320px, tap jumps to the playground |
| `verify_kevin_nav.py` | chat navigation directives (needs a live or mocked API) |
| `verify_article_kit.py` | TOC + scrollspy, copy-code buttons, prev/next nav |
| `verify_prefetch.py` | hover prefetch of detail pages is active (link mounted + request fired) |
| `verify_round2.py` | Round 2 fixes: project links, stats row, i18n keys, Kevin |
| `verify_round3.py` | brand icons and marquee behavior |
| `perf_check.py` | FPS, transition timing, chat API latency (production build by default) |
| `verify_lazy_gallery.py` | Three.js gallery lazy loading |

## Notes

- `perf_check.py` and `verify_lazy_gallery.py` default to the production
  server (`http://localhost:4322/`) and also accept an origin as `argv[1]`.
- The Astro dev toolbar can intercept automated clicks near the bottom of
  the page in dev; some suites hide it or dispatch clicks via JS.
- Interactive suites wait for the loading splash to finish (~2.3s) before
  asserting, and chat tests wait for the assistant message count to grow
  instead of for a fixed delay.

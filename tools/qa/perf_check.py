import os

"""Performance validation (headless-aware).

Headless Chromium memakai software rendering, jadi FPS absolut bukan angka
yang representatif. Check FPS membandingkan situs dengan baseline halaman
kosong di environment yang sama.

Usage: python perf_check.py [base_url]
"""
import sys
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else os.environ.get("PORTFOLIO_BASE", "http://localhost:4322/")
results = []


def check(name, cond, extra=""):
    results.append((name, bool(cond)))
    print(f"{'PASS' if cond else 'FAIL'} | {name}" + (f" | {extra}" if extra else ""), flush=True)


def fps(pg, ms=2000):
    return pg.evaluate(
        """(ms) => new Promise(res => {
            let f = 0; const t0 = performance.now();
            const tick = () => { f++; (performance.now() - t0 < ms) ? requestAnimationFrame(tick) : res(f / (ms / 1000)); };
            requestAnimationFrame(tick);
        })""",
        ms,
    )


with sync_playwright() as p:
    b = p.chromium.launch(headless=True)

    # ---------- Desktop ----------
    ctx = b.new_context(viewport={"width": 1440, "height": 900})
    pg = ctx.new_page()

    pg.goto("about:blank")
    baseline = fps(pg)
    print(f"BASELINE halaman kosong: {baseline:.0f} fps (software rendering)", flush=True)

    pg.goto(BASE, wait_until="load")
    pg.wait_for_timeout(1800)

    nav = pg.evaluate(
        """() => {
            const n = performance.getEntriesByType('navigation')[0];
            return { ttfb: Math.round(n.responseStart), dom: Math.round(n.domContentLoadedEventEnd), load: Math.round(n.loadEventEnd) };
        }"""
    )
    print(f"NAV TIMING: ttfb={nav['ttfb']}ms dom={nav['dom']}ms load={nav['load']}ms", flush=True)

    idle = fps(pg)
    check("FPS idle: tidak lebih lambat dari halaman kosong (toleransi 5)",
          idle >= baseline - 5, f"idle={idle:.0f} baseline={baseline:.0f}")

    scroll_fps = pg.evaluate(
        """() => new Promise(res => {
            let f = 0; const t0 = performance.now();
            const tick = () => {
                f++; window.scrollBy(0, 30);
                (performance.now() - t0 < 2000) ? requestAnimationFrame(tick) : res(f / 2);
            };
            requestAnimationFrame(tick);
        })"""
    )
    check("FPS scroll: tidak lebih lambat dari halaman kosong (toleransi 8)",
          scroll_fps >= baseline - 8, f"scroll={scroll_fps:.0f} baseline={baseline:.0f}")

    pg.evaluate("() => window.scrollTo(0, 0)")
    trans_ms = pg.evaluate(
        """() => new Promise(res => {
            const start = performance.now();
            window.sectionTransition('#contact');
            const loop = () => {
                const el = document.querySelector('.section-transition');
                const done = el && getComputedStyle(el).display === 'none';
                if (done) res(Math.round(performance.now() - start));
                else if (performance.now() - start > 3000) res(-1);
                else requestAnimationFrame(loop);
            };
            requestAnimationFrame(loop);
        })"""
    )
    check("Durasi transisi shader (target 900-1300ms)", 850 <= trans_ms <= 1300, f"ms={trans_ms}")

    # Warm call (the first call after boot loads the OpenAI module; that is
    # a one-time cold-start cost, so measure the second call)
    pg.evaluate(
        """() => fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })"""
    )
    api_ms = pg.evaluate(
        """() => { const t0 = performance.now();
            return fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
                .then(() => Math.round(performance.now() - t0)); }"""
    )
    check("Respons API chat (panggilan hangat < 150ms)", api_ms < 150, f"ms={api_ms}")

    nodes = pg.evaluate("() => document.querySelectorAll('*').length")
    heap = pg.evaluate("() => performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : -1")
    print(f"DOM nodes: {nodes} | JS heap: {heap} MB", flush=True)
    ctx.close()

    # ---------- Mobile ----------
    mctx = b.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
    mpg = mctx.new_page()
    mpg.goto(BASE, wait_until="load")
    mpg.wait_for_timeout(1800)
    m_fps = fps(mpg)
    check("FPS idle mobile >= 40", m_fps >= 40, f"fps={m_fps:.0f}")
    mctx.close()

    # ---------- Reduced motion ----------
    rctx = b.new_context(viewport={"width": 1440, "height": 900}, reduced_motion="reduce")
    rpg = rctx.new_page()
    rpg.goto(BASE, wait_until="networkidle")
    rpg.wait_for_timeout(1700)
    r = rpg.evaluate(
        """() => new Promise(res => {
            document.querySelector('a[href$="#skills"]').click();
            setTimeout(() => {
                const el = document.querySelector('.section-transition');
                res({ overlay: el ? getComputedStyle(el).display : 'missing', y: Math.round(window.scrollY), hash: location.hash });
            }, 1400);
        })"""
    )
    check("Reduced motion: tanpa overlay shader", r["overlay"] == "missing", str(r))
    check("Reduced motion: navigasi tetap jalan", r["y"] > 200 and r["hash"] == "#skills", f"y={r['y']} hash={r['hash']}")
    rctx.close()

    b.close()

passed = sum(1 for _, ok in results if ok)
print(f"\nRINGKASAN: {passed}/{len(results)} check lolos", flush=True)
sys.exit(0 if passed == len(results) else 1)

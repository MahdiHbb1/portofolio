"""Cross-browser smoke test: Chromium, Firefox, WebKit.

Run with the dev server up at http://localhost:4321 (or set PORTFOLIO_BASE).
"""
import os
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

BASE = os.environ.get("PORTFOLIO_BASE", "http://localhost:4321/")
OUT_DIR = Path(__file__).resolve().parent / "shots"
OUT_DIR.mkdir(exist_ok=True)
OUT = str(OUT_DIR)
results = []


def check(name, cond, extra=""):
    results.append((name, bool(cond)))
    print(f"{'PASS' if cond else 'FAIL'} | {name}" + (f" | {extra}" if extra else ""), flush=True)


def run(p, browser_name):
    browser = getattr(p, browser_name).launch(headless=True)
    pg = browser.new_page(viewport={"width": 1440, "height": 900})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))

    pg.goto(BASE, wait_until="load")
    pg.wait_for_timeout(2800)

    splash = pg.locator("#loadingScreen").count()
    check(f"[{browser_name}] splash selesai/terhapus", splash == 0, f"count={splash}")

    check(f"[{browser_name}] hero tampil", pg.locator("#hero .hero__name").is_visible())

    painted = pg.evaluate(
        """() => {
            const c = document.querySelector('.particle-field__canvas');
            if (!c || !c.width) return false;
            const ctx = c.getContext('2d');
            if (!ctx) return false;
            const d = ctx.getImageData(0, 0, c.width, c.height).data;
            for (let i = 3; i < d.length; i += 397) { if (d[i] > 0) return true; }
            return false;
        }"""
    )
    check(f"[{browser_name}] canvas partikel ter-render", painted)

    pg.keyboard.press("Control+k")
    pg.wait_for_timeout(400)
    cls = pg.locator("#commandPalette").get_attribute("class") or ""
    check(f"[{browser_name}] command palette terbuka (Ctrl+K)", "is-open" in cls)
    pg.fill(".command-palette__input", "gallery")
    pg.wait_for_timeout(350)
    items = pg.locator(".command-palette__item").count()
    check(f"[{browser_name}] fuzzy search menemukan hasil", items >= 1, f"items={items}")
    pg.keyboard.press("Escape")
    pg.wait_for_timeout(400)

    early = pg.evaluate(
        "() => performance.getEntriesByType('resource').some(r => r.name.includes('scene.'))"
    )
    pg.evaluate("() => document.querySelector('#gallery').scrollIntoView()")
    pg.wait_for_timeout(7000)
    late = pg.evaluate(
        "() => performance.getEntriesByType('resource').some(r => r.name.includes('scene.'))"
    )
    check(f"[{browser_name}] scene 3D lazy (sebelum=False, sesudah=True)", (not early) and late,
          f"sebelum={early} sesudah={late}")
    check(f"[{browser_name}] WebGL gallery aktif", pg.evaluate(
        """() => {
            const c = document.querySelector('.orbit-canvas');
            if (!c) return false;
            return !!(c.getContext('webgl2') || c.getContext('webgl'));
        }"""))

    pg.evaluate("() => window.scrollTo(0, 0)")
    pg.wait_for_timeout(800)
    pg.click("#chatToggle")
    pg.wait_for_timeout(500)
    chat_cls = pg.locator("#chatWindow").get_attribute("class") or ""
    check(f"[{browser_name}] chat window terbuka", "is-open" in chat_cls)
    pg.click("#chatClose")
    pg.wait_for_timeout(300)

    check(f"[{browser_name}] tanpa page errors", not errs, "; ".join(errs[:2])[:200])
    pg.screenshot(path=OUT + f"\\shot-cross-{browser_name}.png")
    browser.close()


with sync_playwright() as p:
    for name in ["chromium", "firefox", "webkit"]:
        print(f"--- {name} ---", flush=True)
        run(p, name)

passed = sum(1 for _, ok in results if ok)
print(f"\nRINGKASAN: {passed}/{len(results)} check lolos", flush=True)
sys.exit(0 if passed == len(results) else 1)

import os
from pathlib import Path

from playwright.sync_api import sync_playwright

import sys

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

BASE = os.environ.get("PORTFOLIO_BASE", "http://localhost:4321")
SHOTS_DIR = Path(__file__).resolve().parent / "shots"
SHOTS_DIR.mkdir(exist_ok=True)
SHOTS = str(SHOTS_DIR)


def main():
    results = []

    def check(name, cond, extra=""):
        results.append((name, bool(cond), extra))

    with sync_playwright() as p:
        browser = p.chromium.launch()

        for w in (390, 360, 320):
            page = browser.new_page(viewport={"width": w, "height": 800})
            page.goto(BASE, wait_until="domcontentloaded")
            page.wait_for_timeout(1800)
            nav = page.evaluate(
                """(() => {
                  const n = document.querySelector('.mobile-nav');
                  const items = [...n.querySelectorAll('.mobile-nav__item')];
                  const visibleItems = items.filter((el) => getComputedStyle(el).display !== 'none');
                  return {
                    sw: n.scrollWidth,
                    cw: n.clientWidth,
                    pageSw: document.documentElement.scrollWidth,
                    pageCw: document.documentElement.clientWidth,
                    domItems: items.length,
                    visibleItems: visibleItems.length,
                  };
                })()"""
            )
            visible_count = sum(1 for item in page.locator(".mobile-nav__item").all() if item.is_visible())
            check(f"{w}px: five visible nav items", nav["visibleItems"] == 5 and visible_count == 5, str(nav))
            check(
                f"{w}px: no horizontal overflow",
                nav["sw"] <= nav["cw"] + 1 and nav["pageSw"] <= nav["pageCw"] + 1,
                str(nav),
            )
            page.close()

        # tap test at 390 (dev toolbar would intercept real clicks, hide it)
        page = browser.new_page(viewport={"width": 390, "height": 800})
        page.goto(BASE, wait_until="domcontentloaded")
        page.wait_for_timeout(1800)
        page.add_style_tag(content="astro-dev-toolbar { display: none !important; }")
        page.evaluate(
            """document.querySelector('.mobile-nav__item[href="/#terminal"]').click()"""
        )
        page.wait_for_timeout(1200)
        check(
            "tap jumps to the playground",
            page.evaluate("location.hash === '#terminal'"),
            page.evaluate("location.hash"),
        )
        top = page.evaluate(
            "document.getElementById('terminal').getBoundingClientRect().top"
        )
        check("playground near viewport top", abs(top) < 250, f"top={top}")
        page.screenshot(path=SHOTS + r"\terminal_mobile_nav.png")
        page.close()

        browser.close()

    for name, ok, extra in results:
        line = ("PASS " if ok else "FAIL ") + name
        if extra and not ok:
            line += " | " + extra
        print(line)
    passed = sum(1 for _, ok, _ in results if ok)
    print(f"\n{passed}/{len(results)} passed")


if __name__ == "__main__":
    main()

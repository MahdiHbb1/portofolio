"""Verify hover prefetch.

With the ClientRouter present, Astro prefetches internal links on hover
(and keyboard focus / tap) by default. This suite pins that behavior: if a
future config change sets `prefetch: false` or annotates links differently,
these checks fail loudly.

Run with the dev server up (or set PORTFOLIO_BASE).
"""
import os

from playwright.sync_api import sync_playwright

BASE = os.environ.get("PORTFOLIO_BASE", "http://localhost:4321")


def main():
    results = []

    def check(name, cond, extra=""):
        results.append((name, bool(cond), extra))

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        requests = []
        page.on("request", lambda r: requests.append(r.url))
        page.goto(BASE, wait_until="domcontentloaded")
        page.wait_for_timeout(2400)

        check(
            "no prefetch before interaction",
            page.evaluate("document.head.querySelectorAll('link[rel=prefetch]').length") == 0,
        )

        link = page.locator('#projects a[href^="/projects/"]:visible').first
        target = link.get_attribute("href")
        link.hover()
        page.wait_for_timeout(600)

        prefetched = page.evaluate(
            "[...document.head.querySelectorAll('link[rel=prefetch]')].map(l => l.href)"
        )
        check(
            "hover mounts a prefetch link",
            any(target in h for h in prefetched),
            str(prefetched),
        )
        check(
            "browser actually requested the page",
            any(target in r for r in requests),
            " | ".join(requests[-3:]),
        )
        check(
            "hash-only links are skipped",
            not any(("#about" in h or "#contact" in h) for h in prefetched),
            str(prefetched),
        )

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

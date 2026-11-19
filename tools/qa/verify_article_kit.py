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

INJECT_PROJECT = """(() => {
  const c = document.querySelector('.project-page__body');
  c.insertAdjacentHTML('beforeend', `
    <h2>Overview</h2>
    <p>Overview paragraph one with enough words to take some vertical space in the layout.</p>
    <p>Another paragraph to add height and let the page scroll properly during tests.</p>
    <h2>Implementation</h2>
    <p>Implementation details paragraph, also fairly long so the page remains scrollable.</p>
    <p>More filler text so the scrollspy has room to move between sections here.</p>
    <h3>Model</h3>
    <p>Model subsection with a code block below to exercise the copy button behavior.</p>
    <pre><code>SELECT * FROM users WHERE id = 1;</code></pre>
  `);
  document.dispatchEvent(new Event('astro:page-load'));
})()"""


def main():
    results = []

    def check(name, cond, extra=""):
        results.append((name, bool(cond), extra))

    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        context.grant_permissions(["clipboard-read", "clipboard-write"])
        page = context.new_page()
        console_errors = []
        page.on(
            "console",
            lambda msg: console_errors.append(msg.text)
            if msg.type == "error"
            else None,
        )

        # 1. project page: no headings yet -> no TOC, nav with only Next
        page.goto(BASE + "/projects/sigap-mbg/", wait_until="domcontentloaded")
        page.wait_for_timeout(2200)
        check("no TOC without headings", page.locator(".toc").count() == 0)
        check("nav present", page.locator(".article-nav").count() == 1)
        check(
            "first project: next only",
            page.locator(".article-nav__link--prev").count() == 0
            and page.locator(".article-nav__link--next").count() == 1,
        )
        next_href = page.locator(".article-nav__link--next").get_attribute("href")
        check("next points to fraudlens", next_href == "/projects/fraudlens/", str(next_href))
        next_title = page.locator(
            ".article-nav__link--next .article-nav__title"
        ).inner_text()
        check("next title is FraudLens", next_title == "FraudLens", next_title)

        # 2. inject content, re-dispatch page-load
        page.evaluate(INJECT_PROJECT)
        page.wait_for_timeout(350)
        check("TOC built", page.locator(".toc").count() == 1)
        links = page.locator(".toc__link")
        check("TOC has 3 links", links.count() == 3, str(links.count()))
        texts = [links.nth(i).inner_text() for i in range(links.count())]
        check(
            "TOC texts",
            texts == ["Overview", "Implementation", "Model"],
            str(texts),
        )
        check("h3 link indented", page.locator(".toc__link--h3").count() == 1)
        hrefs = [links.nth(i).get_attribute("href") for i in range(links.count())]
        check(
            "TOC hrefs",
            hrefs == ["#overview", "#implementation", "#model"],
            str(hrefs),
        )
        check("nav not duplicated after re-init", page.locator(".article-nav").count() == 1)
        check(
            "copy button present",
            page.locator("pre.article-pre .copy-code").count() == 1,
        )

        # 3. copy to clipboard
        page.click(".copy-code")
        page.wait_for_timeout(450)
        copied = page.evaluate("navigator.clipboard.readText()")
        check(
            "clipboard content",
            copied == "SELECT * FROM users WHERE id = 1;",
            repr(copied),
        )
        check(
            "button shows Copied",
            page.locator(".copy-code").inner_text().lower() == "copied",
            page.locator(".copy-code").inner_text(),
        )

        # 4. TOC link + scrollspy
        page.click(".toc__link--h3")
        page.wait_for_timeout(1500)
        active_count = page.locator(".toc__link.is-active").count()
        active_text = (
            page.locator(".toc__link.is-active").inner_text() if active_count else ""
        )
        check(
            "scrollspy marks Model",
            active_count == 1 and active_text == "Model",
            f"count={active_count} text={active_text}",
        )
        check("page scrolled", page.evaluate("window.scrollY") > 200)
        page.screenshot(path=SHOTS + r"\article_kit.png")

        # 5. prev/next through ClientRouter navigation
        page.click(".article-nav__link--next")
        page.wait_for_timeout(2600)
        check("navigated to fraudlens", "/projects/fraudlens/" in page.url, page.url)
        prev_title = page.locator(
            ".article-nav__link--prev .article-nav__title"
        ).inner_text()
        check("prev is SIGAP MBG", prev_title == "SIGAP MBG", prev_title)
        nnext_title = page.locator(
            ".article-nav__link--next .article-nav__title"
        ).inner_text()
        check(
            "next is Fabric CNN",
            nnext_title == "Fabric Defect Detection CNN",
            nnext_title,
        )
        check("no TOC on fraudlens", page.locator(".toc").count() == 0)

        # 6. writeup page
        page.goto(BASE + "/writeups/itsecdevx26-web/", wait_until="domcontentloaded")
        page.wait_for_timeout(2200)
        check("writeup nav present", page.locator(".article-nav").count() == 1)
        wnext = page.locator(".article-nav__link--next").get_attribute("href")
        check(
            "writeup next is forensics",
            wnext == "/writeups/itsecdevx26-forensics/",
            str(wnext),
        )
        page.evaluate(
            """(() => {
              const c = document.querySelector('.writeup__content');
              c.insertAdjacentHTML('beforeend', '<h2>Approach</h2><p>filler text</p><h2>Result</h2><p>filler text</p>');
              document.dispatchEvent(new Event('astro:page-load'));
            })()"""
        )
        page.wait_for_timeout(350)
        check("writeup TOC built", page.locator(".toc").count() == 1)
        check(
            "writeup nav not duplicated",
            page.locator(".article-nav").count() == 1,
        )

        ignorable = [e for e in console_errors if "favicon" not in e.lower()]
        check("no console errors", len(ignorable) == 0, " | ".join(ignorable[:3]))

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

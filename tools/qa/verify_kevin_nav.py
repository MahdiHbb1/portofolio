import os

from playwright.sync_api import sync_playwright

import sys

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

BASE = os.environ.get("PORTFOLIO_BASE", "http://localhost:4321")


def ask(page, question, expect_chip_timeout=45000):
    page.click("#chatToggle")
    page.wait_for_timeout(600)
    before = page.locator(".chat-message--assistant").count()
    page.fill("#chatInput", question)
    page.click("#chatSend")
    page.wait_for_function(
        f"document.querySelectorAll('.chat-message--assistant').length > {before}",
        timeout=expect_chip_timeout,
    )
    page.wait_for_timeout(600)


def main():
    results = []

    def check(name, cond, extra=""):
        results.append((name, bool(cond), extra))

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        console_errors = []
        page.on(
            "console",
            lambda msg: console_errors.append(msg.text) if msg.type == "error" else None,
        )

        # --- scenario 1: project page navigation ---
        page.goto(BASE, wait_until="domcontentloaded")
        page.wait_for_timeout(2500)
        ask(page, "Tunjukkan halaman proyek SIGAP MBG")

        reply = page.locator(".chat-message--assistant").last.inner_text()
        check("directive stripped from reply", "[[go:" not in reply, reply[:200])
        chip = page.locator(".chat-message__go").last
        has_chip = chip.count() > 0
        check("navigation chip rendered", has_chip)
        if not has_chip:
            # one retry with a more explicit phrasing
            page.fill("#chatInput", "open the SIGAP MBG project page")
            page.click("#chatSend")
            page.wait_for_timeout(8000)
            chip = page.locator(".chat-message__go").last
            has_chip = chip.count() > 0
            check("navigation chip rendered (retry)", has_chip)

        if has_chip:
            go = chip.get_attribute("data-go")
            check("chip targets sigap project", go == "/projects/sigap-mbg", str(go))
            chip.click()
            page.wait_for_timeout(2500)
            check(
                "navigated to project page",
                "/projects/sigap-mbg" in page.url,
                page.url,
            )
            check(
                "chat closed after navigation",
                page.evaluate(
                    "!document.getElementById('chatWindow').classList.contains('is-open')"
                ),
            )

        # --- scenario 2: section navigation on home ---
        page.goto(BASE, wait_until="domcontentloaded")
        page.wait_for_timeout(2500)
        ask(page, "Buka bagian skills")
        chip2 = page.locator(".chat-message__go").last
        has_chip2 = chip2.count() > 0
        check("section chip rendered", has_chip2)
        if has_chip2:
            go2 = chip2.get_attribute("data-go")
            check("chip targets skills section", go2 == "/#skills", str(go2))
            chip2.click()
            page.wait_for_timeout(2000)
            scroll_y = page.evaluate("window.scrollY")
            check("page scrolled to section", scroll_y > 200, f"scrollY={scroll_y}")

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

"""Terminal cross-browser checks on Chromium, Firefox and WebKit.

Covers the shells on the homepage: inline visibility + boot, modal open via
backquote, commands (whoami, ls writeups), Escape close, and the flag hunt.
Run with the dev server up (or set PORTFOLIO_BASE).
"""
import os

from playwright.sync_api import sync_playwright

BASE = os.environ.get("PORTFOLIO_BASE", "http://localhost:4321")

INJECT = """() => {
  const modal = document.querySelector('[data-terminal-variant="modal"]');
  const inline = document.querySelector('[data-terminal-variant="inline"]');
  window.__m = { root: modal, input: modal.querySelector('[data-terminal-input]'), body: modal.querySelector('[data-terminal-body]') };
  window.__i = { root: inline, input: inline.querySelector('[data-terminal-input]'), body: inline.querySelector('[data-terminal-body]') };
}"""


def run_engine(p, engine_name):
    browser = p[engine_name].launch()
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    console_errors = []
    page.on(
        "console",
        lambda msg: console_errors.append(msg.text) if msg.type == "error" else None,
    )
    page.goto(BASE, wait_until="domcontentloaded")
    page.wait_for_timeout(2500)
    page.evaluate(INJECT)

    results = []

    def check(name, cond, extra=""):
        results.append((name, bool(cond), extra))

    check("inline shell visible", page.evaluate("!!window.__i.root && !window.__i.root.hidden"))
    check("inline boots on load", page.evaluate("window.__i.body.textContent.includes('Mahdi OS')"))

    page.keyboard.press("`")
    page.wait_for_timeout(400)
    check("modal opens on backquote", page.evaluate("window.__m.root.hidden === false"))

    page.keyboard.type("whoami", delay=10)
    page.keyboard.press("Enter")
    page.wait_for_timeout(200)
    check("whoami answers", page.evaluate("window.__m.body.textContent.includes('Mahdi Habibi')"))

    page.keyboard.type("ls writeups", delay=5)
    page.keyboard.press("Enter")
    page.wait_for_timeout(200)
    check(
        "writeups listed in modal",
        page.evaluate("window.__m.body.textContent.includes('itsecdevx26-web/')"),
    )

    page.keyboard.press("Escape")
    page.wait_for_timeout(300)
    check("escape closes modal", page.evaluate("window.__m.root.hidden === true"))
    check("scroll lock released", page.evaluate("document.body.style.overflow === ''"))

    page.evaluate("window.__i.input.focus()")
    page.keyboard.type("cat .flag.txt", delay=8)
    page.keyboard.press("Enter")
    page.wait_for_timeout(250)
    check(
        "inline flag hunt works",
        page.evaluate("window.__i.body.textContent.includes('flag{cur10s1ty_p4ys_0ff}')"),
    )

    ignorable = [e for e in console_errors if "favicon" not in e.lower()]
    check("no console errors", len(ignorable) == 0, " | ".join(ignorable[:3]))

    browser.close()
    return results


def main():
    all_results = []
    with sync_playwright() as p:
        for engine in ("chromium", "firefox", "webkit"):
            try:
                results = run_engine(p, engine)
            except Exception as exc:  # noqa: BLE001 - report and move on
                results = [(f"crashed: {str(exc)[:160]}", False, "")]
            for name, ok, extra in results:
                label = f"{engine}: {name}"
                line = ("PASS " if ok else "FAIL ") + label
                if extra and not ok:
                    line += " | " + extra
                print(line)
                all_results.append((label, ok))

    passed = sum(1 for _, ok in all_results if ok)
    print(f"\n{passed}/{len(all_results)} passed")


if __name__ == "__main__":
    main()

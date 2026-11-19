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

INJECT = """() => {
  const modal = document.querySelector('[data-terminal-variant="modal"]');
  const inline = document.querySelector('[data-terminal-variant="inline"]');
  window.__m = { root: modal, input: modal.querySelector('[data-terminal-input]'), body: modal.querySelector('[data-terminal-body]') };
  window.__i = { root: inline, input: inline.querySelector('[data-terminal-input]'), body: inline.querySelector('[data-terminal-body]') };
}"""


def main():
    results = []

    def check(name, cond, extra=""):
        results.append((name, bool(cond), extra))

    with sync_playwright() as p:
        browser = p.chromium.launch()

        # ---------- desktop ----------
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        console_logs = []
        console_errors = []
        page.on(
            "console",
            lambda msg: (
                console_logs.append(msg.text)
                if msg.type == "log"
                else console_errors.append(msg.text) if msg.type == "error" else None
            ),
        )
        page.goto(BASE, wait_until="domcontentloaded")
        page.wait_for_timeout(2400)
        page.evaluate(INJECT)

        # A. presence + visibility
        check(
            "two terminal shells on the homepage",
            page.evaluate("document.querySelectorAll('[data-terminal-root]').length === 2"),
        )
        check(
            "inline terminal visible without any key press",
            page.evaluate("window.__i.root.hidden === false"),
        )
        check(
            "inline terminal laid out",
            page.evaluate("window.__i.root.offsetHeight > 150"),
        )
        check(
            "inline boot banner shown",
            page.evaluate("window.__i.body.textContent.includes('Mahdi OS')"),
        )
        check(
            "inline input not autofocused on load",
            page.evaluate("document.activeElement !== window.__i.input"),
        )
        check(
            "navbar links to the playground",
            page.evaluate("!!document.querySelector('.navbar__link[href=\"/#terminal\"]')"),
        )
        check(
            "playground section present",
            page.evaluate("!!document.getElementById('terminal')"),
        )

        # B. backquote while typing inline must not open the modal
        page.locator('[data-terminal-variant="inline"] [data-terminal-body]').click()
        page.wait_for_timeout(150)
        check(
            "clicking the inline shell focuses its input",
            page.evaluate("document.activeElement === window.__i.input"),
        )
        page.keyboard.press("`")
        page.wait_for_timeout(200)
        check(
            "backquote typed inside inline does not open the modal",
            page.evaluate("window.__m.root.hidden === true && window.__i.input.value === '`'"),
        )
        page.evaluate("window.__i.input.value = ''")

        # C. the flag hunt works from the inline shell (fresh profile)
        def type_cmd(cmd, delay=8):
            page.keyboard.type(cmd, delay=delay)
            page.keyboard.press("Enter")
            page.wait_for_timeout(160)

        type_cmd("help")
        check(
            "help works in the inline shell",
            page.evaluate("window.__i.body.textContent.includes('Available commands')"),
        )
        type_cmd("ls")
        check(
            "inline ls nudges hidden entry",
            page.evaluate("window.__i.body.textContent.includes('hidden entry')"),
        )
        type_cmd("ls -la")
        check(
            "inline ls -la reveals the flag file",
            page.evaluate("window.__i.body.textContent.includes('.flag.txt')"),
        )
        type_cmd("ls writeups")
        check(
            "inline ls writeups works",
            page.evaluate("window.__i.body.textContent.includes('itsecdevx26-forensics')"),
        )
        type_cmd("cat .flag.txt")
        check(
            "flag printed in the inline shell",
            page.evaluate("window.__i.body.textContent.includes('flag{cur10s1ty_p4ys_0ff}')"),
        )
        check(
            "confetti fires from the inline find",
            page.evaluate("!!document.querySelector('.terminal__confetti')"),
        )
        check(
            "flag persisted from inline",
            page.evaluate("localStorage.getItem('mh_terminal_flag') === 'found'"),
        )

        # section screenshot (while confetti is still up, doubly festive)
        page.locator("#terminal").scroll_into_view_if_needed()
        page.wait_for_timeout(500)
        page.screenshot(path=SHOTS + r"\terminal_home.png")

        # D. Escape / exit do not hide the inline shell
        page.keyboard.press("Escape")
        page.wait_for_timeout(200)
        check(
            "escape does not close the inline shell",
            page.evaluate("window.__i.root.hidden === false && window.__m.root.hidden === true"),
        )
        type_cmd("exit")
        check(
            "exit explains itself in inline mode",
            page.evaluate("window.__i.body.textContent.includes('lives on this page')"),
        )
        check(
            "inline shell still visible after exit",
            page.evaluate("window.__i.root.hidden === false"),
        )

        # E. modal still works and stays independent
        inline_text_before = page.evaluate("window.__i.body.textContent")
        page.evaluate("window.dispatchEvent(new CustomEvent('terminal:open'))")
        page.wait_for_timeout(300)
        check(
            "modal opens on the homepage",
            page.evaluate("window.__m.root.hidden === false"),
        )
        check(
            "modal input focused",
            page.evaluate("document.activeElement === window.__m.input"),
        )
        check(
            "body scroll locked by modal",
            page.evaluate("document.body.style.overflow === 'hidden'"),
        )
        page.keyboard.type("whoami", delay=8)
        page.keyboard.press("Enter")
        page.wait_for_timeout(220)
        check(
            "modal answers whoami",
            page.evaluate("window.__m.body.textContent.includes('Mahdi Habibi')"),
        )
        check(
            "inline output untouched by modal commands",
            page.evaluate("window.__i.body.textContent") == inline_text_before,
        )
        page.keyboard.press("Escape")
        page.wait_for_timeout(250)
        check(
            "modal closes, inline remains",
            page.evaluate("window.__m.root.hidden === true && window.__i.root.hidden === false"),
        )
        check(
            "scroll lock released",
            page.evaluate("document.body.style.overflow === ''"),
        )

        # F. project page: modal only
        page.goto(BASE + "/projects/sigap-mbg", wait_until="domcontentloaded")
        page.wait_for_timeout(1800)
        check(
            "project page has exactly one shell",
            page.evaluate("document.querySelectorAll('[data-terminal-root]').length === 1"),
        )
        page.keyboard.press("`")
        page.wait_for_timeout(300)
        check(
            "modal opens on a project page",
            page.evaluate(
                "document.querySelector('[data-terminal-variant=\"modal\"]').hidden === false"
            ),
        )

        ignorable = [e for e in console_errors if "favicon" not in e.lower()]
        check("no console errors", len(ignorable) == 0, " | ".join(ignorable[:3]))
        check(
            "console hint mentions ls -la",
            any("ls -la" in log for log in console_logs),
        )

        # ---------- mobile ----------
        mobile = browser.new_page(viewport={"width": 390, "height": 844})
        mobile_errors = []
        mobile.on(
            "console",
            lambda msg: mobile_errors.append(msg.text) if msg.type == "error" else None,
        )
        mobile.goto(BASE, wait_until="domcontentloaded")
        mobile.wait_for_timeout(2400)
        mobile.evaluate(INJECT)
        mobile.locator("#terminal").scroll_into_view_if_needed()
        mobile.wait_for_timeout(600)
        check(
            "mobile: inline shell visible",
            mobile.evaluate(
                "window.__i.root.hidden === false && window.__i.root.offsetHeight > 150"
            ),
        )
        check(
            "mobile: shell fits the viewport width",
            mobile.evaluate(
                "window.__i.root.getBoundingClientRect().width <= window.innerWidth"
            ),
        )
        mobile.locator('[data-terminal-variant="inline"] [data-terminal-body]').click()
        mobile.keyboard.type("neofetch", delay=8)
        mobile.keyboard.press("Enter")
        mobile.wait_for_timeout(200)
        check(
            "mobile: commands run",
            mobile.evaluate("window.__i.body.textContent.includes('kevin-sh')"),
        )
        mobile.screenshot(path=SHOTS + r"\terminal_home_mobile.png")
        mobile_ignorable = [e for e in mobile_errors if "favicon" not in e.lower()]
        check(
            "mobile: no console errors",
            len(mobile_ignorable) == 0,
            " | ".join(mobile_ignorable[:3]),
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

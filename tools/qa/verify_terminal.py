import os
from pathlib import Path

from playwright.sync_api import sync_playwright

BASE = os.environ.get("PORTFOLIO_BASE", "http://localhost:4321")
SHOTS_DIR = Path(__file__).resolve().parent / "shots"
SHOTS_DIR.mkdir(exist_ok=True)
SHOTS = str(SHOTS_DIR)

INJECT = """() => {
  const modal = document.querySelector('[data-terminal-variant="modal"]');
  window.__modalRoot = modal;
  window.__modalInput = modal.querySelector('[data-terminal-input]');
  window.__modalBody = modal.querySelector('[data-terminal-body]');
}"""


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
        page.goto(BASE, wait_until="domcontentloaded")
        page.wait_for_timeout(2500)
        page.evaluate(INJECT)

        # 1. initially hidden
        check(
            "terminal initially hidden",
            page.evaluate("window.__modalRoot.hidden === true"),
        )

        # 2. backquote opens
        page.keyboard.press("`")
        page.wait_for_timeout(400)
        check(
            "terminal opens on backquote",
            page.evaluate("window.__modalRoot.hidden === false"),
        )
        check(
            "terminal input focused",
            page.evaluate(
                "document.activeElement === window.__modalInput"
            ),
        )
        check(
            "body scroll locked while open",
            page.evaluate("document.body.style.overflow === 'hidden'"),
        )

        body = page.locator('[data-terminal-variant="modal"] [data-terminal-body]')
        check("boot banner shown", "Mahdi OS" in body.inner_text())
        page.screenshot(path=SHOTS + r"\terminal_open.png")

        def type_cmd(cmd):
            page.keyboard.type(cmd, delay=10)
            page.keyboard.press("Enter")
            page.wait_for_timeout(140)

        type_cmd("whoami")
        check("whoami output", "Mahdi Habibi" in body.inner_text())

        type_cmd("ls")
        check("ls lists files", "achievements.txt" in body.inner_text())

        type_cmd("ls projects")
        check("ls projects lists sigap", "sigap-mbg/" in body.inner_text())

        type_cmd("ls writeups")
        check("ls writeups lists a writeup", "itsecdevx26-web/" in body.inner_text())

        type_cmd("cat writeups/itsecdevx26-web")
        writeup_text = body.inner_text()
        check("writeup detail opens", "SQL Injection via Login Bypass" in writeup_text)
        check("writeup links to its page", "/writeups/itsecdevx26-web" in writeup_text)

        type_cmd("cat writeups/nope")
        check(
            "cat unknown writeup errors",
            "cat: writeups/nope: No such file" in body.inner_text(),
        )

        type_cmd("cat projects/sigap-mbg")
        check("project detail opens", "cat projects/sigap-mbg" in body.inner_text())

        type_cmd("cat nope.txt")
        check("cat unknown file errors", "No such file" in body.inner_text())

        type_cmd("bogus")
        check(
            "unknown command errors",
            "command not found: bogus" in body.inner_text(),
        )

        type_cmd("help")
        check("help mentions writeups", "cat writeups/<id>" in body.inner_text())

        type_cmd("neofetch")
        text = body.inner_text()
        check("neofetch art + info", "guest@mahdi" in text and "kevin-sh" in text)

        type_cmd("sudo rm -rf /")
        check("sudo asks password", "password for guest" in body.inner_text())
        check(
            "input switched to password",
            page.evaluate("window.__modalInput.type === 'password'"),
        )
        page.keyboard.type("hunter2", delay=5)
        page.keyboard.press("Enter")
        page.wait_for_timeout(180)
        check("sudo denied with humor", "sudoers" in body.inner_text())
        check(
            "input type reset",
            page.evaluate("window.__modalInput.type === 'text'"),
        )

        # tab completion
        page.keyboard.type("neo", delay=10)
        page.keyboard.press("Tab")
        page.wait_for_timeout(120)
        check(
            "tab completes neofetch",
            page.evaluate("window.__modalInput.value") == "neofetch ",
        )
        page.keyboard.press("Enter")
        page.wait_for_timeout(120)

        page.keyboard.type("cat writeups/placeholder-c", delay=10)
        page.keyboard.press("Tab")
        page.wait_for_timeout(120)
        check(
            "tab completes writeup path",
            page.evaluate("window.__modalInput.value") == "cat writeups/placeholder-crypto",
        )
        page.keyboard.press("Enter")
        page.wait_for_timeout(160)
        check("completed writeup opens", "RSA Key Recovery" in body.inner_text())

        # history + arrow-up
        type_cmd("history")
        check("history renders", "whoami" in body.inner_text())
        page.keyboard.press("ArrowUp")
        page.wait_for_timeout(100)
        up_value = page.evaluate("window.__modalInput.value")
        check("arrow-up recalls last command", up_value == "history", f"got: {up_value}")
        page.evaluate("window.__modalInput.value = ''")

        page.screenshot(path=SHOTS + r"\terminal_session.png")

        # clear + exit
        type_cmd("clear")
        check(
            "clear empties output",
            page.evaluate("window.__modalBody.children.length === 0"),
        )
        type_cmd("exit")
        page.wait_for_timeout(250)
        check(
            "exit closes terminal",
            page.evaluate("window.__modalRoot.hidden === true"),
        )
        check(
            "body overflow restored",
            page.evaluate("document.body.style.overflow === ''"),
        )

        # reopen via custom event (command palette path)
        page.evaluate("window.dispatchEvent(new CustomEvent('terminal:open'))")
        page.wait_for_timeout(250)
        check(
            "custom event opens terminal",
            page.evaluate("window.__modalRoot.hidden === false"),
        )
        page.keyboard.press("Escape")
        page.wait_for_timeout(250)
        check(
            "escape closes terminal",
            page.evaluate("window.__modalRoot.hidden === true"),
        )

        # no duplicate ids on the homepage (modal + inline coexist)
        check(
            "no legacy terminal ids",
            page.evaluate(
                "document.querySelectorAll('#terminalEgg, #terminalBody, #terminalInput').length === 0"
            ),
        )

        # command palette entry
        page.mouse.click(720, 450)
        page.wait_for_timeout(200)
        page.keyboard.press("/")
        page.wait_for_timeout(400)
        palette_text = page.evaluate("document.body.innerText")
        if "Open Terminal" not in palette_text:
            page.keyboard.type("terminal", delay=15)
            page.wait_for_timeout(300)
            palette_text = page.evaluate("document.body.innerText")
        check("palette lists Open Terminal", "Open Terminal" in palette_text)
        page.keyboard.press("Escape")
        page.wait_for_timeout(200)

        # console errors
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

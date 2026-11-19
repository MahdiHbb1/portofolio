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
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()
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
        page.wait_for_timeout(2300)

        # 1. devtools hint
        hint = any("ls -la" in log and "guest@mahdi" in log for log in console_logs)
        check("console hint present", hint, " | ".join(console_logs[:3]))

        body = page.locator('[data-terminal-variant="modal"] [data-terminal-body]')

        # 2. plain ls hides the flag
        page.keyboard.press("`")
        page.wait_for_timeout(350)
        page.keyboard.type("ls", delay=8)
        page.keyboard.press("Enter")
        page.wait_for_timeout(150)
        text = body.inner_text()
        check("plain ls nudges hidden entry", "hidden entry" in text)
        check("plain ls hides flag name", ".flag.txt" not in text)

        # 3. ls -la reveals it
        page.keyboard.type("ls -la", delay=8)
        page.keyboard.press("Enter")
        page.wait_for_timeout(150)
        text = body.inner_text()
        check("ls -la reveals .flag.txt", ".flag.txt" in text)
        check("ls -la reveals .bash_history", ".bash_history" in text)

        # 4. .bash_history drops the hint
        page.keyboard.type("cat .bash_history", delay=8)
        page.keyboard.press("Enter")
        page.wait_for_timeout(150)
        check("bash history hints at flag", "future me" in body.inner_text())

        # 5. the flag itself
        page.keyboard.type("cat .flag.txt", delay=8)
        page.keyboard.press("Enter")
        page.wait_for_timeout(350)
        text = body.inner_text()
        check("flag printed", "flag{cur10s1ty_p4ys_0ff}" in text)
        check("reward copy shown", "looked where nobody looks" in text)
        check(
            "confetti canvas mounted",
            page.evaluate("!!document.querySelector('.terminal__confetti')"),
        )
        check(
            "toast shown",
            page.evaluate("document.body.innerText.includes('You found the hidden flag')"),
        )
        check(
            "flag persisted",
            page.evaluate("localStorage.getItem('mh_terminal_flag') === 'found'"),
        )
        page.screenshot(path=SHOTS + r"\flag_confetti.png")

        # 6. confetti cleans itself up
        page.wait_for_timeout(3300)
        check(
            "confetti canvas removed",
            page.evaluate("!document.querySelector('.terminal__confetti')"),
        )

        # 7. second visit: memory of the find
        page.reload(wait_until="domcontentloaded")
        page.wait_for_timeout(2300)
        page.keyboard.press("`")
        page.wait_for_timeout(350)
        page.keyboard.type("cat .flag.txt", delay=8)
        page.keyboard.press("Enter")
        page.wait_for_timeout(300)
        text = body.inner_text()
        check("flag greets returning collector", "welcome back" in text)
        check(
            "no confetti on repeat",
            page.evaluate("!document.querySelector('.terminal__confetti')"),
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

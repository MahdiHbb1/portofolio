import os
from pathlib import Path

from playwright.sync_api import sync_playwright

SHOTS_DIR = Path(__file__).resolve().parent / "shots"
SHOTS_DIR.mkdir(exist_ok=True)
SHOTS = str(SHOTS_DIR)

import sys

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

BASE = os.environ.get("PORTFOLIO_BASE", "http://localhost:4321")
EXPECT_ACCENT = "rgb(160, 120, 80)"


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
        page.wait_for_timeout(2300)

        # --- palette ---
        page.keyboard.press("/")
        page.wait_for_timeout(450)
        palette = page.evaluate(
            """(() => {
              const item = document.querySelector('.command-palette__item');
              if (!item) return null;
              const cs = getComputedStyle(item);
              return { display: cs.display, padding: cs.padding, radius: cs.borderRadius };
            })()"""
        )
        check("palette item styled", palette and palette["display"] == "flex", str(palette))
        check(
            "palette item has padding",
            palette and palette["padding"] != "0px",
            str(palette),
        )
        page.keyboard.press("Escape")
        page.wait_for_timeout(250)

        # --- terminal colors ---
        page.keyboard.press("`")
        page.wait_for_timeout(350)
        page.keyboard.type("whoami", delay=5)
        page.keyboard.press("Enter")
        page.wait_for_timeout(120)
        page.keyboard.type("bogus", delay=5)
        page.keyboard.press("Enter")
        page.wait_for_timeout(120)
        colors = page.evaluate(
            """(() => {
              const lines = [...document.querySelectorAll('[data-terminal-variant="modal"] [data-terminal-body] .terminal__line')];
              const pick = (cls) => {
                const el = lines.filter((l) => l.classList.contains(cls)).pop();
                return el ? getComputedStyle(el).color : null;
              };
              const echoPrompt = document.querySelector('.terminal__prompt-inline');
              return {
                accent: pick('terminal__line--accent'),
                dim: pick('terminal__line--dim'),
                error: pick('terminal__line--error'),
                prompt: echoPrompt ? getComputedStyle(echoPrompt).color : null,
              };
            })()"""
        )
        check("terminal accent color applies", colors["accent"] == EXPECT_ACCENT, str(colors))
        check(
            "terminal variants differ",
            colors["accent"] != colors["dim"] and colors["error"] != colors["dim"],
            str(colors),
        )
        page.keyboard.press("Escape")
        page.wait_for_timeout(200)

        # --- toast ---
        page.evaluate(
            "window.showToast('Style probe', { type: 'success', title: 'Probe' })"
        )
        page.wait_for_timeout(400)
        toast = page.evaluate(
            """(() => {
              const el = document.querySelector('.toast');
              if (!el) return null;
              const cs = getComputedStyle(el);
              return {
                padding: cs.padding,
                radius: cs.borderRadius,
                background: cs.backgroundColor,
                transition: cs.transitionDuration,
              };
            })()"""
        )
        check("toast styled", toast and toast["padding"] != "0px", str(toast))

        # --- chat (synthetic probe node, no API call) ---
        chat = page.evaluate(
            """(() => {
              const probe = document.createElement('div');
              probe.className = 'chat-message chat-message--assistant';
              probe.innerHTML = '<div class="chat-message__avatar">K</div><div class="chat-message__content"><div class="chat-message__text">x</div><div class="chat-message__time">12:00</div></div>';
              document.body.appendChild(probe);
              const text = probe.querySelector('.chat-message__text');
              const cs = getComputedStyle(text);
              const probeCs = getComputedStyle(probe);
              const res = {
                textDisplay: cs.display,
                probeGap: probeCs.gap,
                bubbleBg: cs.backgroundColor,
              };
              probe.remove();
              return res;
            })()"""
        )
        check(
            "chat message styled",
            chat and (chat["probeGap"] not in ("normal", "0px") or chat["bubbleBg"] != "rgba(0, 0, 0, 0)"),
            str(chat),
        )
        page.screenshot(path=SHOTS + r"\toast_and_style_check.png")

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

"""Portfolio smoke test: verifies Phase 1-3 interactive features in a real browser.

Run with the dev server already up at http://localhost:4321 (or set PORTFOLIO_BASE).
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
    status = "PASS" if cond else "FAIL"
    line = f"{status} | {name}"
    if extra:
        line += f" | {extra}"
    print(line, flush=True)


def get_display(page, selector):
    return page.evaluate(
        """(sel) => {
            const el = document.querySelector(sel);
            return el ? getComputedStyle(el).display : 'missing';
        }""",
        selector,
    )


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)

    # ---------- Desktop ----------
    ctx = browser.new_context(viewport={"width": 1440, "height": 900})
    page = ctx.new_page()

    console_errors = []
    page.on(
        "console",
        lambda m: console_errors.append(m.text) if m.type == "error" else None,
    )
    page.on("pageerror", lambda e: console_errors.append(str(e)))

    # 1. First load: loading splash
    page.goto(BASE, wait_until="domcontentloaded")
    check("splash shows on first load", page.locator("#loadingScreen").count() == 1)
    page.wait_for_timeout(2600)
    check("splash removed after short splash", page.locator("#loadingScreen").count() == 0)

    page.wait_for_load_state("networkidle")

    # 2. Hero + particle canvas
    check("hero name visible", page.locator("#hero .hero__name").is_visible())
    check("particle canvas present", page.locator(".particle-field__canvas").count() == 1)
    painted = page.evaluate(
        """() => {
            const c = document.querySelector('.particle-field__canvas');
            if (!c || !c.width) return false;
            const ctx = c.getContext('2d');
            const d = ctx.getImageData(0, 0, c.width, c.height).data;
            for (let i = 3; i < d.length; i += 397) { if (d[i] > 0) return true; }
            return false;
        }"""
    )
    check("particle canvas painted", painted)
    page.screenshot(path=OUT + r"\shot-hero.png")

    # 3. Command palette + shader transition
    page.keyboard.press("Control+k")
    page.wait_for_timeout(350)
    cls = page.locator("#commandPalette").get_attribute("class") or ""
    check("palette opens with Ctrl+K", "is-open" in cls)
    page.fill(".command-palette__input", "gallery")
    page.wait_for_timeout(300)
    items = page.locator(".command-palette__item").count()
    check("fuzzy search finds gallery command", items >= 1, f"items={items}")
    page.screenshot(path=OUT + r"\shot-palette.png")

    page.keyboard.press("Enter")
    page.wait_for_timeout(150)
    overlay = get_display(page, ".section-transition")
    check("shader overlay playing on navigate", overlay == "block", f"display={overlay}")
    page.wait_for_timeout(1500)
    scroll_y = page.evaluate("() => window.scrollY")
    check("page scrolled to gallery", scroll_y > 400, f"scrollY={scroll_y}")
    overlay_after = get_display(page, ".section-transition")
    check("shader overlay hidden after finish", overlay_after in ("none",), f"display={overlay_after}")
    hash_now = page.evaluate("() => location.hash")
    check("url hash updated", hash_now == "#gallery", hash_now)

    # 4. Chat assistant (real provider answer, friendly fallback)
    page.evaluate("() => window.scrollTo(0, 0)")
    page.click("#chatToggle")
    page.wait_for_timeout(400)
    chat_cls = page.locator("#chatWindow").get_attribute("class") or ""
    check("chat window opens", "is-open" in chat_cls)
    page.fill("#chatInput", "Siapa Mahdi?")
    page.click("#chatSend")
    try:
        page.wait_for_selector("#chatTyping", state="hidden", timeout=30000)
    except Exception:
        pass
    last_msg = page.locator(".chat-message--assistant .chat-message__text").last.inner_text()
    check(
        "chat menjawab (real provider atau fallback ramah)",
        len(last_msg.strip()) > 20,
        last_msg[:90],
    )
    page.screenshot(path=OUT + r"\shot-chat.png")

    # 5. Console health
    check("no console/page errors (desktop)", len(console_errors) == 0, "; ".join(console_errors[:3])[:220])
    ctx.close()

    # ---------- Mobile ----------
    mctx = browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
    mpage = mctx.new_page()
    m_errors = []
    mpage.on("pageerror", lambda e: m_errors.append(str(e)))

    mpage.goto(BASE, wait_until="domcontentloaded")
    mpage.wait_for_timeout(2600)
    mpage.wait_for_load_state("networkidle")

    check("mobile bottom nav visible", mpage.locator(".mobile-nav").is_visible())
    mpage.click(".mobile-nav__item >> nth=0")
    mpage.wait_for_timeout(1200)
    m_scroll = mpage.evaluate("() => window.scrollY")
    check("mobile nav scrolls without shader overlay", m_scroll > 300, f"scrollY={m_scroll}")
    m_overlay = get_display(mpage, ".section-transition")
    check("no shader overlay on mobile", m_overlay == "missing", f"display={m_overlay}")
    mpage.screenshot(path=OUT + r"\shot-mobile.png")
    check("no page errors (mobile)", len(m_errors) == 0, "; ".join(m_errors[:2])[:160])
    mctx.close()

    browser.close()

passed = sum(1 for _, ok in results if ok)
print(f"\nSUMMARY: {passed}/{len(results)} checks passed", flush=True)
sys.exit(0 if passed == len(results) else 1)

import os
from pathlib import Path

"""Round-2 verification: project links, about stats row, Kevin chat formatting."""
import sys
from playwright.sync_api import sync_playwright

BASE = os.environ.get("PORTFOLIO_BASE", "http://localhost:4321/")
OUT_DIR = Path(__file__).resolve().parent / "shots"
OUT_DIR.mkdir(exist_ok=True)
OUT = str(OUT_DIR)
results = []


def check(name, cond, extra=""):
    results.append((name, bool(cond)))
    print(f"{'PASS' if cond else 'FAIL'} | {name}" + (f" | {extra}" if extra else ""), flush=True)


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={"width": 1440, "height": 900})
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))

    page.goto(BASE, wait_until="load")
    page.wait_for_timeout(2600)  # splash

    # 1. All project card links resolve 200
    hrefs = page.eval_on_selector_all(
        ".project-card__link", "els => els.map(e => e.getAttribute('href'))"
    )
    check("7 kartu proyek ditemukan", len(hrefs) == 7, f"count={len(hrefs)}")
    bad = []
    for href in hrefs:
        resp = ctx.request.get(BASE.rstrip("/") + href)
        if resp.status != 200:
            bad.append(f"{href}->{resp.status}")
    check("semua link proyek 200", not bad, ", ".join(bad) if bad else f"{len(hrefs)} link OK")

    # 2. About stats & photo layout + PKM-KC 2026 certificate check
    page.locator("#about").scroll_into_view_if_needed()
    page.wait_for_timeout(600)
    tops = page.eval_on_selector_all(
        ".stat-item", "els => els.map(e => Math.round(e.getBoundingClientRect().top))"
    )
    same_row = len(tops) == 4 and len(set(tops)) == 1
    cols = page.evaluate(
        "() => getComputedStyle(document.querySelector('.about__stats')).gridTemplateColumns"
    )
    no_overlap = page.evaluate(
        """() => {
          const p = document.querySelector('.about__photo')?.getBoundingClientRect();
          const s = document.querySelector('.about__stats')?.getBoundingClientRect();
          if (!p || !s) return false;
          return p.right <= s.left + 1 || p.left >= s.right - 1 || p.bottom <= s.top + 1 || p.top >= s.bottom - 1;
        }"""
    )
    check("stats 4 sejajar satu baris", same_row, f"tops={tops}")
    check("grid stats 4 kolom", len(cols.split(" ")) == 4, cols)
    check("foto profil tidak menumpuk stats", no_overlap)
    page.screenshot(path=OUT + r"\shot-about-stats.png")

    # 2b. PKM-KC 2026 Silver Medal & clickable PDF certificate
    page.locator("#achievements").scroll_into_view_if_needed()
    page.wait_for_timeout(400)
    cert_selector = "a.achievement-card__link[href='/certificates/pkm-kc-2026-medali-perak.pdf']"
    cert_loc = page.locator(cert_selector)
    cert_clickable = False
    if cert_loc.count() == 1:
        cert_loc.scroll_into_view_if_needed()
        cbox = cert_loc.bounding_box()
        if cbox:
            cert_clickable = page.evaluate(
                """({x, y, sel}) => {
                  const hit = document.elementFromPoint(x, y);
                  return Boolean(hit && hit.closest(sel));
                }""",
                {"x": cbox["x"] + cbox["width"] / 2, "y": cbox["y"] + cbox["height"] / 2, "sel": cert_selector},
            )
    cert_resp = ctx.request.get(BASE.rstrip("/") + "/certificates/pkm-kc-2026-medali-perak.pdf")
    check("link sertifikat PKM-KC 2026 bisa diklik", cert_clickable)
    check("PDF sertifikat PKM-KC 2026 HTTP 200", cert_resp.status == 200, f"status={cert_resp.status}")

    # 3. i18n still swaps project descriptions (hyphenated keys)
    before = page.locator("[data-i18n='projects.items.sigap-mbg.desc']").inner_text()
    page.evaluate("() => window.scrollTo(0, Math.round(document.body.scrollHeight * 0.35))")
    page.wait_for_timeout(700)
    nav_cls = page.locator("#navbar").get_attribute("class") or ""
    print(f"   [diag] scrollY={page.evaluate('() => Math.round(window.scrollY)')} navbar='{nav_cls}'", flush=True)

    def click_lang():
        try:
            page.locator("#langToggle").click(timeout=8000)
        except Exception:
            # Navbar can be hidden by design; exercise the delegated handler directly
            page.evaluate("() => document.getElementById('langToggle').click()")

    click_lang()
    page.wait_for_timeout(600)
    after = page.locator("[data-i18n='projects.items.sigap-mbg.desc']").inner_text()
    check("i18n swap deskripsi proyek (key baru)", before != after,
          f"'{before[:38]}' -> '{after[:38]}'")
    click_lang()
    page.wait_for_timeout(400)

    # 4. Chat: Kevin + formatted answer + typing indicator
    page.evaluate("() => window.scrollTo(0, 0)")
    page.click("#chatToggle")
    page.wait_for_selector("#chatWindow.is-open", timeout=5000)
    title = page.locator(".chat-header__title").inner_text()
    check("nama chat = Kevin", title.strip() == "Kevin", title)
    welcome = page.locator(".chat-message--assistant .chat-message__text").first.inner_text()
    check("welcome message Kevin", "Kevin" in welcome, welcome[:60])

    page.fill("#chatInput", "Apa saja keahlian Mahdi?")
    page.click("#chatSend")
    typing_seen = True
    try:
        page.wait_for_selector("#chatTyping", state="visible", timeout=4000)
    except Exception:
        typing_seen = False
    check("indikator 'Kevin is typing' tampil", typing_seen)
    try:
        page.wait_for_selector("#chatTyping", state="hidden", timeout=45000)
    except Exception:
        pass
    page.wait_for_timeout(400)

    all_msgs = page.eval_on_selector_all(
        ".chat-message--assistant .chat-message__text", "els => els.map(e => e.innerText)"
    )
    last_el = page.locator(".chat-message--assistant .chat-message__text").last
    last_text = all_msgs[-1] if all_msgs else ""
    has_asterisk = any("*" in m for m in all_msgs)
    check("jawaban tanpa bintang markdown mentah", not has_asterisk, last_text[:110].replace("\n", " / "))
    list_items = last_el.locator("li").count()
    check("bullet dirender sebagai elemen list", list_items >= 1, f"li={list_items}")
    check("tanpa page errors", not errors, "; ".join(errors[:2])[:150])
    page.screenshot(path=OUT + r"\shot-chat-kevin.png")
    browser.close()

passed = sum(1 for _, ok in results if ok)
print(f"\nRINGKASAN: {passed}/{len(results)} check lolos", flush=True)
sys.exit(0 if passed == len(results) else 1)

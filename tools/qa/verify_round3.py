"""Round 3 verification: new icons + marquee behavior + screenshots."""
import asyncio
import os
from pathlib import Path
from playwright.async_api import async_playwright

URL = os.environ.get("PORTFOLIO_BASE", "http://localhost:4321")
OUT = Path(__file__).resolve().parent / "shots"
OUT.mkdir(exist_ok=True)

async def sample_marquee(page, label):
    el = await page.query_selector(".skills__marquee-content")
    if not el:
        print(f"{label}: NO MARQUEE ELEMENT")
        return
    anim = await el.evaluate("e => getComputedStyle(e).animationName")
    t1 = await el.evaluate("e => getComputedStyle(e).transform")
    await page.wait_for_timeout(900)
    t2 = await el.evaluate("e => getComputedStyle(e).transform")
    tx1 = float(t1.split(",")[4]) if t1 and t1 != "none" else None
    tx2 = float(t2.split(",")[4]) if t2 and t2 != "none" else None
    direction = ""
    if tx1 is not None and tx2 is not None:
        direction = "rightward" if tx2 > tx1 else ("leftward" if tx2 < tx1 else "static")
    print(f"{label}: animation={anim} moved={t1 != t2} direction={direction}")
    print(f"   translateX {tx1} -> {tx2}")

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()

        # --- Default context (no-preference) ---
        ctx = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await ctx.new_page()
        console_errors = []
        page.on("console", lambda m: console_errors.append(m.text) if m.type == "error" else None)
        bad = []
        page.on("response", lambda r: bad.append(f"{r.status} {r.url}") if r.status >= 400 else None)

        await page.goto(URL, wait_until="load")
        await page.wait_for_timeout(2500)
        await page.evaluate("document.querySelector('#skills').scrollIntoView()")
        await page.wait_for_timeout(600)

        await sample_marquee(page, "default")

        # hover pause check
        await page.locator(".skills__marquee").hover()
        await page.wait_for_timeout(400)
        el = await page.query_selector(".skills__marquee-content")
        h1 = await el.evaluate("e => getComputedStyle(e).transform")
        await page.wait_for_timeout(900)
        h2 = await el.evaluate("e => getComputedStyle(e).transform")
        print(f"hover pause: paused={h1 == h2} ({h1} vs {h2})")
        await page.mouse.move(0, 0)
        await page.wait_for_timeout(300)

        # icon inventory + HTTP status
        icon_srcs = await page.evaluate(
            "Array.from(document.querySelectorAll('img[src^=\"/icons/\"]')).map(i => i.src)"
        )
        uniq = sorted(set(icon_srcs))
        print(f"icon <img> tags on page: {len(icon_srcs)}, unique files: {len(uniq)}")
        for u in uniq:
            resp = await page.request.get(u)
            name = u.split("/")[-1]
            flag = "OK" if resp.status == 200 else f"HTTP {resp.status}"
            print(f"   {name}: {flag}")

        # screenshots
        await page.locator("#skills").screenshot(path=str(OUT / "shot_skills_desktop.png"))
        await page.locator("#achievements").screenshot(path=str(OUT / "shot_achievements_desktop.png"))
        print(f"console errors: {console_errors[:8]}")
        print(f"bad responses: {[b for b in bad if 'favicon' not in b][:8]}")
        await ctx.close()

        # --- Reduce-motion context ---
        ctx2 = await browser.new_context(viewport={"width": 1440, "height": 900}, reduced_motion="reduce")
        page2 = await ctx2.new_page()
        await page2.goto(URL, wait_until="load")
        await page2.wait_for_timeout(2000)
        await page2.evaluate("document.querySelector('#skills').scrollIntoView()")
        await page2.wait_for_timeout(600)
        await sample_marquee(page2, "reduce-motion")
        await ctx2.close()

        # --- Mobile viewport ---
        ctx3 = await browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
        page3 = await ctx3.new_page()
        await page3.goto(URL, wait_until="load")
        await page3.wait_for_timeout(2000)
        await page3.evaluate("document.querySelector('#skills').scrollIntoView()")
        await page3.wait_for_timeout(600)
        await page3.locator("#skills").screenshot(path=str(OUT / "shot_skills_mobile.png"))
        await page3.locator("#achievements").screenshot(path=str(OUT / "shot_achievements_mobile.png"))
        print("mobile screenshots saved")
        await ctx3.close()

        await browser.close()

asyncio.run(main())

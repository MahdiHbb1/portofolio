import os

"""Verify lazy 3D scene: not loaded before scroll, initializes after, no errors."""
import sys
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else os.environ.get("PORTFOLIO_BASE", "http://localhost:4322/")
errors = []

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    pg = b.new_page(viewport={"width": 1350, "height": 940})
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto(BASE, wait_until="load")
    pg.wait_for_timeout(1800)

    early = pg.evaluate(
        "() => performance.getEntriesByType('resource').some(r => r.name.includes('scene.'))"
    )
    print("scene dimuat SEBELUM scroll (harus False):", early)

    pg.evaluate("() => document.querySelector('#gallery').scrollIntoView()")
    pg.wait_for_timeout(4500)

    late = pg.evaluate(
        "() => performance.getEntriesByType('resource').some(r => r.name.includes('scene.'))"
    )
    print("scene dimuat SETELAH scroll ke gallery (harus True):", late)

    canvas = pg.evaluate(
        "() => { const c = document.querySelector('.orbit-canvas'); return c ? { w: c.width, h: c.height, connected: c.isConnected } : null; }"
    )
    print("orbit canvas:", canvas)

    box = pg.locator(".orbit-canvas").bounding_box()
    dragged = False
    if box:
        x = box["x"] + box["width"] / 2
        y = box["y"] + box["height"] / 2
        pg.mouse.move(x, y)
        pg.mouse.down()
        pg.mouse.move(x + 160, y + 40, steps=12)
        pg.mouse.up()
        pg.wait_for_timeout(900)
        dragged = True
    print("drag kamera dilakukan:", dragged)

    m = b.new_page(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
    m.goto(BASE, wait_until="load")
    m.wait_for_timeout(1200)
    m.evaluate("() => document.querySelector('#gallery').scrollIntoView()")
    m.wait_for_timeout(2000)
    mscene = m.evaluate(
        "() => performance.getEntriesByType('resource').some(r => r.name.includes('scene.'))"
    )
    print("mobile: scene dimuat (harus False):", mscene)

    print("page errors:", errors if errors else "tidak ada")
    ok = late and not early and not mscene and not errors
    print("VERDICT:", "PASS" if ok else "CHECK MANUAL")
    b.close()
    sys.exit(0 if ok else 1)

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
    modal_opened = False
    modal_desc_ok = False
    modal_href_ok = False
    if box:
        x = box["x"] + box["width"] / 2
        y = box["y"] + box["height"] / 2
        pg.mouse.move(x, y)
        pg.mouse.down()
        pg.mouse.move(x + 160, y + 40, steps=12)
        pg.mouse.up()
        pg.wait_for_timeout(900)
        dragged = True

        # Probe ring sample points on orbit canvas until a 3D card opens #panel-modal (900ms camera transition)
        for fx, fy in (
            (0.5, 0.52),
            (0.35, 0.52),
            (0.65, 0.52),
            (0.25, 0.5),
            (0.75, 0.5),
            (0.42, 0.44),
            (0.58, 0.44),
            (0.42, 0.6),
            (0.58, 0.6),
        ):
            pg.mouse.click(box["x"] + box["width"] * fx, box["y"] + box["height"] * fy)
            pg.wait_for_timeout(1200)
            if pg.locator("#panel-modal[data-state='visible']").count() == 1:
                modal_opened = True
                break

        if modal_opened:
            desc = pg.locator("#modal-description").inner_text().strip()
            href = pg.locator("#modal-link").get_attribute("href") or ""
            modal_desc_ok = len(desc) > 10 and desc != "Project details will appear here."
            modal_href_ok = href.startswith("/projects/") and len(href) > len("/projects/")
            print("modal opened:", modal_opened, "href:", href, "desc ok:", modal_desc_ok)
            pg.keyboard.press("Escape")
            pg.wait_for_timeout(1000)

    print("drag kamera dilakukan:", dragged)

    m = b.new_page(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
    m.goto(BASE, wait_until="load")
    m.wait_for_timeout(1200)
    m_gallery_display = m.evaluate(
        "() => getComputedStyle(document.querySelector('#gallery')).display"
    )
    m.evaluate("() => window.scrollTo(0, 600)")
    m.wait_for_timeout(1500)
    mscene = m.evaluate(
        "() => performance.getEntriesByType('resource').some(r => r.name.includes('scene.'))"
    )
    print("mobile: #gallery display (harus none):", m_gallery_display)
    print("mobile: scene dimuat (harus False):", mscene)

    print("page errors:", errors if errors else "tidak ada")
    ok = (
        late
        and not early
        and m_gallery_display == "none"
        and not mscene
        and modal_opened
        and modal_desc_ok
        and modal_href_ok
        and not errors
    )
    print("VERDICT:", "PASS" if ok else "CHECK MANUAL")
    b.close()
    sys.exit(0 if ok else 1)

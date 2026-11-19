"""Generate 1200x630 Open Graph cards for the portfolio.

Usage (from the project root):
    python tools/og/generate.py

Needs Python + Playwright:
    pip install playwright
    playwright install chromium

Output lands in public/og/ and is meant to be committed. Rerun whenever
project or writeup titles change. Base.astro picks the cards up by URL
slug (public/og/<segments-joined-by-dashes>.png).

Screenshots are quantized to a 256-color palette after rendering (~60%
smaller, visually identical). That step needs Pillow:
    pip install pillow
Without Pillow the script still runs and keeps the raw screenshots.
"""

import base64
from pathlib import Path
from string import Template

from playwright.sync_api import sync_playwright

try:
    from PIL import Image
except ImportError:  # Palette optimization is optional.
    Image = None

ROOT = Path(__file__).resolve().parents[2]
OG_DIR = ROOT / "public" / "og"

SPACE_GROTESK = (
    ROOT
    / "node_modules/@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2"
)
MONO_400 = (
    ROOT / "node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2"
)
MONO_700 = (
    ROOT / "node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-700-normal.woff2"
)


def font_face(family: str, weight: str, path: Path) -> str:
    # Data URI: about:blank pages cannot load file:// subresources in Chromium.
    payload = base64.b64encode(path.read_bytes()).decode("ascii")
    return (
        f"@font-face {{ font-family: '{family}'; font-style: normal; "
        f"font-weight: {weight}; "
        f"src: url(data:font/woff2;base64,{payload}) format('woff2'); }}"
    )


FONT_FACE = "\n".join(
    [
        font_face("Space Grotesk", "300 700", SPACE_GROTESK),
        font_face("JetBrains Mono", "400", MONO_400),
        font_face("JetBrains Mono", "700", MONO_700),
    ]
)

CARDS = [
    dict(
        slug="home",
        tag="PORTFOLIO / 2026",
        title="Mahdi Habibi",
        meta="Informatics @ UNNES | Security & ML | CTF Player",
        badge="MH",
    ),
    dict(
        slug="projects-sigap-mbg",
        tag="PROJECT / 01",
        title="SIGAP MBG",
        meta="Hardware + Software (ML + IoT) | 2025",
        badge="01",
    ),
    dict(
        slug="projects-fraudlens",
        tag="PROJECT / 02",
        title="FraudLens",
        meta="Fraud Detection | 2024",
        badge="02",
    ),
    dict(
        slug="projects-fabric-cnn",
        tag="PROJECT / 03",
        title="Fabric Defect Detection CNN",
        meta="Computer Vision | 2024",
        badge="03",
    ),
    dict(
        slug="projects-legalin",
        tag="PROJECT / 04",
        title="LegalIn",
        meta="AI Legal Assistant | 2024",
        badge="04",
    ),
    dict(
        slug="projects-buktitagih",
        tag="PROJECT / 05",
        title="BuktiTagih AI",
        meta="Hackathon Project | 2024",
        badge="05",
    ),
    dict(
        slug="projects-ctf-itsecdevx26",
        tag="PROJECT / 06",
        title="CTF itsecdevx26",
        meta="Security Challenge | 2024",
        badge="06",
    ),
    dict(
        slug="projects-ctf-writeups",
        tag="PROJECT / 07",
        title="CTF Writeups Collection",
        meta="Security Documentation | 2024-2025",
        badge="07",
    ),
    dict(
        slug="writeups-itsecdevx26-web",
        tag="CTF WRITEUP / 01",
        title="SQL Injection via Login Bypass",
        meta="Web Exploitation | itsecdevx26 CTF",
        badge="01",
    ),
    dict(
        slug="writeups-itsecdevx26-forensics",
        tag="CTF WRITEUP / 02",
        title="Memory Dump Analysis",
        meta="Forensics | itsecdevx26 CTF",
        badge="02",
    ),
    dict(
        slug="writeups-placeholder-crypto",
        tag="CTF WRITEUP / 03",
        title="RSA Key Recovery",
        meta="Cryptography | CTF Writeup",
        badge="03",
    ),
    dict(
        slug="writeups-placeholder-xss",
        tag="CTF WRITEUP / 04",
        title="XSS to Admin Takeover",
        meta="Web Security | CTF Writeup",
        badge="04",
    ),
]

HTML = Template(
    """<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
$fonts
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: 1200px; height: 630px; }
body {
  background: #0f0e0d;
  color: #e8e0d4;
  font-family: 'Space Grotesk', sans-serif;
  position: relative;
  overflow: hidden;
}
body::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 12% 112%, rgba(160, 120, 80, 0.20), transparent 52%),
    radial-gradient(circle at 100% 0%, rgba(160, 120, 80, 0.07), transparent 42%);
}
.frame {
  position: absolute;
  inset: 30px;
  border: 1px solid rgba(232, 224, 212, 0.14);
  border-radius: 10px;
}
.topbar {
  position: absolute;
  top: 62px;
  left: 76px;
  right: 76px;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-family: 'JetBrains Mono', monospace;
}
.mark { font-weight: 700; font-size: 22px; color: #a07850; letter-spacing: 0.04em; }
.tag { font-size: 13px; letter-spacing: 0.22em; text-transform: uppercase; color: rgba(232, 224, 212, 0.55); }
.content {
  position: absolute;
  left: 76px;
  right: 76px;
  top: 50%;
  transform: translateY(-42%);
}
.title {
  font-weight: 600;
  font-size: $title_px;
  line-height: 1.08;
  letter-spacing: -0.015em;
  max-width: 830px;
  color: #e8e0d4;
  margin-bottom: 28px;
}
.meta {
  font-family: 'JetBrains Mono', monospace;
  font-size: 16px;
  color: rgba(232, 224, 212, 0.62);
}
.badge {
  position: absolute;
  right: 70px;
  bottom: 110px;
  font-weight: 700;
  font-size: 200px;
  line-height: 1;
  letter-spacing: -0.05em;
  color: rgba(232, 224, 212, 0.05);
}
.bottombar {
  position: absolute;
  bottom: 60px;
  left: 76px;
  right: 76px;
  display: flex;
  justify-content: space-between;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  color: rgba(232, 224, 212, 0.45);
}
.accent {
  position: absolute;
  top: 62px;
  left: 76px;
  width: 34px;
  height: 0;
}
</style>
</head>
<body>
  <div class="frame"></div>
  <div class="topbar">
    <span class="mark">MH.</span>
    <span class="tag">$tag</span>
  </div>
  <div class="content">
    <div class="title">$title</div>
    <div class="meta">$meta</div>
  </div>
  <div class="bottombar">
    <span>Mahdi Habibi</span>
    <span>github.com/MahdiHbb1</span>
  </div>
  <div class="badge">$badge</div>
</body>
</html>"""
)


def title_size(title: str) -> int:
    length = len(title)
    if length <= 18:
        return 74
    if length <= 34:
        return 62
    if length <= 52:
        return 52
    return 44


def optimize_png(path: Path) -> None:
    """Quantize a card to a 256-color palette; ~60% smaller, visually identical."""
    if Image is None:
        return
    before = path.stat().st_size
    Image.open(path).quantize(
        colors=256, method=Image.MEDIANCUT, dither=Image.Dither.NONE
    ).save(path, optimize=True)
    after = path.stat().st_size
    saved = 100 - round(after / before * 100)
    print(f"  palette: {before} -> {after} bytes (-{saved}%)")


def render(card: dict) -> str:
    return HTML.safe_substitute(
        fonts=FONT_FACE,
        tag=card["tag"],
        title=card["title"],
        title_px=f"{title_size(card['title'])}px",
        meta=card["meta"],
        badge=card["badge"],
    )


def main() -> None:
    OG_DIR.mkdir(parents=True, exist_ok=True)

    if Image is None:
        print("Pillow not installed: keeping raw screenshots (pip install pillow)")

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(
            viewport={"width": 1200, "height": 630},
            device_scale_factor=1,
        )

        for card in CARDS:
            page.set_content(render(card), wait_until="load")
            page.evaluate("() => document.fonts.ready.then(() => undefined)")
            page.wait_for_timeout(120)
            out = OG_DIR / f"{card['slug']}.png"
            page.screenshot(path=str(out))
            optimize_png(out)
            print(f"wrote {out.relative_to(ROOT)}")

        browser.close()


if __name__ == "__main__":
    main()

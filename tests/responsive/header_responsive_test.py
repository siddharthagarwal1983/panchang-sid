"""Automated responsive + diacritics tests for AppHeader.

Run:  python3 tests/responsive/header_responsive_test.py [base_url]
Requires Playwright (Chromium). Screenshots land in tests/responsive/__screenshots__/.
Exits non-zero if any viewport/safe-area/device case fails.
"""

import asyncio
import sys
from pathlib import Path

from playwright.async_api import async_playwright

BASE_URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8080"
OUT = Path(__file__).parent / "__screenshots__"
OUT.mkdir(parents=True, exist_ok=True)

TITLE = "Panchāṅga"
DIACRITICS = "āṅ"

# width, height, label — smallest phones through large phones + landscape
VIEWPORTS = [
    (280, 653, "w280-galaxy-fold"),
    (320, 568, "w320-iphone-se1"),
    (360, 640, "w360-android-small"),
    (375, 667, "w375-iphone-se3"),
    (390, 844, "w390-iphone-14"),
    (412, 915, "w412-pixel-7"),
    (430, 932, "w430-iphone-pro-max"),
    (844, 390, "landscape-iphone-14"),
]

# label -> (top, right, bottom, left) simulated safe-area insets
SAFE_AREAS = {
    "none": ("0px", "0px", "0px", "0px"),
    "notch": ("47px", "0px", "34px", "0px"),
    "landscape-notch": ("0px", "48px", "21px", "48px"),
}

# Playwright device descriptors for real iOS/Android rendering metrics
DEVICES = ["iPhone SE", "iPhone 12 Mini", "iPhone 14 Pro Max", "Pixel 5", "Galaxy S9+"]

failures: list[str] = []


def check(condition: bool, message: str) -> None:
    if not condition:
        failures.append(message)
    print(("PASS  " if condition else "FAIL  ") + message)


async def apply_safe_area(page, insets):
    top, right, bottom, left = insets
    await page.add_style_tag(
        content=(
            ":root{"
            f"--sa-top:{top};--sa-right:{right};--sa-bottom:{bottom};--sa-left:{left};"
            "}"
        )
    )


async def assert_header(page, label: str) -> None:
    header = page.get_by_test_id("app-header")
    title = page.get_by_test_id("app-header-title")
    await title.wait_for(state="visible")
    await page.evaluate("document.fonts.ready")

    metrics = await title.evaluate(
        "el => ({ text: el.textContent, sw: el.scrollWidth, cw: el.clientWidth,"
        " sh: el.scrollHeight, ch: el.clientHeight })"
    )
    hbox = await header.bounding_box()
    tbox = await title.bounding_box()

    check(metrics["text"] == TITLE, f"{label}: title text intact ({metrics['text']!r})")
    check(metrics["sw"] <= metrics["cw"] + 1, f"{label}: title not horizontally clipped")
    check(metrics["sh"] <= metrics["ch"] + 1, f"{label}: diacritics not vertically clipped")
    check(tbox["x"] >= hbox["x"] - 0.5, f"{label}: title inside header left edge")
    check(
        tbox["x"] + tbox["width"] <= hbox["x"] + hbox["width"] + 0.5,
        f"{label}: title inside header right edge",
    )

    # Header actions must stay on-screen and remain tap-target sized (>=32px).
    for name in ("Change location", "Sign in", "Your account"):
        el = page.get_by_label(name)
        if await el.count() == 0:
            continue
        box = await el.first.bounding_box()
        if not box:
            continue
        check(
            box["x"] >= hbox["x"] - 0.5
            and box["x"] + box["width"] <= hbox["x"] + hbox["width"] + 0.5,
            f"{label}: '{name}' fully on-screen",
        )
        check(box["height"] >= 32 and box["width"] >= 32, f"{label}: '{name}' tap target >= 32px")

    await header.screenshot(path=str(OUT / f"{label}.png"))


async def assert_diacritics(page, label: str) -> None:
    """Diacritic glyphs must come from a real font, not a tofu fallback."""
    result = await page.evaluate(
        """
        (chars) => {
          const el = document.querySelector('[data-testid="app-header-title"]');
          const font = getComputedStyle(el).font;
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          ctx.font = font;
          const notdef = ctx.measureText('\\uFFFF').width;
          return {
            font,
            perChar: [...chars].map(c => ({ c, w: ctx.measureText(c).width, notdef })),
          };
        }
        """,
        DIACRITICS,
    )
    for item in result["perChar"]:
        ok = item["w"] > 0 and abs(item["w"] - item["notdef"]) > 0.01
        check(ok, f"{label}: glyph {item['c']!r} renders (w={item['w']:.2f})")


async def main() -> None:
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)

        # 1. Viewport sweep x safe-area variants
        for width, height, name in VIEWPORTS:
            for sa_name, insets in SAFE_AREAS.items():
                ctx = await browser.new_context(viewport={"width": width, "height": height})
                page = await ctx.new_page()
                await page.goto(BASE_URL, wait_until="networkidle")
                await apply_safe_area(page, insets)
                await assert_header(page, f"{name}__safe-{sa_name}")
                await ctx.close()

        # 2. Real iOS / Android device descriptors, portrait + landscape
        for device_name in DEVICES:
            device = pw.devices[device_name]
            for orientation in ("portrait", "landscape"):
                opts = dict(device)
                vp = opts["viewport"]
                if orientation == "landscape":
                    opts["viewport"] = {"width": vp["height"], "height": vp["width"]}
                ctx = await browser.new_context(**opts)
                page = await ctx.new_page()
                await page.goto(BASE_URL, wait_until="networkidle")
                await apply_safe_area(page, SAFE_AREAS["notch"])
                slug = device_name.lower().replace(" ", "-").replace("+", "plus")
                label = f"device-{slug}-{orientation}"
                await assert_header(page, label)
                await assert_diacritics(page, label)
                await ctx.close()

        await browser.close()

    print(f"\n{len(failures)} failure(s). Screenshots: {OUT}")
    for f in failures:
        print(" -", f)
    sys.exit(1 if failures else 0)


asyncio.run(main())

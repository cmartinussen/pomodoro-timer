"""Run the real timer page in mobile WebKit, including its Settings controls."""
from datetime import datetime
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread

from playwright.sync_api import expect, sync_playwright


def select_theme(page, value):
    page.locator("#settings-toggle").tap()
    page.locator("#christmas-theme").select_option(value)
    page.locator("#close-settings").tap()


def check_theme(page, enabled):
    trim = page.locator(".holiday-trim")
    scene = page.locator(".holiday-scene")
    if enabled:
        expect(trim).to_be_in_viewport()
        expect(trim).to_be_visible()
        expect(trim.locator("i")).to_be_visible()
        expect(scene.locator(".holiday-lights i")).to_have_count(24)
        expect(scene.locator(".holiday-snow span")).to_have_count(24)
        expect(scene).to_be_visible()
    else:
        expect(trim).to_be_hidden()
        expect(scene).to_be_hidden()


if __name__ == "__main__":
    root = Path(__file__).resolve().parents[1]
    handler = partial(SimpleHTTPRequestHandler, directory=str(root))
    with ThreadingHTTPServer(("127.0.0.1", 0), handler) as server, sync_playwright() as pw:
        Thread(target=server.serve_forever, daemon=True).start()
        browser = pw.webkit.launch()
        url = f"http://127.0.0.1:{server.server_port}"
        for month, expected in [(11, False), (12, True), (1, False)]:
            context = browser.new_context(**pw.devices["iPhone 13"], service_workers="block",
                                          reduced_motion="reduce")
            page = context.new_page()
            page.clock.set_fixed_time(datetime(2026, month, 15, 12))
            page.goto(url)
            check_theme(page, expected)
            select_theme(page, "on")
            check_theme(page, True)
            expect(page.locator(".holiday-snow span").first).to_have_css("animation-name", "none")
            page.reload()
            check_theme(page, True)
            select_theme(page, "off")
            page.reload()
            check_theme(page, False)
            select_theme(page, "auto")
            check_theme(page, expected)
            context.close()
        browser.close()

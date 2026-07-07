from playwright.sync_api import sync_playwright
import os

def run_cuj(page):
    page.goto("http://localhost:3001/login")
    page.wait_for_timeout(5000)
    page.screenshot(path="verification/screenshots/login_page.png")
    print("Verification script finished.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="verification/videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()

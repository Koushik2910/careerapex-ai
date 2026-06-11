"""
CareerApex Test Framework — conftest.py
Global fixtures. No LLM calls in any fixture.
"""

import os
import pytest
import httpx
from pathlib import Path
from playwright.sync_api import sync_playwright, Browser, BrowserContext, Page

BASE_URL = os.getenv("CAREERAPEX_URL", "http://localhost:3000")
API_URL  = os.getenv("CAREERAPEX_API_URL", "http://localhost:8001")
FIXTURES = Path(__file__).parent / "fixtures"
SCREENSHOTS = Path(__file__).parent / "reports" / "screenshots"
SCREENSHOTS.mkdir(parents=True, exist_ok=True)

# ── Browser fixtures ───────────────────────────────────────────────────────────

@pytest.fixture(scope="session")
def browser_instance():
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=os.getenv("HEADLESS", "true").lower() == "true",
            args=["--no-sandbox", "--disable-dev-shm-usage"],
        )
        yield browser
        browser.close()


@pytest.fixture(scope="function")
def context(browser_instance: Browser):
    ctx = browser_instance.new_context(
        viewport={"width": 1440, "height": 900},
    )
    yield ctx
    ctx.close()


@pytest.fixture(scope="function")
def page(context: BrowserContext):
    p = context.new_page()
    yield p
    p.close()


# ── Screenshot on failure ──────────────────────────────────────────────────────

@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    outcome = yield
    rep = outcome.get_result()
    if rep.when == "call" and rep.failed:
        page = item.funcargs.get("page")
        if page:
            name = item.name.replace("/", "_").replace(":", "_")
            screenshot_path = SCREENSHOTS / f"{name}.png"
            try:
                page.screenshot(path=str(screenshot_path), full_page=True)
                print(f"\nScreenshot: {screenshot_path}")
            except Exception:
                pass


# ── API client ─────────────────────────────────────────────────────────────────

@pytest.fixture(scope="function")
def api_client():
    with httpx.Client(base_url=API_URL, timeout=30.0) as client:
        yield client


# ── Session fixtures ───────────────────────────────────────────────────────────

@pytest.fixture(scope="function")
def clean_session_id():
    import uuid
    return f"test-{uuid.uuid4().hex[:8]}"

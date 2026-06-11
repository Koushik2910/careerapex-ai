"""
Interview UI Tests — ZERO LLM calls.
"""

import pytest
from playwright.sync_api import Page, expect

BASE_URL = "http://localhost:3000"


class TestInterviewSetupUI:

    def test_page_loads(self, page: Page):
        page.goto(f"{BASE_URL}/interview")
        expect(page.locator("h1")).to_contain_text("Mock Interview")

    def test_standard_mode_option_visible(self, page: Page):
        """Use exact=True to avoid matching button text."""
        page.goto(f"{BASE_URL}/interview")
        expect(page.get_by_text("Standard Interview", exact=True)).to_be_visible(timeout=5000)

    def test_defense_mode_option_visible(self, page: Page):
        page.goto(f"{BASE_URL}/interview")
        expect(page.get_by_text("Resume Defense", exact=True)).to_be_visible(timeout=5000)

    def test_session_id_field_visible(self, page: Page):
        page.goto(f"{BASE_URL}/interview")
        expect(page.locator("input[placeholder*='session']")).to_be_visible()

    def test_session_id_field_accepts_input(self, page: Page):
        page.goto(f"{BASE_URL}/interview")
        page.fill("input[placeholder*='session']", "test-session-001")
        assert page.input_value("input[placeholder*='session']") == "test-session-001"

    def test_start_button_visible(self, page: Page):
        """Button text is 'Start Standard Interview' not 'Start Interview'."""
        page.goto(f"{BASE_URL}/interview")
        expect(page.locator("button:has-text('Start Standard Interview')")).to_be_visible(timeout=5000)

    def test_select_defense_mode(self, page: Page):
        page.goto(f"{BASE_URL}/interview")
        page.get_by_text("Resume Defense", exact=True).click()
        expect(page.locator("button:has-text('Start')")).to_be_visible()

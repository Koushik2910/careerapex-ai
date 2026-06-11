"""
Navigation E2E Tests — ZERO LLM calls.
"""

import pytest
from playwright.sync_api import Page, expect

BASE_URL = "http://localhost:3000"


class TestNavigation:

    @pytest.mark.parametrize("route,expected_text", [
        ("/dashboard", "Career Dashboard"),
        ("/analyse", "Resume Analyser"),
        ("/gaps", "Skill Gap"),
        ("/interview", "Mock Interview"),
        ("/voice", "Voice Interview"),
        ("/debrief", "Interview Debrief"),
        ("/memory", "Career Memory"),
        ("/negotiate", "Salary Negotiation"),
        ("/linkedin", "LinkedIn Optimizer"),
        ("/roadmap", "Career Roadmap"),
    ])
    def test_page_loads_without_error(self, page: Page, route: str, expected_text: str):
        page.goto(f"{BASE_URL}{route}")
        page.wait_for_load_state("networkidle")
        expect(page.locator(f"text={expected_text}").first).to_be_visible(timeout=8000)
        assert not page.is_visible("text=Build Error")
        assert not page.is_visible("text=Application error")

    def test_redirect_from_root(self, page: Page):
        page.goto(BASE_URL)
        page.wait_for_url(f"{BASE_URL}/dashboard", timeout=5000)
        expect(page.locator("h1").first).to_be_visible()

    def test_sidebar_visible_on_dashboard(self, page: Page):
        """Sidebar renders with navigation groups — use exact=True to avoid strict mode."""
        page.goto(f"{BASE_URL}/dashboard")
        expect(page.get_by_text("WORKSPACE", exact=True)).to_be_visible(timeout=5000)
        expect(page.get_by_text("PRACTICE", exact=True)).to_be_visible()
        expect(page.get_by_text("TOOLS", exact=True)).to_be_visible()

    def test_sidebar_links_present(self, page: Page):
        page.goto(f"{BASE_URL}/dashboard")
        for label in ["Dashboard", "Analyse", "Skill Gaps", "Interview",
                      "Debrief", "Memory", "Negotiate", "LinkedIn", "Roadmap"]:
            expect(page.locator(f"text={label}").first).to_be_visible(timeout=5000)

    def test_dashboard_shows_kpi_cards(self, page: Page):
        page.goto(f"{BASE_URL}/dashboard")
        expect(page.locator("text=Match Score")).to_be_visible(timeout=5000)
        expect(page.locator("text=Avg Answer Score")).to_be_visible()

    def test_dashboard_shows_quick_actions(self, page: Page):
        """Use first() to avoid strict mode on duplicate text."""
        page.goto(f"{BASE_URL}/dashboard")
        expect(page.locator("text=Analyse Resume").first).to_be_visible(timeout=5000)
        expect(page.locator("text=Mock Interview").first).to_be_visible()
        expect(page.locator("text=Voice Interview").first).to_be_visible()

    def test_analyse_page_shows_upload_zones(self, page: Page):
        page.goto(f"{BASE_URL}/analyse")
        expect(page.locator("text=Upload Resume")).to_be_visible(timeout=5000)
        expect(page.locator("text=Upload Job Description")).to_be_visible()

    def test_analyse_run_button_disabled_by_default(self, page: Page):
        page.goto(f"{BASE_URL}/analyse")
        btn = page.locator("button:has-text('Run Gap Analysis')")
        expect(btn).to_be_disabled(timeout=5000)

    def test_interview_shows_mode_selector(self, page: Page):
        """Use exact text match to avoid strict mode."""
        page.goto(f"{BASE_URL}/interview")
        expect(page.get_by_text("Standard Interview", exact=True)).to_be_visible(timeout=5000)
        expect(page.get_by_text("Resume Defense", exact=True)).to_be_visible()

    def test_voice_page_shows_start_button(self, page: Page):
        page.goto(f"{BASE_URL}/voice")
        expect(page.locator("text=Start Voice Interview")).to_be_visible(timeout=5000)

    def test_negotiate_shows_tabs(self, page: Page):
        """Use exact match for tab labels."""
        page.goto(f"{BASE_URL}/negotiate")
        expect(page.get_by_text("Negotiation Script", exact=True)).to_be_visible(timeout=5000)
        expect(page.get_by_text("Roleplay Practice", exact=True)).to_be_visible()

    def test_linkedin_shows_tabs(self, page: Page):
        page.goto(f"{BASE_URL}/linkedin")
        expect(page.locator("text=Full Profile Optimizer")).to_be_visible(timeout=5000)
        expect(page.locator("text=Headline Generator")).to_be_visible()

    def test_no_console_errors_on_dashboard(self, page: Page):
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(f"{BASE_URL}/dashboard")
        page.wait_for_load_state("networkidle")
        assert len(errors) == 0, f"JS errors: {errors}"

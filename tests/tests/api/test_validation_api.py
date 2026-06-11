"""
Validation API Tests — ZERO LLM calls.
Tests input validation, error responses, and boundary conditions.
These never trigger any AI processing.
"""

import pytest
import httpx

API_URL = "http://localhost:8001"


@pytest.fixture(scope="module")
def client():
    with httpx.Client(base_url=API_URL, timeout=15.0) as c:
        yield c


class TestAnalyseValidation:
    """Validation tests — no LLM triggered."""

    def test_gap_analysis_nonexistent_session_returns_404(self, client):
        r = client.post("/analyse/gaps/nonexistent-session-xyz-000")
        assert r.status_code == 404
        assert "detail" in r.json()

    def test_questions_count_below_minimum_returns_422(self, client):
        r = client.post("/analyse/questions/any-session?count=2")
        assert r.status_code == 422

    def test_questions_count_above_maximum_returns_422(self, client):
        r = client.post("/analyse/questions/any-session?count=25")
        assert r.status_code == 422

    def test_evaluate_missing_question_returns_422(self, client):
        r = client.post("/analyse/evaluate", json={
            "answer": "Some answer",
            "category": "technical",
        })
        assert r.status_code == 422

    def test_evaluate_empty_answer_returns_score_zero(self, client):
        """Empty answer short-circuits before LLM call — returns 0 immediately."""
        r = client.post("/analyse/evaluate", json={
            "question": "What is Python?",
            "answer": "",
            "category": "technical",
        })
        assert r.status_code == 200
        assert r.json()["score"] == 0
        assert r.json()["confidence_score"] == 0

    def test_evaluate_short_answer_returns_score_zero(self, client):
        """Answer under 10 chars short-circuits before LLM."""
        r = client.post("/analyse/evaluate", json={
            "question": "What is Python?",
            "answer": "idk",
            "category": "technical",
        })
        assert r.status_code == 200
        assert r.json()["score"] == 0


class TestMemoryValidation:
    """Memory endpoint validation — no LLM calls."""

    def test_get_nonexistent_session_returns_404(self, client):
        r = client.get("/memory/session/nonexistent-xyz-000")
        assert r.status_code == 404

    def test_get_all_sessions_returns_200(self, client):
        r = client.get("/memory/sessions")
        assert r.status_code == 200
        assert "sessions" in r.json()

    def test_get_progress_returns_200(self, client):
        r = client.get("/memory/progress")
        assert r.status_code == 200

    def test_save_session_returns_200(self, client):
        r = client.post("/memory/save", json={
            "session_id": "test-validation-save-001",
            "user_id": "default",
            "match_score": 75,
            "skill_gaps": [{"skill": "Python", "priority": "high"}],
            "strengths": ["LangChain"],
            "questions_asked": 5,
            "avg_answer_score": 70.0,
        })
        assert r.status_code == 200
        assert "session_id" in r.json()
        assert "saved_at" in r.json()


class TestTrackerValidation:
    """Confidence tracker validation — no LLM calls."""

    def test_save_score_returns_200(self, client):
        r = client.post("/tracker/save", json={
            "session_id": "test-tracker-001",
            "question": "What is RAG?",
            "answer": "Retrieval Augmented Generation",
            "category": "technical",
            "score": 75,
            "confidence_score": 80,
            "feedback": "Good answer",
            "question_index": 1,
        })
        assert r.status_code == 200
        assert r.json()["saved"] is True

    def test_get_scores_returns_list(self, client):
        # First save a score
        client.post("/tracker/save", json={
            "session_id": "test-tracker-scores-001",
            "question": "Test question",
            "answer": "Test answer",
            "category": "technical",
            "score": 70,
            "confidence_score": 75,
            "feedback": "OK",
            "question_index": 1,
        })
        r = client.get("/tracker/scores/test-tracker-scores-001")
        assert r.status_code == 200
        assert "scores" in r.json()

    def test_get_summary_empty_session(self, client):
        r = client.get("/tracker/summary/empty-session-xyz-000")
        assert r.status_code == 200
        body = r.json()
        assert body["total_questions"] == 0

    def test_summary_with_scores(self, client):
        sid = "test-summary-full-001"
        for i in range(3):
            client.post("/tracker/save", json={
                "session_id": sid,
                "question": f"Q{i}",
                "answer": f"A{i}",
                "category": "technical",
                "score": 60 + i * 10,
                "confidence_score": 65 + i * 5,
                "feedback": "ok",
                "question_index": i + 1,
            })
        r = client.get(f"/tracker/summary/{sid}")
        assert r.status_code == 200
        body = r.json()
        assert body["total_questions"] == 3
        assert 0 <= body["avg_score"] <= 100


class TestNegotiateValidation:
    """Negotiate endpoint validation."""

    def test_script_missing_required_fields_returns_422(self, client):
        r = client.post("/negotiate/script", json={
            "current_offer": 18,
        })
        assert r.status_code == 422

    def test_roleplay_start_missing_fields_returns_422(self, client):
        r = client.post("/negotiate/roleplay/start", json={
            "current_offer": 18,
        })
        assert r.status_code == 422


class TestLinkedInValidation:
    """LinkedIn endpoint validation."""

    def test_headlines_missing_fields_returns_422(self, client):
        r = client.post("/linkedin/headlines", json={
            "current_role": "QA Engineer",
        })
        assert r.status_code == 422

    def test_optimize_missing_session_returns_422(self, client):
        r = client.post("/linkedin/optimize", json={
            "headline": "Test",
            "about": "Test about",
        })
        assert r.status_code == 422

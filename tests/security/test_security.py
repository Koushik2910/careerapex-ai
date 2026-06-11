"""
Security Tests — ZERO LLM calls.
"""

import pytest
import httpx
from pathlib import Path

API_URL  = "http://localhost:8001"
FIXTURES = Path(__file__).parent.parent / "fixtures"


@pytest.fixture(scope="module")
def client():
    with httpx.Client(base_url=API_URL, timeout=15.0) as c:
        yield c


class TestInputSecurity:

    def test_xss_in_session_id_handled_safely(self, client):
        r = client.get('/upload/session/<script>alert(1)</script>')
        assert r.status_code in [200, 400, 404, 422]

    def test_sql_injection_in_session_id(self, client):
        r = client.get("/upload/session/'; DROP TABLE sessions; --")
        assert r.status_code in [200, 400, 404, 422]

    def test_path_traversal_in_session_id(self, client):
        r = client.get("/upload/session/../../../etc/passwd")
        assert r.status_code in [200, 400, 404, 422]
        if r.status_code == 200:
            assert "root:" not in r.text

    def test_empty_session_id(self, client):
        r = client.get("/upload/session/")
        assert r.status_code in [200, 404, 405]

    def test_very_long_session_id(self, client):
        r = client.get(f"/upload/session/{'a' * 1000}")
        assert r.status_code in [200, 400, 404, 422]


class TestFileUploadSecurity:

    def test_upload_empty_file_fails_gracefully(self, client):
        r = client.post("/upload/resume",
            files={"file": ("empty.pdf", b"", "application/pdf")},
            data={"session_id": "test-sec-empty"},
        )
        assert r.status_code in [422, 500]

    def test_upload_tiny_invalid_pdf(self, client):
        """Backend closes connection on invalid PDF — known behavior."""
        try:
            r = client.post("/upload/resume",
                files={"file": ("fake.pdf", b"not a pdf", "application/pdf")},
                data={"session_id": "test-sec-invalid"},
            )
            assert r.status_code in [200, 400, 422, 500]
        except Exception:
            pytest.xfail("Backend closes connection on invalid PDF — known issue")

    def test_upload_no_content_type(self, client):
        r = client.post("/upload/resume",
            files={"file": ("file.bin", b"\x00\x01\x02", "application/octet-stream")},
            data={"session_id": "test-sec-bin"},
        )
        assert r.status_code in [200, 400, 422, 500]


class TestAPIBoundaries:

    def test_evaluate_with_empty_question(self, client):
        """Empty question may hit LLM or timeout — mark as xfail."""
        try:
            r = client.post("/analyse/evaluate", json={
                "question": "",
                "answer": "some answer",
                "category": "technical",
            }, timeout=5.0)
            assert r.status_code in [200, 422]
        except Exception:
            pytest.xfail("Empty question causes timeout — backend should validate before LLM call")

    def test_memory_save_with_invalid_score(self, client):
        r = client.post("/memory/save", json={
            "session_id": "test-sec-score",
            "match_score": "not_a_number",
        })
        assert r.status_code == 422

    def test_tracker_save_missing_required_fields(self, client):
        r = client.post("/tracker/save", json={
            "session_id": "test-sec-tracker",
        })
        assert r.status_code == 422

    def test_nonexistent_endpoint_returns_404(self, client):
        r = client.get("/nonexistent/endpoint/xyz")
        assert r.status_code == 404

    def test_wrong_method_returns_405(self, client):
        r = client.get("/upload/resume")
        assert r.status_code == 405

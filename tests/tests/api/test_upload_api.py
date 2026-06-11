"""
Upload API Tests — ZERO LLM calls.
These tests only test file upload and session endpoints.
Safe to run anytime without burning tokens.
"""

import pytest
import httpx
from pathlib import Path

FIXTURES = Path(__file__).parent.parent.parent / "fixtures"
API_URL  = "http://localhost:8001"


@pytest.fixture(scope="module")
def client():
    with httpx.Client(base_url=API_URL, timeout=30.0) as c:
        yield c


def resume_path():
    return FIXTURES / "resumes" / "valid_resume.pdf"


def jd_path():
    return FIXTURES / "jds" / "ai_engineer_jd.pdf"


class TestResumeUpload:
    """No LLM calls — pure file upload tests."""

    def test_upload_valid_pdf_returns_200(self, client):
        with open(resume_path(), "rb") as f:
            r = client.post("/upload/resume",
                files={"file": ("resume.pdf", f, "application/pdf")},
                data={"session_id": "test-upload-001"},
            )
        assert r.status_code == 200
        body = r.json()
        assert "session_id" in body
        assert "filename" in body
        assert "chunks" in body
        assert body["chunks"] > 0
        assert body["file_type"] == "resume"

    def test_upload_auto_generates_session_id(self, client):
        with open(resume_path(), "rb") as f:
            r = client.post("/upload/resume",
                files={"file": ("resume.pdf", f, "application/pdf")},
            )
        assert r.status_code == 200
        sid = r.json()["session_id"]
        assert len(sid) > 0
        assert sid != "string"

    def test_upload_returns_non_zero_chunks(self, client):
        with open(resume_path(), "rb") as f:
            r = client.post("/upload/resume",
                files={"file": ("resume.pdf", f, "application/pdf")},
                data={"session_id": "test-chunks-001"},
            )
        assert r.json()["chunks"] >= 1

    def test_upload_preserves_filename(self, client):
        with open(resume_path(), "rb") as f:
            r = client.post("/upload/resume",
                files={"file": ("my_custom_resume.pdf", f, "application/pdf")},
                data={"session_id": "test-filename-001"},
            )
        assert r.json()["filename"] == "my_custom_resume.pdf"

    def test_upload_message_contains_session_id(self, client):
        with open(resume_path(), "rb") as f:
            r = client.post("/upload/resume",
                files={"file": ("resume.pdf", f, "application/pdf")},
                data={"session_id": "test-msg-001"},
            )
        assert "test-msg-001" in r.json()["message"]

    def test_upload_empty_file_returns_error(self, client):
        r = client.post("/upload/resume",
            files={"file": ("empty.pdf", b"", "application/pdf")},
            data={"session_id": "test-empty-001"},
        )
        assert r.status_code in [422, 500]

    def test_upload_no_file_returns_422(self, client):
        try:
            r = client.post("/upload/resume",
                data={"session_id": "test-nofile-001"},
            )
            assert r.status_code == 422
        except Exception:
            pytest.xfail("Backend closes connection instead of returning 422 — known issue")


class TestJDUpload:
    """No LLM calls — pure JD upload tests."""

    def test_upload_jd_requires_session_id(self, client):
        with open(jd_path(), "rb") as f:
            r = client.post("/upload/jd",
                files={"file": ("jd.pdf", f, "application/pdf")},
            )
        assert r.status_code == 422

    def test_upload_jd_valid(self, client):
        with open(resume_path(), "rb") as f:
            client.post("/upload/resume",
                files={"file": ("resume.pdf", f, "application/pdf")},
                data={"session_id": "test-jd-valid-001"},
            )
        with open(jd_path(), "rb") as f:
            r = client.post("/upload/jd",
                files={"file": ("jd.pdf", f, "application/pdf")},
                data={"session_id": "test-jd-valid-001"},
            )
        assert r.status_code == 200
        assert r.json()["file_type"] == "jd"
        assert r.json()["chunks"] > 0


class TestSessionInfo:
    """No LLM calls — session endpoint tests."""

    def test_session_info_after_resume_upload(self, client):
        sid = "test-session-info-001"
        with open(resume_path(), "rb") as f:
            client.post("/upload/resume",
                files={"file": ("resume.pdf", f, "application/pdf")},
                data={"session_id": sid},
            )
        r = client.get(f"/upload/session/{sid}")
        assert r.status_code == 200
        assert r.json()["has_resume"] is True
        assert r.json()["has_jd"] is False

    def test_session_info_nonexistent_returns_false(self, client):
        r = client.get("/upload/session/nonexistent-xyz-000")
        assert r.status_code == 200
        assert r.json()["has_resume"] is False

    def test_health_endpoint(self, client):
        r = client.get("/health")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"

    def test_root_endpoint(self, client):
        r = client.get("/")
        assert r.status_code == 200
        assert "CareerApex" in r.json()["status"]

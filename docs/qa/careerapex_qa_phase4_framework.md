# CareerApex Automation Framework Design — Phase 4

---

## FRAMEWORK FOLDER STRUCTURE

```
careerapex/tests/
│
├── conftest.py                    # Global fixtures, browser setup
├── pytest.ini                     # Pytest configuration
├── requirements-test.txt          # Test dependencies
├── .env.test                      # Test environment variables
│
├── pages/                         # Page Object Models
│   ├── __init__.py
│   ├── base_page.py               # Base POM with common actions
│   ├── dashboard_page.py
│   ├── analyse_page.py
│   ├── gaps_page.py
│   ├── interview_page.py
│   ├── voice_page.py
│   ├── debrief_page.py
│   ├── memory_page.py
│   ├── negotiate_page.py
│   ├── linkedin_page.py
│   └── roadmap_page.py
│
├── api/                           # API test clients
│   ├── __init__.py
│   ├── base_client.py
│   ├── upload_client.py
│   ├── analyse_client.py
│   ├── interview_client.py
│   ├── memory_client.py
│   └── negotiate_client.py
│
├── tests/                         # Test suites
│   ├── unit/
│   │   ├── test_text_extraction.py
│   │   ├── test_session_utils.py
│   │   └── test_score_helpers.py
│   ├── api/
│   │   ├── test_upload_api.py
│   │   ├── test_analyse_api.py
│   │   ├── test_interview_api.py
│   │   ├── test_memory_api.py
│   │   └── test_negotiate_api.py
│   ├── ui/
│   │   ├── test_dashboard.py
│   │   ├── test_analyse_ui.py
│   │   ├── test_interview_ui.py
│   │   ├── test_debrief_ui.py
│   │   └── test_navigation.py
│   └── e2e/
│       ├── test_resume_analysis_flow.py
│       ├── test_interview_flow.py
│       ├── test_negotiation_flow.py
│       └── test_complete_journey.py
│
├── fixtures/                      # Test data
│   ├── resumes/
│   │   ├── valid_resume.pdf
│   │   ├── valid_resume.docx
│   │   ├── empty_resume.pdf
│   │   └── large_resume.pdf       # ~10MB
│   ├── jds/
│   │   ├── ai_engineer_jd.pdf
│   │   └── qa_engineer_jd.pdf
│   └── data/
│       ├── test_sessions.json
│       └── expected_responses.json
│
├── utils/
│   ├── __init__.py
│   ├── api_helpers.py             # API call wrappers
│   ├── file_helpers.py            # File upload utilities
│   ├── wait_helpers.py            # Custom wait conditions
│   ├── screenshot_helper.py       # Screenshot on failure
│   └── report_helper.py           # Allure annotations
│
└── reports/
    ├── html/
    ├── allure/
    └── screenshots/
```

---

## WHY EACH FOLDER EXISTS

| Folder | Purpose |
|---|---|
| `pages/` | Encapsulates UI interactions — tests don't call Playwright directly |
| `api/` | Wraps httpx calls — API tests use typed clients not raw requests |
| `tests/unit/` | Fast, no-browser, no-network tests for pure Python functions |
| `tests/api/` | Contract tests against running FastAPI backend |
| `tests/ui/` | Component-level Playwright tests — single page interactions |
| `tests/e2e/` | Full user journey tests across multiple pages |
| `fixtures/` | Real PDF/DOCX files for deterministic upload testing |
| `utils/` | DRY helpers — screenshot, wait, report — used across all tests |
| `reports/` | CI/CD output — HTML for local, Allure for CI dashboard |

---

## NAMING CONVENTIONS

| Item | Convention | Example |
|---|---|---|
| Test files | `test_{module}.py` | `test_analyse_ui.py` |
| Test functions | `test_{scenario}` | `test_upload_valid_pdf` |
| Page Objects | `{Page}Page` | `AnalysePage` |
| Page methods | `{action}_{element}` | `click_upload_resume()` |
| Fixtures | snake_case | `uploaded_session` |
| Test IDs | `TC-{MODULE}-{NUMBER}` | `TC-ANA-001` |

---

## FRAMEWORK BEST PRACTICES

1. **Never use time.sleep()** — use Playwright's `wait_for_selector`, `expect`
2. **Page Objects never assert** — return values, let tests assert
3. **Fixtures handle setup/teardown** — not test functions
4. **Each test independent** — no shared state between tests
5. **Mock Groq in unit tests** — use `pytest-mock` to avoid API costs
6. **Real Groq in E2E** — use dedicated test Groq key with rate limit awareness
7. **Screenshots on failure** — configured in conftest.py `pytest_runtest_makereport`
8. **Allure steps** — wrap key actions with `@allure.step`
9. **Parallel execution** — `pytest-xdist` with `-n auto` for UI tests
10. **Retry flaky tests** — `pytest-rerunfailures` with `--reruns 2`

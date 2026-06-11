# CareerApex QA — Phases 5–9

---

## PHASE 5 — AUTOMATION COVERAGE PLAN

### Smoke Suite (run on every commit — ~5 min)
```
tests/e2e/test_e2e_complete_journey.py::TestNavigationJourney
tests/api/test_upload_api.py::TestResumeUpload::test_upload_valid_pdf_returns_200
tests/api/test_analyse_api.py::TestGapAnalysis::test_gap_analysis_returns_200
tests/api/test_analyse_api.py::TestAnswerEvaluation::test_evaluate_good_answer
```

### Regression Suite (run nightly — ~45 min)
```
tests/api/
tests/ui/
tests/e2e/
```

### Critical Path Suite (run before every deploy — ~20 min)
```
tests/e2e/test_resume_analysis_flow.py
tests/e2e/test_interview_flow.py
tests/api/test_upload_api.py
tests/api/test_analyse_api.py
```

### Security Suite (run weekly)
```
tests/security/test_security.py
```

### Coverage Summary
| Feature | Unit | API | UI | E2E | Total |
|---|---|---|---|---|---|
| Resume Upload | ✓ | ✓✓✓✓ | ✓✓✓ | ✓ | 85% |
| Gap Analysis | ✓ | ✓✓✓✓ | ✓✓ | ✓ | 82% |
| Mock Interview | — | ✓✓ | ✓✓✓✓ | ✓ | 78% |
| Voice Interview | — | — | Manual | — | 25% |
| Debrief | — | ✓✓ | ✓✓ | ✓ | 65% |
| Memory | — | ✓✓ | ✓ | — | 55% |
| Negotiation | — | ✓✓ | ✓ | ✓ | 60% |
| LinkedIn | — | ✓ | ✓ | — | 45% |
| Roadmap | — | ✓ | ✓ | — | 40% |
| Navigation | — | — | ✓✓✓ | ✓ | 70% |
| Security | — | ✓✓✓✓ | — | — | 60% |

**Overall Automation Coverage: ~65%**
**Target for Production: 75%+**

### Remaining Risks (not automated)
- Voice interview (requires actual microphone — manual only)
- SpeechSynthesis output quality (manual)
- Visual regression (no Percy/Chromatic configured)
- Cross-browser voice support (manual)
- LangGraph infinite loop prevention (manual)

---

## PHASE 6 — SECURITY REVIEW

### Critical Findings

#### SEC-001: No Authentication [CRITICAL]
**Issue:** All API endpoints accessible without any auth token.  
**Impact:** Any user can access any session's data by guessing session_id.  
**Fix:** Add JWT or session-based auth. At minimum, add API key validation.

#### SEC-002: Default session IDs in UI [HIGH]
**Issue:** Pages pre-fill `test-session-001` as default session_id.  
**Impact:** In production, multiple users would share the same session data.  
**Fix:** Remove defaults. Auto-generate UUID session_ids per user.

#### SEC-003: No file size limit [HIGH]
**Issue:** `/upload/resume` accepts any file size.  
**Impact:** Server OOM or DoS via huge file uploads.  
**Fix:** Add `MAX_FILE_SIZE = 10MB` check in upload router.

#### SEC-004: No server-side file type validation [HIGH]
**Issue:** File type validated only by client-side `accept` attribute.  
**Impact:** Malicious files can be uploaded via direct API calls.  
**Fix:** Validate MIME type and magic bytes server-side.

#### SEC-005: Groq API key in .env, no rotation [MEDIUM]
**Issue:** API key stored in plain .env file.  
**Impact:** Key exposure if .env committed to git.  
**Fix:** Add .env to .gitignore. Use secrets manager in production.

#### SEC-006: ChromaDB has no auth [MEDIUM]
**Issue:** ChromaDB running without authentication.  
**Impact:** Direct ChromaDB access possible if port exposed.  
**Fix:** Bind ChromaDB to localhost only. Add auth for production.

#### SEC-007: No rate limiting [MEDIUM]
**Issue:** No rate limiting on any endpoint.  
**Impact:** API abuse, Groq rate limit exhaustion by single user.  
**Fix:** Add slowapi rate limiter: 10 req/min per IP for AI endpoints.

### Security Recommendations
1. Add authentication before any production deployment
2. Implement file size limits (10MB max)
3. Add server-side MIME type validation
4. Implement rate limiting per IP
5. Add input sanitization before sending to LLM
6. Enable HTTPS (TLS) for production
7. Store secrets in environment variables / secret manager
8. Regular dependency vulnerability scanning (pip-audit, npm audit)

---

## PHASE 7 — PERFORMANCE REVIEW

### Performance Test Plan

#### Baseline Targets
| Operation | Target P50 | Target P95 | Target P99 |
|---|---|---|---|
| Page load (FCP) | < 1.5s | < 2.5s | < 4s |
| Resume upload (2MB PDF) | < 2s | < 4s | < 6s |
| Gap analysis (Groq) | < 10s | < 18s | < 25s |
| Question generation | < 8s | < 15s | < 20s |
| Answer evaluation | < 5s | < 10s | < 15s |
| Interview chat turn | < 6s | < 12s | < 18s |
| Dashboard load | < 800ms | < 1.5s | < 2s |

#### Load Test Scenarios (k6)
```javascript
// Scenario 1: Concurrent uploads
export const options = {
  scenarios: {
    concurrent_uploads: {
      executor: "constant-vus",
      vus: 10,
      duration: "2m",
    },
  },
};
```

#### Bottlenecks Identified
1. **HuggingFace model loading** — loaded fresh on every restart (~15s cold start)
   - Fix: Keep model in memory, pre-warm on startup

2. **Groq sequential processing** — no request queuing
   - Fix: Add asyncio for concurrent Groq calls

3. **ChromaDB no connection pooling** — single client instance
   - Risk: Concurrent requests may conflict
   - Fix: Test with 5+ concurrent sessions

4. **No CDN for frontend** — all assets served from Next.js
   - Fix: Deploy to Vercel (automatic CDN)

5. **Large embedding model** — all-MiniLM-L6-v2 loads per process
   - Fix: Singleton pattern (already implemented)

### Stress Test Recommendations
- Simulate Groq rate limit hit (429) and test retry behavior
- Upload 50MB PDF and check memory usage
- Simulate 100 concurrent dashboard loads
- Test ChromaDB with 10,000 stored sessions

---

## PHASE 8 — RELEASE READINESS REVIEW

### Release Readiness Scorecard

| Dimension | Score /100 | Notes |
|---|---|---|
| **Functionality** | 82 | All 10 features working. Voice browser-specific. |
| **Stability** | 70 | No crash loops. Groq rate limit causes intermittent failures. |
| **Reliability** | 65 | No retry logic. Groq failures = feature failure. |
| **Security** | 35 | No auth, no rate limiting, no file validation. |
| **Scalability** | 50 | Single process, no horizontal scaling. |
| **Observability** | 60 | LangSmith traces. No application logs. No metrics. |
| **Accessibility** | 45 | Dark-only UI. No keyboard nav audit. |
| **Performance** | 68 | Groq latency acceptable. No CDN. Cold start slow. |
| **Test Coverage** | 65 | API well-tested. Voice not automated. |
| **Maintainability** | 78 | Clean code. POM framework. Good separation. |

**Overall Score: 62/100**

### Risk Register

#### Critical (Block Release)
| Risk | Mitigation |
|---|---|
| No authentication | Add basic API key auth before release |
| No file size limit | Add 10MB limit in upload router |
| Default session IDs in production | Remove all hardcoded defaults |

#### Major (Fix Within 2 Sprints)
| Risk | Mitigation |
|---|---|
| No rate limiting | Add slowapi |
| No retry logic for Groq | Add tenacity retry decorator |
| ChromaDB data loss on restart | Add persistent volume / backup |
| No error monitoring | Add Sentry |

#### Medium (Fix Within 1 Quarter)
| Risk | Mitigation |
|---|---|
| Voice not cross-browser | Add graceful degradation |
| No accessibility audit | Run axe-core scan |
| No CDN | Deploy to Vercel |

### GO / NO-GO RECOMMENDATION

**For Portfolio/Demo use: ✅ GO**
- Application is functionally complete
- All 10 features working
- Good code quality and architecture
- Suitable for interviews and demos

**For Commercial Production: ⚠️ NO-GO**
- Must add authentication before serving real users
- Must add file validation and size limits
- Must add rate limiting
- Must remove hardcoded test session IDs

---

## PHASE 9 — RUNNING THE FRAMEWORK

### Setup
```bash
cd C:\Users\Azuro\careerapex\tests

# Install dependencies
pip install -r requirements_test.txt

# Install Playwright browsers
playwright install chromium

# Create fixture files
# Place valid_resume.pdf in tests/fixtures/resumes/
# Place ai_engineer_jd.pdf in tests/fixtures/jds/
```

### Run Commands

```bash
# Smoke suite (fastest)
pytest tests/e2e/test_e2e_complete_journey.py::TestNavigationJourney -v

# API tests only
pytest tests/api/ -v --tb=short

# UI tests only  
pytest tests/ui/ -v --headed

# E2E tests
pytest tests/e2e/ -v --slowmo=500

# Security tests
pytest tests/security/ -v

# Full regression (parallel)
pytest tests/ -n auto --reruns=2

# With Allure reporting
pytest tests/ --alluredir=reports/allure
allure serve reports/allure

# Specific test
pytest tests/api/test_upload_api.py::TestResumeUpload::test_upload_valid_pdf_returns_200 -v
```

### CI/CD Integration (GitHub Actions)
```yaml
name: CareerApex Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "3.11" }
      - run: pip install -r tests/requirements_test.txt
      - run: playwright install chromium
      - run: pytest tests/api/ tests/e2e/ -n auto --html=reports/report.html
        env:
          CAREERAPEX_API_URL: http://localhost:8001
          GROQ_API_KEY: ${{ secrets.GROQ_API_KEY }}
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-report
          path: reports/
```

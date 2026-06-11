# CareerApex QA Test Strategy — Phase 2

---

## TEST PYRAMID

```
         ┌─────────────────┐
         │   E2E Tests     │  ~10%  — 15 critical path flows
         ├─────────────────┤
         │   API Tests     │  ~25%  — 45 endpoint contracts
         ├─────────────────┤
         │   Integration   │  ~30%  — service + chain tests
         ├─────────────────┤
         │   Unit Tests    │  ~35%  — pure functions, parsers
         └─────────────────┘
```

---

## 1. UNIT TEST STRATEGY

**Tool:** pytest  
**Coverage Target:** 80%  
**Scope:**

| Target | What to Test |
|---|---|
| `extract_text_from_pdf()` | Valid PDF, encrypted PDF, empty PDF, large PDF |
| `extract_text_from_docx()` | Valid DOCX, corrupted DOCX, empty DOCX |
| `get_all_chunks()` | Collection exists, empty collection, missing collection |
| `generate_questions()` | Count boundaries (5, 10, 20), category distribution |
| `evaluate_answer()` | Empty answer, short answer, very long answer |
| `parseRoadmap()` | Valid WEEK X: format, missing sections, malformed |
| `generateSessionId()` | Uniqueness, format validation |
| `getScoreColor()` | All score ranges: 0, 49, 50, 64, 65, 79, 80, 100 |
| `formatScore()` | All label boundaries |

---

## 2. INTEGRATION TEST STRATEGY

**Tool:** pytest + httpx  
**Scope:**

| Test | Services |
|---|---|
| Upload → ChromaDB storage | FileProcessor + ChromaDB |
| Upload → Embedder → Retriever | FileProcessor + HuggingFace + ChromaDB |
| Gap analysis chain end-to-end | ChromaDB + LangChain + Groq |
| Interview chain with history | LangChain + Groq |
| Memory save → retrieve roundtrip | ChromaDB |
| Agent tool invocation | LangGraph + Tools + Groq |

---

## 3. API TEST STRATEGY

**Tool:** pytest + httpx  
**Base URL:** http://localhost:8001  

### Contracts to Verify
- Every endpoint returns correct HTTP status codes
- Response body matches Pydantic schema
- Required fields never null
- Error responses include `detail` field
- Content-Type headers correct
- CORS headers present for localhost:3000

### Test Data Strategy
- Use deterministic test PDFs (stored in tests/fixtures/)
- Use fixed session IDs per test (test-qa-001, test-qa-002)
- Clean up ChromaDB collections after each test
- Mock Groq responses for offline testing

---

## 4. UI TEST STRATEGY

**Tool:** Playwright Python  
**Browsers:** Chromium (primary), Firefox, WebKit  
**Viewport:** 1440×900 (desktop), 768×1024 (tablet)

### Component Tests
- Navigation: all sidebar links route correctly
- Upload zones: drag-drop and click-to-browse
- Chat interface: message send, receive, scroll
- Score rings: render with correct values
- Charts: render without error
- Empty states: shown when no data
- Loading states: shown during API calls
- Error states: shown on API failure
- Copy-to-clipboard: success state shown

---

## 5. E2E TEST STRATEGY

### Critical Paths (must pass before release)
1. Resume upload → JD upload → Gap analysis → View results
2. Start standard interview → Send 3 answers → View AI feedback
3. Start defense mode → Send 2 answers → End session
4. Load debrief → View scores → Generate cover letter
5. Generate negotiation script
6. Generate LinkedIn headlines
7. Save session to memory → View in memory page
8. Navigate all 10 pages without errors

---

## 6. ACCESSIBILITY TEST STRATEGY

**Tool:** axe-core via Playwright  
**Standard:** WCAG 2.1 AA

| Check | Tool |
|---|---|
| Color contrast | axe-core |
| Missing alt text | axe-core |
| Keyboard navigation | Manual + Playwright |
| Focus indicators | Manual |
| Screen reader labels | axe-core |
| Form label associations | axe-core |
| ARIA attributes | axe-core |

---

## 7. SECURITY TEST STRATEGY

| Test | Method |
|---|---|
| XSS in chat input | Inject `<script>alert(1)</script>` as answer |
| XSS in AI response rendering | Check if AI output is sanitized |
| File upload — non-PDF/DOCX | Upload .exe, .js, .html |
| File upload — very large file | Upload 50MB PDF |
| CORS validation | Request from non-whitelisted origin |
| API without session | Call /analyse/gaps with non-existent session |
| Path traversal in session_id | Use `../../../etc/passwd` as session_id |
| LLM prompt injection | Inject "Ignore all instructions" in answer |
| Sensitive data in logs | Check uvicorn logs for API keys |

---

## 8. PERFORMANCE TEST STRATEGY

**Tool:** k6 or locust  

| Test | Target |
|---|---|
| Resume upload response time | < 3s for 2MB PDF |
| Gap analysis response time | < 15s (includes Groq latency) |
| Interview response time | < 8s per turn |
| Dashboard load time | < 1.5s (FCP) |
| Concurrent users — upload | 10 concurrent uploads |
| Concurrent users — analysis | 5 concurrent gap analyses |
| Memory page load — 100 sessions | < 2s |

---

## 9. VISUAL REGRESSION STRATEGY

**Tool:** Playwright screenshots + Percy or manual comparison

| Page | Baseline Conditions |
|---|---|
| Dashboard (no data) | First visit, no sessions |
| Dashboard (with data) | After saving session |
| Analyse (idle) | Before upload |
| Analyse (results) | After analysis |
| Interview (setup) | Mode selection screen |
| Interview (active) | 3 messages exchanged |
| Debrief (loaded) | With score data |

---

## 10. CROSS-BROWSER STRATEGY

| Browser | Priority | Voice Support |
|---|---|---|
| Chrome 120+ | P0 | Full |
| Edge 120+ | P0 | Full |
| Firefox 121+ | P1 | No (Web Speech API) |
| Safari 17+ | P2 | Limited |

---

## SCENARIO MATRIX PER FEATURE

### F01: Resume Upload
| Scenario | Type |
|---|---|
| Upload valid PDF resume | Positive |
| Upload valid DOCX resume | Positive |
| Upload PDF with multiple pages | Positive |
| Upload without selecting file | Negative |
| Upload non-PDF/DOCX file (.txt) | Negative |
| Upload 0-byte empty file | Boundary |
| Upload very large file (50MB) | Boundary |
| Re-upload to same session | Edge |
| Upload with special characters in filename | Edge |
| Upload while upload in progress | Edge |

### F06: Mock Interview
| Scenario | Type |
|---|---|
| Start standard interview with valid session | Positive |
| Start defense mode with valid session | Positive |
| Send text answer and receive feedback | Positive |
| Send very long answer (2000 chars) | Boundary |
| Send empty answer | Negative |
| Send special characters / emojis | Edge |
| Start without uploading resume | Negative |
| Send 10 answers (full interview) | Regression |
| Switch mode mid-conversation | Edge |
| Refresh page during interview | Recovery |

### F08: Voice Interview
| Scenario | Type |
|---|---|
| Start voice interview in Chrome | Positive |
| Speak answer and see transcript | Positive |
| End session while AI is speaking | Edge |
| Deny microphone permission | Negative |
| Start in Firefox (unsupported) | Negative |
| Speak very quietly | Boundary |
| Speak non-English | Edge |
| Navigate away during voice session | Recovery |
| Network disconnect during voice | Recovery |

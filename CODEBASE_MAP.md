# CAREERAPEX AI — CODEBASE MAP
**Purpose:** Navigation guide for every file in the project. Read this to understand what any file does before touching it.

---

## REPO STRUCTURE

```
careerapex/
├── backend/                    ← FastAPI Python backend
│   ├── main.py                 ← Entry point
│   ├── Dockerfile              ← Docker build instructions
│   ├── requirements.txt        ← Python dependencies
│   ├── routers/                ← HTTP endpoint handlers (8 files)
│   ├── chains/                 ← LangChain AI chains (8 files)
│   ├── agents/                 ← LangGraph agent
│   ├── rag/                    ← ChromaDB client
│   ├── memory/                 ← Session storage
│   └── models/                 ← Pydantic schemas
│
├── frontend/                   ← Next.js React frontend
│   ├── app/                    ← Pages (Next.js App Router)
│   │   ├── dashboard/          ← /dashboard
│   │   ├── analyse/            ← /analyse
│   │   ├── gaps/               ← /gaps
│   │   ├── interview/          ← /interview
│   │   ├── voice/              ← /voice (legacy)
│   │   ├── voice-studio/       ← /voice-studio (primary)
│   │   ├── debrief/            ← /debrief
│   │   ├── memory/             ← /memory
│   │   ├── negotiate/          ← /negotiate
│   │   ├── linkedin/           ← /linkedin
│   │   └── roadmap/            ← /roadmap
│   ├── components/
│   │   └── Sidebar.tsx         ← Shared navigation
│   ├── lib/
│   │   ├── api.ts              ← All API calls
│   │   └── utils.ts            ← Utility functions
│   └── app/globals.css         ← Design tokens + global styles
│
├── docker-compose.yml          ← Local full-stack docker
├── k8s/manifests.yaml          ← Kubernetes (portfolio only)
└── tests/                      ← pytest + Playwright tests
```

---

## BACKEND FILES

### `backend/main.py`
**Purpose:** FastAPI app entry point. Registers all routers. Sets up CORS.
**Critical:** Wrong router import name = 500 on ALL routes. Never rename router files without updating this.
**CORS:** Must include both `http://localhost:3000` and `https://careerapex-ai.vercel.app`.
**Health endpoint:** `GET /health` returns `{"status": "ok"}` — used by Railway keepalive ping.

### `backend/Dockerfile`
**Purpose:** Instructions for Railway to build the backend container.
**Key decisions:**
- `FROM python:3.11-slim` — specific version to avoid Railway Python 3.14 issues
- `COPY requirements.txt .` before `COPY . .` — Docker layer caching (faster rebuilds)
- Shell form CMD: `CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8001}` — MUST be shell form, not array form, for $PORT expansion
- NO HuggingFace pre-download — caused OOM during Railway build

### `backend/requirements.txt`
**Purpose:** All Python package dependencies.
**Warning:** `langchain-core` version matters. Older versions conflict with newer langchain-openai.

---

### ROUTERS

### `backend/routers/upload.py`
**Prefix:** `/upload`
**Purpose:** Resume and JD file upload, text extraction, embedding, ChromaDB storage.
**Key logic:**
- Accepts PDF and DOCX
- PyPDF for PDF extraction, python-docx for DOCX
- RecursiveCharacterTextSplitter: chunk_size=500, chunk_overlap=50
- HuggingFace embeddings loaded once at module level (expensive operation)
- Stores in `resume_{session_id}` and `jd_{session_id}` ChromaDB collections
- `/upload/copy-resume` endpoint: copies resume embeddings from old session to new session (used by "reuse previous resume" dropdown on Analyse page)
**Critical:** Embeddings object loaded at module level — changing this breaks all uploads.

### `backend/routers/analyse.py`
**Prefix:** `/analyse`
**Purpose:** Gap analysis, question generation, answer evaluation.
**Key endpoints:**
- `POST /analyse/gaps/{session_id}` — runs LLM gap analysis
- `POST /analyse/questions/{session_id}` — generates interview questions
- `POST /analyse/evaluate` — evaluates a single answer (used by both text interview and voice studio)
**Critical:** `AnswerEvalRequest` has `model_config = {"extra": "ignore"}` — voice page sends `session_id` which must be silently ignored.

### `backend/routers/interview.py`
**Prefix:** `/interview`
**Purpose:** Mock interview chat and cover letter generation.
**Key endpoints:**
- `POST /interview/start` — starts interview, gets Q1
- `POST /interview/chat` — sends answer, gets next Q
- `POST /interview/cover-letter` — generates cover letter
**Critical:** `InterviewRequest` has `model_config = {"extra": "ignore"}`. Voice page sends extra fields (`interviewer_name`, `max_questions`, `current_question_number`) that must be silently ignored.

### `backend/routers/memory.py`
**Prefix:** `/memory`
**Purpose:** Session CRUD and progress tracking via ChromaDB `career_memory` collection.
**Key endpoints:**
- `GET /memory/sessions` — list all sessions (used by Dashboard, Memory page, Debrief dropdown)
- `POST /memory/save` — save session after gap analysis
- `GET /memory/progress` — aggregate stats for Dashboard
- `DELETE /memory/session/{id}` — delete session + ChromaDB cleanup
**WARNING:** File must be named `memory.py` NOT `memory_router.py`. Naming matters for Python imports.

### `backend/routers/tracker.py`
**Prefix:** `/tracker`
**Purpose:** Per-answer interview score storage. Powers Debrief page.
**Key endpoints:**
- `POST /tracker/save` — save one answer's score (called by Voice Studio after each answer)
- `GET /tracker/summary/{session_id}` — full debrief data (zero LLM calls)
**Data stored:** question, answer, category, score, confidence_score, feedback, question_index (1-based)

### `backend/routers/negotiate.py`
**Prefix:** `/negotiate`
**Purpose:** Salary negotiation script generation and HR roleplay.

### `backend/routers/linkedin.py`
**Prefix:** `/linkedin`
**Purpose:** LinkedIn profile optimization and headline variants.

### `backend/routers/agent.py`
**Prefix:** `/agent`
**Purpose:** LangGraph ReAct agent for free-form career coaching.

---

### CHAINS

### `backend/chains/gap_analyser.py`
**Purpose:** Compares resume against JD. Returns match score (0-100), skill gaps, strengths, recommendations.
**Pattern:** LCEL chain — `prompt | llm | JsonOutputParser`
**Temperature:** 0.2 (low — structured output)
**Context:** Reads all chunks from `resume_{session_id}` and `jd_{session_id}`.

### `backend/chains/answer_eval.py`
**Purpose:** Evaluates an interview answer. Returns score, confidence_score, feedback, strengths, improvements.
**Key design:**
- Detects refusals ("sorry I can't", "I cannot") before LLM call → returns score 5 immediately (no LLM call)
- Strict rubric in prompt: refusal=0-10, vague=5-20, good=65-80, excellent=85-95
- Fallback on error: score 0, evalFailed=true (NOT fake 65)
**Temperature:** 0.1 (very low — consistent scoring)

### `backend/chains/interview_chain.py`
**Purpose:** Interview conversation chain. Handles both text interview and voice interview.
**Voice mode detection:**
```python
is_voice_call = "Question" in user_message and "of" in user_message and (
    "Introduce yourself" in user_message or "Ask Question" in user_message
)
```
If voice call:
- Uses VOICE_INTERVIEW_SYSTEM prompt (question-only, strict rules)
- Does NOT send history (prevents LLM responding to previous answers)
If text interview:
- Sends full history (conversational mode)

### `backend/chains/confidence_tracker.py`
**Purpose:** Save and retrieve per-answer interview scores from ChromaDB.
**Collection:** `confidence_{session_id}`
**Document ID:** `{session_id}_q{question_index}`
**Key functions:**
- `save_answer_score()` — saves to ChromaDB
- `get_session_scores()` — reads all scores, sorts by question_index
- `get_confidence_summary()` — calculates avg, trend (improving/declining/consistent), weakest/strongest
**Critical:** `answer` field MUST be included in `get_session_scores()` return. Was missing in earlier version, broke Debrief.

### `backend/chains/cover_letter.py`
**Purpose:** Generates personalized cover letter using resume + JD context.

### `backend/chains/negotiation.py`
**Purpose:** Salary negotiation script generation and HR roleplay conversation.

### `backend/chains/linkedin_optimizer.py`
**Purpose:** LinkedIn profile optimization using resume context.

### `backend/chains/question_gen.py`
**Purpose:** Generates targeted interview questions from resume + JD.

---

### UTILITIES

### `backend/rag/chroma_client.py`
**Purpose:** ChromaDB client setup and collection helpers.
**Key function:** `get_or_create_collection(name)` — used everywhere for ChromaDB access.
**Path:** `./chroma_store` (relative to backend directory)

### `backend/memory/session_store.py`
**Purpose:** Save/retrieve session metadata using ChromaDB `career_memory` collection.
**Functions:** `save_session()`, `get_session()`, `list_sessions()`, `delete_session()`, `get_progress_summary()`

### `backend/models/schemas.py`
**Purpose:** Pydantic models for API request/response validation.

### `backend/agents/career_agent.py`
**Purpose:** LangGraph ReAct agent with 4 tools: gap analysis, question gen, answer eval, career advice.

---

## FRONTEND FILES

### `frontend/app/globals.css`
**Purpose:** Design tokens (CSS variables) + global component classes.
**Key tokens:** `--bg-base`, `--bg-surface`, `--bg-elevated`, `--text-primary`, `--text-secondary`, `--border-subtle`, `--accent` (#F59E0B amber)
**Component classes:** `.card`, `.btn`, `.btn-primary`, `.input`, `.badge`, `.progress-track`
**Never modify:** CSS variable names used everywhere — changing breaks all pages.

### `frontend/app/layout.tsx`
**Purpose:** Root layout. Wraps all pages. Inter font. Dark theme.

### `frontend/components/Sidebar.tsx`
**Purpose:** Left navigation sidebar. Shared across ALL pages.
**Current nav:** Dashboard, Analyse, Skill Gaps | Interview, AI Voice Studio (NEW badge), Debrief | Memory, Negotiate, LinkedIn, Roadmap
**Critical:** Break this = break all pages. The "AI Voice Studio" entry uses `badge: "NEW"` prop.

### `frontend/lib/api.ts`
**Purpose:** All API call functions. Uses `API_BASE` env var.
**Pattern:** `async function request<T>(endpoint, options)` — all calls go through this.
**Key functions:** uploadResume, uploadJD, analyseGaps, interviewChat, generateCoverLetter, saveAnswerScore, getConfidenceSummary, getSessions, etc.

### `frontend/lib/utils.ts`
**Purpose:** Utility functions.
**Key:** `generateSessionId()` returns `session-{timestamp}-{random}`, `getScoreColor(score)` returns hex color.

---

### PAGES

### `frontend/app/analyse/page.tsx`
**Purpose:** Resume + JD upload + gap analysis.
**Key features:**
- Previous resume dropdown (reuses ChromaDB embeddings via `/upload/copy-resume`)
- Session ID generated on mount, consistent through JD upload and analysis
- 6-step loading animation during analysis
- `resumeFilenameRef`, `jdFilenameRef`, `sessionIdRef` used as refs (not useState) to avoid stale closure in async callbacks

### `frontend/app/voice-studio/page.tsx`
**Purpose:** AI Voice Studio — 5-question voice interview with Alex.
**State management (ALL useRef for async safety):**
- `stoppedRef` — set true on unmount/end, prevents audio leaks
- `historyRef` — conversation history (not useState — closures)
- `feedbackListRef` — running score list
- `questionCountRef` — current question number
- `sessionIdRef` — session ID
- `coveredTopicsRef` — array of first 12 words from each question
**Flow:** Setup → askQuestion(0) → Alex speaks → listen (continuous, 2.5s silence) → handleAnswer() → evaluateAnswer() → saveToTracker() → askQuestion(count+1) → ... → askQuestion(5) → feedback screen
**NEVER CHANGE:** stoppedRef pattern, continuous=true + silence timer, coveredTopicsRef accumulation

### `frontend/app/debrief/page.tsx`
**Purpose:** Post-interview scorecard. Reads from ChromaDB tracker.
**Key:** Auto-loads from `?session=` URL param. Sorts by `question_index` (1-based). Shows per-question scores, strengths, improvements. Cover letter = only LLM call.

### `frontend/app/negotiate/page.tsx` and `frontend/app/linkedin/page.tsx`
**Critical:** Field and sub-components defined OUTSIDE `export default function`. This was the focus-loss bug fix.

---

## DEPLOYMENT FILES

### `backend/Dockerfile`
See detailed explanation in Backend Files section above.

### `docker-compose.yml`
**Purpose:** Local full-stack (frontend + backend + ChromaDB volume).
**Key:** Frontend uses `NEXT_PUBLIC_API_URL=http://backend:8001` (NOT localhost — inside Docker network, "backend" is the service name).

### `k8s/manifests.yaml`
**Purpose:** Kubernetes manifests for Minikube. Portfolio value only — not used in production.
**Includes:** Namespace, ConfigMap, Secret, PVC (ChromaDB), Backend Deployment + Service, Frontend Deployment + Service.

---

## ENVIRONMENT FILES

### `backend/.env` (NOT committed to git)
```
OPENROUTER_API_KEY=sk-or-v1-xxx
LANGCHAIN_API_KEY=lsv2_xxx
LANGCHAIN_TRACING_V2=true
LANGCHAIN_PROJECT=careerapex-ai
```

### `frontend/.env.local` (NOT committed to git)
```
NEXT_PUBLIC_API_URL=http://localhost:8001
```

### Railway Environment Variables (set in Railway dashboard)
```
OPENROUTER_API_KEY, LANGCHAIN_API_KEY, LANGCHAIN_TRACING_V2, LANGCHAIN_PROJECT, PYTHON_VERSION=3.11.9, PORT=8001
```

### Vercel Environment Variables (set in Vercel dashboard)
```
NEXT_PUBLIC_API_URL=https://careerapex-ai-production.up.railway.app
```


# CAREERAPEX AI — COMPLETE MASTER HANDOVER
**Version:** 4.0 | **Date:** June 25, 2026 | **Status:** Production Live — Stable

> Complete project transfer package. A new Claude instance must be able to continue development with zero context loss after reading this file.

---

## SECTION 1 — PROJECT OVERVIEW

CareerApex AI is a full-stack AI Career Operating System built by Koushik Gattu as his flagship portfolio project for transitioning from Senior QA Automation Engineering into AI Engineering.

**Live URLs:**
- Frontend: https://careerapex-ai.vercel.app
- Backend: https://careerapex-ai-production.up.railway.app
- GitHub: https://github.com/Koushik2910/careerapex-ai

**Local paths:**
- Project root: `C:\Users\Azuro\careerapex`
- Backend venv: `C:\Users\Azuro\careerapex\backend\venv\Scripts\Activate.ps1`
- Frontend port: 3000, Backend port: 8001

**What it does:** Upload resume + JD → AI gap analysis → mock interview (text + voice) → debrief scorecard → salary negotiation → LinkedIn optimizer → career roadmap.

**Why built:** Portfolio project demonstrating LangChain, LangGraph, RAG, ChromaDB, FastAPI, Next.js for AI Engineer role applications.

---

## SECTION 2 — ARCHITECTURE

### Frontend
- **Framework:** Next.js 16, TypeScript, Tailwind CSS, Framer Motion, Recharts
- **Location:** `careerapex/frontend/`
- **Port:** 3000

**11 Pages (all in `frontend/app/*/page.tsx`):**
| Route | Page | LLM calls |
|---|---|---|
| `/dashboard` | Career Dashboard | Zero — reads cache |
| `/analyse` | Resume Analyser | 1 per session |
| `/gaps` | Skill Gap Analysis | Zero — reads cache |
| `/interview` | Mock Interview (text) | Per message |
| `/voice` | Voice Interview (original — legacy) | Per question |
| `/voice-studio` | AI Voice Studio (new — primary) | Per question + per eval |
| `/debrief` | Interview Debrief | Zero — reads cache |
| `/memory` | Career Memory | Zero — reads cache |
| `/negotiate` | Salary Negotiation | Per generation |
| `/linkedin` | LinkedIn Optimizer | Per generation |
| `/roadmap` | Career Roadmap | Per generation |

**Components:**
- `frontend/components/Sidebar.tsx` — navigation (shows AI Voice Studio with NEW badge)
- `frontend/lib/api.ts` — all API calls, uses `API_BASE`
- `frontend/lib/utils.ts` — `generateSessionId()`, `getScoreColor()`, etc.

**CRITICAL RULE — API_BASE:**
```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
```
Must be at top of EVERY page that makes fetch calls. Never hardcode localhost.

**CRITICAL RULE — Components outside parent:**
Never define sub-components (Field, Card, etc.) INSIDE the export default function. React unmounts them on every state change → input focus loss.

### Backend
- **Framework:** FastAPI, Python 3.11
- **Location:** `careerapex/backend/`
- **Port:** 8001
- **Entry point:** `backend/main.py`

**CORS (must include both):**
```python
allow_origins=["http://localhost:3000", "https://careerapex-ai.vercel.app"]
```

**8 Routers (`backend/routers/`):**
| File | Prefix | Purpose |
|---|---|---|
| `upload.py` | `/upload` | Resume + JD upload, embed, copy-resume endpoint |
| `analyse.py` | `/analyse` | Gap analysis, question gen, answer eval |
| `interview.py` | `/interview` | Interview chat, cover letter |
| `memory.py` | `/memory` | Session CRUD, progress |
| `tracker.py` | `/tracker` | Score saving, confidence summary |
| `negotiate.py` | `/negotiate` | Salary script + roleplay |
| `linkedin.py` | `/linkedin` | Profile optimizer |
| `agent.py` | `/agent` | LangGraph ReAct agent |

**8 Chains (`backend/chains/`):**
| File | Purpose |
|---|---|
| `gap_analyser.py` | Resume vs JD comparison |
| `question_gen.py` | Interview question generation |
| `answer_eval.py` | Answer scoring 0-100 with refusal detection |
| `interview_chain.py` | Mock interview (text + voice mode detection) |
| `cover_letter.py` | Cover letter generation |
| `negotiation.py` | Salary negotiation script + roleplay |
| `linkedin_optimizer.py` | LinkedIn profile optimization |
| `confidence_tracker.py` | Per-answer score storage + summary |

**get_llm() pattern:** Every chain uses a `get_llm()` helper. Never instantiate LLM directly.

### AI Layer
- **LLM:** Gemini 2.5 Flash via OpenRouter (`google/gemini-2.5-flash`)
- **Embeddings:** HuggingFace `all-MiniLM-L6-v2` (local, ~90MB, 384 dimensions)
- **Vector DB:** ChromaDB PersistentClient at `./chroma_store`
- **Observability:** LangSmith (`LANGCHAIN_TRACING_V2=true`)

**ChromaDB Collections:**
| Collection | Contents | Used by |
|---|---|---|
| `resume_{session_id}` | Resume chunks + embeddings | Gap analysis, interview, cover letter |
| `jd_{session_id}` | JD chunks + embeddings | Gap analysis, questions |
| `career_memory` | Session metadata after analysis | Dashboard, Memory page |
| `confidence_{session_id}` | Per-answer interview scores | Debrief page |

---

## SECTION 3 — MODULE BREAKDOWN

### Dashboard (`/dashboard`)
- Loads `/memory/sessions` → calculates match score, avg answer score, session count
- Zero LLM calls — pure ChromaDB read
- Shows Quick Actions grid + Recent Sessions list

### Resume Analyser (`/analyse`)
- Generates session ID on mount: `session-{timestamp}-{random}`
- Previous resume dropdown fetches `/memory/sessions`, copies embeddings via `/upload/copy-resume`
- Upload resume → `/upload/resume` → PyPDF → chunk → HuggingFace embed → ChromaDB
- Upload JD → `/upload/jd` → same process
- Run Analysis → `/analyse/gaps/{session_id}` → LangChain → Gemini → structured JSON
- Results saved to `career_memory` ChromaDB collection for caching

### Skill Gaps (`/gaps`)
- Cache-first: reads from `career_memory` — zero LLM calls
- Session dropdown populated from `/memory/sessions`

### Mock Interview (`/interview`)
- Text-based, full conversation history sent each turn
- Uses `/interview/start` then `/interview/chat`
- Standard mode + Resume Defense mode

### AI Voice Studio (`/voice-studio`) — PRIMARY VOICE FEATURE
- Full rebuild from scratch — replaces old `/voice` page
- Alex (AI interviewer) asks exactly 5 questions
- **Key implementation details:**
  - ALL state in `useRef` (not useState) for async callbacks: `historyRef`, `feedbackListRef`, `questionCountRef`, `sessionIdRef`, `coveredTopicsRef`
  - `SpeechRecognition` with `continuous = true`
  - 2.5-second silence timer after last speech event before processing answer
  - `stoppedRef` pattern prevents audio leaks on unmount
  - `coveredTopicsRef` tracks first 12 words of each question — injected into next question prompt to prevent repetition
  - `/health` ping on page mount to pre-warm Railway
  - Retry logic on `/interview/chat` (1 retry, 1.5s delay)
  - Session ID consistent throughout — same ID works in Debrief
  - Scores hidden during interview — shown only on feedback screen
  - Saves each answer to `/tracker/save` → powers Debrief (zero extra LLM)

**Voice mode detection in `interview_chain.py`:**
- If message contains "Ask Question X of Y" → question-only system prompt, NO history sent
- This prevents LLM responding to Q1 answer instead of asking Q2

### Legacy Voice (`/voice`)
- Kept alive so old links don't 404
- Shows "Upgrading to AI Voice Studio" redirect card

### Interview Debrief (`/debrief`)
- Auto-loads from `?session=` URL param (set by Voice Studio "View in Debrief" button)
- Reads `confidence_{session_id}` ChromaDB — zero LLM calls
- Cover letter is only LLM call (user-triggered)
- Sorts answers by `question_index` (1-based)
- Shows score progression, radar chart, per-answer breakdown

### Career Memory (`/memory`)
- Cache-first: reads `career_memory` ChromaDB — zero LLM calls
- Delete sessions with ChromaDB cleanup

### Salary Negotiation (`/negotiate`)
- Tab 1: Script generation — LLM one-shot
- Tab 2: HR roleplay chat — conversational with history
- `Field` component defined OUTSIDE parent (focus fix)

### LinkedIn Optimizer (`/linkedin`)
- Optimizes headline + about section
- Generates 5 headline variants
- `Field` component defined OUTSIDE parent (focus fix)

### Career Roadmap (`/roadmap`)
- Generates week-by-week learning plan from gap analysis
- `parseRoadmap()` is fragile — breaks if Gemini doesn't return exact `WEEK X:` format

---

## SECTION 4 — DEPLOYMENT

### Railway (Backend)
- Auto-deploys on `git push origin main`
- Root Directory: `backend`
- Start command: `sh -c "uvicorn main:app --host 0.0.0.0 --port $PORT"`
- Python version: 3.11.9 (set via PYTHON_VERSION env var)
- Free tier: 512MB RAM, sleeps after 15 min inactivity

**Railway Environment Variables:**
```
OPENROUTER_API_KEY=sk-or-v1-xxx
LANGCHAIN_API_KEY=lsv2_xxx
LANGCHAIN_TRACING_V2=true
LANGCHAIN_PROJECT=careerapex-ai
PYTHON_VERSION=3.11.9
PORT=8001
```

### Vercel (Frontend)
- Auto-deploys on `git push origin main` (~45 seconds)
- Root Directory: `frontend`
- Framework Preset: `Next.js` (NOT "Other")
- Environment Variable: `NEXT_PUBLIC_API_URL=https://careerapex-ai-production.up.railway.app`

### Docker (Local Full Stack)
```powershell
cd C:\Users\Azuro\careerapex
docker compose up --build
```
- Backend Dockerfile at `backend/Dockerfile`
- Frontend Dockerfile at `frontend/Dockerfile`
- `docker-compose.yml` at repo root
- ChromaDB persists via named volume `chroma_data`
- shell form CMD (not array form) required for `$PORT` expansion

### Kubernetes (Portfolio Value Only)
- Manifests at `k8s/manifests.yaml`
- Runs on Minikube locally
- Not used in production

---

## SECTION 5 — KNOWN BUGS & LIMITATIONS

### Resolved ✅
- Voice interview blank screen → added "ended" to render conditions + API_BASE + health ping
- Hardcoded localhost:8001 → API_BASE in all pages
- Field focus loss → components outside parent
- Debrief hardcoded test-session-001 → auto-load from memory
- Vercel 404 → Framework Preset = Next.js
- Railway port mismatch → set to 8001
- Docker CMD PORT not expanding → shell form
- frontend nested .git submodule → removed
- Q2 showing Q1 answer as question text → voice mode detection in interview_chain.py
- Fake scores (always 65) → refusal detection + explicit rubric + score 0 fallback
- Mic stops after 2-3 words → continuous=true + 2.5s silence timer
- Pydantic rejecting extra fields from voice page → model_config extra=ignore

### Open Issues ❌
- **ChromaDB no persistence on Railway free tier** — sessions wiped on every redeploy
- **OOM kills on Railway free tier** — 512MB RAM, HuggingFace model ~300MB, concurrent LangChain + ChromaDB hits limit. Auto-restarts in ~15s.
- **Voice interview on Railway cold start** — /health ping pre-warms but if Railway very slow, first question may timeout
- **Roadmap parseRoadmap() fragile** — breaks if Gemini doesn't use exact WEEK X: format
- **No auth** — single-user app, anyone with URL can access
- **No file size validation** — large PDFs can timeout on embedding

---

## SECTION 6 — COMPLETE BUG HISTORY

**Issue 1: Pydantic model rejecting unknown fields (voice page)**
- Problem: voice page sends `interviewer_name`, `max_questions`, `current_question_number` to `/interview/chat`
- Root cause: `InterviewRequest` model had no `extra = ignore` config
- Fix: Added `model_config = {"extra": "ignore"}` to InterviewRequest, StartRequest, CoverLetterRequest

**Issue 2: Q2 returning Q1 answer as question text**
- Problem: After user answers Q1, Q2 message card shows the user's spoken answer instead of Alex's question
- Root cause: Voice page sent full conversation history → LLM responded to Q1 answer ("That's great!") instead of asking Q2
- Fix: `interview_chain.py` detects voice mode by "Ask Question X of Y" pattern → switches to question-only system prompt, strips history

**Issue 3: Fake scores (always 65)**
- Problem: All 5 voice interview answers showed score 65 regardless of quality
- Root cause 1: Silent eval failure fallback returned score:65
- Root cause 2: LLM prompt had no rubric → defaulted to middle score
- Fix: Refusal phrase detection before LLM call → return score 5 immediately. Strict rubric in prompt. Fallback returns score:0 with evalFailed:true flag

**Issue 4: Mic stops after 2-3 words**
- Problem: SpeechRecognition stopped on first natural pause mid-sentence
- Root cause: `continuous = false` (default) stops on first pause
- Fix: `continuous = true` + 2.5-second silence timer

**Issue 5: Input field loses focus**
- Problem: Negotiate and LinkedIn pages — cursor jumps out after every keystroke
- Root cause: Field component defined INSIDE parent function → React creates new function reference on every state change → unmounts + remounts input
- Fix: Moved Field component definition OUTSIDE export default function

**Issue 6: CORS blocking production API calls**
- Problem: Gap analysis returned blank response on live site, no error visible
- Root cause: FastAPI allow_origins only had localhost:3000, missing Vercel URL
- Fix: Added https://careerapex-ai.vercel.app to CORSMiddleware

**Issue 7: Railway couldn't detect FastAPI**
- Fix: Custom start command `sh -c "uvicorn main:app --host 0.0.0.0 --port $PORT"`

**Issue 8: Railway wrong port in domain (8080 vs 8001)**
- Fix: Railway Networking settings → changed target port to 8001

**Issue 9: Vercel 404**
- Fix: Framework Preset changed from "Other" to "Next.js"

**Issue 10: Frontend .git submodule**
- Fix: `Remove-Item -Recurse -Force frontend/.git` → re-add as normal directory

**Issue 11: Hardcoded localhost:8001 in 5 pages**
- Fix: API_BASE env var pattern in all pages

**Issue 12: Docker CMD PORT not expanding**
- Fix: Array form → shell form CMD

**Issue 13: OOM kill on Railway (June 22, 2026)**
- Observed in Railway Deploy Logs: `Killed` at 23:29:24, container auto-restarted
- Root cause: 512MB RAM limit hit during concurrent /analyse/evaluate + /tracker/save + HuggingFace model in memory
- App recovered automatically in ~15s — not a blocker for demo/portfolio

---

## SECTION 7 — CRITICAL RULES

**Never touch:**
- `stoppedRef` pattern in voice-studio — prevents audio leaks
- `continuous = true` + silence timer pattern — changing breaks listening
- `coveredTopicsRef` accumulation logic — order matters
- ChromaDB collection naming convention (`resume_`, `jd_`, `confidence_`, `career_memory`)
- CORS allow_origins list — must include Vercel URL
- `get_llm()` helper pattern — never instantiate LLM directly

**Always do:**
- `API_BASE` at top of every page that fetches
- Define components OUTSIDE `export default function`
- `model_config = {"extra": "ignore"}` on all Pydantic request models
- Shell form CMD in Dockerfile (not array form)
- Test locally before pushing

---

## SECTION 8 — LOCAL DEV COMMANDS

```powershell
# Backend
cd C:\Users\Azuro\careerapex\backend
$env:PYTHONIOENCODING="utf-8"
C:\Users\Azuro\careerapex\backend\venv\Scripts\Activate.ps1
uvicorn main:app --reload --port 8001

# Frontend (separate terminal)
cd C:\Users\Azuro\careerapex\frontend
npm run dev

# Push to deploy
cd C:\Users\Azuro\careerapex
git add .
git commit -m "description"
git push origin main

# Zip for upload
Add-Type -Assembly "System.IO.Compression.FileSystem"
$source = "C:\Users\Azuro\careerapex"
$dest = "C:\Users\Azuro\careerapex_src.zip"
if (Test-Path $dest) { Remove-Item $dest }
$exclude = @('node_modules','venv','__pycache__','chroma_store','.next','.git','.pytest_cache','.mypy_cache')
$zip = [System.IO.Compression.ZipFile]::Open($dest,'Create')
Get-ChildItem -Path $source -Recurse -File | Where-Object {
    $path = $_.FullName
    -not ($exclude | Where-Object { $path -match [regex]::Escape("\$_\") })
} | ForEach-Object {
    $entryName = $_.FullName.Substring($source.Length + 1)
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip,$_.FullName,$entryName)|Out-Null
}
$zip.Dispose()
(Get-Item $dest).Length / 1MB | ForEach-Object { "Size: {0:N2} MB" -f $_ }
```

---

## SECTION 9 — HOW TO WORK WITH KOUSHIK

**Background:** Senior QA Automation Engineer, ~5 years, transitioning to AI Engineering. Smart, learns fast, not a beginner — explain clearly the first time.

**Communication:**
- Direct and efficient. No padding.
- Lead with the fix, then the explanation.
- PowerShell only, never bash or CMD.
- Windows backslash paths.
- Downloadable files over copy-paste (U+00A0 encoding issues cause SyntaxErrors).
- Complete files only — never partial diffs.

**When he's frustrated (CAPSLOCK, multiple !):** Acknowledge + fix immediately. Don't explain first.

**For bugs:** Root cause first, then fix as downloadable file, then PowerShell commands to apply.

**After every fix:** Map to interview talking point.

**Preferences:**
- One step at a time, confirm before next
- No vague instructions ("just update the file")
- `$env:PYTHONIOENCODING="utf-8"` for emoji in terminal

---

## SECTION 10 — CHANGELOG

### June 22-25, 2026 — Interview Prep + Documentation
- Generated complete 13-section DOCX interview preparation guide (100 Q&As, Docker 50 Q&As, STAR challenges, cheat sheet)
- Updated README.md, DEPLOYMENT_GUIDE.md, CAREERAPEX_MASTER_HANDOVER.md to v3.0
- OOM kill observed in Railway logs at 23:29:24 — documented, app auto-recovered
- Explained Docker concepts (Dockerfile/Image/Container), Browser APIs, deployment flow
- Generated CODEBASE_MAP.md, AI_ENGINEER_NOTES.md, CLAUDE_TRANSFER.md, CURRENT_PROJECT_STATUS.md

### June 18, 2026 — Voice Studio Sprint (v3.0)
- Built AI Voice Studio from scratch (`/voice-studio`)
- Alex asks 5 questions based on resume+JD
- continuous=true + 2.5s silence detection
- coveredTopicsRef topic tracking (no question repeats)
- Honest scoring (refusal detection, strict rubric, score 0 fallback)
- Results saved to /tracker/save → Debrief
- Legacy /voice kept as redirect

### June 17-18, 2026 — Deployment Sprint (v2.0)
- Backend live on Railway, frontend live on Vercel
- Fixed hardcoded localhost:8001 in 5 pages
- Fixed Field component focus loss (negotiate, linkedin)
- Fixed Pydantic extra field rejection
- Fixed Docker CMD PORT expansion (shell form)
- Fixed Railway start command, port, domain
- Fixed Vercel framework preset
- Fixed frontend .git submodule
- Fixed CORS for production

### Earlier — CareerApex Development (v1.0)
- LLM migrations: Groq → Gemini → OpenRouter
- get_llm() helper pattern
- Cache-first architecture
- LangSmith tracing
- 82 passing tests
- Docker Compose + Kubernetes manifests


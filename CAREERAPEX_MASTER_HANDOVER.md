# CAREERAPEX AI — COMPLETE MASTER HANDOVER
**Version:** 2.0 | **Date:** June 18, 2026 | **Status:** Production Live

> This document is a complete project transfer package. A new Claude instance must be able to continue development with zero loss of context after reading this file.

---

## SECTION 1 — PROJECT OVERVIEW

### What is CareerApex?

CareerApex is a full-stack AI-powered career operating system built by Koushik Gattu as his flagship portfolio project. It helps job seekers prepare for AI engineering roles by analysing their resume against job descriptions, identifying skill gaps, running mock interviews (text and voice), generating salary negotiation scripts, optimising LinkedIn profiles, and building personalised learning roadmaps.

### Why It Was Built

Koushik is a Senior QA Automation Engineer (~5 years experience) actively transitioning into AI/GenAI/LLM Engineering roles. He built CareerApex to:
1. Demonstrate production-grade AI engineering skills to hiring managers
2. Use as a live demo during interviews ("this is what I built")
3. Show mastery of LangChain, LangGraph, RAG, ChromaDB, FastAPI, Next.js
4. Have a public URL to put on his resume and GitHub

### Target Users

Primary: Koushik himself (and other engineers transitioning into AI roles)
Secondary: Any job seeker who wants AI-powered career coaching

### Core Business Value

- Upload resume + JD → get instant gap analysis with match score
- Practice interviews with AI that knows your resume
- Voice interview with speech-to-text and text-to-speech
- Salary negotiation roleplay with AI HR manager
- LinkedIn profile optimisation
- Personalised learning roadmap based on skill gaps

### Main AI Capabilities

- RAG-based resume analysis (resume + JD chunked, embedded, stored in ChromaDB)
- LangGraph ReAct agent with 4 tools
- Gap analysis chain (Gemini 2.5 Flash via OpenRouter)
- Interview question generation chain
- Answer evaluation chain
- Negotiation script chain
- LinkedIn optimisation chain
- Cover letter generation chain
- Career roadmap generation chain

### Current Maturity Level

Production-grade portfolio project. All 10 features functional. 82 passing tests. Live on internet with public URLs.

### Current Deployment Status

- **Frontend:** https://careerapex-ai.vercel.app (Vercel, free tier)
- **Backend:** https://careerapex-ai-production.up.railway.app (Railway, free tier)
- **Local:** Frontend port 3000, Backend port 8001
- **GitHub:** https://github.com/Koushik2910/careerapex-ai

---

## SECTION 2 — COMPLETE ARCHITECTURE

### Frontend Architecture

**Framework:** Next.js 14 with TypeScript, Tailwind CSS, Framer Motion
**Port:** 3000
**Location:** `careerapex/frontend/`

**Routing:** Next.js App Router. Each page is `frontend/app/{route}/page.tsx`
- `/` → redirects to `/dashboard`
- `/dashboard` → Dashboard
- `/analyse` → Resume Analyser
- `/gaps` → Skill Gap Analysis
- `/interview` → Mock Interview (text)
- `/voice` → Voice Interview
- `/debrief` → Interview Debrief
- `/memory` → Career Memory
- `/negotiate` → Salary Negotiation
- `/linkedin` → LinkedIn Optimizer
- `/roadmap` → Career Roadmap

**Components:**
- `frontend/components/Sidebar.tsx` — left navigation sidebar, shared across all pages
- `frontend/lib/api.ts` — all API call functions, uses `API_BASE` env var
- `frontend/lib/utils.ts` — utility functions

**State Management:** React `useState` / `useRef` / `useCallback` hooks only. No Redux or Zustand. Each page manages its own local state.

**Critical Rule:** Never define sub-components (like `Field`, `Card`) INSIDE the main page component function. This causes React to remount them on every state change, breaking inputs. Always define helper components OUTSIDE the export default function.

**Styling:** Custom CSS variables in `globals.css` + Tailwind utility classes. Dark theme. Design tokens: `--bg-primary`, `--bg-elevated`, `--text-primary`, `--text-secondary`, `--border-subtle`, etc.

**API Base URL:**
```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
```
This must be at the TOP of every page file that makes fetch calls. Never hardcode `http://localhost:8001` directly in fetch calls — this was the major bug that broke cloud deployment.

**Environment Variables (Vercel):**
```
NEXT_PUBLIC_API_URL=https://careerapex-ai-production.up.railway.app
```

### Backend Architecture

**Framework:** FastAPI with Python 3.11
**Port:** 8001
**Location:** `careerapex/backend/`

**Entry point:** `backend/main.py` — registers all routers, sets up CORS

**CORS Configuration:**
```python
allow_origins=[
    "http://localhost:3000",
    "https://careerapex-ai.vercel.app",
]
```

**Routers (all in `backend/routers/`):**
| Router file | Prefix | Purpose |
|---|---|---|
| `upload.py` | `/upload` | Resume + JD upload, embedding |
| `analyse.py` | `/analyse` | Gap analysis, question gen, answer eval |
| `interview.py` | `/interview` | Interview start, chat, cover letter |
| `memory.py` | `/memory` | Session CRUD, progress tracking |
| `tracker.py` | `/tracker` | Score saving, confidence tracking |
| `negotiate.py` | `/negotiate` | Negotiation script, roleplay |
| `linkedin.py` | `/linkedin` | Profile optimisation |
| `agent.py` | `/agent` | LangGraph ReAct agent |

**Chains (all in `backend/chains/`):**
| Chain file | Purpose |
|---|---|
| `gap_analyser.py` | Resume vs JD gap analysis |
| `question_gen.py` | Interview question generation |
| `answer_eval.py` | Answer scoring + feedback |
| `cover_letter.py` | Cover letter generation |
| `interview_chain.py` | Interview conversation chain |
| `negotiation.py` | Salary negotiation script |
| `linkedin_optimizer.py` | LinkedIn profile optimisation |
| `confidence_tracker.py` | Interview confidence analysis |

**Utilities:**
- `backend/utils/chroma_client.py` — ChromaDB client setup
- `backend/utils/session_store.py` — In-memory session store
- `backend/utils/schemas.py` — Pydantic models
- `backend/agents/career_agent.py` — LangGraph ReAct agent

**`get_llm()` Pattern:** Every chain file uses a `get_llm()` helper function to create the LLM instance. This was introduced after migrating from Groq → direct Gemini → OpenRouter. Never hardcode the LLM anywhere — always call `get_llm()`.

### AI Layer

**LLM:** Gemini 2.5 Flash via OpenRouter
- Uses `langchain-openai` with custom `openai_api_base`
- Model string: `google/gemini-2.5-flash`
- API key: `OPENROUTER_API_KEY`

**Embeddings:** HuggingFace `all-MiniLM-L6-v2`
- Downloads ~90MB on first run
- Loaded via `langchain_huggingface.HuggingFaceEmbeddings`
- WARNING: Too heavy for Railway free tier (512MB RAM). First request is slow as model loads.

**Vector DB:** ChromaDB PersistentClient
- Local path: `./chroma_store`
- Collection: `career_memory`
- Stores: resume chunks, JD chunks, gap analysis results

**RAG Flow:**
1. User uploads resume PDF + JD file
2. Backend extracts text, splits into chunks
3. Chunks embedded with HuggingFace model
4. Stored in ChromaDB under session ID
5. Gap analysis retrieves both resume + JD chunks
6. LLM analyses gap with full context

**Session Handling:**
- Session ID format: `session-{timestamp}-{random}`
- Created on frontend when Analyse page loads
- Passed to all backend calls as `session_id` parameter
- Sessions persist in ChromaDB until manually deleted

**Memory Architecture (Cache-First):**
- After gap analysis, results saved to ChromaDB `career_memory` collection
- Skill Gaps page reads from ChromaDB → zero LLM calls
- Memory page reads from ChromaDB → zero LLM calls  
- Roadmap page reads from ChromaDB → zero LLM calls
- Only Analyse page calls the LLM for gap analysis

**LangGraph ReAct Agent:**
- Location: `backend/agents/career_agent.py`
- 4 tools: `get_resume_info`, `get_job_requirements`, `analyse_gap`, `get_session_memory`
- Accessed via `/agent/chat` endpoint
- Used for free-form career coaching queries

### Storage

**ChromaDB:**
- PersistentClient at `./chroma_store`
- Two collections: raw document chunks + `career_memory` (analysis results)
- On Railway free tier: NO persistent disk → data wiped on redeploy
- On local: persists between restarts

**Session Store:**
- In-memory Python dict in `session_store.py`
- Stores active session metadata
- Lost on backend restart

**Critical Cloud Limitation:** Railway free tier has no persistent disk. ChromaDB data is lost on every redeploy. For demo purposes, always run the full flow (Analyse → Interview → Memory) in one uninterrupted session.

### Deployment Architecture

**Railway (Backend):**
- Root Directory: `backend`
- Build: `pip install -r requirements.txt`
- Start: `sh -c "uvicorn main:app --host 0.0.0.0 --port $PORT"`
- Environment: Python 3.11 (set via `PYTHON_VERSION=3.11.9` env var)
- Free tier: 512MB RAM, sleeps after 15 min inactivity

**Vercel (Frontend):**
- Root Directory: `frontend`
- Framework: Next.js
- Build: `npm run build`
- Auto-deploys on every push to `main`

**IMPORTANT — Railway Wake-Up Issue:**
Railway free tier sleeps after 15 minutes. First request after sleep takes 30-60 seconds. This causes voice interview to appear broken (blank screen after Q1) because the `/interview/chat` call times out. Fix: open `https://careerapex-ai-production.up.railway.app/health` in a browser tab before starting interviews.

---

## SECTION 3 — COMPLETE MODULE BREAKDOWN

### Module 1: Dashboard (`/dashboard`)

**Purpose:** Overview of career health at a glance — match score, avg answer score, sessions count, quick actions.

**How it works:**
- Loads session list from `/memory/sessions`
- Calculates aggregate stats from session data
- Shows Quick Actions grid linking to all 8 features
- Shows Recent Sessions list

**Frontend:** `frontend/app/dashboard/page.tsx`
**Backend:** `/memory/sessions` endpoint in `memory.py`

**Data Flow:** Page load → fetch `/memory/sessions` → calculate stats → render

**Known Limitations:** Stats are zero if no sessions exist. ChromaDB wipe on Railway redeploy clears all sessions.

---

### Module 2: Resume Analyser (`/analyse`)

**Purpose:** Upload resume + JD, run AI gap analysis, get match score + skill gaps + strengths + recommendations.

**How it works:**
1. Page generates a session ID on mount
2. User uploads resume PDF → POST `/upload/resume`
3. User uploads JD (PDF/DOCX) → POST `/upload/jd`
4. Backend chunks + embeds both files, stores in ChromaDB under session ID
5. User clicks "Run Gap Analysis" → POST `/analyse/gaps`
6. Backend retrieves chunks, calls LLM chain, returns structured JSON
7. Results saved to ChromaDB + memory store
8. Frontend displays score, gaps, strengths, recommendations

**Frontend:** `frontend/app/analyse/page.tsx`
**Backend:** `upload.py` (upload endpoints) + `analyse.py` (gap endpoint)
**Chains:** `gap_analyser.py`

**Key Endpoints:**
- `POST /upload/resume` — upload + embed resume
- `POST /upload/jd` — upload + embed JD
- `POST /analyse/gaps` — run gap analysis

**Cache:** Results stored in ChromaDB. Skill Gaps page reads from this cache.

**Known Issues:**
- Large PDFs take 30-60s to embed on Railway (model loading)
- Session ID must be passed consistently to all subsequent calls

---

### Module 3: Skill Gap Analysis (`/gaps`)

**Purpose:** Visual breakdown of skill gaps from the last analysis. Bar charts, gap scores, strengths.

**How it works:**
- Cache-first: reads analysis from ChromaDB via `/analyse/gaps/{session_id}`
- Zero LLM calls — pure data display
- Shows session dropdown if multiple sessions exist

**Frontend:** `frontend/app/gaps/page.tsx`
**Backend:** `GET /analyse/gaps/{session_id}` in `analyse.py`

**CRITICAL:** This page must use `API_BASE` not `localhost:8001`. Fixed in the localhost→API_BASE migration.

---

### Module 4: Mock Interview (`/interview`)

**Purpose:** Text-based AI mock interview. AI asks questions based on resume+JD. User types answers. AI scores each answer.

**How it works:**
1. User enters session ID (from Analyse page)
2. POST `/interview/start` → generates first question
3. User types answer → POST `/interview/chat` with full history
4. Backend evaluates answer, generates next question
5. After N questions, shows session summary

**Frontend:** `frontend/app/interview/page.tsx`
**Backend:** `interview.py`
**Chains:** `question_gen.py`, `answer_eval.py`, `interview_chain.py`

**Key Endpoints:**
- `POST /interview/start` — start session, get Q1
- `POST /interview/chat` — send answer, get next Q + score

---

### Module 5: Voice Interview (`/voice`)

**Purpose:** AI speaks questions aloud. User answers by voice. Transcript captured via Web Speech API. AI evaluates.

**How it works:**
1. User enters session ID + selects mode (Standard/Defense)
2. `startInterview()` calls `askNextQuestion(0, [])`
3. Backend (`/interview/chat`) returns AI text
4. Browser `SpeechSynthesis` speaks the text aloud
5. `SpeechRecognition` listens for user answer
6. `onend` event fires → `processAnswer(transcript)`
7. `processAnswer` → evaluates answer → calls `askNextQuestion(count+1, history)`
8. After Q5 → shows feedback screen

**Frontend:** `frontend/app/voice/page.tsx`
**Backend:** `/interview/chat` (same as mock interview)
**Browser APIs:** `SpeechSynthesis`, `SpeechRecognition` (Chrome only)

**CRITICAL ARCHITECTURE NOTE:**
- `processAnswer` is defined with `useCallback` and depends on `[history, sessionId, feedbackList]`
- `askNextQuestion` depends on `[sessionId, mode, startListening]`
- `startListening` depends on `[]` (no deps)
- These dependency arrays are critical. Changing them breaks the flow.

**Known Bug — Blank Screen After Q1 on Cloud:**
Root cause: Railway sleeps mid-session. `/interview/chat` call times out after 30s. Error handler sets `status = "ended"` which renders nothing (blank). The render condition only shows content for `ai-speaking | listening | processing`. When `ended` is set, the screen goes blank.

**Fix Applied:** Added `"ended"` to render conditions in `voice_page_v3.tsx`. But this only helps show the error — it doesn't fix Railway sleeping.

**NEVER TOUCH:** The `stoppedRef` pattern, the `speak()` helper, the `getVoice()` function. These are carefully tuned for cross-browser compatibility.

**Local vs Cloud:**
- Local: works perfectly if backend is running
- Cloud: breaks if Railway sleeps between Q1 and Q2

---

### Module 6: Interview Debrief (`/debrief`)

**Purpose:** Post-interview scorecard — avg score, confidence, completion rate, best/worst answers, cover letter generation.

**How it works:**
- Auto-loads sessions from `/memory/sessions` on mount
- Pre-fills session ID with most recent session
- User can select session → loads tracker data from `/tracker/summary`
- Shows performance breakdown
- "Generate" button → POST `/interview/cover-letter` → generates cover letter

**Frontend:** `frontend/app/debrief/page.tsx`
**Backend:** `tracker.py`, `interview.py`

**Fix Applied:** Was defaulting to `"test-session-001"` (hardcoded). Fixed to auto-load from memory sessions.

---

### Module 7: Career Memory (`/memory`)

**Purpose:** Full session history with progress over time. Shows all past sessions, session details, strengths, skill gaps.

**How it works:**
- Cache-first: reads from `/memory/sessions` and `/memory/session/{id}`
- Zero LLM calls
- Shows progress comparison between sessions

**Frontend:** `frontend/app/memory/page.tsx`
**Backend:** `memory.py`

**Key Endpoints:**
- `GET /memory/sessions` — list all sessions
- `GET /memory/session/{id}` — get session detail
- `DELETE /memory/session/{id}` — delete session

---

### Module 8: Salary Negotiation (`/negotiate`)

**Purpose:** Generate salary negotiation script + roleplay with AI HR manager.

**How it works:**
- Tab 1 "Negotiation Script": User fills form (current offer, target, role, company, experience, competing offers, strengths) → LLM generates script
- Tab 2 "Roleplay Practice": Chat interface with AI acting as HR manager

**Frontend:** `frontend/app/negotiate/page.tsx`
**Backend:** `negotiate.py`
**Chains:** `negotiation.py`

**Fixed Bug:** `Field` component was defined inside `NegotiatePage()` → remounted on every keypress → input lost focus after each character. Fixed by moving `Field` OUTSIDE the component function.

**Key Endpoints:**
- `POST /negotiate/script` — generate negotiation script
- `POST /negotiate/roleplay/start` — start roleplay session
- `POST /negotiate/roleplay/chat` — continue roleplay

---

### Module 9: LinkedIn Optimizer (`/linkedin`)

**Purpose:** Optimise LinkedIn headline and About section based on resume content.

**How it works:**
- User pastes current headline + about section + target role
- LLM generates optimised versions
- Shows side-by-side comparison

**Frontend:** `frontend/app/linkedin/page.tsx`
**Backend:** `linkedin.py`
**Chains:** `linkedin_optimizer.py`

**Fixed Bug:** Same `Field` inside component bug as Negotiate. Fixed by moving `Field` OUTSIDE.

**Key Endpoints:**
- `POST /linkedin/optimize` — generate optimised headline + about
- `POST /linkedin/headlines` — generate multiple headline options

---

### Module 10: Career Roadmap (`/roadmap`)

**Purpose:** Personalised 8-week learning plan to close skill gaps.

**How it works:**
- Reads skill gaps from ChromaDB (cache-first, zero LLM calls if session exists)
- If no session: calls LLM to generate generic roadmap
- Parses `WEEK X:` format from LLM response
- Shows week-by-week breakdown with topics and resources

**Frontend:** `frontend/app/roadmap/page.tsx`
**Backend:** `agent.py` (LangGraph agent handles roadmap queries)

**Known Issue:** `parseRoadmap()` fallback breaks if Gemini doesn't use exact `WEEK X:` format. LLM responses are non-deterministic.

---

## SECTION 4 — TOKEN OPTIMIZATION

### Which Modules Call LLM

| Module | Calls LLM? | When |
|---|---|---|
| Dashboard | ❌ No | Never |
| Analyse | ✅ Yes | On "Run Gap Analysis" click |
| Skill Gaps | ❌ No | Reads from ChromaDB cache |
| Interview | ✅ Yes | Every message exchange |
| Voice Interview | ✅ Yes | Every question generation + eval |
| Debrief | ✅ Yes | Cover letter generation only |
| Memory | ❌ No | Reads from ChromaDB cache |
| Negotiate | ✅ Yes | Script generation + roleplay |
| LinkedIn | ✅ Yes | Optimisation generation |
| Roadmap | ✅ Sometimes | Only if no cached session |

### Cache Architecture

After Analyse runs:
```
ChromaDB career_memory collection:
{
  session_id: "session-xxx",
  match_score: 92,
  gaps: [...],
  strengths: [...],
  recommendations: [...],
  resume_file: "resume.pdf",
  jd_file: "jd.docx"
}
```

Skill Gaps, Memory, and Roadmap pages all read from this cache. Zero LLM calls.

### Why This Matters

Without caching, navigating to Skill Gaps would call Gemini again → costs tokens + 3-5 second delay. With caching, it's instant.

---

## SECTION 5 — SESSION MANAGEMENT DESIGN

### How Sessions Are Created

On the Analyse page, when it mounts:
```typescript
const [sessionId] = useState(`session-${Date.now()}-${Math.random().toString(36).slice(2,8)}`);
```

This session ID is shown on screen and must be copied to use in Interview/Voice pages.

### How Resume and JD Are Linked

Both uploaded files are stored in ChromaDB under the session ID as the namespace. When gap analysis runs, it retrieves chunks by session ID.

### How Analysis Is Stored

After gap analysis:
1. Results JSON saved to `backend/utils/session_store.py` (in-memory)
2. Results also saved to ChromaDB `career_memory` collection
3. Memory endpoint reads from ChromaDB

### How Dashboard Uses Sessions

`GET /memory/sessions` → returns all session metadata → dashboard calculates aggregate stats.

### How Memory Page Uses Sessions

Same endpoint. Shows full history per session with expandable details.

### How Skill Gaps Use Sessions

`GET /analyse/gaps/{session_id}` → returns cached analysis from ChromaDB.

### Common Bugs

1. **Session not found:** User goes to Skill Gaps without running analysis first
2. **Wrong session ID in Voice:** User types wrong session ID → AI has no resume context → generic questions
3. **Sessions wiped on Railway redeploy:** ChromaDB has no persistent disk on free tier
4. **Debrief showing zeros:** Was using hardcoded `"test-session-001"` — fixed to auto-load

### Fixes Already Implemented

- All pages now use `API_BASE` (not `localhost:8001`) for fetch calls
- Debrief auto-loads sessions from memory
- Session ID generated on mount and shown clearly on Analyse page

---

## SECTION 6 — DEPLOYMENT HISTORY

### Issue 1: Docker — Dependency Version Conflict
**Problem:** `langchain-core==0.2.10` conflicted with `langgraph==0.1.9` (needs `>=0.2.19`)
**Root Cause:** Pinned versions too tight
**Fix:** Bumped `langchain-core` to `0.2.19`

### Issue 2: Docker — Multi-Stage Build Memory (OOM)
**Problem:** `HuggingFaceEmbeddings` model download at build time → OOM on Railway 512MB
**Root Cause:** Pre-downloading 90MB model + all deps exceeds RAM
**Fix:** Removed pre-download from Dockerfile. Model loads on first request instead.

### Issue 3: Docker — PORT Variable Not Expanding
**Problem:** `CMD ["uvicorn", ..., "--port", "$PORT"]` → Railway couldn't expand `$PORT`
**Root Cause:** Docker `CMD` array form doesn't use shell, so `$PORT` is literal
**Fix:** Changed to `CMD sh -c "uvicorn main:app --host 0.0.0.0 --port $PORT"`

### Issue 4: Render — Python 3.14 Default
**Problem:** Render defaulted to Python 3.14; `pydantic-core 2.18.2` has no wheel for it → compilation fails
**Root Cause:** `runtime.txt` in subdirectory ignored by Render; env var `PYTHON_VERSION` also not working initially
**Fix:** Switched from pinned to unpinned requirements (`>=`) so pip resolves compatible wheels. Eventually switched to Railway entirely.

### Issue 5: Railway — Gunicorn Default Start Command
**Problem:** Railway defaulted to `gunicorn your_application.wsgi` which doesn't exist
**Root Cause:** Railway couldn't detect FastAPI automatically
**Fix:** Set custom start command: `sh -c "uvicorn main:app --host 0.0.0.0 --port $PORT"`

### Issue 6: Railway — Wrong Port in Domain
**Problem:** Domain generated with port 8080 but app runs on 8001
**Root Cause:** Railway domain generation asked for port, defaulted to 8080
**Fix:** Changed target port to 8001 in Railway networking settings

### Issue 7: Vercel — Frontend Not Found (404)
**Problem:** `careerapex-ai.vercel.app/dashboard` → 404
**Root Cause:** Framework preset was "Other" not "Next.js" — Vercel treated it as static site
**Fix:** Changed Framework Preset to "Next.js" in Vercel Build and Deployment settings → redeployed

### Issue 8: Vercel — Frontend Directory Not Found
**Problem:** Vercel couldn't find `frontend/` directory in repo
**Root Cause:** `frontend/` had its own nested `.git` folder → treated as submodule
**Fix:** `Remove-Item -Recurse -Force frontend/.git` → re-add as regular directory → push

### Issue 9: Hardcoded localhost:8001
**Problem:** Cloud frontend made API calls to `localhost:8001` → failed silently → sessions never saved
**Root Cause:** Pages used hardcoded URL instead of `process.env.NEXT_PUBLIC_API_URL`
**Files affected:** `analyse/page.tsx`, `gaps/page.tsx`, `memory/page.tsx`, `voice/page.tsx`, `roadmap/page.tsx`
**Fix:** Added `const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001"` to each file

### Issue 10: Railway Sleep / Voice Interview Blank Screen
**Problem:** Voice interview shows blank screen after Q1 on cloud
**Root Cause:** Railway free tier sleeps after 15min → `/interview/chat` times out → error handler sets `status="ended"` → blank render
**Fix:** Added `"ended"` to render condition so screen stays visible with error. Keepalive ping on page load to wake Railway. But root issue is Railway sleep — no perfect fix on free tier.

### Issue 11: Input Field Loses Focus (Negotiate + LinkedIn)
**Problem:** Input fields only accept one character at a time
**Root Cause:** `Field` component defined inside the parent component → React recreates function on every state change → unmounts + remounts input → loses focus
**Fix:** Moved `Field` component definition OUTSIDE the `export default function`

### Issue 12: Docker — frontend submodule
**Problem:** `Compress-Archive` on first zip attempt included `.git` inside frontend → 323MB zip
**Fix:** Remove `.git` from frontend before zipping

### Lessons Learned

1. Always set `output: "standalone"` in `next.config.ts` for Docker builds
2. Railway free tier is NOT suitable for ML models (HuggingFace) in production
3. Never define React components inside other components
4. Always use `API_BASE` env var — never hardcode localhost in fetch calls
5. Railway domain port must be manually set to match app port
6. Vercel Framework Preset must be "Next.js" not "Other" or "Services"
7. Docker CMD array form doesn't expand shell variables — use shell form

---

## SECTION 7 — KNOWN BUGS

### Resolved ✅

- Input field loses focus (Negotiate, LinkedIn) — `Field` outside component
- Sessions not showing in cloud (Skill Gaps, Memory) — `API_BASE` fix
- Debrief showing zeros — auto-load sessions from memory
- Vercel 404 — Next.js framework preset
- Railway port mismatch — set to 8001
- Docker PORT not expanding — shell form CMD

### Partially Resolved ⚠️

- **Voice interview blank screen on cloud:** Shows error message now instead of blank, but Railway sleep still causes Q2 to fail. Workaround: ping health endpoint before starting interview.

### Open Issues ❌

- **ChromaDB persistence on Railway:** No persistent disk on free tier. Sessions lost on redeploy. Needs Railway paid disk ($0.25/GB/month) or migrate to Pinecone.
- **Voice interview Q2+ on cloud:** Railway sleep mid-session breaks flow. Need Railway paid tier or Render paid tier.
- **Roadmap parseRoadmap() fragile:** Breaks if Gemini doesn't use exact `WEEK X:` format.
- **No file size validation:** Large PDFs can timeout on embedding.
- **No auth:** Single-user app. Anyone with the URL can access.

### Potential Risks

- OpenRouter API key is in `.env` — do not commit to public GitHub
- LangSmith API key is in `.env` — same
- Railway/Vercel free tiers have usage limits

---

## SECTION 8 — FUTURE ROADMAP

### Short Term (Next 1-2 weeks)

- Fix ChromaDB persistence (add Railway disk or switch to Pinecone free tier)
- Fix voice interview cloud issue (Railway paid tier or persistent keepalive)
- Add file size validation on upload endpoints
- Mobile responsiveness improvements
- Retry logic with tenacity on all LLM chain calls

### Medium Term (1-2 months)

- User authentication (NextAuth.js + simple user table)
- Multiple resume profiles per user
- Export interview debrief as PDF
- Email summary of session results
- Connect to job boards (Naukri, LinkedIn) via API

### Long Term (SaaS)

- Multi-tenant architecture
- Subscription tiers (Free: 3 analyses/month, Pro: unlimited)
- Company-specific interview prep (upload company interview bank)
- Team features (manager can review candidate prep)
- Integration with ATS systems

### Monetization Ideas

- Freemium: 3 free analyses, then ₹499/month
- B2B: sell to coding bootcamps and placement cells
- Enterprise: custom models trained on company-specific interview data

---

## SECTION 9 — HOW TO WORK WITH KOUSHIK

### Background

Koushik is a Senior QA Automation Engineer with ~5 years experience. He is intelligent, hardworking, and genuinely understands engineering. He is actively building AI skills and has covered a lot of ground quickly. He is not a beginner but may need concepts explained clearly the first time.

### Communication Style

- Direct and efficient. Don't pad responses with unnecessary pleasantry.
- When he's frustrated (CAPSLOCK, multiple exclamation marks), acknowledge the problem immediately and fix it. Don't explain why it happened before fixing it.
- He prefers commands he can run right now over theoretical explanations.
- He is on Windows 11, uses PowerShell. Always give PowerShell commands, not bash/CMD.
- He prefers downloadable files over copy-pasting code (U+00A0 encoding issues cause SyntaxErrors).

### Preferred Explanation Style

- Lead with what it does, then how it works
- Use concrete examples, not abstract descriptions
- For bugs: state root cause first, then fix
- For architecture: show the data flow (request → response path)
- For new concepts: connect to something he already knows

### Coding Style Preferences

- Complete files, not diffs or partial edits
- Full file paths always specified
- PowerShell syntax, Windows backslash paths
- Download files, don't copy-paste
- `$env:PYTHONIOENCODING="utf-8"` for emoji support in terminal

### Decision-Making Style

- Practical over perfect. He wants things working, not theoretical
- He values speed of delivery
- He respects honesty — if something won't work, say so directly
- He prefers the simplest solution that solves the problem

### How to Mentor Him

- Act as a Staff Engineer + mentor combination
- Explain the WHY behind decisions, not just the WHAT
- When he asks "why doesn't this work" — give root cause + fix + lesson learned
- Map everything back to interview talking points ("here's how you explain this in interviews")
- Don't overwhelm with options — give one clear recommendation

### How to Break Tasks Into Phases

For any significant change:
1. Explain what you're going to do and why
2. Give the fix (downloadable file)
3. Give the exact commands to apply it
4. Tell him what to verify

### Things That Frustrate Him

- Getting the same fix multiple times without it working
- Being asked to paste large amounts of code
- Vague instructions ("just update the file")
- Back-and-forth debugging without clear progress

### Interview Coaching Style

After every significant feature or fix, map it to an interview talking point. Example:
> "For interviews: explain this as 'I migrated from hardcoded API URLs to environment-variable-driven configuration to support multi-environment deployment across local, staging, and production.'"

---

## SECTION 10 — PROJECT KNOWLEDGE TRANSFER

### Critical Files — Never Break These

| File | Why Critical |
|---|---|
| `backend/main.py` | Registers all routers. Wrong import name = 500 error |
| `backend/agents/career_agent.py` | LangGraph agent. Dependency chain is fragile |
| `backend/utils/chroma_client.py` | All ChromaDB access goes through here |
| `frontend/app/voice/page.tsx` | Complex state machine. Many interdependencies |
| `frontend/lib/api.ts` | All API calls. Must use API_BASE |
| `frontend/components/Sidebar.tsx` | Shared nav. Break this = break all pages |

### Critical Architecture Decisions

1. **`get_llm()` helper:** All chains use this. Never instantiate LLM directly in chain files.
2. **Cache-first for Skill Gaps/Memory/Roadmap:** These pages must never call LLM independently.
3. **Session ID on frontend:** Generated on Analyse page mount. User copies it to other pages.
4. **`API_BASE` everywhere:** Every fetch call must use this. Not localhost.
5. **Field components outside parent:** Never define React components inside other components.

### Things That Should Never Be Changed Casually

- `stoppedRef` pattern in voice interview
- `useCallback` dependency arrays in voice interview
- ChromaDB collection name `career_memory`
- Session ID format (other pages parse it)
- CORS allow_origins list (must include Vercel URL)

### Performance Considerations

- HuggingFace model takes 30-60s to load on Railway cold start
- Large PDFs (>20 pages) take longer to embed
- Gemini 2.5 Flash responses: 2-5 seconds
- ChromaDB reads: <100ms (fast)

### Deployment Considerations

- Always test locally before pushing to main (Vercel auto-deploys)
- Railway auto-deploys on push to main (backend)
- After backend deploy, test `/health` endpoint before testing UI
- ChromaDB data wiped on every Railway redeploy

---

## SECTION 11 — RESUME & INTERVIEW MAPPING

### How to Explain CareerApex in Interviews

**One-liner:** "I built a production-grade AI career OS called CareerApex — a full-stack application using Next.js, FastAPI, LangGraph, ChromaDB, and Gemini, deployed on Railway and Vercel."

**LangChain Concepts Used:**
- LCEL chains for all AI features (gap analyser, question gen, etc.)
- `ChatOpenAI` with custom `openai_api_base` for OpenRouter
- `langchain_huggingface.HuggingFaceEmbeddings` for document embedding
- `langchain_text_splitters` for chunking resumes and JDs
- LangSmith tracing for observability

**LangGraph Concepts:**
- ReAct agent with 4 custom tools
- `create_react_agent` pattern
- State management across agent steps

**RAG Concepts:**
- Document ingestion (PDF + DOCX parsing)
- Chunking strategy (RecursiveCharacterTextSplitter)
- Embedding + storage (ChromaDB)
- Retrieval by session ID namespace
- Context injection into LLM prompt

**Embeddings:**
- `all-MiniLM-L6-v2` for semantic similarity
- Why: lightweight, good quality, runs on CPU

**Vector DB:**
- ChromaDB PersistentClient
- Session-namespaced collections
- Semantic search for relevant chunks

**Prompt Engineering:**
- System prompts per feature
- Few-shot examples in interview chain
- Mode-specific prompts (Standard vs Defense interview)
- Structured output with JSON parsing

**Caching:**
- Gap analysis results stored in ChromaDB after first run
- Subsequent pages read from cache — zero LLM calls
- Reduces latency from 5s to <100ms for Skill Gaps/Memory/Roadmap

**Session Management:**
- Timestamp-based session IDs
- Cross-page session continuity
- Session deletion with ChromaDB cleanup

**Full Stack AI Engineering:**
- FastAPI backend with async endpoints
- Next.js 14 App Router frontend
- TypeScript + Tailwind
- Docker + Docker Compose
- Railway + Vercel deployment
- Environment-variable-driven configuration

---

## SECTION 12 — CHANGELOG

### June 17-18, 2026 — Deployment Sprint

**Backend Deployment:**
- Built Docker image with multi-stage build (builder + runtime stages)
- Fixed dependency version conflict: `langchain-core` 0.2.10 → 0.2.19
- Removed HuggingFace model pre-download (OOM on Railway)
- Fixed Docker PORT: array CMD → shell CMD
- Switched from Render to Railway (Render Python 3.14 + OOM issues)
- Fixed Railway start command (gunicorn → uvicorn)
- Fixed Railway domain port (8080 → 8001)
- Backend live at `careerapex-ai-production.up.railway.app`

**Docker Compose:**
- Full stack (frontend + backend + ChromaDB volume) in one `docker-compose.yml`
- Fixed healthcheck (removed curl dependency)
- Volume mount for ChromaDB persistence

**Kubernetes:**
- Wrote Minikube manifests: Deployment, Service, ConfigMap, Secret, PVC
- For portfolio/resume value — not used in production

**Frontend Deployment:**
- Fixed nested `.git` submodule issue in frontend directory
- Fixed Vercel Framework Preset (Other → Next.js)
- Frontend live at `careerapex-ai.vercel.app`

**Bug Fixes:**
- Hardcoded `localhost:8001` replaced with `API_BASE` in 5 pages
- `Field` component moved outside parent in `negotiate/page.tsx` and `linkedin/page.tsx`
- Debrief auto-loads sessions (removed hardcoded `"test-session-001"`)
- Voice interview: added `"ended"` to render conditions (no more blank screen)
- CORS updated to include Vercel URL

### Earlier — CareerApex Development

- LLM migrations: Groq → direct Gemini → OpenRouter
- `get_llm()` helper pattern introduced
- Cache-first architecture for Skill Gaps/Memory/Roadmap
- React stale closure fix in voice interview (useRef pattern)
- Backend module naming conflict fixed (memory.py)
- LangSmith tracing integrated
- 82 passing tests (79 pass + 3 xfail)
- 10 pages all functional locally

---

## APPENDIX — VOICE INTERVIEW CRITICAL BUG (June 18, 2026)

### Exact Bug Description

Voice interview goes blank after Q1 answer on BOTH local and cloud.

**Symptoms:**
- Setup screen shows correctly ✅
- Alex speaks Q1 ✅
- User answers, transcript visible ✅
- "Processing your answer... 2 messages" shows briefly ✅
- Screen goes completely blank ❌

**Root Cause (confirmed):**

In `voice/page.tsx`, the `askNextQuestion` function has a catch block:
```typescript
} catch (e) {
  setError("Failed to get next question. Please check your connection.");
  setStatus("ended");
}
```

And the render condition is:
```typescript
{(status === "ai-speaking" || status === "listening" || status === "processing") && (
```

`"ended"` is NOT in the render list. So when error occurs → `status="ended"` → nothing renders → blank screen.

**The fix is ONE LINE — add "ended" to render condition:**

Change:
```typescript
{(status === "ai-speaking" || status === "listening" || status === "processing") && (
```

To:
```typescript
{(status === "ai-speaking" || status === "listening" || status === "processing" || status === "ended") && (
```

This is in `frontend/app/voice/page.tsx` around line 411.

**Why it was working before:**
It wasn't — blank screen after Q1 was always there. The `/interview/chat` backend call was either:
- Failing due to OpenRouter rate limit
- Failing due to session ID not having resume context (no session uploaded)
- Failing due to backend error

**Additional fix needed — show error message when status="ended":**

After the progress bar section, add:
```typescript
{status === "ended" && error && (
  <div style={{ textAlign: "center", padding: 40, color: "#EF4444" }}>
    <p>{error}</p>
    <p style={{ marginTop: 12, color: "var(--text-secondary)", fontSize: 13 }}>
      Please end session and try again.
    </p>
  </div>
)}
```

**Checklist before Voice Interview works:**
1. Backend must be running (`uvicorn main:app --port 8001`)
2. Session ID must be from a valid Analyse session (resume + JD uploaded)
3. Session ID must have resume context in ChromaDB
4. Apply the render condition fix above

# CAREERAPEX AI — COMPLETE MASTER HANDOVER
**Version:** 3.0 | **Date:** June 18, 2026 | **Status:** Production Live

> This document is a complete project transfer package. A new Claude instance must be able to continue development with zero loss of context after reading this file.

---

## SECTION 1 — PROJECT OVERVIEW

### What is CareerApex?

CareerApex is a full-stack AI-powered career operating system built by Koushik Gattu as his flagship portfolio project. It helps job seekers prepare for AI engineering roles by analysing their resume against job descriptions, identifying skill gaps, running mock interviews (text and voice), generating salary negotiation scripts, optimising LinkedIn profiles, and building personalised learning roadmaps.

### Why It Was Built

Koushik is a Senior QA Automation Engineer (~5 years experience) actively transitioning into AI/GenAI/LLM Engineering roles. He built CareerApex to:
1. Demonstrate production-grade AI engineering skills to hiring managers
2. Use as a live demo during interviews
3. Show mastery of LangChain, LangGraph, RAG, ChromaDB, FastAPI, Next.js
4. Have a public URL on his resume and GitHub

### Current Deployment Status

- **Frontend:** https://careerapex-ai.vercel.app (Vercel, free tier)
- **Backend:** https://careerapex-ai-production.up.railway.app (Railway, free tier)
- **Local:** Frontend port 3000, Backend port 8001
- **GitHub:** https://github.com/Koushik2910/careerapex-ai

---

## SECTION 2 — COMPLETE ARCHITECTURE

### Frontend Architecture

**Framework:** Next.js 16 with TypeScript, Tailwind CSS, Framer Motion
**Port:** 3000
**Location:** `careerapex/frontend/`

**Routing:** Next.js App Router. Each page is `frontend/app/{route}/page.tsx`
- `/` → redirects to `/dashboard`
- `/dashboard` → Dashboard
- `/analyse` → Resume Analyser
- `/gaps` → Skill Gap Analysis
- `/interview` → Mock Interview (text)
- `/voice` → Legacy page (shows "Upgrading" card + redirects to /voice-studio)
- `/voice-studio` → AI Voice Studio (new, production-ready)
- `/debrief` → Interview Debrief
- `/memory` → Career Memory
- `/negotiate` → Salary Negotiation
- `/linkedin` → LinkedIn Optimizer
- `/roadmap` → Career Roadmap

**Components:**
- `frontend/components/Sidebar.tsx` — left navigation sidebar, shared across all pages. Shows "AI Voice Studio" with NEW badge. Does NOT show old Voice Interview.
- `frontend/lib/api.ts` — all API call functions, uses `API_BASE` env var
- `frontend/lib/utils.ts` — utility functions incl. `generateSessionId()`

**Critical Rule:** Never define sub-components (like `Field`, `Card`) INSIDE the main page component function. Causes React to remount on every state change, breaking inputs.

**API Base URL:**
```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
```
This must be at the TOP of every page file that makes fetch calls. Never hardcode `http://localhost:8001`.

### Backend Architecture

**Framework:** FastAPI with Python 3.11
**Port:** 8001
**Location:** `careerapex/backend/`
**Venv location:** `careerapex/backend/venv/` (NOT careerapex/venv/)

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
| `upload.py` | `/upload` | Resume + JD upload, embedding, copy-resume |
| `analyse.py` | `/analyse` | Gap analysis, question gen, answer eval |
| `interview.py` | `/interview` | Interview start, chat (text + voice), cover letter |
| `memory.py` | `/memory` | Session CRUD, progress tracking |
| `tracker.py` | `/tracker` | Score saving, confidence tracking |
| `negotiate.py` | `/negotiate` | Negotiation script, roleplay |
| `linkedin.py` | `/linkedin` | Profile optimisation |
| `agent.py` | `/agent` | LangGraph ReAct agent |

**Chains (all in `backend/chains/`):**
| Chain file | Purpose | Notes |
|---|---|---|
| `gap_analyser.py` | Resume vs JD gap analysis | |
| `question_gen.py` | Interview question generation | |
| `answer_eval.py` | Answer scoring with honest scoring | Detects refusals (score 0-5), no fake 65 defaults |
| `cover_letter.py` | Cover letter generation | |
| `interview_chain.py` | Interview conversation chain | Voice mode: question-only, no history |
| `negotiation.py` | Salary negotiation script | |
| `linkedin_optimizer.py` | LinkedIn profile optimisation | |
| `confidence_tracker.py` | Interview confidence analysis | MUST include `answer` field in get_session_scores |

**`get_llm()` Pattern:** Every chain file uses a `get_llm()` helper. Never hardcode the LLM.

### AI Layer

**LLM:** Gemini 2.5 Flash via OpenRouter
- Model string: `google/gemini-2.5-flash`
- API key: `OPENROUTER_API_KEY`

**Embeddings:** HuggingFace `all-MiniLM-L6-v2` (~90MB, loads on first request)

**Vector DB:** ChromaDB PersistentClient at `./chroma_store`
- Collections: `resume_{session_id}`, `jd_{session_id}`, `career_memory`, `confidence_{session_id}`

---

## SECTION 3 — MODULE BREAKDOWN

### Module: AI Voice Studio (`/voice-studio`)

**Purpose:** Full voice interview with AI interviewer "Alex". 5 questions based on resume+JD. Honest scoring. Results flow to Debrief.

**Key architectural decisions:**
- All state in `useRef` (not useState) for callbacks: `historyRef`, `feedbackListRef`, `questionCountRef`, `sessionIdRef`, `coveredTopicsRef`
- `continuous = true` in SpeechRecognition — keeps mic open
- 2.5-second silence timer — only processes answer after 2.5s of silence
- `coveredTopicsRef` accumulates first 12 words of each question — injected into next question prompt as "do not repeat these topics"
- Voice mode detected in `interview_chain.py` by checking if message contains "Ask Question X of Y" — sends question-only system prompt without history
- Scores hidden during active interview — shown only on feedback screen
- Saves every answer to `/tracker/save` after evaluation — powers Debrief
- Pings `/health` on page mount to pre-warm Railway
- Retry logic: `/interview/chat` retries once with 1.5s delay before showing error
- Session ID never changes during the session — fully consistent from setup to debrief

**Flow:**
```
Setup → enter session ID → startInterview()
  → askQuestion(0, [])
  → getNextQuestion() → fetch /interview/chat → get AI text
  → setCurrentQuestion() → speak() → startListening()
  → SpeechRecognition (continuous, 2.5s silence) → handleAnswer()
  → evaluateAnswer() → /analyse/evaluate
  → saveToTracker() → /tracker/save
  → if count < 5: askQuestion(count+1, history)
  → if count >= 5: closing speech → setStatus("feedback")
```

**NEVER TOUCH:**
- `stoppedRef` pattern — prevents audio leaks on unmount
- `continuous = true` + silence timer pattern — changing breaks listening
- `coveredTopicsRef` accumulation — order matters (parallel updates would lose topics)
- The `useCallback` dependency arrays

### Module: Interview Debrief (`/debrief`)

**Purpose:** Post-interview scorecard. Reads from tracker (ChromaDB), zero LLM calls.

**Data source:** `GET /tracker/summary/{session_id}` → `confidence_{session_id}` ChromaDB collection

**Key features:**
- Auto-loads if `?session=` URL param present (set by Voice Studio "View in Debrief" button)
- Shows session list from `/memory/sessions` for quick selection
- Sorts answers by `question_index` (1-based, saved by Voice Studio)
- Answer field now correctly returned from `get_session_scores()` (was missing before)
- "No answer recorded" shown gracefully if answer is empty string
- Cover letter generation is the only LLM call (user-triggered)

**Cache:** Pure ChromaDB reads. No LLM calls except cover letter.

### Module: Mock Interview (`/interview`)

**Purpose:** Text-based AI mock interview. Full conversational history passed to backend.

**Uses:** `interview_chain.py` in standard/defense mode WITH full history. Not affected by voice mode changes.

**Distinction from Voice Studio:** Text interview sends free-form user messages. Voice Studio sends "Ask Question X of Y" messages. `interview_chain.py` detects which mode by checking the message pattern.

### Module: Legacy Voice (`/voice`)

**Purpose:** Shows "Upgrading to AI Voice Studio" card. Redirects users to `/voice-studio`. Kept so old URLs don't 404.

---

## SECTION 4 — CRITICAL BUG HISTORY

### Issue 1: Voice interview blank screen (RESOLVED)
**Root cause:** `status="ended"` not included in render condition. `http://localhost:8001` hardcoded in 2 fetch calls. Error handler set `status="ended"` → blank screen.
**Fix:** Added `"ended"` to render conditions. Added `API_BASE` constant. Added error UI with health endpoint link.

### Issue 2: Q2 showing Q1 answer as question text (RESOLVED)
**Root cause:** Backend `/interview/chat` with full conversation history caused LLM to respond to Q1 answer ("That's a great initial question...") instead of asking Q2. History included the long Q1 answer text, LLM continued conversation.
**Fix:** `interview_chain.py` detects voice calls and sends question-only system prompt WITHOUT conversation history. System prompt strictly forbids feedback.

### Issue 3: Questions repeating same topic (RESOLVED)
**Root cause:** No memory of what was asked. LLM picked most prominent resume project (LexAI/LangGraph) repeatedly.
**Fix:** `coveredTopicsRef` in Voice Studio frontend. First 12 words of each question saved. Injected into next question prompt: "Topics already covered: Q1: '...'; Q2: '...'. Do NOT ask about these again."

### Issue 4: Answers not showing in Debrief (RESOLVED)
**Root cause:** `get_session_scores()` in `confidence_tracker.py` built the return dict without the `answer` field. The field was saved to ChromaDB correctly but never returned.
**Fix:** Added `"answer": meta.get("answer", "")` to the scores dict in `get_session_scores()`.

### Issue 5: Wrong question numbers in Debrief (RESOLVED)
**Root cause:** Voice Studio saves `question_index` as 1-based (newCount after increment). Debrief showed `ans.question_index + 1` making Q1 show as "Question 2".
**Fix:** Changed to `ans.question_index` directly. Added `.sort()` by `question_index` before rendering.

### Issue 6: Fake scores (always 65) (RESOLVED)
**Root cause:** Silent eval failure fallback returned `score: 65`. LLM prompt didn't have strict scoring rules.
**Fix:** `answer_eval.py` now: detects refusals/off-topic answers before LLM call (returns 0-5). Strict scoring rules in prompt. Fallback returns `score: 0` with `evalFailed: true`. Frontend checks `evalFailed` flag.

### Issue 7: Mic stops after 2-3 words (RESOLVED)
**Root cause:** `SpeechRecognition.continuous = false` stops mic on first natural pause.
**Fix:** `continuous = true` + 2.5-second silence timer. Timer resets on every new speech result. Only fires after sustained silence.

### Issue 8: Input field loses focus (RESOLVED)
**Root cause:** `Field` component defined inside parent component. React recreates on every state change → unmount + remount → loses focus.
**Fix:** Moved `Field` definition OUTSIDE the `export default function`.

### Issue 9: Hardcoded localhost:8001 (RESOLVED)
**Root cause:** Pages used hardcoded URL instead of env var.
**Fix:** `const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001"` at top of every page.

---

## SECTION 5 — KNOWN OPEN ISSUES

### ChromaDB persistence on Railway ❌
No persistent disk on free tier. Sessions lost on every redeploy. Workaround: complete full session without deploying. Fix: add Railway disk ($0.25/GB/month) or migrate to Pinecone.

### Voice interview on Railway cold start ⚠️
Railway sleeps after 15 min. Voice Studio pings `/health` on mount but if Railway is slow to wake (>30s), first question may timeout. Workaround: open health endpoint URL in browser first. Fix: Railway paid tier or cron keepalive.

### Roadmap `parseRoadmap()` fragile ❌
Breaks if Gemini doesn't return exact `WEEK X:` format. Needs more robust parser.

### No file size validation ❌
Large PDFs can timeout on embedding.

### No auth ❌
Single-user app. Anyone with the URL can access all sessions.

---

## SECTION 6 — HOW TO WORK WITH KOUSHIK

### Background
Senior QA Automation Engineer transitioning to AI Engineering. Intelligent, hardworking, learns fast. Not a beginner — explain clearly but don't oversimplify.

### Communication Style
- Direct and efficient. Don't pad with unnecessary pleasantry.
- Lead with fix, then explanation.
- PowerShell only, never bash or CMD.
- Downloadable files over copy-paste (U+00A0 encoding issues cause SyntaxErrors).
- Complete files only — never partial diffs or patches.
- One step at a time with confirmation before next step.

### Coding Conventions
- Always `API_BASE` not `localhost:8001`
- Always complete file replacements
- Windows backslash paths
- `$env:PYTHONIOENCODING="utf-8"` for emoji in terminal
- Venv is at `backend/venv/` → activate with `C:\Users\Azuro\careerapex\backend\venv\Scripts\Activate.ps1`

### After Every Fix
Map to interview talking point. Example:
> "For interviews: explain this as 'I implemented continuous speech recognition with a 2.5-second silence detection timer, replacing the default single-utterance mode to give candidates enough time to formulate complete answers.'"

---

## SECTION 7 — CRITICAL FILES — NEVER BREAK THESE

| File | Why Critical |
|---|---|
| `backend/main.py` | Registers all routers. Wrong import = 500 on all routes |
| `backend/chains/interview_chain.py` | Voice mode detection logic. Break this = Q2 shows answer as question |
| `backend/chains/confidence_tracker.py` | Must include `answer` field in `get_session_scores()`. Missing = Debrief shows empty answers |
| `backend/chains/answer_eval.py` | Honest scoring. Removing refusal detection = fake 65s back |
| `frontend/app/voice-studio/page.tsx` | Most complex page. `stoppedRef`, `continuous=true`, `coveredTopicsRef` all critical |
| `frontend/components/Sidebar.tsx` | Shared nav. Break this = break all pages |
| `frontend/lib/api.ts` | All API calls. Must use API_BASE |

---

## SECTION 8 — CHANGELOG

### June 18, 2026 — Voice Studio Sprint (v3.0)

**New: AI Voice Studio (`/voice-studio`)**
- Full rebuild of voice interview from scratch
- Alex (fixed interviewer name) asks 5 questions
- `continuous = true` + 2.5-second silence timer for proper listening
- `coveredTopicsRef` topic tracker prevents question repetition
- Scores hidden during interview (shown only in feedback)
- Per-question feedback with strengths + improvements
- Results auto-saved to `/tracker/save` for Debrief
- Session ID consistent throughout (setup → active → feedback → debrief)
- Full session ID displayed in feedback (not truncated), selectable for copy
- Railway keepalive ping on mount

**Voice mode in `interview_chain.py`**
- Detects voice calls by "Ask Question X of Y" pattern in message
- Question-only system prompt: strict rules, no feedback, no history
- Prevents LLM from responding to candidate's answer instead of asking next question

**Honest scoring in `answer_eval.py`**
- Refusal detection: "sorry I can't", "no I cannot" etc. → score 0-5 immediately
- Strict scoring rubric in LLM prompt (no more default 65)
- Fallback returns `score: 0` with `evalFailed: true` flag

**Debrief fixes**
- `confidence_tracker.py`: added missing `answer` field to `get_session_scores()`
- Debrief page: fixed question numbering (1-based, was +1), sorted by index, empty answer handled gracefully
- Auto-loads from `?session=` URL param (set by Voice Studio "View in Debrief")
- Session list shown for quick selection

**Legacy voice page**
- `/voice` replaced with "Upgrading to AI Voice Studio" redirect card
- Route kept alive so old links don't 404

**Sidebar**
- "Voice Interview" replaced with "AI Voice Studio" + green NEW badge
- `/voice` route removed from nav

### June 17-18, 2026 — Deployment Sprint (v2.0)

- Backend live on Railway, frontend live on Vercel
- Fixed hardcoded `localhost:8001` in 5 pages → `API_BASE`
- Fixed `Field` component inside parent (negotiate, linkedin) → focus bug
- Fixed Debrief hardcoded session ID → auto-load from memory
- Fixed Vercel Framework Preset (Other → Next.js)
- Fixed Railway domain port (8080 → 8001)
- Fixed Docker PORT expansion (array CMD → shell CMD)
- Added Docker Compose for local full-stack
- Added Kubernetes manifests for Minikube

### Earlier — CareerApex Development (v1.0)

- LLM migrations: Groq → direct Gemini → OpenRouter
- `get_llm()` helper pattern introduced
- Cache-first architecture for Skill Gaps/Memory/Roadmap
- React stale closure fix in voice interview (useRef pattern)
- Backend module naming conflict fixed (memory.py)
- LangSmith tracing integrated
- 82 passing tests

---

## APPENDIX A — VOICE STUDIO TECHNICAL DEEP-DIVE

### Why `continuous = true` + silence timer?

Chrome's Web Speech API in non-continuous mode stops recording after the first natural pause (1-2 seconds). For interview answers, users need time to think mid-sentence. The solution:

1. `continuous = true` — mic stays open indefinitely
2. Every `onresult` event (new speech detected) resets a 2.5-second timer
3. When the timer fires (2.5s of silence), `rec.stop()` is called
4. `rec.onend` fires → answer is processed

This lets users speak, pause to think, continue, pause again — the mic only stops when they've truly been silent for 2.5 full seconds.

### Why topic tracking works

The LLM gets a message like:
```
Ask Question 3 of 5. Two questions remaining. Base it on the resume and job description.
Topics already covered: Q1: "Hi Koushik, I'm Alex, a senior technical interviewer"; 
Q2: "Your resume mentions implementing LangGraph Corrective RAG with a 5-node". 
Do NOT ask about these topics again — pick a completely different aspect.
Keep it concise and direct.
```

The first 12 words of each previous question give enough context for the LLM to recognise what was covered without sending the full question text (saves tokens).

### Why voice mode strips history

Without history: LLM receives "Ask Question 2 of 5" → asks a question.
With history: LLM receives Q1 text + user's Q1 answer + "Ask Question 2" → responds to the answer first ("That's a great initial question!") before asking Q2, which then appears as the Q2 text.

The fix: for voice calls, only the system prompt + current instruction is sent. The system prompt already contains the full resume + JD context, so the LLM has everything it needs to ask relevant questions without conversation history.


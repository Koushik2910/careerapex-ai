# CAREERAPEX MASTER HANDOVER DOCUMENT
## Permanent Project Memory — For All Future Claude Chats
### Last Updated: June 2026 | Version 1.0

---

> **TO ANY FUTURE CLAUDE CHAT:**
> Read this entire document before responding to Koushik. After reading, you should behave as if you participated in this project from Day 1. Never ask for context that is already here. Never require re-explanation of architecture, decisions, or preferences. Jump straight to helping.

---

# SECTION 1 — USER PROFILE

## Who is Koushik Gattu?

**Full Name:** Koushik Gattu
**Location:** Hyderabad, India
**Current Company:** Azuro Technologies (client-embedded at Kroll)
**Job Title:** Senior QA Automation Engineer
**Total Experience:** ~4 years 8 months
**Current CTC:** 13.18 LPA
**GitHub:** https://github.com/Koushik2910
**Portfolio:** koushikgattu.lovable.app

## Career Background

Koushik started his career in QA automation. He has 5 years of experience in Selenium, Playwright, pytest, Azure DevOps, and enterprise test frameworks. He was embedded at Kroll (restructuring software company) through Azuro Technologies for most of his career.

In early 2026, Koushik identified that QA automation is being automated away by AI and made a strategic decision to transition into AI Engineering. He started learning LangChain, LangGraph, RAG, and agentic AI — and built production-grade AI projects to demonstrate these skills.

**Previous Companies:** Azuro Technologies (Kroll), ITSS Global, Temenos

## Technical Strengths
- Selenium, Playwright (Python + TypeScript), pytest, Azure DevOps
- Python scripting and automation
- API testing, CI/CD pipelines
- LangChain LCEL chains, LangGraph ReAct agents
- ChromaDB vector storage, HuggingFace embeddings
- FastAPI, Pydantic v2
- Next.js 14, React, TypeScript, Tailwind CSS
- Prompt engineering, structured output, JSON parsing
- LangSmith observability

## Technical Weaknesses (Self-Acknowledged)
- Limited cloud deployment experience (AWS/GCP/Azure production deploys)
- No LoRA/fine-tuning hands-on experience
- Limited experience with production-scale vector DBs (Pinecone at scale)
- No Kubernetes/Docker in production

## Learning Style
- Learns by BUILDING, not by reading theory
- Needs analogies — explains concepts like a 20-year-old graduate
- Prefers ONE step at a time with confirmation before proceeding
- Learns through mistakes — appreciates root cause explanations
- Keeps handwritten notes (AI Engineering Master Notes document)
- Likes real examples from CareerApex to anchor every concept

## Work Style
- Methodical and thorough
- Tests everything before moving on
- Screenshots errors and shares them — doesn't paste text errors unless asked
- Works on Windows 11, PowerShell, VS Code
- Kroll VDI (no internet) for day job; personal machine for AI projects
- Works late evenings and weekends on AI projects

## Preferred Communication Style
- **Direct and brief** — no motivational framing, no "great question!", no padding
- **One step at a time** — give a command, wait for confirmation, then next step
- **Always PowerShell syntax** — never bash unless explicitly asked
- **Full file paths** — never relative paths, always absolute
- **Complete files** — never partial edits, always full file content
- **Download files** — never copy-paste code (causes U+00A0 non-breaking space errors)
- **Tables for comparisons** — clear structure preferred over prose for decisions
- **No emojis** unless Koushik uses them first

## What Should Be AVOIDED
- Long motivational intros ("Great question! I'd be happy to help!")
- Partial code edits (must give full file always)
- Relative paths
- Bash commands on Windows
- Explaining things Koushik already knows (check memory first)
- Asking multiple questions at once
- Generic advice not tied to CareerApex specifics

---

# SECTION 2 — CAREER GOALS

## Current Salary
13.18 LPA at Azuro Technologies (embedded at Kroll)

## Target Salary
26 LPA by February 2027

## Target Roles
- AI Automation Engineer
- AI Application Engineer
- GenAI Engineer
- LLM Engineer
- AI Quality Engineer

**Preferred companies:** AI-first startups and product companies in Hyderabad (remote/hybrid preferred)

## Short-Term Goal (Next 3-6 months)
- Land an AI Engineer / GenAI Engineer role at 24+ LPA
- Complete portfolio with 3 production-grade AI projects
- Build strong GitHub presence with documented projects
- Get active on LinkedIn with AI content

## Long-Term Goal (1-2 years)
- Senior AI Engineer at a product company
- 35-40 LPA
- Specialise in agentic AI and RAG systems

## Why CareerApex Was Built
1. Personal use case — Koushik was applying to AI roles and wanted to analyse his own resume vs JDs
2. Demonstrate AI engineering skills (RAG, LangGraph, voice AI, caching, observability)
3. Most impressive portfolio project because it's production-grade, has 10 features, is tested, and observable
4. The project literally IS a career tool — using it to get the job that inspired it is a compelling interview story

## Job Search Strategy
- LinkedIn job applications (using Apify MCP scraper to find roles)
- Naukri profile updated
- GitHub profile showing working code (not just READMEs)
- CareerApex as lead project in all applications
- Target: roles with "LangChain", "RAG", "LLM", "AI Engineer" in JD

## AI Engineer Roadmap
Completed:
- LangChain Days 1-12 (LCEL, RAG, memory, agents, LangSmith)
- LexAI (Contract Intelligence Engine) — LangChain + hybrid search + CrossEncoder
- CareerApex AI — full AI career OS

Planned:
- Deployment on cloud (Vercel + Railway/Render)
- Add authentication to CareerApex
- Study LLM evaluation (RAGAS)
- Explore fine-tuning with LoRA

---

# SECTION 3 — CAREERAPEX PROJECT

## Complete Project Overview

**Name:** CareerApex AI
**Type:** AI Career Operating System
**Status:** Fully functional, running locally
**GitHub:** https://github.com/Koushik2910/careerapex-ai

**One-line description:** A production-grade AI Career Operating System that analyses resumes against job descriptions using RAG, conducts mock and voice interviews, tracks confidence scores, and generates personalised career strategies.

**Business Problem:** Job seekers don't know why they get rejected. They send the same resume everywhere, don't practice interviews systematically, and have no way to compare their skills against specific job requirements. CareerApex solves this by giving every user a personalised AI career coach that reads THEIR resume and THEIR JD.

## Architecture

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + custom CSS design system in `globals.css`
- **Animations:** Framer Motion
- **Charts:** Recharts
- **Voice:** Web Speech API (SpeechSynthesis + SpeechRecognition, browser-native)
- **Port:** 3000
- **Location:** `C:\Users\Azuro\careerapex\frontend\`

**Pages:**
- `/dashboard` — `frontend/app/dashboard/page.tsx`
- `/analyse` — `frontend/app/analyse/page.tsx`
- `/gaps` — `frontend/app/gaps/page.tsx`
- `/interview` — `frontend/app/interview/page.tsx`
- `/voice` — `frontend/app/voice/page.tsx`
- `/debrief` — `frontend/app/debrief/page.tsx`
- `/memory` — `frontend/app/memory/page.tsx`
- `/negotiate` — `frontend/app/negotiate/page.tsx`
- `/linkedin` — `frontend/app/linkedin/page.tsx`
- `/roadmap` — `frontend/app/roadmap/page.tsx`

**Design System (globals.css):**
- CSS custom properties: `--bg-base`, `--bg-surface`, `--bg-elevated`, `--bg-overlay`, `--bg-hover`
- Text: `--text-primary`, `--text-secondary`, `--text-tertiary`, `--text-disabled`
- Borders: `--border-default`, `--border-subtle`
- Accent: `#F59E0B` (amber/gold — primary brand colour)
- Success: `#10B981` (green)
- Error: `#EF4444` (red)
- Info: `#3B82F6` (blue)
- Utility classes: `.card`, `.card-accent`, `.btn`, `.btn-primary`, `.btn-ghost`, `.btn-danger`, `.badge`, `.badge-green`, `.badge-amber`, `.badge-red`, `.kpi-card`, `.progress-track`, `.progress-fill`, `.empty-state`, `.section-title`, `.section-header`

**Sidebar Groups:**
- WORKSPACE: Dashboard, Analyse, Skill Gaps
- PRACTICE: Interview, Voice Interview, Debrief
- TOOLS: Memory, Negotiate, LinkedIn, Roadmap

### Backend
- **Framework:** FastAPI
- **Language:** Python 3.11
- **Port:** 8001
- **Location:** `C:\Users\Azuro\careerapex\backend\`
- **Start command:** `cd C:\Users\Azuro\careerapex\backend && venv\Scripts\activate && uvicorn main:app --reload --port 8001`

**Routers** (`backend/routers/`):
- `upload.py` — `/upload/resume`, `/upload/jd`, `/upload/copy-resume`
- `analyse.py` — `/analyse/gaps/{session_id}`, `/analyse/questions/{session_id}`, `/analyse/evaluate`
- `interview.py` — `/interview/start`, `/interview/chat`, `/interview/cover-letter`
- `memory.py` — `/memory/save`, `/memory/session/{id}`, `/memory/sessions`, `/memory/search`, `/memory/progress`, `DELETE /memory/session/{id}`
- `tracker.py` — `/tracker/save`, `/tracker/scores/{id}`, `/tracker/summary/{id}`
- `negotiate.py` — `/negotiate/script`, `/negotiate/roleplay/start`, `/negotiate/roleplay/chat`
- `linkedin.py` — `/linkedin/optimize`, `/linkedin/headlines`
- `agent.py` — `/agent/chat`

**Chains** (`backend/chains/`):
- `gap_analyser.py` — resume vs JD gap analysis
- `question_gen.py` — interview question generation
- `answer_eval.py` — answer scoring 0-100
- `cover_letter.py` — personalised cover letter
- `interview_chain.py` — multi-turn interview conversation
- `negotiation.py` — salary negotiation scripts + roleplay
- `linkedin_optimizer.py` — LinkedIn headline/about optimisation

**All chains use `get_llm()` helper pattern:**
```python
def get_llm(temperature=0.3) -> ChatOpenAI:
    return ChatOpenAI(
        model="google/gemini-2.5-flash",
        openai_api_key=os.getenv("OPENROUTER_API_KEY"),
        openai_api_base="https://openrouter.ai/api/v1",
        temperature=temperature,
        default_headers={
            "HTTP-Referer": "https://careerapex.ai",
            "X-Title": "CareerApex AI"
        },
    )
```

**Agents** (`backend/agents/`):
- `career_agent.py` — LangGraph ReAct agent with 4 tools

**Memory** (`backend/memory/`):
- `session_store.py` — ChromaDB CRUD operations

### Database / Storage
- **Vector DB:** ChromaDB PersistentClient at `./chroma_store`
- **Collections:**
  - `resume_{session_id}` — resume chunk embeddings
  - `jd_{session_id}` — JD chunk embeddings
  - `career_memory` — session history (all analyses, scores, filenames)
- **Embeddings:** HuggingFace `all-MiniLM-L6-v2` (384 dimensions)
- **Similarity metric:** cosine

### LLM Stack
- **Primary:** `google/gemini-2.5-flash` via OpenRouter
- **API:** Uses `langchain-openai` ChatOpenAI with custom `openai_api_base="https://openrouter.ai/api/v1"`
- **Env var:** `OPENROUTER_API_KEY`
- **Migration history:** Groq (hit 100K tokens/day limit) → Gemini direct (20 req/day limit) → OpenRouter (current, generous limits)

### LangSmith Observability
```
LANGCHAIN_API_KEY=...
LANGCHAIN_TRACING_V2=true
LANGCHAIN_PROJECT=careerapex-ai
```
All chains and agents auto-traced.

### Session Management
- **Session ID format:** `session-{timestamp}-{6_random_chars}` e.g. `session-1781234567890-abc123`
- **Generated:** On first resume upload (or immediately when selecting a previous resume)
- **Used for:** ChromaDB collection names, memory storage key, interview context, tracker scores
- **Async safety:** Frontend uses `useRef` alongside `useState` for session_id and filenames — prevents stale closure bugs in async callbacks

### Caching Architecture (Cache-First)
- After gap analysis: full result JSON saved to `career_memory` as `analysis_data` field
- Skill Gaps page: reads `analysis_data` from session → zero LLM call
- Dashboard: reads from memory → zero LLM call
- Career Memory: reads from ChromaDB → zero LLM call
- Only these call LLM: Resume Analysis (once per session), Interview (per message), Voice Interview (per message), Debrief cover letter, Negotiation script, LinkedIn optimisation, Roadmap generation
- **Token savings:** ~60% reduction vs naive re-generation

### Voice Architecture
- **STT:** `SpeechRecognition` (Web Speech API, Chrome only)
- **TTS:** `SpeechSynthesis` (Web Speech API)
- **Interviewer:** "Alex" — fixed name, consistent voice (priority: Google US English → Microsoft David → Alex → any en-US)
- **Question limit:** Exactly 5 questions per session
- **Flow:** AI speaks → user answers → transcript sent to `/interview/chat` → AI evaluates + asks next
- **Audio leak prevention:** `stoppedRef = useRef(false)` — on unmount: cancel + abort all audio

### .env File (`backend/.env`)
```
OPENROUTER_API_KEY=your_key
LANGCHAIN_API_KEY=your_langsmith_key
LANGCHAIN_TRACING_V2=true
LANGCHAIN_PROJECT=careerapex-ai
```

---

# SECTION 4 — COMPLETE FEATURE INVENTORY

## Feature 1: Dashboard (`/dashboard`)

**Purpose:** Overview of career health — latest match score, answer score, session count, quick actions, recent sessions.

**Inputs:** None (reads from memory)

**Outputs:** KPI rings, quick action cards, recent sessions list

**Backend Flow:** `GET /memory/progress` → `GET /memory/sessions`

**Frontend Flow:** `useEffect` calls `getProgress()` + `getSessions()` in parallel. Auto-refreshes on `visibilitychange` event (when user navigates back). Also polls every 30 seconds.

**AI Components:** None — zero LLM calls

**Caching:** Reads from ChromaDB career_memory. All data from cached sessions.

**Known Issues:** Sessions count in progress summary uses `sessions_count` from progress API, not `sessions.length` — can diverge if sessions deleted manually.

**Future Improvements:** Real-time WebSocket updates, activity timeline, skill trend charts over time

---

## Feature 2: Resume Analysis (`/analyse`)

**Purpose:** Upload resume + JD → AI gap analysis with match score (0-100), skill gaps with priorities, strengths, recommendations.

**Inputs:** Resume PDF/DOCX, JD PDF/DOCX, session_id (auto-generated)

**Outputs:** match_score, skill_gaps[], strengths[], recommendations[], summary

**Backend Flow:**
1. `POST /upload/resume` — pypdf/python-docx text extraction → chunk → HuggingFace embed → ChromaDB `resume_{sid}`
2. `POST /upload/jd` — same process → ChromaDB `jd_{sid}`
3. `POST /analyse/gaps/{session_id}` — retrieve all chunks → join → truncate (6000+3000 chars) → LangChain chain → Gemini → JsonOutputParser → Pydantic validate
4. Auto-save to `career_memory` collection via `/memory/save`

**Frontend Flow:**
- Resume DropZone → uploads on file selection
- JD DropZone — enabled only after resume uploaded
- Previous Resume Dropdown — appears when sessions exist and resume zone is idle
  - Selecting generates NEW session_id immediately
  - Calls `/upload/copy-resume` to copy resume embeddings to new session
  - JD uploads to new session_id
  - Analysis uses new session_id (both resume + JD present)
- 6-step animated loader during analysis (StepLoader component)
- Auto-save to memory after analysis with `resumeFilenameRef.current` (not state — prevents stale closure)
- Green "Session saved to Career Memory" confirmation shown

**AI Components:**
- HuggingFace all-MiniLM-L6-v2 (embeddings)
- LangChain LCEL: `prompt | ChatOpenAI(temp=0.2) | JsonOutputParser(pydantic_object=GapAnalysisResult)`

**Caching:** Analysis result saved to ChromaDB. Subsequent Skill Gaps visits read from cache.

**Key Bug Fixed:** Stale closure — `resumeFilenameRef` and `sessionIdRef` (useRef) used in async callbacks instead of state

**Previous Resume Dropdown:**
- Deduplicates by `resume_filename` — shows unique resumes only (latest session per resume)
- Shows: filename, last used date, last match score
- Generates new session_id on selection (not at analysis time — that was the original bug)
- `/upload/copy-resume` endpoint copies ChromaDB chunks from old session to new session

**Pydantic Output Model:**
```python
class GapAnalysisResult(BaseModel):
    overall_match_score: int
    skill_gaps: List[SkillGap]  # {skill, required_level, current_level, gap_score, priority}
    strengths: List[str]
    recommendations: List[str]
    summary: str
```

**Known Issues:** None currently

**Future Improvements:** Multiple JD comparison, batch analysis, ATS keyword highlighting

---

## Feature 3: Skill Gap Analysis (`/gaps`)

**Purpose:** Visual breakdown of skill gaps from cached analysis — bar chart, progress bars, priority badges. Zero LLM calls.

**Inputs:** Session selected from dropdown

**Outputs:** Same data as Analysis page — match score, skill gaps chart, strengths, recommendations

**Backend Flow:** `GET /memory/sessions` → session selected → read `analysis_data` from session → no LLM

**Frontend Flow:**
- Session dropdown populated from `/memory/sessions`
- Dropdown shows: resume filename, JD filename, date, match score
- Selecting session: checks `session.analysis_data` → if exists, render immediately
- Fallback: calls `/analyse/gaps/{session_id}` only if no cached data
- Shows "Cached · No LLM call" badge
- Recharts BarChart for gap scores, animated progress bars via Framer Motion

**AI Components:** None — pure cache read

**Caching:** This IS the cache consumer. Relies on analysis_data saved during Resume Analysis.

**Known Issues:** If analysis was run before the cache-first update, `analysis_data` may be empty → falls back to LLM

**Future Improvements:** Skill gap trend over time (compare across sessions), downloadable report

---

## Feature 4: Mock Interview (`/interview`)

**Purpose:** AI conducts personalised mock interview using questions generated from user's actual resume and JD. Standard mode (supportive) and Resume Defense mode (challenging).

**Inputs:** session_id, mode (standard/defense), user answers

**Outputs:** AI questions, per-answer feedback, score

**Backend Flow:**
- `POST /interview/start` — generates first question using ChromaDB resume+JD context
- `POST /interview/chat` — multi-turn conversation, history passed each time
- Backend uses `interview_chain.py`: `SystemMessage(resume+JD context) + history + HumanMessage(answer)`

**Frontend Flow:**
- Mode selection (Standard / Defense)
- Session ID input
- Chat interface with typing animation on AI responses
- Each answer sent with full conversation history
- Score saved via `/tracker/save`

**AI Components:** LangChain LCEL interview chain (temp=0.5 for natural variation)

**Caching:** Resume/JD context retrieved from ChromaDB on each `/interview/start`. No LLM caching — every answer needs evaluation.

**Known Issues:** No question count limit in standard mock interview (only Voice Interview has 5-question limit)

**Future Improvements:** Add question count limit to mock interview too, topic-based question sets

---

## Feature 5: Voice Interview (`/voice`)

**Purpose:** Full voice-based mock interview. Alex (AI interviewer) speaks questions, user answers verbally, AI transcribes, evaluates, asks next question. Exactly 5 questions then feedback.

**Inputs:** session_id (required — loads resume+JD context), mode, voice

**Outputs:** 5 AI questions, 5 user answers, per-question scores and feedback, overall score

**Interviewer:** Alex (fixed name, consistent)
- Voice priority: Google US English → Microsoft David → Alex → any en-US
- Rate: 0.92, Pitch: 1.0, Volume: 1.0

**Question Flow:**
- Q1: Alex introduces himself and asks first question from resume+JD
- Q2-Q3: Follow-up questions from resume+JD
- Q4: "We have 2 questions remaining. [question]"
- Q5: "This is your final question. [question]"
- After Q5 answer: Alex gives closing statement → feedback screen appears automatically

**Backend Flow:**
- `POST /interview/chat` with `session_id`, message, history, mode, interviewer_name, max_questions, current_question_number
- Backend retrieves resume+JD from ChromaDB using session_id
- `POST /analyse/evaluate` for per-answer scoring

**Frontend State Machine:**
```
setup → processing → ai-speaking → listening → processing → ai-speaking → ...
                                                                        ↓ (after Q5)
                                                                    feedback
```

**Audio Leak Prevention:**
- `stoppedRef = useRef(false)`
- On End Session / unmount: `stoppedRef.current = true` + `window.speechSynthesis.cancel()` + `recognition.abort()`

**Feedback Screen:**
- Overall score (average of 5 question scores)
- Per-question card: question, user's answer, score/100, feedback
- "Practice Again with Alex" button → resets to setup
- "View Full Debrief" button → `/debrief`

**Chrome Only:** Web Speech API not supported in Firefox/Safari

**Known Issues:**
- "no-speech" errors if user is silent → Alex says "I didn't hear anything" and restarts recognition
- Voice selection depends on browser having voices loaded (uses `onvoiceschanged` callback)

**Future Improvements:** ElevenLabs for consistent voice quality, Whisper for better STT, visual waveform

---

## Feature 6: Interview Debrief (`/debrief`)

**Purpose:** Post-interview scorecard — score progression, category breakdown, cover letter generation.

**Inputs:** session_id

**Outputs:** avg_score, confidence_trend, category_breakdown, score_chart, cover_letter

**Backend Flow:**
- `GET /tracker/summary/{session_id}` — aggregates all saved answer scores
- `POST /interview/cover-letter` — generates cover letter (LLM call)

**Frontend Flow:**
- Score rings (SVG animated strokeDashoffset)
- Recharts LineChart (score over time), RadarChart (category breakdown)
- Cover letter generated on demand (not auto-generated)

**AI Components:** Cover letter chain (temp=0.6 for creative writing)

**Caching:** Tracker scores read from ChromaDB. Cover letter re-generated each time (no cache).

**Future Improvements:** Cache cover letter per session, export to DOCX, email to self

---

## Feature 7: Career Memory (`/memory`)

**Purpose:** Full session history with JD filename, resume filename, match scores, delete functionality, progress comparison.

**Inputs:** None (reads all sessions)

**Outputs:** Session list (newest first), session detail, progress summary

**Backend Flow:** `GET /memory/sessions` + `GET /memory/progress`

**Frontend Flow:**
- Progress summary card (total sessions, latest match, previous match, delta)
- Session list (left panel) — shows resume filename, JD filename, match score, date
- Session detail (right panel) — strengths tags, skill gap tags, score KPIs, session ID, date
- Delete: trash icon → confirmation modal → `DELETE /memory/session/{id}`
- Auto-refresh on `visibilitychange`
- Refresh button for manual refresh

**Session Storage Fields:**
```python
{
  session_id, resume_filename, jd_filename,
  match_score, questions_asked, avg_answer_score,
  timestamp, skill_gaps[], strengths[],
  analysis_data (full JSON), user_id
}
```

**Delete Flow:** `collection.delete(ids=[session_id])` in ChromaDB. Frontend updates local state.

**AI Components:** None

**Future Improvements:** Export session history, filter by date/score, bulk delete

---

## Feature 8: Salary Negotiation (`/negotiate`)

**Purpose:** Generate tactical negotiation script + practice with AI HR manager roleplay.

**Inputs:** current_offer, target_salary, role, company, experience, competing_offers, strengths

**Outputs:** Script with exact phrases, roleplay conversation

**Backend Flow:**
- `POST /negotiate/script` — generates script (temp=0.4 for precision)
- `POST /negotiate/roleplay/start` — AI plays HR manager at specific company
- `POST /negotiate/roleplay/chat` — multi-turn roleplay

**Frontend Flow:** Two tabs — Script Generator and Roleplay Chat

**AI Components:** Negotiation chain (temp=0.4 for scripts, 0.6 for roleplay)

**Future Improvements:** Industry-specific benchmarks, offer comparison tool

---

## Feature 9: LinkedIn Optimizer (`/linkedin`)

**Purpose:** Rewrite LinkedIn headline and About section with recruiter-optimised keywords.

**Inputs:** Current headline, current About section, session_id (for resume context)

**Outputs:** Optimised headline, 5 headline variants, optimised About section, keywords_added[], profile_strength_score, recommendations[]

**Backend Flow:**
- `POST /linkedin/optimize` — full profile analysis (LLM)
- `POST /linkedin/headlines` — 5 headline variants (LLM, temp=0.5)

**Frontend Flow:** Two tabs — Profile Optimizer and Headline Variants

**Pydantic Output:**
```python
class LinkedInResult(BaseModel):
    headline: HeadlineResult  # {original, optimized, improvements[], keywords_added[]}
    about: AboutResult
    skills_to_add: List[str]
    keywords: List[str]
    profile_strength_score: int
    recommendations: List[str]
```

**AI Components:** LinkedIn optimizer chain (temp=0.4)

**Caching:** No cache — regenerates each time. Future: cache per session.

---

## Feature 10: Career Roadmap (`/roadmap`)

**Purpose:** Week-by-week learning plan to close skill gaps and transition to target role.

**Inputs:** session_id (dropdown), target_role, timeframe (1/2/3 months)

**Outputs:** Weekly roadmap cards with tasks and resources, completion tracking

**Backend Flow:** `POST /agent/chat` — LangGraph career agent generates roadmap directly (instructed NOT to use tools)

**Frontend Flow:**
- Session dropdown (auto-selects latest session)
- Target role input, timeframe select
- Generate button → agent call
- `parseRoadmap()` splits on `WEEK \d+:` regex
- Expandable week cards with task checklist
- Progress bar: `completed.size / roadmap.length * 100`
- Checkboxes toggle completion state

**AI Components:** LangGraph career agent (roadmap prompt instructs: "Do not use tools. Write the roadmap directly.")

**Future Improvements:** Save roadmap to database, calendar integration, resource links

---

# SECTION 5 — COMPLETE AI KNOWLEDGE JOURNEY (Days 1-12)

## Day 1 — LLM Basics and Messages
**Concept:** `ChatOpenAI`, `HumanMessage`, `AIMessage`, `SystemMessage`, `.invoke()`
**Definition:** LangChain wraps all LLM APIs with a consistent interface. Messages are typed objects with roles.
**Why Learned:** Foundation of every AI call in the project
**Used in CareerApex:** Every chain and agent. Interview chain: `[SystemMessage(resume_context), ...history, HumanMessage(answer)]`
**Interview Answer:** "LangChain provides a consistent `.invoke()` interface across all LLM providers. Message types — System (instructions), Human (user), AI (model response) — form the structure of every LLM conversation."

## Day 2 — Prompt Templates
**Concept:** `ChatPromptTemplate.from_messages([...])` with `{variables}`
**Definition:** Reusable prompt templates with named placeholders filled at runtime
**Why Learned:** Separate structure from data — one template, many uses
**Used in CareerApex:** All 7 chains use ChatPromptTemplate. Gap analysis: `{resume_text}`, `{jd_text}` variables.
**Interview Answer:** "Prompt templates separate the prompt structure from runtime data. Variables are filled at `.invoke()` time, making prompts reusable, testable, and maintainable."

## Day 3 — Output Parsers
**Concept:** `JsonOutputParser(pydantic_object=Model)`, `StrOutputParser()`
**Definition:** Converts raw LLM string output into structured data (dict, list, typed objects)
**Why Learned:** Apps need data structures, not raw strings
**Used in CareerApex:** `JsonOutputParser(pydantic_object=GapAnalysisResult)` enforces schema in gap analysis and question generation
**Interview Answer:** "Output parsers transform LLM text into structured data. JsonOutputParser with Pydantic validates the schema — if LLM returns wrong types, it raises immediately rather than causing downstream bugs."

## Day 4 — LCEL (LangChain Expression Language)
**Concept:** Pipe operator `|` composing Runnables: `prompt | llm | parser`
**Definition:** Chain components together with `|`. Each is a Runnable with `.invoke()`, `.stream()`, `.batch()`
**Why Learned:** Clean, auto-streaming, auto-LangSmith-tracing, consistent interface
**Used in CareerApex:** All 7 chains. `chain = prompt | get_llm() | JsonOutputParser(...)` — one line is the entire pipeline
**Interview Answer:** "LCEL uses the pipe operator to compose Runnables. Auto-supports streaming, async, parallelisation, and LangSmith tracing. Every component is swappable."

## Day 5 — Memory and Conversation History
**Concept:** Passing full message history on every LLM call; LLMs are stateless
**Definition:** Maintain conversation context by passing all previous messages on each turn
**Why Learned:** Interview chains need multi-turn conversations
**Used in CareerApex:** Interview + negotiation roleplay: frontend maintains `messages[]` array, passed to backend on every request
**Interview Answer:** "LLMs are stateless — every call starts fresh. Conversation memory = pass full message history on every request. Frontend maintains the history array; backend prepends SystemMessage and appends new HumanMessage."

## Day 6 — Document Loaders and Text Splitters
**Concept:** `PyPDFLoader`, `RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)`
**Definition:** Extract text from files, split into embedding-sized chunks
**Why Learned:** Need to process uploaded resume and JD files
**Used in CareerApex:** `pypdf.PdfReader` for PDF, `python-docx` for DOCX. Manual extraction for control. ~500 token chunks.
**Interview Answer:** "Document loaders extract text; text splitters divide into chunks fitting embedding model limits. Overlap prevents context loss at boundaries. `RecursiveCharacterTextSplitter` splits on paragraphs→sentences→words."

## Day 7 — ChromaDB Vector Store
**Concept:** `PersistentClient`, `get_or_create_collection`, `upsert`, `query`
**Definition:** Open-source vector database with persistent storage, cosine similarity, metadata support
**Why Learned:** Need to store and retrieve resume/JD embeddings and session history
**Used in CareerApex:** Three collections. `upsert()` for no-duplicate sessions. `get()` for full document retrieval (not similarity — need ALL chunks).
**Interview Answer:** "ChromaDB `PersistentClient` stores to disk. `add()` stores, `upsert()` updates-or-inserts, `query()` does ANN similarity search. Metadata stored alongside embeddings for filtering and retrieval."

## Day 8 — RAG Pipeline End-to-End
**Concept:** Document → chunk → embed → vector store → retriever → LLM chain
**Definition:** Retrieval-Augmented Generation: search knowledge base → inject into prompt → generate grounded response
**Why Learned:** Core feature of CareerApex — personalised analysis from actual resume content
**Used in CareerApex:** Upload → chunk → embed → ChromaDB. Analysis → retrieve all chunks → join → inject → Gemini → parse
**Interview Answer:** "RAG pipeline: ingest (chunk→embed→store), query (embed→retrieve→inject→generate). LLM knowledge comes from retrieved documents, not training data — reduces hallucinations, enables personalisation."

## Day 9 — Conversational RAG
**Concept:** Combining RAG with conversation history; resolving ambiguous references before retrieval
**Definition:** Multi-turn conversations where the AI both remembers the conversation AND grounds answers in retrieved documents
**Why Learned:** Interview chain needs resume context AND conversation history
**Used in CareerApex:** Interview chain manually implements this — system prompt includes resume context, history passed each turn
**Interview Answer:** "`create_history_aware_retriever` rephrases ambiguous queries using conversation history before retrieval. Enables 'that' and 'it' references to work across turns."

## Day 10 — Hybrid Search and CrossEncoder
**Concept:** BM25 + vector search via `EnsembleRetriever`, CrossEncoder re-ranking
**Definition:** Combine keyword (exact) and semantic (meaning) search for best precision. Re-ranker scores pairs more accurately.
**Why Learned:** Better retrieval quality for contract analysis
**Used in CareerApex:** Implemented in LexAI (Contract Intelligence Engine). CareerApex uses vector-only search — hybrid is a future enhancement.
**Interview Answer:** "Hybrid combines BM25 (exact term frequency) with dense vector retrieval. RRF merges results. CrossEncoder re-ranks top-k pairs with full cross-attention — much more accurate than vector similarity alone."

## Day 11 — LangSmith Tracing
**Concept:** 3 env vars → auto-trace all chains and agents
**Definition:** Observability platform recording every LLM call — inputs, outputs, token counts, latency, cost per step
**Why Learned:** Production AI needs visibility — debugging without traces is guesswork
**Used in CareerApex:** All 3 env vars in `.env`. Every gap analysis and agent run visible in LangSmith dashboard with full trace.
**Interview Answer:** "LangSmith auto-traces when `LANGCHAIN_TRACING_V2=true`. Each trace shows full prompt, raw response, token count, latency, cost per step. Used to debug the Gemini content-list format issue."

## Day 12 — LangGraph Agents
**Concept:** `StateGraph`, nodes, conditional edges, `ToolNode`, `@tool` decorator, ReAct pattern
**Definition:** Graph-based framework for stateful multi-step AI workflows where the agent decides its own sequence of actions
**Why Learned:** Career agent needs to dynamically choose between gap analysis, questions, evaluation, and advice tools
**Used in CareerApex:** Career agent in `backend/agents/career_agent.py`. 4 tools. Agent → conditional edge → tools → back to agent.
**Interview Answer:** "LangGraph StateGraph: agent node runs LLM with bound tools → conditional edge (tool calls? → tools node, else END) → tools node executes → back to agent. TypedDict state flows and accumulates."

---

# SECTION 6 — IMPORTANT ARCHITECTURE DECISIONS

## LangChain chosen because:
- Largest ecosystem, most job postings mention it
- LCEL provides clean composable syntax
- Auto-LangSmith tracing
- 200+ integrations
- Rejected: LlamaIndex (RAG-only focus, fewer agent capabilities), Haystack (less Python-native)

## LangGraph chosen because:
- Official LangChain extension — same ecosystem
- Fine-grained control over agent state and transitions
- Conditional edges enable true agent behaviour
- Rejected: Crew AI (higher abstraction, less control), AutoGen (more complex setup)

## ChromaDB chosen because:
- Local/embedded — no external server needed
- Persistent to disk — survives restarts
- Strong LangChain integration
- Free, no API key needed
- Rejected: Pinecone (requires paid account for production), FAISS (in-memory only, needs custom persistence)
- **Future:** Move to Pinecone for multi-user production deployment

## OpenRouter chosen because:
- Groq was first choice (fast, free) but 100K token/day limit hit in 3 test runs
- Gemini direct tried next but 20 requests/day free tier is too restrictive
- OpenRouter: 300+ models, generous limits, one API key, OpenAI-compatible API format
- Migration was zero-cost architecturally: just change `ChatOpenAI` base_url and api_key

## Gemini 2.5 Flash chosen because:
- Cheap per token vs GPT-4o
- 1M token context window (no truncation concerns)
- Fast response time
- Good structured JSON output reliability
- GPT-4o rejected: higher cost, same tasks don't need complex reasoning

## Cache-First Architecture chosen because:
- Skill Gaps page called same LLM analysis as Analyse page — identical results, wasted tokens
- Users visit Skill Gaps 3-5x per session
- Solution: save full analysis_data JSON to ChromaDB after analysis, read from cache on all subsequent visits
- Result: ~60% token reduction across application

## useRef for async values (not useState) because:
- Bug found: resume_filename was empty string when saveToMemory async function executed
- Root cause: React closures capture state at render time, not execution time
- useRef is mutable — always reflects latest value regardless of when async function runs
- Applied to: sessionIdRef, resumeFilenameRef, jdFilenameRef

## Voice session ID generated at resume selection time (not analysis time) because:
- Bug: New session_id was generated at handleAnalyse() time
- JD had already been uploaded to OLD session_id
- Analysis used NEW session_id — "No JD found" error
- Fix: Generate new session_id immediately when user selects previous resume from dropdown
- JD upload then uses the correct new session_id

## Alex as fixed interviewer name because:
- "I'm [Your Name]" looked unprofessional and broken
- Fixed name creates consistent brand identity
- Same voice settings every time creates reliability
- Users relate better to a named interviewer

## 5-question limit on Voice Interview because:
- No limit = sessions ran indefinitely, no natural ending
- Users don't know when it will end
- 5 questions is enough for meaningful practice (~15-20 minutes)
- Warning at Q4 and Q5 prepares user
- Auto-feedback after Q5 completes the loop professionally

## Memory.py naming (not memory_router.py) because:
- `main.py` imports: `from routers.memory import router as memory_router`
- File MUST be named `memory.py` in the routers folder
- If named `memory_router.py`, FastAPI crashes with `ModuleNotFoundError: No module named 'routers.memory'`

## Pydantic for all LLM output because:
- Type safety: if LLM returns `gap_score: "high"` (string) instead of int, Pydantic catches it immediately
- Better than debugging a downstream crash
- Self-documenting: the Pydantic model IS the API contract

---

# SECTION 7 — CURRENT PROJECT STATUS

## Completed ✅
- Dashboard (auto-refresh, KPI rings, recent sessions)
- Resume Analyser (upload zones, 6-step loader, auto-save, previous resume dropdown)
- Skill Gap Analysis (session dropdown, cache-first, bar chart, progress bars)
- Mock Interview (standard + defense mode, multi-turn conversation)
- Voice Interview (Alex interviewer, 5-question limit, feedback screen, stoppedRef pattern)
- Interview Debrief (score charts, cover letter)
- Career Memory (full session list, JD filename, delete with confirmation, progress summary)
- Salary Negotiation (script + roleplay)
- LinkedIn Optimizer (profile + headline variants)
- Career Roadmap (session dropdown, week cards, completion tracking)
- Career Agent (LangGraph ReAct, 4 tools)
- LangSmith tracing on all chains
- Cache-first architecture (~60% token reduction)
- QA test suite (82 tests, zero LLM calls)
- README.md
- J1 Resume Handover Document
- AI Engineering Master Notes (864 lines)
- CareerApex Master Handover (this document)
- GitHub: https://github.com/Koushik2910/careerapex-ai

## Partially Completed ⚠️
- Tests: 82 passing, 3 xfailing (known acceptable failures):
  - `test_upload_no_file_returns_422` — backend closes connection instead of 422
  - `test_upload_tiny_invalid_pdf` — backend closes connection
  - `test_evaluate_with_empty_question` — times out (hits LLM path)
- Interview Debrief: charts work but cover letter not cached per session
- Roadmap: completion state not persisted (resets on page refresh)

## Still Needs Work 🔧
- Authentication (currently single-user, no login)
- Cloud deployment (currently localhost only)
- Custom domain and SSL
- Roadmap progress persistence to database
- Session search feature (semantic search button exists in backend, not exposed in UI)
- Mobile-responsive design (desktop only currently)

## Known Bugs
1. **ChromaDB upsert and session count:** Deleting a session then re-running analysis can cause ChromaDB count to diverge from UI count in rare cases. Refresh fixes it.
2. **Voice Interview "no-speech":** If user is silent for too long, recognition ends and Alex re-prompts. Occasional double-prompt if network is slow.
3. **Roadmap parse:** If Gemini doesn't use `WEEK X:` format exactly, `parseRoadmap()` falls back to single block. Works but less structured.
4. **Previous Resume Dropdown copy-resume:** If `/upload/copy-resume` endpoint doesn't exist in `upload.py`, falls back to original session. Must paste the endpoint code from `upload_router_addition.py`.

## Technical Debt
- All 7 chain files duplicate `get_llm()` — should move to shared `backend/utils/llm.py`
- Error handling in chains is minimal — needs retry logic with tenacity
- No input sanitisation on upload endpoints (file size limit, MIME type validation)
- No rate limiting on LLM endpoints (single user currently, no issue)
- Test fixtures use hardcoded PDF paths — need dynamic generation

---

# SECTION 8 — RESPONSE STYLE (How Claude Should Respond to Koushik)

## Tone
- Direct and professional
- No filler words, no motivational preamble
- No "Great question!", "Happy to help!", "Let me know if you need anything!"
- Treat Koushik as a capable engineer, not a student

## Level of Detail
- Give exactly what was asked — not less, not more
- If writing code: full file, never partial
- If giving commands: PowerShell syntax, full absolute paths, copy-paste ready
- If explaining: use analogies first, then technical explanation

## Preferred Explanation Style
- **Analogy first, then technical** — always anchor abstract concepts to something physical
- **CareerApex example** — if the concept is used in CareerApex, reference it
- **Simple English** — explain like teaching a 20-year-old graduate
- **No jargon without definition**

## Preferred Learning Style
- Show working code before explaining theory
- Explain WHY before HOW
- One concept at a time, confirm understanding before moving on

## Interview Preparation Style
- Provide CareerApex-specific answers, not generic answers
- Format: Question → CareerApex answer → what to emphasise
- Include code snippets where they strengthen the answer
- Don't give 10 interview Q&As at once — 5 at a time max

## Project Planning Style
- List tasks in order
- One step at a time — provide step, wait for confirmation
- If multiple files need changes, provide them all in one zip
- Always specify exact file paths

## Career Guidance Style
- Direct advice — "Do X because Y" not "You might consider X"
- Reference target salary (26 LPA) and target role (AI Engineer) in advice
- Remind Koushik of his strengths (QA background = testable, observable AI)

## Coding Guidance Style
- Full files only — never `// ... rest of code`
- Windows PowerShell for all commands
- Absolute paths always (`C:\Users\Azuro\careerapex\...`)
- Download files (no copy-paste — causes U+00A0 non-breaking space encoding errors)
- Confirm before proceeding to next step

---

# SECTION 9 — RESUME AND LINKEDIN CONTEXT

## Professional Summary (Approved by Koushik, Use Verbatim)
"Senior QA Automation Engineer with 5 years of production experience at Kroll, ITSS Global, and Temenos — now shipping production-grade AI applications."

**Note:** Salary mentions explicitly rejected. Transition language ("transitioning into") rejected — positions as already doing AI engineering.

## Company Naming Rules
- "Azuro Technologies (Kroll)" — not just "Azuro" or just "Kroll"
- Role at Kroll: "Kroll Restructuring Application" (not "client work" or "embedded contractor")

## Top 4 Resume Bullets (CareerApex)
1. "Built CareerApex AI, a production-grade AI Career Operating System using LangChain LCEL, LangGraph ReAct agents, ChromaDB RAG, and Gemini 2.5 Flash via OpenRouter — featuring resume gap analysis, mock interviews, voice I/O, salary negotiation roleplay, and career memory with session persistence."
2. "Engineered a cache-first RAG pipeline that embeds resume/JD documents with HuggingFace `all-MiniLM-L6-v2`, stores structured analysis results in ChromaDB, and serves Skill Gap Analysis with zero LLM re-calls — reducing token consumption by ~60% vs naive re-generation."
3. "Designed a LangGraph ReAct career agent with 4 custom tools (gap analysis, question generation, answer evaluation, career advice), implementing structured JSON output via Pydantic, multi-turn conversation history management, and full LangSmith tracing for production observability."
4. "Delivered full-stack AI application (Next.js 14 + FastAPI + Python) with 82 automated Playwright + pytest tests (zero LLM calls in test suite), LangSmith observability, and multi-provider LLM migration (Groq → Gemini → OpenRouter) with single-file configuration change pattern."

## Top 10 ATS Keywords
LangChain, LangGraph, Retrieval-Augmented Generation (RAG), ChromaDB, LLM Application Development, FastAPI, Prompt Engineering, Vector Embeddings, AI Agent Development, LangSmith

## LinkedIn About Section (Use This)
"I'm a Senior QA Automation Engineer transitioning into AI Engineering — building production-grade AI applications that go beyond tutorials.

My flagship project is CareerApex AI — a full AI Career Operating System I built end-to-end using LangChain, LangGraph, ChromaDB RAG, and Gemini 2.5 Flash. It performs resume gap analysis, conducts voice mock interviews, tracks confidence scores, and generates salary negotiation strategies — all personalised to the user's actual resume and JD.

What I bring to AI engineering roles:
• RAG pipelines — document ingestion, HuggingFace embeddings, ChromaDB vector storage, cache-first retrieval
• LangGraph agents — ReAct pattern, tool binding, multi-turn conversation management
• Production mindset — 82 automated tests, LangSmith observability, structured Pydantic output, LLM provider migration
• Full-stack delivery — FastAPI backends, Next.js frontends, prompt engineering, token optimization

5 years of QA automation (Selenium, Playwright, pytest, Azure DevOps) means I build AI that is observable, testable, and reliable — not just a demo.

Open to: AI Automation Engineer · AI Application Engineer · GenAI Engineer · LLM Engineer (Hyderabad, remote/hybrid)"

## 30-Second Verbal Pitch
"I built CareerApex AI — a full AI Career Operating System. Users upload their resume and a job description. A LangChain RAG pipeline embeds both using HuggingFace embeddings, stores in ChromaDB, then runs through Gemini 2.5 Flash to produce a gap analysis with match score and prioritised skill gaps. Sessions are cached so Skill Gaps loads with zero LLM calls. There's also a LangGraph ReAct agent, voice interview with a fixed AI interviewer named Alex, confidence tracking, and 82 automated tests. Full LangSmith observability on every chain."

---

# SECTION 10 — NEW CHAT INSTRUCTIONS

## Direct Instructions to Future Claude Chats

**READ THIS BEFORE RESPONDING.**

You are continuing an ongoing AI engineering project with Koushik Gattu. You have full context from this document. Act accordingly.

### What You Know
- Koushik is a Senior QA Engineer transitioning to AI Engineering
- His main project is CareerApex AI — a full AI Career OS running at localhost:3000 (frontend) and localhost:8001 (backend)
- The project is at `C:\Users\Azuro\careerapex\`
- He uses Windows 11, PowerShell, VS Code
- All AI work on his personal machine (username: Azuro)
- Kroll work on VDI (username: Koushik.Gattu, no internet)

### How to Respond
1. **Never ask for context already in this document** — you have it
2. **Never give partial code** — always full files
3. **Always PowerShell syntax** — never bash
4. **Always absolute paths** — `C:\Users\Azuro\careerapex\...`
5. **One step at a time** — command → wait → confirm → next
6. **Zip files for download** — never ask to copy-paste code
7. **Direct and brief** — no motivational preamble
8. **Use CareerApex examples** — when explaining AI concepts, anchor to CareerApex

### Start Commands (Always Available)
```cmd
# Backend
cd C:\Users\Azuro\careerapex\backend
venv\Scripts\activate
uvicorn main:app --reload --port 8001

# Frontend
cd C:\Users\Azuro\careerapex\frontend
npm run dev

# URLs
App: http://localhost:3000
API: http://localhost:8001/docs
LangSmith: https://smith.langchain.com
```

### When Koushik Asks for Code Changes
1. Identify the exact file(s) to change
2. Write complete file(s) — never partial
3. Create a zip with all changed files
4. Give PowerShell copy commands with absolute paths
5. State which services need restart (backend vs frontend)

### When Koushik Asks About AI Concepts
1. Start with a simple analogy
2. Give the technical definition
3. Show how it's used in CareerApex specifically
4. Give the interview answer version

### When Koushik Asks About Career/Resume
1. Reference his target (26 LPA, AI Engineer roles)
2. Use the approved professional summary verbatim
3. Reference CareerApex as the lead project
4. Keep "Azuro Technologies (Kroll)" naming convention

### When Koushik Reports a Bug
1. Look at the screenshot carefully
2. Identify root cause before suggesting fix
3. Explain the root cause in one sentence
4. Provide the fix as a complete file in a zip

### Key Files Quick Reference
```
Frontend pages:    C:\Users\Azuro\careerapex\frontend\app\{page}\page.tsx
Backend routers:   C:\Users\Azuro\careerapex\backend\routers\{router}.py
Backend chains:    C:\Users\Azuro\careerapex\backend\chains\{chain}.py
Backend agent:     C:\Users\Azuro\careerapex\backend\agents\career_agent.py
Session store:     C:\Users\Azuro\careerapex\backend\memory\session_store.py
Main entry:        C:\Users\Azuro\careerapex\backend\main.py
API utils:         C:\Users\Azuro\careerapex\frontend\lib\api.ts
Utils:             C:\Users\Azuro\careerapex\frontend\lib\utils.ts
Sidebar:           C:\Users\Azuro\careerapex\frontend\components\Sidebar.tsx
Globals CSS:       C:\Users\Azuro\careerapex\frontend\app\globals.css
Env file:          C:\Users\Azuro\careerapex\backend\.env
```

### Important Gotchas (Know These)
1. Memory router must be `memory.py` not `memory_router.py` — main.py imports `from routers.memory`
2. Gemini via OpenRouter returns content as list `[{"type": "text", "text": "..."}]` — need isinstance guard
3. Voice audio leak — always use stoppedRef pattern on Voice page
4. Stale closure — always use useRef alongside useState for values used in async callbacks
5. Copy-paste from Claude chat causes U+00A0 non-breaking space errors — always download files
6. New session_id for resume reuse must be generated at SELECTION time, not analysis time
7. `$env:PYTHONIOENCODING="utf-8"` if emoji rendering issues in PowerShell
8. MySQL service name is `MySQL97` (for other projects, not CareerApex)

---

*End of CAREERAPEX_MASTER_HANDOVER.md*
*This document is the single source of truth for all future Claude chats on the CareerApex project.*
*Koushik Gattu | June 2026*

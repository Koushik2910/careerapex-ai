# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CareerApex AI is a full-stack AI career coaching platform. Users upload a resume + job description, and the system provides skill gap analysis, mock interview sessions (with scoring and feedback), cover letter generation, salary negotiation scripts, and LinkedIn optimization — all powered by an LLM backend.

## Running the Project

**Backend** (FastAPI, Python — from `backend/`):
```
uvicorn main:app --reload --port 8001
```
Requires a `backend/.env` with `GROQ_API_KEY`, `LANGCHAIN_API_KEY`, `LANGCHAIN_TRACING_V2=true`, `LANGCHAIN_PROJECT`.

**Frontend** (Next.js — from `frontend/`):
```
npm run dev      # dev server on port 3000
npm run build    # production build
npm run lint     # ESLint
```
Requires `frontend/.env.local` with `NEXT_PUBLIC_API_URL=http://localhost:8001`.

## Architecture

```
frontend/ (Next.js 16 App Router, React 19, Tailwind 4, TypeScript)
    └── calls →
backend/ (FastAPI, Python)
    ├── chains/     ← LangChain prompt chains (gap analysis, question gen, answer eval, etc.)
    ├── agents/     ← LangGraph agentic workflow (career_agent.py — tool-calling orchestrator)
    ├── routers/    ← FastAPI route handlers (one per feature domain)
    ├── rag/        ← ChromaDB singleton client
    ├── memory/     ← Session persistence (ChromaDB-backed)
    └── models/     ← Pydantic request/response schemas
```

### Data Flow

1. **Upload** — Resume/JD files are parsed (pypdf/python-docx), chunked with `RecursiveCharacterTextSplitter` (size=500, overlap=50), embedded with `all-MiniLM-L6-v2`, and stored in ChromaDB collections keyed by `session_id`.
2. **Analyse** — Gap analysis, question generation, and answer evaluation are LangChain chains that retrieve relevant chunks from ChromaDB and call the Groq LLM (`llama-3.3-70b-versatile`).
3. **Interview/Agent** — LangGraph agent in `agents/career_agent.py` binds tools (gap analysis, question gen, evaluation, career advice) and orchestrates multi-step reasoning.
4. **Session** — All state is tied to a UUID `session_id`. Sessions are stored in ChromaDB collection `career_memory` with metadata (match_score, skill_gaps, strengths). No SQL/relational database is used.

### Frontend Structure

- `app/` — Page-level route components (App Router); each subdirectory is a feature route (`/analyse`, `/interview`, `/negotiate`, `/linkedin`, `/memory`, etc.)
- `components/Sidebar.tsx` — Fixed navigation sidebar
- `lib/api.ts` — Typed REST API client; all backend calls go through here
- `lib/utils.ts` — Session ID generation, score formatting, color mapping

### Backend Structure

Each feature maps to a router + chain pair:
| Feature | Router | Chain |
|---|---|---|
| Resume/JD upload | `routers/upload.py` | (direct ChromaDB) |
| Skill gap analysis | `routers/analyse.py` | `chains/gap_analyser.py` |
| Interview questions | `routers/analyse.py` | `chains/question_gen.py` |
| Answer evaluation | `routers/analyse.py` | `chains/answer_eval.py` |
| Mock interview chat | `routers/interview.py` | `chains/interview_chain.py` |
| Cover letter | `routers/interview.py` | `chains/cover_letter.py` |
| AI career agent | `routers/agent.py` | `agents/career_agent.py` |
| Session memory | `routers/memory.py` | `memory/session_store.py` |
| Salary negotiation | `routers/negotiate.py` | `chains/negotiation.py` |
| LinkedIn optimize | `routers/linkedin.py` | `chains/linkedin_optimizer.py` |
| Answer tracking | `routers/tracker.py` | `chains/confidence_tracker.py` |

## Key Constraints

- **Next.js 16 breaking changes** — See `frontend/AGENTS.md`. The app uses the App Router exclusively; no Pages Router.
- **No authentication** — App is single-user; no auth middleware exists anywhere.
- **ChromaDB is the only datastore** — All sessions, embeddings, and memory live in `backend/chroma_store/`. No migrations, no SQL.
- **LLM model** — Groq `llama-3.3-70b-versatile` is hardcoded in chains. Changing it requires updating each chain file individually.
- **Port binding** — Backend must run on 8001 to match the frontend's `NEXT_PUBLIC_API_URL`.
- **Path alias** — Frontend uses `@/*` to reference files from the `frontend/` root (configured in `tsconfig.json`).

# CareerApex AI — AI Career Operating System

<div align="center">

![CareerApex](https://img.shields.io/badge/CareerApex-AI%20Career%20OS-F59E0B?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?style=for-the-badge&logo=fastapi)
![LangChain](https://img.shields.io/badge/LangChain-0.2-1C3C3C?style=for-the-badge)
![LangGraph](https://img.shields.io/badge/LangGraph-ReAct-4B0082?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)

**A production-grade AI-powered career coaching platform built with LangChain, LangGraph, ChromaDB, and Gemini 2.5 Flash via OpenRouter.**

🌐 **Live:** [careerapex-ai.vercel.app](https://careerapex-ai.vercel.app) · [GitHub](https://github.com/Koushik2910/careerapex-ai)

[Features](#features) · [Architecture](#architecture) · [Setup](#setup) · [API Docs](#api-docs) · [Testing](#testing)

</div>

---

## Overview

CareerApex AI is a full-stack AI Career Operating System that helps job seekers:

- Analyse their resume against job descriptions using RAG-powered gap analysis
- Practice mock interviews (text or voice) with AI that asks targeted questions from their actual resume
- Track confidence and performance across multiple interview sessions
- Generate salary negotiation scripts and practice with an AI HR roleplay
- Optimise their LinkedIn profile and generate targeted headlines
- Build personalised career roadmaps to close skill gaps

Built as a portfolio project demonstrating production-grade AI engineering with LangChain, LangGraph agents, ChromaDB vector storage, HuggingFace embeddings, and LangSmith observability.

---

## Features

| Feature | Description |
|---|---|
| **Resume Analysis** | Upload resume + JD → AI gap analysis with match score, skill gaps, strengths, recommendations |
| **Skill Gap Analysis** | Visual bar chart + progress bars, cache-first (zero LLM re-calls) |
| **Mock Interview** | Text-based — Standard mode + Resume Defense mode with AI feedback after each answer |
| **AI Voice Studio** | Full voice I/O — Alex (AI interviewer) speaks questions, listens via Web Speech API, evaluates answers with honest scoring, tracks topics to avoid repeating questions |
| **Interview Debrief** | Confidence tracking, score progression charts, radar charts, per-answer feedback, cover letter generation — powered by cached tracker data (no LLM calls) |
| **Career Memory** | Session history with JD filename tracking, delete with confirmation, progress comparison |
| **Salary Negotiation** | Script generation + HR roleplay with AI manager |
| **LinkedIn Optimizer** | Profile strength score, optimised headline/about, keyword recommendations |
| **Career Roadmap** | Week-by-week learning plan with task tracking and completion percentage |
| **Career Agent** | LangGraph ReAct agent with 4 tools: gap analysis, questions, evaluation, advice |

---

## Architecture

```
careerapex/
├── backend/                    # FastAPI backend
│   ├── main.py                 # App entry point, CORS, router registration
│   ├── routers/
│   │   ├── upload.py           # Resume + JD upload, ChromaDB indexing, copy-resume endpoint
│   │   ├── analyse.py          # Gap analysis, question generation, answer eval
│   │   ├── interview.py        # Mock interview + cover letter
│   │   ├── memory.py           # Session CRUD + progress tracking
│   │   ├── tracker.py          # Confidence score tracking (used by Debrief)
│   │   ├── negotiate.py        # Salary negotiation + roleplay
│   │   ├── linkedin.py         # LinkedIn profile optimizer
│   │   └── agent.py            # LangGraph career agent
│   ├── chains/
│   │   ├── gap_analyser.py     # LangChain LCEL gap analysis chain
│   │   ├── question_gen.py     # Interview question generation
│   │   ├── answer_eval.py      # Answer evaluation + honest scoring (refusal detection)
│   │   ├── cover_letter.py     # Cover letter generation
│   │   ├── interview_chain.py  # Mock interview (text) + voice interview (question-only mode)
│   │   ├── negotiation.py      # Salary negotiation chains
│   │   ├── confidence_tracker.py # Per-answer score storage + summary (includes answer field)
│   │   └── linkedin_optimizer.py
│   ├── agents/
│   │   └── career_agent.py     # LangGraph ReAct agent
│   ├── memory/
│   │   └── session_store.py    # ChromaDB session persistence
│   └── rag/
│       └── chroma_client.py    # ChromaDB vector store client
│
├── frontend/                   # Next.js 16 App Router frontend
│   ├── app/
│   │   ├── dashboard/          # Career dashboard with KPI rings
│   │   ├── analyse/            # Resume + JD upload with step loader + resume history dropdown
│   │   ├── gaps/               # Skill gap visual analysis (cache-first)
│   │   ├── interview/          # Text-based mock interview chat
│   │   ├── voice/              # Legacy voice page (redirects to AI Voice Studio)
│   │   ├── voice-studio/       # AI Voice Studio — full voice interview with Alex
│   │   ├── debrief/            # Interview debrief + charts (reads from tracker, no LLM)
│   │   ├── memory/             # Session history + delete
│   │   ├── negotiate/          # Salary negotiation
│   │   ├── linkedin/           # LinkedIn optimizer
│   │   └── roadmap/            # Career roadmap tracker
│   └── components/
│       └── Sidebar.tsx         # Navigation sidebar (includes AI Voice Studio with NEW badge)
│
└── tests/                      # Pytest + Playwright test suite
    ├── tests/api/              # API contract tests (zero LLM calls)
    ├── tests/ui/               # Playwright UI tests
    ├── tests/e2e/              # End-to-end journey tests
    └── security/               # Security boundary tests
```

### Tech Stack

| Layer | Technology |
|---|---|
| **LLM** | Gemini 2.5 Flash via OpenRouter |
| **Agent Framework** | LangGraph ReAct |
| **Chain Framework** | LangChain LCEL |
| **Embeddings** | HuggingFace `all-MiniLM-L6-v2` |
| **Vector DB** | ChromaDB (persistent) |
| **Observability** | LangSmith tracing |
| **Backend** | FastAPI + Uvicorn |
| **Frontend** | Next.js 16, TypeScript, Tailwind CSS |
| **Animations** | Framer Motion |
| **Charts** | Recharts |
| **Voice** | Web Speech API (browser-native, Chrome only) |
| **Testing** | Pytest + Playwright |

---

## Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- OpenRouter API key (https://openrouter.ai)
- LangSmith API key (https://smith.langchain.com) — optional

### 1. Clone the repository

```bash
git clone https://github.com/Koushik2910/careerapex-ai.git
cd careerapex-ai
```

### 2. Backend setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

pip install -r requirements.txt
```

Create `backend/.env`:

```env
OPENROUTER_API_KEY=your_openrouter_key_here
LANGCHAIN_API_KEY=your_langsmith_key_here
LANGCHAIN_TRACING_V2=true
LANGCHAIN_PROJECT=careerapex-ai
```

Start backend:

```bash
uvicorn main:app --reload --port 8001
```

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

### 4. Open the app

| URL | Purpose |
|---|---|
| http://localhost:3000 | CareerApex frontend |
| http://localhost:8001/docs | FastAPI Swagger UI |
| https://smith.langchain.com | LangSmith traces |

---

## Usage

### Quick Start

1. **Analyse** → Upload resume PDF + JD → Run Gap Analysis → copy session ID
2. **AI Voice Studio** → Paste session ID → Alex asks 5 questions → speak your answers → get detailed feedback
3. **Debrief** → Paste same session ID → view per-answer breakdown, charts, cover letter
4. **Skill Gaps** → Select session from dropdown → cached results, zero LLM calls
5. **Interview** → Text-based mock interview with the same session ID

### AI Voice Studio Flow

```
Setup screen → enter session ID → Start Interview with Alex
  → Alex introduces himself and asks Q1 (based on your resume)
  → Mic turns green → speak your answer (2.5s silence = done)
  → Processing → Alex asks Q2 (different topic, never repeats)
  → Repeat for Q3, Q4, Q5
  → Feedback screen → per-question scores, feedback, strengths, improvements
  → "View in Debrief" → full scorecard with charts
```

**Key behaviours:**
- Scores hidden during interview (no pressure)
- 2.5-second silence detection before processing answer
- Topic tracker prevents repeat questions across all 5 rounds
- Results auto-saved to Debrief via `/tracker/save`
- Session ID stays consistent throughout — same ID works in Debrief

---

## API Docs

Full Swagger UI available at http://localhost:8001/docs

### Key Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/upload/resume` | Upload + embed resume |
| `POST` | `/upload/jd` | Upload + embed JD |
| `POST` | `/upload/copy-resume` | Copy resume embeddings across sessions |
| `POST` | `/analyse/gaps/{session_id}` | Run gap analysis |
| `POST` | `/analyse/evaluate` | Evaluate answer with honest scoring |
| `POST` | `/interview/chat` | Mock interview (text + voice question mode) |
| `POST` | `/tracker/save` | Save per-answer score (used by Voice Studio) |
| `GET` | `/tracker/summary/{session_id}` | Full debrief data (cached, no LLM) |
| `GET` | `/memory/sessions` | List all sessions |
| `DELETE` | `/memory/session/{id}` | Delete session |
| `POST` | `/agent/chat` | Career agent (LangGraph) |

---

## Testing

```bash
cd tests
pip install -r requirements_test.txt
playwright install chromium

# Run all tests
pytest tests/ security/ -v --html=reports/html/report.html

# API tests only (zero LLM calls)
pytest tests/api/ -v

# UI tests only
pytest tests/ui/ -v --headed
```

---

## Cache-First Architecture

| Page | LLM Calls |
|---|---|
| Dashboard | ❌ Zero |
| Skill Gaps | ❌ Zero (reads cached analysis) |
| Career Memory | ❌ Zero |
| Interview Debrief | ❌ Zero (reads cached tracker data) |
| Resume Analysis | ✅ Once per session |
| Mock Interview | ✅ Per message |
| AI Voice Studio | ✅ Per question + per answer eval |
| Negotiation | ✅ Per generation |
| LinkedIn | ✅ Per generation |
| Roadmap | ✅ Per generation |

---

## Deployment

| Layer | Platform | URL |
|---|---|---|
| Frontend | Vercel | https://careerapex-ai.vercel.app |
| Backend | Railway | https://careerapex-ai-production.up.railway.app |

See `DEPLOYMENT_GUIDE.md` for full deployment instructions.

---

## License

MIT License — free to use, modify, and distribute.

---

<div align="center">
Built by <strong>Koushik Gattu</strong> · Senior QA Automation Engineer → AI Engineer
<br/>
<a href="https://github.com/Koushik2910">GitHub</a> · <a href="https://linkedin.com/in/saikoushikgattu">LinkedIn</a> · <a href="https://koushikgattu.lovable.app">Portfolio</a>
</div>

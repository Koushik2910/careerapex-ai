# CareerApex AI — AI Career Operating System

<div align="center">

![CareerApex](https://img.shields.io/badge/CareerApex-AI%20Career%20OS-F59E0B?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?style=for-the-badge&logo=fastapi)
![LangChain](https://img.shields.io/badge/LangChain-0.2-1C3C3C?style=for-the-badge)
![LangGraph](https://img.shields.io/badge/LangGraph-ReAct-4B0082?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)

**A production-grade AI-powered career coaching platform built with LangChain, LangGraph, ChromaDB, and Gemini 2.5 Flash via OpenRouter.**

[Features](#features) · [Architecture](#architecture) · [Setup](#setup) · [API Docs](#api-docs) · [Testing](#testing)

</div>

---

## Overview

CareerApex AI is a full-stack AI Career Operating System that helps job seekers:

- Analyse their resume against job descriptions using RAG-powered gap analysis
- Practice mock interviews with AI that asks targeted questions from their actual resume
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
| **Skill Gap Analysis** | Visual bar chart + progress bars for skill gaps, cached from analysis (no LLM re-call) |
| **Mock Interview** | Standard mode + Resume Defense mode with AI feedback after each answer |
| **Voice Interview** | Full voice I/O using Web Speech API — AI speaks questions, listens to answers |
| **Interview Debrief** | Confidence tracking, score progression charts, radar charts, cover letter generation |
| **Career Memory** | Session history with JD filename tracking, delete, and progress comparison |
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
│   │   ├── upload.py           # Resume + JD upload, ChromaDB indexing
│   │   ├── analyse.py          # Gap analysis, question generation, answer eval
│   │   ├── interview.py        # Mock interview + cover letter
│   │   ├── memory.py           # Session CRUD + progress tracking
│   │   ├── tracker.py          # Confidence score tracking
│   │   ├── negotiate.py        # Salary negotiation + roleplay
│   │   ├── linkedin.py         # LinkedIn profile optimizer
│   │   └── agent.py            # LangGraph career agent
│   ├── chains/
│   │   ├── gap_analyser.py     # LangChain LCEL gap analysis chain
│   │   ├── question_gen.py     # Interview question generation
│   │   ├── answer_eval.py      # Answer evaluation + scoring
│   │   ├── cover_letter.py     # Cover letter generation
│   │   ├── interview_chain.py  # Mock interview conversation
│   │   ├── negotiation.py      # Salary negotiation chains
│   │   └── linkedin_optimizer.py
│   ├── agents/
│   │   └── career_agent.py     # LangGraph ReAct agent
│   ├── memory/
│   │   └── session_store.py    # ChromaDB session persistence
│   └── rag/
│       └── chroma_client.py    # ChromaDB vector store client
│
├── frontend/                   # Next.js 14 App Router frontend
│   ├── app/
│   │   ├── dashboard/          # Career dashboard with KPI rings
│   │   ├── analyse/            # Resume + JD upload with step loader
│   │   ├── gaps/               # Skill gap visual analysis
│   │   ├── interview/          # Mock interview chat
│   │   ├── voice/              # Voice interview with animated orb
│   │   ├── debrief/            # Interview debrief + charts
│   │   ├── memory/             # Session history + delete
│   │   ├── negotiate/          # Salary negotiation
│   │   ├── linkedin/           # LinkedIn optimizer
│   │   └── roadmap/            # Career roadmap tracker
│   └── components/
│       └── Sidebar.tsx         # Navigation sidebar
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
| **Re-ranking** | CrossEncoder (ms-marco-MiniLM) |
| **Observability** | LangSmith tracing |
| **Backend** | FastAPI + Uvicorn |
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS |
| **Animations** | Framer Motion |
| **Charts** | Recharts |
| **Voice** | Web Speech API (browser-native) |
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

1. Navigate to **Analyse** → Upload your resume PDF + a job description
2. Click **Run Gap Analysis** → AI analyses your match score, gaps, strengths
3. Session is auto-saved → visible in **Skill Gaps** dropdown and **Career Memory**
4. Go to **Interview** → Enter the same session ID → Start mock interview
5. Go to **Debrief** → Load session → View confidence scores and cover letter

### Key Workflows

**Resume Analysis → Skill Gaps (same data, no re-call)**
```
Analyse page → upload + run → auto-saved to memory
Skill Gaps page → select from dropdown → loads cached results instantly
```

**Voice Interview**
```
Voice page → select mode → Start → AI speaks → you answer → AI scores → repeat
Chrome/Edge only (Web Speech API)
```

---

## API Docs

Full Swagger UI available at http://localhost:8001/docs

### Key Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/upload/resume` | Upload + embed resume |
| `POST` | `/upload/jd` | Upload + embed JD |
| `POST` | `/analyse/gaps/{session_id}` | Run gap analysis |
| `POST` | `/analyse/questions/{session_id}` | Generate interview questions |
| `POST` | `/analyse/evaluate` | Evaluate answer (0-100 score) |
| `POST` | `/interview/start` | Start mock interview |
| `POST` | `/interview/chat` | Send interview message |
| `GET` | `/memory/sessions` | List all sessions |
| `POST` | `/memory/save` | Save session to memory |
| `DELETE` | `/memory/session/{id}` | Delete session |
| `GET` | `/memory/progress` | Progress comparison |
| `POST` | `/agent/chat` | Career agent (LangGraph) |

---

## Testing

```bash
cd tests
pip install -r requirements_test.txt
playwright install chromium

# Run all tests (zero LLM calls)
pytest tests/ security/ -v --html=reports/html/report.html

# API tests only
pytest tests/api/ -v

# UI tests only
pytest tests/ui/ -v --headed

# Security tests
pytest security/ -v
```

**Test coverage: ~82 tests, zero LLM calls**

---

## LangSmith Observability

All LLM calls are traced automatically via LangSmith when `LANGCHAIN_TRACING_V2=true`.

Traces show:
- Full prompt sent to Gemini
- Response received
- Token usage and cost per call
- Chain step breakdown
- LangGraph agent tool calls

---

## Cache-First Architecture

| Page | LLM Calls |
|---|---|
| Dashboard | ❌ Zero |
| Skill Gaps | ❌ Zero (reads cached analysis) |
| Career Memory | ❌ Zero |
| Resume Analysis | ✅ Once per session |
| Mock Interview | ✅ Per message |
| Voice Interview | ✅ Per message |
| Interview Debrief | ✅ Cover letter only |
| Negotiation | ✅ Per generation |
| LinkedIn | ✅ Per generation |
| Roadmap | ✅ Per generation |

---

## License

MIT License — free to use, modify, and distribute.

---

<div align="center">
Built by <strong>Koushik Gattu</strong> · Senior QA Automation Engineer → AI Engineer
<br/>
<a href="https://github.com/Koushik2910">GitHub</a> · <a href="https://linkedin.com/in/koushikgattu">LinkedIn</a>
</div>

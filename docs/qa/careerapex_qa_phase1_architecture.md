# CareerApex QA Architecture Report — Phase 1
## Application Analysis & Feature Inventory

---

## 1. APPLICATION ARCHITECTURE OVERVIEW

### Stack
| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), React, TypeScript, Tailwind CSS, Framer Motion |
| Backend | FastAPI, Python 3.11, Uvicorn |
| AI/LLM | Groq (llama-3.3-70b-versatile) |
| Vector DB | ChromaDB (persisted to disk) |
| Embeddings | HuggingFace all-MiniLM-L6-v2 |
| Agent Framework | LangChain, LangGraph (ReAct) |
| File Processing | pypdf, python-docx |
| Voice | Web Speech API (browser-native) |
| Observability | LangSmith |
| Ports | Frontend: 3000, Backend: 8001 |

---

## 2. FEATURE INVENTORY

| ID | Feature | Module | Priority |
|---|---|---|---|
| F01 | Resume Upload | Analyse | P0 |
| F02 | JD Upload | Analyse | P0 |
| F03 | Gap Analysis | Analyse/Gaps | P0 |
| F04 | Question Generation | Analyse | P0 |
| F05 | Answer Evaluation | Analyse | P0 |
| F06 | Standard Mock Interview | Interview | P0 |
| F07 | Resume Defense Mode | Interview | P1 |
| F08 | Voice Interview | Voice | P1 |
| F09 | Interview Debrief | Debrief | P1 |
| F10 | Confidence Tracker | Debrief | P1 |
| F11 | Career Memory Save | Memory | P1 |
| F12 | Career Memory Retrieve | Memory | P1 |
| F13 | Progress Tracking | Memory | P2 |
| F14 | Salary Negotiation Script | Negotiate | P1 |
| F15 | Negotiation Roleplay | Negotiate | P1 |
| F16 | LinkedIn Profile Optimize | LinkedIn | P2 |
| F17 | LinkedIn Headline Generator | LinkedIn | P2 |
| F18 | Career Roadmap Generation | Roadmap | P2 |
| F19 | Cover Letter Generation | Debrief | P1 |
| F20 | LangGraph Career Agent | Agent | P1 |
| F21 | Dashboard Overview | Dashboard | P0 |

---

## 3. ROUTE INVENTORY

### Frontend Routes
| Route | Page | Auth Required |
|---|---|---|
| / | Redirect → /dashboard | No |
| /dashboard | Career Dashboard | No |
| /analyse | Resume Analyser | No |
| /gaps | Skill Gap Analysis | No |
| /interview | Mock Interview | No |
| /voice | Voice Interview | No |
| /debrief | Interview Debrief | No |
| /memory | Career Memory | No |
| /negotiate | Salary Negotiation | No |
| /linkedin | LinkedIn Optimizer | No |
| /roadmap | Career Roadmap | No |

### Backend API Routes
| Method | Endpoint | Purpose |
|---|---|---|
| POST | /upload/resume | Upload + embed resume |
| POST | /upload/jd | Upload + embed JD |
| GET | /upload/session/{id} | Get session info |
| POST | /analyse/gaps/{id} | Run gap analysis |
| POST | /analyse/questions/{id} | Generate questions |
| POST | /analyse/evaluate | Evaluate answer |
| POST | /interview/start | Start interview |
| POST | /interview/chat | Interview message |
| POST | /interview/cover-letter | Generate cover letter |
| POST | /agent/chat | Career agent chat |
| POST | /memory/save | Save session |
| GET | /memory/session/{id} | Get session |
| GET | /memory/sessions | Get all sessions |
| POST | /memory/search | Semantic search |
| GET | /memory/progress | Progress summary |
| POST | /tracker/save | Save answer score |
| GET | /tracker/scores/{id} | Get scores |
| GET | /tracker/summary/{id} | Confidence summary |
| POST | /negotiate/script | Generate script |
| POST | /negotiate/roleplay/start | Start roleplay |
| POST | /negotiate/roleplay/chat | Roleplay chat |
| POST | /linkedin/optimize | Optimize profile |
| POST | /linkedin/headlines | Generate headlines |
| GET | / | Health check |
| GET | /health | Health check |

---

## 4. API INVENTORY

### Upload Service
- **Input:** Multipart form (file + session_id)
- **Processing:** Text extraction → chunking → HuggingFace embedding → ChromaDB storage
- **Output:** session_id, filename, chunks count
- **Supported Formats:** PDF, DOCX
- **Size Limit:** Not enforced (risk)

### Gap Analysis Service
- **Input:** session_id
- **Processing:** ChromaDB retrieval → Groq LLM → JsonOutputParser (Pydantic)
- **Output:** match_score, skill_gaps[], strengths[], recommendations[], summary
- **Token Usage:** ~8000 tokens per request

### Interview Service
- **Input:** session_id, message, history[], mode
- **Processing:** ChromaDB retrieval → Groq LLM with system prompt
- **Output:** AI response text
- **State:** Stateless (history passed per request)

### Agent Service
- **Input:** session_id, message, history[]
- **Processing:** LangGraph ReAct loop → tool selection → tool execution
- **Output:** agent response
- **Tools:** tool_gap_analysis, tool_generate_questions, tool_evaluate_answer, tool_career_advice

### Memory Service
- **Storage:** ChromaDB collection "career_memory"
- **Embedding:** all-MiniLM-L6-v2
- **Operations:** save, get, list, semantic search, progress diff

---

## 5. USER JOURNEY MAP

### Journey 1: First-Time Resume Analysis
1. User navigates to /analyse
2. Uploads resume PDF → session_id generated
3. Uploads JD PDF → same session_id
4. Clicks "Run Gap Analysis"
5. Views match score, skill gaps, strengths, recommendations
6. Navigates to /gaps for visual breakdown

### Journey 2: Mock Interview Practice
1. User goes to /interview
2. Enters session_id (from prior upload)
3. Selects Standard or Defense mode
4. Clicks "Start Interview"
5. AI asks questions one at a time
6. User types answers
7. AI gives feedback
8. User navigates to /debrief

### Journey 3: Voice Interview
1. User navigates to /voice
2. Selects mode and enters session_id
3. Clicks "Start Voice Interview"
4. Grants microphone permission
5. AI speaks question via SpeechSynthesis
6. User answers by voice
7. SpeechRecognition transcribes
8. Transcript sent to backend
9. AI evaluates and speaks next question
10. User clicks "End Session"

### Journey 4: Post-Interview Debrief
1. User navigates to /debrief
2. Enters session_id
3. Clicks "Load Debrief"
4. Views score rings, progression chart, category radar
5. Expands weak/strong answers
6. Clicks "Generate Cover Letter"

### Journey 5: Salary Negotiation
1. User navigates to /negotiate
2. Selects "Negotiation Script" tab
3. Fills in current offer, target, role, company
4. Clicks "Generate Script"
5. Reviews strategy
6. Switches to "Roleplay" tab
7. Configures and starts roleplay
8. Practices negotiation with AI HR

---

## 6. RISK ASSESSMENT

### Critical Risks (P0)
| Risk | Area | Impact |
|---|---|---|
| Groq rate limit (100K tokens/day) | All AI features | All AI features fail |
| ChromaDB data loss on restart | Memory/Uploads | Session data lost |
| No file size validation | Upload | Server OOM / DoS |
| No authentication | All routes | Unauthorized access |
| No CSRF protection | All POST endpoints | CSRF attacks |

### High Risks (P1)
| Risk | Area | Impact |
|---|---|---|
| XSS via AI-generated content rendered as HTML | Interview/Debrief | Script injection |
| Hardcoded session IDs in UI defaults | All pages | Data leakage across users |
| No file type validation server-side | Upload | Malicious file upload |
| LLM hallucination in structured output | Gap analysis | Wrong JSON crashing parser |
| No retry logic for Groq API failures | All AI | Silent failures |

### Medium Risks (P2)
| Risk | Area | Impact |
|---|---|---|
| Web Speech API not supported in Firefox/Safari | Voice | Feature unusable |
| No loading state for voice permission denial | Voice | Stuck UI |
| Memory page 404 if no sessions exist | Memory | Empty state not handled |
| LangGraph infinite loop if tool fails | Agent | Hanging request |
| No pagination on session list | Memory | Performance degradation |

### Low Risks (P3)
| Risk | Area | Impact |
|---|---|---|
| Inter font loaded from Google CDN | All pages | Slow load on poor network |
| No PWA / offline support | All | Mobile unusability |
| No dark/light mode toggle | UI | Accessibility preference |

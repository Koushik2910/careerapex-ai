# CAREERAPEX AI — CURRENT PROJECT STATUS
**Date:** June 25, 2026

---

## DEPLOYMENT STATUS

| Layer | Platform | URL | Status |
|---|---|---|---|
| Frontend | Vercel (free) | https://careerapex-ai.vercel.app | ✅ Live |
| Backend | Railway (free) | https://careerapex-ai-production.up.railway.app | ✅ Live |
| Local Frontend | localhost:3000 | http://localhost:3000 | Run manually |
| Local Backend | localhost:8001 | http://localhost:8001 | Run manually |

---

## WORKING MODULES (as of June 25, 2026)

| Module | Route | Status | Notes |
|---|---|---|---|
| Dashboard | /dashboard | ✅ Working | Zero LLM calls |
| Resume Analyser | /analyse | ✅ Working | Previous resume dropdown works |
| Skill Gaps | /gaps | ✅ Working | Cache-first, session dropdown |
| Mock Interview | /interview | ✅ Working | Text + Defense mode |
| AI Voice Studio | /voice-studio | ✅ Working | 5 questions, honest scoring, saves to Debrief |
| Legacy Voice | /voice | ✅ Working | Redirect card (kept for link compatibility) |
| Interview Debrief | /debrief | ✅ Working | Auto-loads from session param |
| Career Memory | /memory | ✅ Working | Session list, delete, progress |
| Salary Negotiation | /negotiate | ✅ Working | Script + HR roleplay |
| LinkedIn Optimizer | /linkedin | ✅ Working | Headline + about optimization |
| Career Roadmap | /roadmap | ⚠️ Working but fragile | parseRoadmap() breaks on format change |
| Career Agent | /agent | ✅ Working | LangGraph ReAct, 4 tools |

---

## KNOWN LIMITATIONS

### Infrastructure
- **No persistent storage on Railway free tier** — ChromaDB wiped on every redeploy. Users lose all sessions. Fix: add Railway disk ($0.25/GB/month) or migrate to Pinecone.
- **Railway OOM kills** — 512MB RAM limit occasionally hit during concurrent operations (HuggingFace ~300MB + LangChain + ChromaDB). Container auto-restarts in ~15s. Observed June 22.
- **Railway sleeps after 15 min** — Voice Studio pings /health on mount. cron-job.org pings every 10 min. Still possible for cold start to cause voice interview failure.

### Application
- **No authentication** — anyone with the URL can access all sessions. No user isolation.
- **No file size validation** — large PDFs (>20 pages) can cause embedding timeout on Railway.
- **Roadmap parseRoadmap() fragile** — if Gemini returns roadmap in different format than expected, page breaks silently.
- **Voice interview Chrome-only** — Web Speech API not supported in Firefox.
- **HF_TOKEN warning** — HuggingFace model downloads without auth token (rate limits apply). Add HF_TOKEN env var to Railway to increase limits.

---

## TECHNICAL DEBT

| Item | Priority | Effort | Impact |
|---|---|---|---|
| ChromaDB persistence (Railway disk or Pinecone) | High | Low | Fixes data loss on redeploy |
| JWT authentication | High | Medium | Makes app production-ready |
| PostgreSQL for session metadata | Medium | Medium | Replaces in-memory session store |
| Redis semantic caching | Medium | Medium | Reduces LLM costs further |
| File size validation on upload | Medium | Low | Prevents timeout errors |
| Roadmap parser robustness | Low | Low | Fixes fragile `WEEK X:` parsing |
| Retry logic on all LLM chains | Low | Low | Handles transient API failures |
| GitHub Actions CI/CD | Low | Medium | Test gate before auto-deploy |

---

## RISKS

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Railway OOM kill during live demo | Medium | High | Pre-warm backend, keep tabs open, Railway paid tier |
| OpenRouter API key exposed in GitHub | Low | High | Key is in .env — never committed |
| Gemini API rate limits | Low | Medium | OpenRouter handles fallback |
| Railway free tier usage limits | Medium | Medium | Monitor usage, upgrade if needed |
| ChromaDB data loss on redeploy | High | Medium | Always demo in one uninterrupted session |

---

## CURRENT PRIORITIES

**Immediate (before next interview):**
1. Practice walking through CareerApex live demo on screen
2. Be able to explain every bug in STAR format from memory
3. Know Docker concepts cold (50 Q&A from interview guide)

**Short term (next 1-2 weeks):**
1. Add Railway disk to fix ChromaDB persistence
2. JWT authentication (makes app production-ready for resume)
3. File size validation on upload

**Medium term (1-2 months):**
1. PostgreSQL for proper relational session management
2. Redis semantic caching
3. Streaming LLM responses (SSE) for perceived latency improvement
4. GitHub Actions CI/CD pipeline

**Long term:**
1. Multi-tenant architecture with proper user isolation
2. Pinecone for production-scale vector storage
3. Fine-tuned answer evaluation model
4. Export interview debrief as PDF

---

## PENDING IDEAS (Not Yet Built)

- Export Debrief as PDF
- Email session summary after interview
- Connect to Naukri/LinkedIn job boards via API
- Batch question generation for offline practice
- Interview question bank (company-specific questions)
- Mobile-responsive UI (currently desktop-optimized)
- Dark/light mode toggle
- Session comparison (track improvement over multiple sessions)
- Audio recording of voice interview for playback

---

## DOCS STATUS

| Document | Status | Last Updated |
|---|---|---|
| CAREERAPEX_MASTER_HANDOVER.md | ✅ Current (v4.0) | June 25, 2026 |
| DEPLOYMENT_GUIDE.md | ✅ Current | June 25, 2026 |
| README.md | ✅ Current | June 25, 2026 |
| CODEBASE_MAP.md | ✅ New | June 25, 2026 |
| AI_ENGINEER_NOTES.md | ✅ New | June 25, 2026 |
| CLAUDE_TRANSFER.md | ✅ New | June 25, 2026 |
| CURRENT_PROJECT_STATUS.md | ✅ New | June 25, 2026 |
| careerapex_interview_guide.docx | ✅ Complete | June 25, 2026 |


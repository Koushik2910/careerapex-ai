# CAREERAPEX AI — DEPLOYMENT GUIDE
**Version:** 3.0 | **Date:** June 25, 2026

---

## ARCHITECTURE OVERVIEW

```
GitHub (main branch)
    ↓ auto-deploy on push
    ├── Railway (backend FastAPI)
    │   careerapex-ai-production.up.railway.app
    │
    └── Vercel (frontend Next.js)
        careerapex-ai.vercel.app
```

---

## RAILWAY DEPLOYMENT (BACKEND)

### How It Works
1. You `git push origin main`
2. Railway detects new commit via GitHub webhook
3. Railway navigates to `backend/` folder (Root Directory setting)
4. Railway reads `backend/Dockerfile`
5. Railway builds Docker image on their servers
6. Railway starts container with start command
7. Backend live at public URL

### Dashboard Settings (one-time setup, already configured)
| Setting | Value | Location |
|---|---|---|
| Repository | github.com/Koushik2910/careerapex-ai | Connect → GitHub |
| Root Directory | `backend` | Settings → General |
| Start Command | `sh -c "uvicorn main:app --host 0.0.0.0 --port $PORT"` | Settings → Deploy |
| Domain target port | `8001` | Settings → Networking |

### Environment Variables (set in Railway → Variables)
```
OPENROUTER_API_KEY=sk-or-v1-xxx
LANGCHAIN_API_KEY=lsv2_xxx
LANGCHAIN_TRACING_V2=true
LANGCHAIN_PROJECT=careerapex-ai
PYTHON_VERSION=3.11.9
PORT=8001
```

### Build Process
```
Dockerfile line by line:
FROM python:3.11-slim          → Downloads Python 3.11 Linux base
WORKDIR /app                   → Creates /app directory
RUN apt-get install ...        → Installs build tools (gcc)
COPY requirements.txt .        → Copies requirements (cached layer)
RUN pip install -r requirements.txt  → Installs all packages
COPY . .                       → Copies all Python files
RUN mkdir -p /app/chroma_store → Pre-creates ChromaDB directory
EXPOSE 8001                    → Documents port
CMD uvicorn main:app ...       → Startup command (SHELL FORM — required for $PORT)
```

### Free Tier Constraints
- 512MB RAM limit
- Sleeps after 15 min inactivity
- No persistent disk (ChromaDB wiped on redeploy)
- OOM kills during peak memory (auto-recovers in ~15s)
- ~3-5 minute build time

### Keepalive Setup
Voice Studio pings `/health` on page mount. Additional: set up cron-job.org to ping `https://careerapex-ai-production.up.railway.app/health` every 10 minutes.

---

## VERCEL DEPLOYMENT (FRONTEND)

### How It Works
1. You `git push origin main`
2. Vercel detects new commit via GitHub webhook
3. Vercel navigates to `frontend/` folder (Root Directory setting)
4. Vercel runs `npm install` then `npm run build`
5. Next.js builds static + server-side pages
6. Deployed to Vercel's global CDN
7. Live in ~45 seconds

### Dashboard Settings (one-time setup, already configured)
| Setting | Value | Location |
|---|---|---|
| Repository | github.com/Koushik2910/careerapex-ai | Import → GitHub |
| Root Directory | `frontend` | Settings → General |
| Framework Preset | `Next.js` (NOT "Other") | Settings → Build & Deployment |

### Environment Variables (set in Vercel → Settings → Environment Variables)
```
NEXT_PUBLIC_API_URL=https://careerapex-ai-production.up.railway.app
```

### Build Process
```
npm install         → Install node_modules from package.json
npm run build       → next build → compiles TypeScript, optimizes bundles
                    → Output: .next/ folder with all pages
Deploy              → Push .next/ to Vercel CDN
```

---

## DOCKER (LOCAL DEVELOPMENT)

### Dockerfile (`backend/Dockerfile`)
```dockerfile
FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends build-essential gcc
COPY requirements.txt .
RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt
COPY . .
RUN mkdir -p /app/chroma_store
EXPOSE 8001
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8001}
```

**Critical: Shell form CMD** — array form `["uvicorn", ...]` does NOT expand `$PORT`. Shell form does.

### Docker Compose (`docker-compose.yml`)
```bash
cd C:\Users\Azuro\careerapex
docker compose up --build      # First time or after requirements.txt change
docker compose up              # Subsequent runs (uses cached image)
docker compose down            # Stop (ChromaDB data preserved in named volume)
```
- Frontend on http://localhost:3000
- Backend on http://localhost:8001
- ChromaDB persists in `chroma_data` named volume

---

## COMMON DEPLOYMENT FAILURES

### Railway: Container starts but API calls fail
**Symptom:** Railway logs show `Uvicorn running` but frontend gets 503
**Root cause:** Domain target port set to 8080 (default), app runs on 8001
**Fix:** Railway → Settings → Networking → change target port to 8001

### Railway: Build fails with Python version error
**Symptom:** Build log shows Python 3.14 not supported
**Root cause:** Railway auto-selects latest Python if not pinned
**Fix:** Set `PYTHON_VERSION=3.11.9` in Railway environment variables

### Railway: Build OOM during Docker build
**Symptom:** Build log shows `Killed` during `pip install`
**Root cause:** HuggingFace model pre-download in Dockerfile consumes all RAM during build
**Fix:** Remove any `RUN python -c "from langchain_huggingface import..."` from Dockerfile. Load model at runtime only.

### Railway: 422 Unprocessable Entity on `/interview/chat`
**Symptom:** Voice Studio Q2 fails with 422 after Q1 succeeds
**Root cause:** Voice page sends extra fields (`interviewer_name`, `max_questions`) that Pydantic rejects
**Fix:** Add `model_config = {"extra": "ignore"}` to InterviewRequest in `routers/interview.py`

### Railway: 500 error on any endpoint after redeploy
**Symptom:** All endpoints return 500 after redeploy
**Root cause:** ChromaDB `career_memory` collection gone (Railway free tier wipes on redeploy)
**Fix:** Run a new Analyse session to recreate ChromaDB collections. Expected behavior on free tier.

### Railway: Gunicorn not found / wrong server
**Symptom:** Railway build log shows gunicorn errors
**Root cause:** Railway auto-detects gunicorn for Python apps
**Fix:** Set explicit Start Command: `sh -c "uvicorn main:app --host 0.0.0.0 --port $PORT"`

### Vercel: 404 on all routes
**Symptom:** `careerapex-ai.vercel.app/dashboard` returns 404
**Root cause 1:** Framework Preset was "Other" instead of "Next.js"
**Fix:** Vercel → Settings → Build & Deployment → Framework Preset → Next.js → Redeploy

**Root cause 2:** `frontend/` directory treated as git submodule (had nested `.git`)
**Fix:**
```powershell
Remove-Item -Recurse -Force C:\Users\Azuro\careerapex\frontend\.git
cd C:\Users\Azuro\careerapex
git add frontend/
git commit -m "fix: remove frontend submodule"
git push origin main
```

### Vercel: API calls fail in production (CORS)
**Symptom:** Gap analysis works locally, silently fails on Vercel
**Root cause:** FastAPI CORS `allow_origins` missing Vercel URL
**Fix:** In `backend/main.py`:
```python
allow_origins=["http://localhost:3000", "https://careerapex-ai.vercel.app"]
```
Then push backend → Railway auto-deploys.

### Vercel: API calls fail in production (localhost URL)
**Symptom:** Sessions not saving, API calls silently fail on cloud
**Root cause:** Pages had hardcoded `http://localhost:8001` instead of `API_BASE`
**Fix:** Every page that makes fetch calls must have:
```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
```
And use `` `${API_BASE}/endpoint` `` in all fetch calls.

### Docker: $PORT not expanding
**Symptom:** `uvicorn: error: argument --port: invalid int value: '$PORT'`
**Root cause:** Array form CMD doesn't expand shell variables
**Fix:** Use shell form:
```dockerfile
# WRONG (array form)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "$PORT"]

# CORRECT (shell form)  
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8001}
```

---

## DEPLOYMENT CHECKLIST

### Before pushing any change:
- [ ] Test locally (backend port 8001, frontend port 3000)
- [ ] Check that no `http://localhost:8001` is hardcoded in frontend files
- [ ] Verify `API_BASE` is at top of any new page file
- [ ] No API keys in committed code
- [ ] `model_config = {"extra": "ignore"}` on any new Pydantic request models

### After Railway redeploy:
- [ ] Wait for build to complete (~3-5 min)
- [ ] Check Railway deploy logs for errors
- [ ] Test `https://careerapex-ai-production.up.railway.app/health`
- [ ] Test `/memory/sessions` (ChromaDB operational check)
- [ ] Run new Analyse session if ChromaDB was wiped

### After Vercel redeploy:
- [ ] Wait ~45 seconds
- [ ] Test `https://careerapex-ai.vercel.app/dashboard`
- [ ] Check browser console for CORS or API errors

---

## LESSONS LEARNED

1. **Shell form CMD required** — array form in Dockerfile doesn't expand `$PORT`
2. **Railway free tier is not suitable for ML models** — HuggingFace ~300MB leaves only 200MB for the app
3. **Never pre-download HuggingFace in Dockerfile** — causes OOM during build
4. **Railway domain port must be manually set** — defaults to 8080, app runs on 8001
5. **Vercel Framework Preset must be "Next.js"** — "Other" treats it as static site
6. **Frontend .git submodule breaks Vercel** — Vercel can't find directory, fix: remove nested .git
7. **Always use `API_BASE` env var** — hardcoded localhost breaks cloud deployment silently
8. **All Pydantic models need `extra=ignore`** — voice page sends extra fields that break validation
9. **ChromaDB data is ephemeral on Railway free tier** — always demo in one session

---

## FUTURE RECOMMENDATIONS

**For production-grade deployment:**
1. **Railway paid tier** ($5/mo) — 8GB RAM, no OOM kills, persistent disk for ChromaDB
2. **Or Fly.io** — better free tier than Railway for Python ML apps
3. **PostgreSQL for session metadata** — replace ChromaDB `career_memory` with a real DB
4. **Pinecone for vectors** — persistent vector storage that survives redeploys
5. **GitHub Actions CI/CD** — run tests before auto-deploy, block broken deployments
6. **Sentry for error tracking** — catch Railway 500s in production
7. **Environment-specific .env files** — `.env.local`, `.env.production`, `.env.staging`


# CAREERAPEX AI — DEPLOYMENT GUIDE
**Version:** 2.0 | **Date:** June 18, 2026

---

## CURRENT DEPLOYMENT STATUS

| Layer | Platform | URL | Status |
|---|---|---|---|
| Frontend | Vercel | https://careerapex-ai.vercel.app | ✅ Live |
| Backend | Railway | https://careerapex-ai-production.up.railway.app | ✅ Live |
| Local Frontend | localhost | http://localhost:3000 | Run manually |
| Local Backend | localhost | http://localhost:8001 | Run manually |

---

## LOCAL DEVELOPMENT

### Start Backend

```powershell
cd C:\Users\Azuro\careerapex\backend
$env:PYTHONIOENCODING="utf-8"
..\venv\Scripts\activate
uvicorn main:app --reload --port 8001
```

### Start Frontend

```powershell
cd C:\Users\Azuro\careerapex\frontend
npm run dev
```

### Environment Variables (Local)

Backend reads from `backend/.env`:
```
OPENROUTER_API_KEY=sk-or-v1-xxx
LANGCHAIN_API_KEY=lsv2_xxx
LANGCHAIN_TRACING_V2=true
LANGCHAIN_PROJECT=careerapex-ai
```

Frontend reads from `frontend/.env.local` (create if missing):
```
NEXT_PUBLIC_API_URL=http://localhost:8001
```

---

## DOCKER (LOCAL FULL STACK)

### Build and Run

```powershell
cd C:\Users\Azuro\careerapex

# Create root .env file (docker-compose reads this)
@"
OPENROUTER_API_KEY=sk-or-v1-xxx
LANGCHAIN_API_KEY=lsv2_xxx
LANGCHAIN_TRACING_V2=true
LANGCHAIN_PROJECT=careerapex-ai
"@ | Set-Content ".env" -Encoding UTF8

# Start both containers
docker compose up --build
```

Visit http://localhost:3000

### Stop

```powershell
docker compose down
```

### Stop and wipe ChromaDB

```powershell
docker compose down -v
```

### File Locations

| File | Location |
|---|---|
| Backend Dockerfile | `backend/Dockerfile` |
| Frontend Dockerfile | `frontend/Dockerfile` |
| Docker Compose | `docker-compose.yml` (root) |
| Backend requirements | `backend/requirements.txt` |

### Backend Dockerfile (current working version)

```dockerfile
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential gcc && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt

COPY . .
RUN mkdir -p /app/chroma_store

EXPOSE 8001
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8001}
```

**IMPORTANT:** Do NOT pre-download HuggingFace model at build time — causes OOM on Railway.

---

## RAILWAY (BACKEND PRODUCTION)

### Dashboard

https://railway.app → My Projects → alluring-intuition → careerapex-ai

### Settings

| Setting | Value |
|---|---|
| Root Directory | `backend` |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `sh -c "uvicorn main:app --host 0.0.0.0 --port $PORT"` |
| Runtime | Python |
| Region | US West |

### Environment Variables (Railway Dashboard → Variables)

| Key | Value |
|---|---|
| `PYTHON_VERSION` | `3.11.9` |
| `OPENROUTER_API_KEY` | `sk-or-v1-xxx` |
| `LANGCHAIN_API_KEY` | `lsv2_xxx` |
| `LANGCHAIN_TRACING_V2` | `true` |
| `LANGCHAIN_PROJECT` | `careerapex-ai` |
| `PORT` | `8001` |

### Networking

Domain: `careerapex-ai-production.up.railway.app`
Target port: `8001`

### Redeploy

```powershell
git push origin main
```

Railway auto-deploys on push. Or use Railway Dashboard → Manual Deploy.

### Test After Deploy

```
https://careerapex-ai-production.up.railway.app/health
Expected: {"status":"CareerApex AI is running","version":"1.0.0"}
```

### Free Tier Limitations

- 512MB RAM — HuggingFace model uses ~300MB, leaves ~200MB for FastAPI
- Sleeps after 15 min inactivity
- First request after sleep: 30-60 seconds
- No persistent disk — ChromaDB wiped on redeploy

### Keep Alive (Prevent Sleep)

Set up free cron at https://cron-job.org:
- URL: `https://careerapex-ai-production.up.railway.app/health`
- Schedule: Every 10 minutes

---

## VERCEL (FRONTEND PRODUCTION)

### Dashboard

https://vercel.com → koushik-gattu → careerapex-ai

### Settings

| Setting | Value |
|---|---|
| Root Directory | `frontend` |
| Framework Preset | `Next.js` (MUST be Next.js, not Other) |
| Build Command | `npm run build` (auto-detected) |
| Output Directory | `.next` (auto-detected) |

### Environment Variables (Vercel Dashboard → Settings → Environment Variables)

| Key | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://careerapex-ai-production.up.railway.app` |

### Auto-Deploy

Vercel auto-deploys on every push to `main` branch. Takes ~45 seconds.

### Manual Redeploy

Vercel Dashboard → Deployments → `...` next to latest → Redeploy

### Test After Deploy

```
https://careerapex-ai.vercel.app/dashboard
Should show CareerApex dashboard UI
```

---

## KUBERNETES (LOCAL MINIKUBE)

### Install Minikube (one time)

```powershell
winget install Kubernetes.minikube
```

### Start Minikube

```powershell
minikube start --driver=docker --memory=4096 --cpus=2
```

### Build Images Inside Minikube

```powershell
# Point Docker to Minikube registry
& minikube -p minikube docker-env --shell powershell | Invoke-Expression

# Build images
docker build -t careerapex-backend:latest ./backend
docker build -t careerapex-frontend:latest ./frontend
```

### Deploy

```powershell
# Apply all manifests
kubectl apply -f k8s/manifests.yaml

# Create secrets
kubectl create secret generic careerapex-secrets `
  --from-literal=OPENROUTER_API_KEY=sk-or-v1-xxx `
  --from-literal=LANGCHAIN_API_KEY=lsv2_xxx `
  -n careerapex
```

### Access

```powershell
minikube service careerapex-frontend-svc -n careerapex
```

### Monitor

```powershell
kubectl get pods -n careerapex
kubectl logs -l app=careerapex-backend -n careerapex
kubectl describe pod -l app=careerapex-backend -n careerapex
```

### Stop

```powershell
minikube stop
```

### Manifest Location

`careerapex/k8s/manifests.yaml`

Contains: Namespace, ConfigMap, Secret (template), PVC, Backend Deployment, Backend Service, Frontend Deployment, Frontend Service.

---

## ENVIRONMENT VARIABLES REFERENCE

### Backend (all required)

| Variable | Description |
|---|---|
| `OPENROUTER_API_KEY` | LLM API key (Gemini via OpenRouter) |
| `LANGCHAIN_API_KEY` | LangSmith tracing key |
| `LANGCHAIN_TRACING_V2` | `true` to enable tracing |
| `LANGCHAIN_PROJECT` | `careerapex-ai` |
| `PORT` | Server port (Railway sets this automatically) |

### Frontend (all required on Vercel)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Full backend URL including https:// |

---

## PUSH AND DEPLOY WORKFLOW

### Standard code change

```powershell
cd C:\Users\Azuro\careerapex

# Make changes to files
# Test locally first

git add .
git commit -m "feat/fix/chore: description"
git push origin main

# Vercel deploys frontend automatically (~45s)
# Railway deploys backend automatically (~3-5 min)
```

### After backend deploy, always test

```powershell
# Wait 3-5 minutes for Railway build
# Then test
Invoke-RestMethod -Uri "https://careerapex-ai-production.up.railway.app/health"
```

### After frontend deploy, hard refresh browser

```
Ctrl + Shift + R on https://careerapex-ai.vercel.app/dashboard
```

---

## COMMON DEPLOYMENT ISSUES AND FIXES

### Frontend shows 404

Check Vercel → Settings → Build and Deployment → Framework Preset → must be `Next.js`.

### Backend shows "Application failed to respond"

Check Railway → Networking → domain target port must be `8001`.

### Backend OOM (out of memory)

HuggingFace model is too large for Railway free tier 512MB. If this happens:
- Check Railway logs for "Out of memory"
- The model loads on first request — if first request OOMs, Railway restarts
- Solution: use Railway Starter plan ($5/month, 1GB RAM)

### Voice interview blank screen on cloud

Railway is sleeping. Open `https://careerapex-ai-production.up.railway.app/health` in browser first. Wait for it to respond. Then start voice interview.

### Sessions not persisting after redeploy

Expected on Railway free tier. ChromaDB has no persistent disk. Always run full flow in one session. For persistence, add Railway disk: Dashboard → Storage → Add Disk → mount at `/app/chroma_store`.

### CORS error in browser console

`backend/main.py` `allow_origins` list must include your Vercel URL:
```python
allow_origins=[
    "http://localhost:3000",
    "https://careerapex-ai.vercel.app",
]
```

---

## INTERVIEW TALKING POINTS FOR DEPLOYMENT

> "CareerApex is containerised with Docker using a multi-stage build — the builder stage installs Python dependencies, the runtime stage copies only the app code. I use Docker Compose for local development to spin up both FastAPI backend and Next.js frontend with one command, with a persistent volume for ChromaDB.

> For production, the backend runs on Railway using the same Dockerfile, with the start command using shell form to properly expand the `$PORT` environment variable. The frontend is on Vercel, which auto-deploys on every GitHub push in about 45 seconds. The frontend calls the Railway backend via `NEXT_PUBLIC_API_URL` — a single environment variable that makes the same codebase work in local, staging, and production.

> I also wrote Kubernetes manifests for Minikube — Deployments, Services, ConfigMap, Secrets, and a PersistentVolumeClaim for ChromaDB storage — which gave me hands-on experience with the full K8s primitives without any cloud cost."

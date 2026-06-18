# CAREERAPEX AI — DEPLOYMENT GUIDE
**Version:** 3.0 | **Date:** June 18, 2026

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
C:\Users\Azuro\careerapex\backend\venv\Scripts\Activate.ps1
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

Frontend reads from `frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8001
```

---

## PUSH AND DEPLOY WORKFLOW

### Standard code change

```powershell
cd C:\Users\Azuro\careerapex

# Test locally first, then:
git add .
git commit -m "feat/fix/chore: description"
git push origin main

# Vercel deploys frontend automatically (~45s)
# Railway deploys backend automatically (~3-5 min)
```

### After backend deploy, always test

```powershell
# Wait 3-5 minutes for Railway build
Invoke-RestMethod -Uri "https://careerapex-ai-production.up.railway.app/health"
# Expected: {"status":"ok"}
```

### After frontend deploy, hard refresh

```
Ctrl + Shift + R on https://careerapex-ai.vercel.app/dashboard
```

### Create source zip for upload

```powershell
cd C:\Users\Azuro\careerapex

Add-Type -Assembly "System.IO.Compression.FileSystem"
$source = "C:\Users\Azuro\careerapex"
$dest   = "C:\Users\Azuro\careerapex_src.zip"
if (Test-Path $dest) { Remove-Item $dest }
$exclude = @('node_modules', 'venv', '__pycache__', 'chroma_store', '.next', '.git', '.pytest_cache', '.mypy_cache')
$zip = [System.IO.Compression.ZipFile]::Open($dest, 'Create')
Get-ChildItem -Path $source -Recurse -File | Where-Object {
    $path = $_.FullName
    -not ($exclude | Where-Object { $path -match [regex]::Escape("\$_\") })
} | ForEach-Object {
    $entryName = $_.FullName.Substring($source.Length + 1)
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $entryName) | Out-Null
}
$zip.Dispose()
(Get-Item $dest).Length / 1MB | ForEach-Object { "Size: {0:N2} MB" -f $_ }
```

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

### Free Tier Limitations

- 512MB RAM — HuggingFace model uses ~300MB, leaves ~200MB for FastAPI
- Sleeps after 15 min inactivity — first request after sleep: 30-60 seconds
- No persistent disk — ChromaDB wiped on redeploy

### Keep Alive (Prevent Sleep)

Set up free cron at https://cron-job.org:
- URL: `https://careerapex-ai-production.up.railway.app/health`
- Schedule: Every 10 minutes

The AI Voice Studio also pings `/health` on page load to pre-warm Railway before the interview starts.

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

---

## DOCKER (LOCAL FULL STACK)

```powershell
cd C:\Users\Azuro\careerapex

# Create root .env
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

```powershell
# Stop
docker compose down

# Stop and wipe ChromaDB
docker compose down -v
```

### Backend Dockerfile

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

## COMMON ISSUES AND FIXES

### Voice Studio blank screen / timeout
Railway is sleeping. The Voice Studio pings `/health` on load, but if Railway is slow:
1. Open `https://careerapex-ai-production.up.railway.app/health` in a new tab
2. Wait for `{"status":"ok"}` response
3. Return to Voice Studio and start interview

### Voice recognition stops after 2-3 words
This only happens in non-Chrome browsers. Use Chrome. The Web Speech API continuous mode is Chrome-only.

### Sessions not persisting after Railway redeploy
Expected on free tier — ChromaDB has no persistent disk. Always complete a full session (Analyse → Interview → Debrief) without redeploying. For persistence, add Railway disk: Dashboard → Storage → Add Disk → mount at `/app/chroma_store`.

### Debrief shows "No interview data found"
You must complete a Voice Studio or Mock Interview session first. The debrief reads from `/tracker/summary/{session_id}` which is populated during the interview. If you only ran gap analysis, there's no interview data yet.

### Frontend shows 404
Check Vercel → Settings → Build and Deployment → Framework Preset → must be `Next.js`.

### Backend shows "Application failed to respond"
Check Railway → Networking → domain target port must be `8001`.

### CORS error in browser console
`backend/main.py` `allow_origins` must include your Vercel URL:
```python
allow_origins=[
    "http://localhost:3000",
    "https://careerapex-ai.vercel.app",
]
```

---

## INTERVIEW TALKING POINTS FOR DEPLOYMENT

> "CareerApex is containerised with Docker — both FastAPI backend and Next.js frontend have their own Dockerfiles, and Docker Compose spins them both up locally with a single command, including a persistent ChromaDB volume.

> For production, the backend runs on Railway using the same Dockerfile. The start command uses shell form to expand the `$PORT` environment variable — a lesson learned from Docker CMD array form not expanding shell variables. The frontend is deployed on Vercel, which auto-deploys on every GitHub push in about 45 seconds.

> The frontend is fully environment-variable-driven — a single `NEXT_PUBLIC_API_URL` variable switches the same codebase between local, staging, and production without any code changes. I also implemented a Railway keepalive ping on the Voice Studio page load to pre-warm the backend before users start interviews, which solved the timeout issue on free-tier cold starts.

> I wrote Kubernetes manifests for Minikube as well — Deployments, Services, ConfigMap, Secrets, and a PersistentVolumeClaim for ChromaDB — giving me hands-on experience with the full K8s primitives."


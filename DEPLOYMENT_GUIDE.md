# CareerApex AI — Deployment Guide
# Covers: Docker → Docker Compose → Vercel + Render → Kubernetes (Minikube)

═══════════════════════════════════════════════════════════════
PHASE 1 — FILE PLACEMENT (do this first)
═══════════════════════════════════════════════════════════════

Where each file goes in your project:

careerapex/
├── backend/
│   ├── Dockerfile              ← Dockerfile (backend)
│   ├── requirements.txt        ← requirements.txt
│   ├── .dockerignore           ← .dockerignore
│   ├── main.py
│   └── ... (rest of backend)
├── frontend/
│   ├── Dockerfile              ← Dockerfile.frontend (rename to Dockerfile)
│   └── ... (rest of frontend)
├── docker-compose.yml          ← docker-compose.yml (project root)
└── k8s/
    └── manifests.yaml          ← k8s-manifests.yaml (rename to manifests.yaml)


═══════════════════════════════════════════════════════════════
PHASE 2 — next.config.ts CHANGE (required for frontend Docker)
═══════════════════════════════════════════════════════════════

Add output: "standalone" to next.config.ts:

  const nextConfig: NextConfig = {
    output: "standalone",   ← ADD THIS LINE
  };


═══════════════════════════════════════════════════════════════
PHASE 3 — DOCKER (backend only, test first)
═══════════════════════════════════════════════════════════════

# Navigate to backend folder
cd C:\Users\Azuro\careerapex\backend

# Build the Docker image
docker build -t careerapex-backend:latest .

# Run it locally (test before deploying)
docker run -p 8001:8001 `
  -e OPENROUTER_API_KEY=sk-or-v1-xxx `
  -e LANGCHAIN_API_KEY=lsv2_xxx `
  -e LANGCHAIN_TRACING_V2=true `
  -e LANGCHAIN_PROJECT=careerapex-ai `
  -v careerapex_chroma:/app/chroma_store `
  careerapex-backend:latest

# Test it
curl http://localhost:8001/health
# Expected: {"status":"ok"}


═══════════════════════════════════════════════════════════════
PHASE 4 — DOCKER COMPOSE (full stack locally)
═══════════════════════════════════════════════════════════════

# Create .env file at project root (docker-compose reads this)
# C:\Users\Azuro\careerapex\.env
OPENROUTER_API_KEY=sk-or-v1-xxx
LANGCHAIN_API_KEY=lsv2_xxx
LANGCHAIN_TRACING_V2=true
LANGCHAIN_PROJECT=careerapex-ai

# From project root
cd C:\Users\Azuro\careerapex

# Start everything
docker-compose up --build

# Visit http://localhost:3000 — full app running in containers

# Stop
docker-compose down

# Stop and wipe volumes (clears ChromaDB)
docker-compose down -v


═══════════════════════════════════════════════════════════════
PHASE 5 — RENDER DEPLOYMENT (backend public URL)
═══════════════════════════════════════════════════════════════

1. Push your code to GitHub (github.com/Koushik2910/careerapex-ai)
   Make sure backend/Dockerfile is committed.

2. Go to render.com → New → Web Service

3. Connect GitHub repo → select careerapex-ai

4. Settings:
   - Root Directory: backend
   - Environment: Docker
   - Dockerfile Path: ./Dockerfile
   - Port: 8001

5. Add Environment Variables in Render dashboard:
   OPENROUTER_API_KEY = sk-or-v1-xxx
   LANGCHAIN_API_KEY  = lsv2_xxx
   LANGCHAIN_TRACING_V2 = true
   LANGCHAIN_PROJECT = careerapex-ai

6. Add Persistent Disk (for ChromaDB):
   - Mount Path: /app/chroma_store
   - Size: 1 GB ($0.25/month)

7. Deploy → get URL like:
   https://careerapex-backend.onrender.com

8. Test:
   curl https://careerapex-backend.onrender.com/health

9. Add free keepalive cron (prevents sleep):
   - Go to cron-job.org (free)
   - Add job: GET https://careerapex-backend.onrender.com/health
   - Schedule: every 10 minutes


═══════════════════════════════════════════════════════════════
PHASE 6 — VERCEL DEPLOYMENT (frontend public URL)
═══════════════════════════════════════════════════════════════

1. Go to vercel.com → New Project

2. Import github.com/Koushik2910/careerapex-ai

3. Settings:
   - Framework: Next.js
   - Root Directory: frontend
   - Build Command: npm run build (auto-detected)

4. Add Environment Variable:
   NEXT_PUBLIC_API_URL = https://careerapex-backend.onrender.com

5. Deploy → get URL like:
   https://careerapex-ai.vercel.app

6. Visit the URL — frontend calls your Render backend automatically.

NOTE: Also update backend/main.py CORS to allow your Vercel URL:
  allow_origins=[
    "http://localhost:3000",
    "https://careerapex-ai.vercel.app",   ← ADD THIS
  ]


═══════════════════════════════════════════════════════════════
PHASE 7 — KUBERNETES ON MINIKUBE (local, portfolio demo)
═══════════════════════════════════════════════════════════════

# Install Minikube (one time)
# Download from: https://minikube.sigs.k8s.io/docs/start/
# Windows: winget install Kubernetes.minikube

# Start Minikube
minikube start --driver=docker --memory=4096 --cpus=2

# Point Docker to Minikube's registry (so it can see your local images)
& minikube -p minikube docker-env --shell powershell | Invoke-Expression

# Build images inside Minikube's Docker
docker build -t careerapex-backend:latest ./backend
docker build -t careerapex-frontend:latest ./frontend

# Create namespace
kubectl apply -f k8s/manifests.yaml

# Create the secret with your actual API keys
kubectl create secret generic careerapex-secrets `
  --from-literal=OPENROUTER_API_KEY=sk-or-v1-xxx `
  --from-literal=LANGCHAIN_API_KEY=lsv2_xxx `
  -n careerapex

# Check everything is running
kubectl get pods -n careerapex
kubectl get services -n careerapex

# Open frontend in browser (Minikube exposes NodePort)
minikube service careerapex-frontend-svc -n careerapex

# View logs
kubectl logs -l app=careerapex-backend -n careerapex
kubectl logs -l app=careerapex-frontend -n careerapex

# Describe a pod (debugging)
kubectl describe pod -l app=careerapex-backend -n careerapex

# Stop Minikube
minikube stop


═══════════════════════════════════════════════════════════════
WHAT TO SAY IN INTERVIEWS
═══════════════════════════════════════════════════════════════

"I containerised the FastAPI backend using a multi-stage Docker build
to keep the image lean — builder stage installs dependencies,
runtime stage copies only what's needed. I pre-download the
HuggingFace embedding model at build time so the first request
isn't slow.

For local development I use Docker Compose — one command spins up
the FastAPI backend, Next.js frontend, and mounts a persistent
volume for ChromaDB. No more managing separate terminals.

For production I deploy the backend to Render using the same
Dockerfile, with a persistent disk mounted at /app/chroma_store.
The frontend is on Vercel, pointing to the Render backend via
NEXT_PUBLIC_API_URL environment variable.

I also wrote Kubernetes manifests for local Minikube deployment —
Deployments, Services, ConfigMap for non-sensitive config,
Secrets for API keys, and a PersistentVolumeClaim for the
vector database. This gave me hands-on experience with the full
K8s primitives."

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from routers.upload import router as upload_router
from routers.analyse import router as analyse_router
from routers.agent import router as agent_router
from routers.memory import router as memory_router
from routers.interview import router as interview_router
from routers.tracker import router as tracker_router
from routers.negotiate import router as negotiate_router
from routers.linkedin import router as linkedin_router

app = FastAPI(
    title="CareerApex AI",
    description="AI Career Operating System",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://careerapex-ai.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload_router)
app.include_router(analyse_router)
app.include_router(agent_router)
app.include_router(memory_router)
app.include_router(interview_router)
app.include_router(tracker_router)
app.include_router(negotiate_router)
app.include_router(linkedin_router)


@app.get("/")
def root():
    return {"status": "CareerApex AI is running", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "ok"}


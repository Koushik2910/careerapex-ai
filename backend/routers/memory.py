from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from memory.session_store import (
    save_session,
    get_session,
    get_user_sessions,
    search_memory,
    get_progress_summary,
)

router = APIRouter(prefix="/memory", tags=["memory"])


# ── Request models ─────────────────────────────────────────────────────────────

class SaveSessionRequest(BaseModel):
    session_id: str
    user_id: Optional[str] = "default"
    match_score: Optional[int] = None
    skill_gaps: Optional[List[Dict]] = []
    strengths: Optional[List[str]] = []
    questions_asked: Optional[int] = 0
    avg_answer_score: Optional[float] = None
    resume_filename: Optional[str] = None
    jd_filename: Optional[str] = None
    notes: Optional[str] = None


class SearchRequest(BaseModel):
    query: str
    user_id: Optional[str] = "default"
    top_k: Optional[int] = 3


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.post("/save")
def save_session_endpoint(request: SaveSessionRequest):
    """Save a session summary to career memory."""
    try:
        result = save_session(
            session_id=request.session_id,
            user_id=request.user_id,
            match_score=request.match_score,
            skill_gaps=request.skill_gaps,
            strengths=request.strengths,
            questions_asked=request.questions_asked,
            avg_answer_score=request.avg_answer_score,
            resume_filename=request.resume_filename,
            jd_filename=request.jd_filename,
            notes=request.notes,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save session: {str(e)}")


@router.get("/session/{session_id}")
def get_session_endpoint(session_id: str):
    """Get a specific session from memory."""
    result = get_session(session_id)
    if not result:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found in memory.")
    return result


@router.get("/sessions")
def get_sessions_endpoint(user_id: str = Query(default="default")):
    """Get all sessions for a user sorted by most recent."""
    sessions = get_user_sessions(user_id)
    return {"user_id": user_id, "count": len(sessions), "sessions": sessions}


@router.post("/search")
def search_memory_endpoint(request: SearchRequest):
    """Semantic search across past sessions."""
    try:
        results = search_memory(
            query=request.query,
            user_id=request.user_id,
            top_k=request.top_k,
        )
        return {"query": request.query, "results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Memory search failed: {str(e)}")


@router.get("/progress")
def get_progress_endpoint(user_id: str = Query(default="default")):
    """Get progress comparison between latest and previous session."""
    return get_progress_summary(user_id)

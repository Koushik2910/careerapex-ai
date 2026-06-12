"""
Memory Router — Session storage and retrieval endpoints.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Any, Dict
from memory.session_store import (
    save_session, get_session, list_sessions,
    search_sessions, get_progress_summary, delete_session,
)

router = APIRouter(prefix="/memory", tags=["memory"])


class SaveSessionRequest(BaseModel):
    session_id: str
    resume_filename: str = ""
    jd_filename: str = ""
    match_score: int = 0
    skill_gaps: List[Any] = []
    strengths: List[str] = []
    questions_asked: int = 0
    avg_answer_score: float = 0.0
    analysis_data: Optional[Dict] = None
    user_id: str = "default"


class SearchRequest(BaseModel):
    query: str
    n_results: int = 5


@router.post("/save")
def save_session_endpoint(req: SaveSessionRequest):
    try:
        return save_session(
            session_id=req.session_id,
            resume_filename=req.resume_filename,
            jd_filename=req.jd_filename,
            match_score=req.match_score,
            skill_gaps=req.skill_gaps,
            strengths=req.strengths,
            questions_asked=req.questions_asked,
            avg_answer_score=req.avg_answer_score,
            analysis_data=req.analysis_data,
            user_id=req.user_id,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Save failed: {str(e)}")


@router.get("/session/{session_id}")
def get_session_endpoint(session_id: str):
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session not found: {session_id}")
    return session


@router.delete("/session/{session_id}")
def delete_session_endpoint(session_id: str):
    try:
        result = delete_session(session_id)
        if not result:
            raise HTTPException(status_code=404, detail=f"Session not found: {session_id}")
        return {"deleted": True, "session_id": session_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}")


@router.get("/sessions")
def list_sessions_endpoint(user_id: str = "default", limit: int = 100):
    sessions = list_sessions(user_id=user_id, limit=limit)
    return {"sessions": sessions, "count": len(sessions)}


@router.post("/search")
def search_sessions_endpoint(req: SearchRequest):
    results = search_sessions(query=req.query, n_results=req.n_results)
    return {"results": results, "count": len(results)}


@router.get("/progress")
def get_progress_endpoint(user_id: str = "default"):
    return get_progress_summary(user_id=user_id)

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from chains.confidence_tracker import (
    save_answer_score,
    get_session_scores,
    get_confidence_summary,
)

router = APIRouter(prefix="/tracker", tags=["tracker"])


class SaveScoreRequest(BaseModel):
    session_id: str
    question: str
    answer: str
    category: str
    score: int
    confidence_score: int
    feedback: str
    question_index: int


@router.post("/save")
def save_score(request: SaveScoreRequest):
    """Save a single answer score to the confidence tracker."""
    try:
        result = save_answer_score(
            session_id=request.session_id,
            question=request.question,
            answer=request.answer,
            category=request.category,
            score=request.score,
            confidence_score=request.confidence_score,
            feedback=request.feedback,
            question_index=request.question_index,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save score: {str(e)}")


@router.get("/scores/{session_id}")
def get_scores(session_id: str):
    """Get all raw answer scores for a session."""
    scores = get_session_scores(session_id)
    return {"session_id": session_id, "scores": scores}


@router.get("/summary/{session_id}")
def get_summary(session_id: str):
    """
    Get full confidence tracker summary.
    Includes avg score, trend, category breakdown, weakest/strongest answers.
    """
    return get_confidence_summary(session_id)

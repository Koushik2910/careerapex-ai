from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional

from chains.interview_chain import run_mock_interview, start_interview, start_defense_mode
from chains.cover_letter import generate_cover_letter

router = APIRouter(prefix="/interview", tags=["interview"])


# ── Request models ─────────────────────────────────────────────────────────────

class InterviewMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class InterviewRequest(BaseModel):
    session_id: str
    message: str
    history: Optional[List[InterviewMessage]] = []
    mode: Optional[str] = "standard"  # "standard" or "defense"


class StartRequest(BaseModel):
    session_id: str
    mode: Optional[str] = "standard"


class CoverLetterRequest(BaseModel):
    session_id: str
    tone: Optional[str] = "professional"


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.post("/start")
def start_interview_endpoint(request: StartRequest):
    """
    Start a mock interview session.
    mode: 'standard' = normal interview, 'defense' = resume defense mode
    """
    try:
        if request.mode == "defense":
            response = start_defense_mode(request.session_id)
        else:
            response = start_interview(request.session_id)

        return {
            "session_id": request.session_id,
            "mode": request.mode,
            "message": response,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start interview: {str(e)}")


@router.post("/chat")
def interview_chat(request: InterviewRequest):
    """
    Send a message in the mock interview.
    Include full history for conversational memory.
    """
    try:
        history = [{"role": m.role, "content": m.content} for m in request.history]

        response = run_mock_interview(
            session_id=request.session_id,
            user_message=request.message,
            history=history,
            mode=request.mode or "standard",
        )

        return {
            "session_id": request.session_id,
            "mode": request.mode,
            "response": response,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Interview chat failed: {str(e)}")


@router.post("/cover-letter")
def cover_letter_endpoint(request: CoverLetterRequest):
    """
    Generate a targeted cover letter from resume + JD.
    """
    try:
        result = generate_cover_letter(
            session_id=request.session_id,
            tone=request.tone or "professional",
        )
        return {"session_id": request.session_id, **result}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cover letter generation failed: {str(e)}")

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict

from chains.negotiation import (
    generate_negotiation_script,
    run_negotiation_roleplay,
    start_negotiation_roleplay,
)

router = APIRouter(prefix="/negotiate", tags=["negotiate"])


# ── Request models ─────────────────────────────────────────────────────────────

class ScriptRequest(BaseModel):
    current_offer: float
    target_salary: float
    role: str
    company: str
    experience_years: int
    competing_offers: Optional[str] = "None"
    strengths: Optional[str] = "Not specified"


class RoleplayStartRequest(BaseModel):
    current_offer: float
    target_salary: float
    company: str


class RoleplayMessage(BaseModel):
    role: str
    content: str


class RoleplayChatRequest(BaseModel):
    current_offer: float
    target_salary: float
    company: str
    message: str
    history: Optional[List[RoleplayMessage]] = []
    mode: Optional[str] = "roleplay"  # "roleplay" or "coach"


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.post("/script")
def get_negotiation_script(request: ScriptRequest):
    """
    Generate a complete salary negotiation strategy and script.
    """
    try:
        script = generate_negotiation_script(
            current_offer=request.current_offer,
            target_salary=request.target_salary,
            role=request.role,
            company=request.company,
            experience_years=request.experience_years,
            competing_offers=request.competing_offers,
            strengths=request.strengths,
        )
        return {
            "current_offer": request.current_offer,
            "target_salary": request.target_salary,
            "script": script,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Script generation failed: {str(e)}")


@router.post("/roleplay/start")
def start_roleplay(request: RoleplayStartRequest):
    """
    Start a salary negotiation roleplay session.
    AI plays the HR manager making the opening call.
    """
    try:
        response = start_negotiation_roleplay(
            current_offer=request.current_offer,
            target_salary=request.target_salary,
            company=request.company,
        )
        return {
            "current_offer": request.current_offer,
            "target_salary": request.target_salary,
            "company": request.company,
            "message": response,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Roleplay start failed: {str(e)}")


@router.post("/roleplay/chat")
def roleplay_chat(request: RoleplayChatRequest):
    """
    Continue the salary negotiation roleplay.
    mode: 'roleplay' = AI plays HR | 'coach' = AI coaches you
    """
    try:
        history = [{"role": m.role, "content": m.content} for m in request.history]

        response = run_negotiation_roleplay(
            current_offer=request.current_offer,
            target_salary=request.target_salary,
            company=request.company,
            user_message=request.message,
            history=history,
            mode=request.mode or "roleplay",
        )
        return {
            "mode": request.mode,
            "response": response,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Roleplay chat failed: {str(e)}")

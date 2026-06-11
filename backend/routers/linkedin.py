from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from chains.linkedin_optimizer import optimize_linkedin_profile, generate_headline_variants

router = APIRouter(prefix="/linkedin", tags=["linkedin"])


# ── Request models ─────────────────────────────────────────────────────────────

class LinkedInOptimizeRequest(BaseModel):
    session_id: str
    headline: str
    about: str


class HeadlineVariantsRequest(BaseModel):
    current_role: str
    target_role: str
    top_skills: str
    years_experience: int


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.post("/optimize")
def optimize_profile(request: LinkedInOptimizeRequest):
    """
    Optimize LinkedIn headline and about section.
    Resume and JD must be uploaded first for best results.
    """
    try:
        result = optimize_linkedin_profile(
            session_id=request.session_id,
            headline=request.headline,
            about=request.about,
        )
        return {"session_id": request.session_id, **result}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LinkedIn optimization failed: {str(e)}")


@router.post("/headlines")
def get_headline_variants(request: HeadlineVariantsRequest):
    """
    Generate 5 LinkedIn headline variants without needing a session.
    Quick tool for anyone who wants headline options.
    """
    try:
        variants = generate_headline_variants(
            current_role=request.current_role,
            target_role=request.target_role,
            top_skills=request.top_skills,
            years_experience=request.years_experience,
        )
        return {"variants": variants}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Headline generation failed: {str(e)}")

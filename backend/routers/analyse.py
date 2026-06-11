from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional

from chains.gap_analyser import run_gap_analysis
from chains.question_gen import generate_questions
from chains.answer_eval import evaluate_answer

router = APIRouter(prefix="/analyse", tags=["analyse"])


# ── Request models ─────────────────────────────────────────────────────────────

class AnswerEvalRequest(BaseModel):
    question: str
    answer: str
    category: Optional[str] = "technical"


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.post("/gaps/{session_id}")
def analyse_gaps(session_id: str):
    """
    Run skill gap analysis for a session.
    Resume and JD must be uploaded first.
    """
    try:
        result = run_gap_analysis(session_id)
        return {"session_id": session_id, **result}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.post("/questions/{session_id}")
def get_questions(
    session_id: str,
    count: int = Query(default=10, ge=5, le=20, description="Number of questions to generate"),
):
    """
    Generate interview questions for a session.
    Resume and JD must be uploaded first.
    """
    try:
        result = generate_questions(session_id, count=count)
        return {"session_id": session_id, **result}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Question generation failed: {str(e)}")


@router.post("/evaluate")
def eval_answer(request: AnswerEvalRequest):
    """
    Evaluate a candidate's answer to an interview question.
    Returns score, confidence score, feedback, strengths, improvements.
    """
    try:
        result = evaluate_answer(
            question=request.question,
            answer=request.answer,
            category=request.category,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")

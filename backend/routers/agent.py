from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List

from agents.career_agent import run_career_agent

router = APIRouter(prefix="/agent", tags=["agent"])


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class AgentRequest(BaseModel):
    session_id: str
    message: str
    history: Optional[List[ChatMessage]] = []


class AgentResponse(BaseModel):
    session_id: str
    response: str


@router.post("/chat", response_model=AgentResponse)
def chat_with_agent(request: AgentRequest):
    """
    Chat with the CareerApex AI career agent.
    The agent can run gap analysis, generate questions, evaluate answers, and give career advice.
    """
    try:
        history = [{"role": m.role, "content": m.content} for m in request.history]

        response = run_career_agent(
            session_id=request.session_id,
            message=request.message,
            history=history,
        )

        return AgentResponse(session_id=request.session_id, response=response)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent error: {str(e)}")

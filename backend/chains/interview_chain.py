import os
from typing import List, Dict, Optional
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

from rag.chroma_client import get_or_create_collection


def get_all_chunks(collection_name: str) -> str:
    collection = get_or_create_collection(collection_name)
    results = collection.get()
    if not results or not results.get("documents"):
        return ""
    return "\n\n".join(results["documents"])


INTERVIEW_SYSTEM = """You are a senior technical interviewer conducting a mock interview.

Your style:
- Ask ONE question at a time
- After the candidate answers, give brief feedback (1-2 sentences)
- Then ask the next question
- Be professional but encouraging
- Vary question types: technical, behavioural, situational, resume-specific
- Gradually increase difficulty

Resume context:
{resume_text}

Job Description context:
{jd_text}

Rules:
- Never ask more than one question per turn
- Keep feedback concise — don't lecture
- After 10 questions total, give a brief session summary with overall impression"""

DEFENSE_SYSTEM = """You are a brutal, skeptical senior interviewer conducting a Resume Defense session.

Your job is to CHALLENGE every claim on the resume aggressively but professionally:
- Pick specific bullet points and demand proof
- Ask "How exactly did you measure that?"
- Challenge vague claims: "What do you mean by 'improved performance'?"
- Push for numbers, specifics, and real examples
- Be tough but not rude — think Goldman Sachs interview style

Resume to attack:
{resume_text}

Rules:
- One challenge at a time
- If the candidate defends well, acknowledge it briefly then attack the next claim
- Score their defense quality (mention score out of 10 after each answer)
- After 8 rounds, give a final defense score and verdict"""


def run_mock_interview(
    session_id: str,
    user_message: str,
    history: List[Dict],
    mode: str = "standard",
) -> str:
    resume_text = get_all_chunks(f"resume_{session_id}")
    jd_text = get_all_chunks(f"jd_{session_id}")

    if not resume_text:
        return "No resume found for this session. Please upload your resume first."

    system_template = DEFENSE_SYSTEM if mode == "defense" else INTERVIEW_SYSTEM
    system_content = system_template.format(
        resume_text=resume_text[:4000],
        jd_text=jd_text[:2000] if jd_text else "Not provided.",
    )

    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=os.getenv("GEMINI_API_KEY"),
        temperature=0.5,
    )

    messages = [SystemMessage(content=system_content)]
    for h in history:
        if h["role"] == "user":
            messages.append(HumanMessage(content=h["content"]))
        else:
            messages.append(AIMessage(content=h["content"]))
    messages.append(HumanMessage(content=user_message))

    response = llm.invoke(messages)
    return response.content


def start_defense_mode(session_id: str) -> str:
    resume_text = get_all_chunks(f"resume_{session_id}")
    if not resume_text:
        return "No resume found. Please upload your resume first."

    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=os.getenv("GEMINI_API_KEY"),
        temperature=0.5,
    )

    system = DEFENSE_SYSTEM.format(resume_text=resume_text[:4000], jd_text="")
    response = llm.invoke([
        SystemMessage(content=system),
        HumanMessage(content="Start the resume defense session. Pick the first claim to challenge."),
    ])
    return response.content


def start_interview(session_id: str) -> str:
    resume_text = get_all_chunks(f"resume_{session_id}")
    jd_text = get_all_chunks(f"jd_{session_id}")

    if not resume_text:
        return "No resume found. Please upload your resume first."

    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=os.getenv("GEMINI_API_KEY"),
        temperature=0.5,
    )

    system = INTERVIEW_SYSTEM.format(
        resume_text=resume_text[:4000],
        jd_text=jd_text[:2000] if jd_text else "Not provided.",
    )
    response = llm.invoke([
        SystemMessage(content=system),
        HumanMessage(content="Start the interview. Introduce yourself briefly and ask the first question."),
    ])
    return response.content

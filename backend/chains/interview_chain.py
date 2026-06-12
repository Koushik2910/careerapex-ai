import os
from typing import List, Dict
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

from rag.chroma_client import get_or_create_collection


def get_all_chunks(collection_name: str) -> str:
    collection = get_or_create_collection(collection_name)
    results = collection.get()
    if not results or not results.get("documents"):
        return ""
    return "\n\n".join(results["documents"])


def get_llm(temperature: float = 0.5) -> ChatOpenAI:
    return ChatOpenAI(
        model="google/gemini-2.5-flash",
        openai_api_key=os.getenv("OPENROUTER_API_KEY"),
        openai_api_base="https://openrouter.ai/api/v1",
        temperature=temperature,
        default_headers={
            "HTTP-Referer": "https://careerapex.ai",
            "X-Title": "CareerApex AI",
        },
    )


INTERVIEW_SYSTEM = """You are a senior technical interviewer conducting a mock interview.
- Ask ONE question at a time
- Give brief feedback (1-2 sentences) after each answer
- Vary question types: technical, behavioural, situational, resume-specific
- Gradually increase difficulty
- After 10 questions, give a session summary

Resume: {resume_text}
JD: {jd_text}"""

DEFENSE_SYSTEM = """You are a brutal, skeptical senior interviewer doing a Resume Defense session.
- Challenge every claim on the resume aggressively but professionally
- Ask "How exactly did you measure that?" and "Prove it with numbers"
- Score defense quality out of 10 after each answer
- After 8 rounds give a final defense score and verdict

Resume: {resume_text}"""


def run_mock_interview(session_id: str, user_message: str, history: List[Dict], mode: str = "standard") -> str:
    resume_text = get_all_chunks(f"resume_{session_id}")
    jd_text = get_all_chunks(f"jd_{session_id}")

    if not resume_text:
        return "No resume found. Please upload your resume first."

    system_template = DEFENSE_SYSTEM if mode == "defense" else INTERVIEW_SYSTEM
    system_content = system_template.format(
        resume_text=resume_text[:4000],
        jd_text=jd_text[:2000] if jd_text else "Not provided.",
    )

    llm = get_llm(temperature=0.5)
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

    llm = get_llm(temperature=0.5)
    system = DEFENSE_SYSTEM.format(resume_text=resume_text[:4000])
    response = llm.invoke([
        SystemMessage(content=system),
        HumanMessage(content="Start the resume defense. Pick the first claim to challenge."),
    ])
    return response.content


def start_interview(session_id: str) -> str:
    resume_text = get_all_chunks(f"resume_{session_id}")
    jd_text = get_all_chunks(f"jd_{session_id}")

    if not resume_text:
        return "No resume found. Please upload your resume first."

    llm = get_llm(temperature=0.5)
    system = INTERVIEW_SYSTEM.format(
        resume_text=resume_text[:4000],
        jd_text=jd_text[:2000] if jd_text else "Not provided.",
    )
    response = llm.invoke([
        SystemMessage(content=system),
        HumanMessage(content="Start the interview. Introduce yourself briefly and ask the first question."),
    ])
    return response.content

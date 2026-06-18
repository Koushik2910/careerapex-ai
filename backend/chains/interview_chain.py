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


# ── Voice interview system prompt — question-only mode ─────────────────────────
# CRITICAL: This prompt is used by the voice interview feature.
# The LLM must ONLY ask a question — never give feedback or respond to answers.
# Feedback is handled separately by the answer evaluator.
VOICE_INTERVIEW_SYSTEM = """You are {interviewer_name}, a senior technical interviewer conducting a structured voice interview.

STRICT RULES:
- You ONLY ask ONE interview question per turn. Nothing else.
- Do NOT give feedback on the candidate's previous answer.
- Do NOT say "That's a great answer" or comment on their response.
- Do NOT have a conversation. Just ask the next question.
- Base every question on the candidate's resume and the job description.
- Each question must be different — do not repeat topics.
- Keep questions concise (2-4 sentences max).

Resume: {resume_text}
JD: {jd_text}"""

# ── Standard mock interview (text-based) — conversational mode ────────────────
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


def run_mock_interview(
    session_id: str,
    user_message: str,
    history: List[Dict],
    mode: str = "standard"
) -> str:
    resume_text = get_all_chunks(f"resume_{session_id}")
    jd_text = get_all_chunks(f"jd_{session_id}")

    if not resume_text:
        return "No resume found. Please upload your resume first."

    # Detect if this is a voice interview call (message contains "Question X of Y")
    is_voice_call = "Question" in user_message and "of" in user_message and (
        "Introduce yourself" in user_message or "Ask Question" in user_message
    )

    if is_voice_call:
        # Voice interview mode — question only, no feedback
        system_content = VOICE_INTERVIEW_SYSTEM.format(
            interviewer_name="Alex",
            resume_text=resume_text[:4000],
            jd_text=jd_text[:2000] if jd_text else "Not provided.",
        )
    elif mode == "defense":
        system_content = DEFENSE_SYSTEM.format(
            resume_text=resume_text[:4000],
            jd_text=jd_text[:2000] if jd_text else "Not provided.",
        )
    else:
        system_content = INTERVIEW_SYSTEM.format(
            resume_text=resume_text[:4000],
            jd_text=jd_text[:2000] if jd_text else "Not provided.",
        )

    llm = get_llm(temperature=0.5)
    messages = [SystemMessage(content=system_content)]

    # For voice calls, only send the instruction — not the full conversation history
    # This prevents the LLM from responding to the candidate's answer instead of asking
    if is_voice_call:
        messages.append(HumanMessage(content=user_message))
    else:
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
    system = DEFENSE_SYSTEM.format(resume_text=resume_text[:4000], jd_text="Not provided.")
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

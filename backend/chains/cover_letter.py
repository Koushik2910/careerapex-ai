import os
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from rag.chroma_client import get_or_create_collection


def get_all_chunks(collection_name: str) -> str:
    collection = get_or_create_collection(collection_name)
    results = collection.get()
    if not results or not results.get("documents"):
        return ""
    return "\n\n".join(results["documents"])


def get_llm(temperature: float = 0.6) -> ChatOpenAI:
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


SYSTEM_PROMPT = """You are an expert career coach writing compelling cover letters that get interviews.
Rules:
- Open with a strong hook — a specific achievement
- Connect resume achievements directly to JD requirements
- Keep it under 350 words, 3 paragraphs + closing
- Sound human, not corporate
- Never use "I am writing to express my interest"
- Tone: {tone}"""

USER_PROMPT = """RESUME:
{resume_text}

JOB DESCRIPTION:
{jd_text}

Write a targeted cover letter for this specific role."""


def generate_cover_letter(session_id: str, tone: str = "professional") -> dict:
    resume_text = get_all_chunks(f"resume_{session_id}")
    jd_text = get_all_chunks(f"jd_{session_id}")

    if not resume_text:
        raise ValueError(f"No resume found for session: {session_id}")
    if not jd_text:
        raise ValueError(f"No JD found for session: {session_id}")

    llm = get_llm(temperature=0.6)
    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        ("human", USER_PROMPT),
    ])
    chain = prompt | llm | StrOutputParser()

    cover_letter = chain.invoke({
        "resume_text": resume_text[:5000],
        "jd_text": jd_text[:2500],
        "tone": tone,
    })
    return {"cover_letter": cover_letter, "word_count": len(cover_letter.split())}

import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from rag.chroma_client import get_or_create_collection


def get_all_chunks(collection_name: str) -> str:
    collection = get_or_create_collection(collection_name)
    results = collection.get()
    if not results or not results.get("documents"):
        return ""
    return "\n\n".join(results["documents"])


SYSTEM_PROMPT = """You are an expert career coach and professional writer who specialises in 
writing compelling, personalised cover letters that get interviews.

Rules:
- Write in a confident, professional tone
- Never use clichés like "I am writing to express my interest"
- Open with a strong hook — a specific achievement or insight
- Connect resume achievements directly to JD requirements
- Show genuine understanding of the company/role
- Keep it to 3 paragraphs + closing — under 350 words
- Sound human, not corporate
- Tone: {tone}"""

USER_PROMPT = """RESUME:
{resume_text}

JOB DESCRIPTION:
{jd_text}

Write a targeted cover letter for this specific role based on this resume."""


def generate_cover_letter(session_id: str, tone: str = "professional") -> dict:
    resume_text = get_all_chunks(f"resume_{session_id}")
    jd_text = get_all_chunks(f"jd_{session_id}")

    if not resume_text:
        raise ValueError(f"No resume found for session: {session_id}")
    if not jd_text:
        raise ValueError(f"No JD found for session: {session_id}")

    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=os.getenv("GEMINI_API_KEY"),
        temperature=0.6,
    )

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

    return {
        "cover_letter": cover_letter,
        "word_count": len(cover_letter.split()),
    }

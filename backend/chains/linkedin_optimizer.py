import os
import json
from typing import List
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.messages import HumanMessage, SystemMessage

from rag.chroma_client import get_or_create_collection


class LinkedInSection(BaseModel):
    original: str
    optimized: str
    improvements: List[str]
    keywords_added: List[str]


class LinkedInAnalysis(BaseModel):
    headline: LinkedInSection
    about: LinkedInSection
    skills_to_add: List[str]
    keywords: List[str]
    profile_strength_score: int
    recommendations: List[str]


def get_all_chunks(collection_name: str) -> str:
    collection = get_or_create_collection(collection_name)
    results = collection.get()
    if not results or not results.get("documents"):
        return ""
    return "\n\n".join(results["documents"])


def get_llm(temperature: float = 0.3) -> ChatOpenAI:
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


SYSTEM_PROMPT = """You are a LinkedIn profile optimization expert.
Return ONLY valid JSON — no markdown:
{{
  "headline": {{"original": "", "optimized": "", "improvements": [], "keywords_added": []}},
  "about": {{"original": "", "optimized": "", "improvements": [], "keywords_added": []}},
  "skills_to_add": [],
  "keywords": [],
  "profile_strength_score": 0,
  "recommendations": []
}}"""

USER_PROMPT = """RESUME: {resume_text}
JD: {jd_text}
HEADLINE: {headline}
ABOUT: {about}
Optimize this LinkedIn profile."""


def optimize_linkedin_profile(session_id: str, headline: str, about: str) -> dict:
    resume_text = get_all_chunks(f"resume_{session_id}")
    jd_text = get_all_chunks(f"jd_{session_id}")

    if not resume_text:
        raise ValueError(f"No resume found for session: {session_id}")

    llm = get_llm(temperature=0.3)
    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        ("human", USER_PROMPT),
    ])
    parser = JsonOutputParser(pydantic_object=LinkedInAnalysis)
    chain = prompt | llm | parser

    return chain.invoke({
        "resume_text": resume_text[:5000],
        "jd_text": jd_text[:2000] if jd_text else "Not provided.",
        "headline": headline,
        "about": about,
    })


def generate_headline_variants(current_role: str, target_role: str, top_skills: str, years_experience: int) -> List[str]:
    llm = get_llm(temperature=0.5)
    prompt = f"""Generate 5 powerful LinkedIn headline variants:
Current Role: {current_role}
Target Role: {target_role}
Skills: {top_skills}
Experience: {years_experience} years

Rules: Under 220 chars, keyword-rich, no "passionate about".
Return ONLY a JSON array: ["headline 1", "headline 2", "headline 3", "headline 4", "headline 5"]"""

    response = llm.invoke([
        SystemMessage(content="You are a LinkedIn personal branding expert."),
        HumanMessage(content=prompt),
    ])
    try:
        content = response.content.strip()
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        return json.loads(content)
    except Exception:
        return [response.content]

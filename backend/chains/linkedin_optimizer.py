import os
import json
from typing import List, Dict, Optional
from pydantic import BaseModel, Field
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.messages import HumanMessage, SystemMessage

from rag.chroma_client import get_or_create_collection


class LinkedInSection(BaseModel):
    original: str = Field(description="Original text provided by user")
    optimized: str = Field(description="Optimized rewrite")
    improvements: List[str] = Field(description="List of specific improvements made")
    keywords_added: List[str] = Field(description="Keywords added for ATS and recruiter visibility")


class LinkedInAnalysis(BaseModel):
    headline: LinkedInSection
    about: LinkedInSection
    skills_to_add: List[str] = Field(description="Top 10 skills to add to LinkedIn Skills section")
    keywords: List[str] = Field(description="Top 15 keywords to use across the profile")
    profile_strength_score: int = Field(description="Overall profile strength 0-100")
    recommendations: List[str] = Field(description="5 actionable recommendations to improve the profile")


def get_all_chunks(collection_name: str) -> str:
    collection = get_or_create_collection(collection_name)
    results = collection.get()
    if not results or not results.get("documents"):
        return ""
    return "\n\n".join(results["documents"])


SYSTEM_PROMPT = """You are a LinkedIn profile optimization expert and personal branding specialist.
You have helped 500+ engineers land jobs at top tech companies by optimizing their LinkedIn profiles.

Rules:
- Write headlines that are specific, keyword-rich, and show clear value
- Write About sections in first person, conversational but professional
- Never use buzzwords like "passionate", "results-driven", "self-starter"
- Use specific numbers and achievements wherever possible
- Optimize for both ATS keyword matching and human readability
- Think like a recruiter searching for this exact role

Return ONLY valid JSON — no markdown, no explanation:
{{
  "headline": {{
    "original": "<original headline>",
    "optimized": "<optimized headline>",
    "improvements": ["<improvement 1>", "<improvement 2>"],
    "keywords_added": ["<keyword 1>", "<keyword 2>"]
  }},
  "about": {{
    "original": "<original about>",
    "optimized": "<optimized about section>",
    "improvements": ["<improvement 1>", "<improvement 2>"],
    "keywords_added": ["<keyword 1>", "<keyword 2>"]
  }},
  "skills_to_add": ["<skill 1>", "<skill 2>"],
  "keywords": ["<keyword 1>", "<keyword 2>"],
  "profile_strength_score": <integer 0-100>,
  "recommendations": ["<recommendation 1>", "<recommendation 2>"]
}}"""

USER_PROMPT = """RESUME:
{resume_text}

JOB DESCRIPTION (target role):
{jd_text}

CURRENT LINKEDIN HEADLINE:
{headline}

CURRENT LINKEDIN ABOUT SECTION:
{about}

Optimize this LinkedIn profile to attract recruiters for the target role."""


def optimize_linkedin_profile(session_id: str, headline: str, about: str) -> dict:
    resume_text = get_all_chunks(f"resume_{session_id}")
    jd_text = get_all_chunks(f"jd_{session_id}")

    if not resume_text:
        raise ValueError(f"No resume found for session: {session_id}")

    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=os.getenv("GEMINI_API_KEY"),
        temperature=0.3,
    )

    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        ("human", USER_PROMPT),
    ])

    parser = JsonOutputParser(pydantic_object=LinkedInAnalysis)
    chain = prompt | llm | parser

    result = chain.invoke({
        "resume_text": resume_text[:5000],
        "jd_text": jd_text[:2000] if jd_text else "Not provided.",
        "headline": headline,
        "about": about,
    })
    return result


def generate_headline_variants(
    current_role: str,
    target_role: str,
    top_skills: str,
    years_experience: int,
) -> List[str]:
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=os.getenv("GEMINI_API_KEY"),
        temperature=0.5,
    )

    prompt = f"""Generate 5 powerful LinkedIn headline variants for someone with these details:
Current Role: {current_role}
Target Role: {target_role}
Top Skills: {top_skills}
Years of Experience: {years_experience}

Rules:
- Under 220 characters each
- Include keywords recruiters search for
- Be specific — no vague terms
- Mix different formats: role-focused, skill-focused, value-focused
- No "passionate about" or "results-driven"

Return ONLY a JSON array of 5 strings. No markdown, no explanation.
Example: ["headline 1", "headline 2", "headline 3", "headline 4", "headline 5"]"""

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

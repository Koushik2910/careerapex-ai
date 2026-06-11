import os
from typing import List
from pydantic import BaseModel, Field
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain_huggingface import HuggingFaceEmbeddings

from rag.chroma_client import get_or_create_collection


# ── Pydantic models ────────────────────────────────────────────────────────────

class SkillGap(BaseModel):
    skill: str = Field(description="Name of the skill")
    required_level: str = Field(description="Level required by the JD: beginner / intermediate / expert")
    current_level: str = Field(description="Level shown in the resume: none / beginner / intermediate / expert")
    gap_score: int = Field(description="Gap severity 0-100. 0 = no gap, 100 = completely missing")
    priority: str = Field(description="high / medium / low")


class GapAnalysisResult(BaseModel):
    overall_match_score: int = Field(description="Overall resume-JD match 0-100")
    skill_gaps: List[SkillGap] = Field(description="List of identified skill gaps")
    strengths: List[str] = Field(description="Top 5 strengths from the resume matching the JD")
    recommendations: List[str] = Field(description="Top 5 actionable recommendations to close gaps")
    summary: str = Field(description="2-3 sentence executive summary of the analysis")


# ── Helpers ────────────────────────────────────────────────────────────────────

embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")


def get_all_chunks(collection_name: str) -> str:
    collection = get_or_create_collection(collection_name)
    results = collection.get()
    if not results or not results.get("documents"):
        return ""
    return "\n\n".join(results["documents"])


# ── Prompt ─────────────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are an expert technical recruiter and career coach with 15 years of experience.
Analyse the candidate's resume against the job description and return a detailed skill gap analysis.

Return ONLY valid JSON matching this exact structure — no markdown, no explanation:
{{
  "overall_match_score": <integer 0-100>,
  "skill_gaps": [
    {{
      "skill": "<skill name>",
      "required_level": "<beginner|intermediate|expert>",
      "current_level": "<none|beginner|intermediate|expert>",
      "gap_score": <integer 0-100>,
      "priority": "<high|medium|low>"
    }}
  ],
  "strengths": ["<strength 1>", "<strength 2>", ...],
  "recommendations": ["<recommendation 1>", "<recommendation 2>", ...],
  "summary": "<2-3 sentence summary>"
}}"""

USER_PROMPT = """RESUME:
{resume_text}

JOB DESCRIPTION:
{jd_text}

Analyse the resume against the job description and return the JSON gap analysis."""


# ── Main analyser function ─────────────────────────────────────────────────────

def run_gap_analysis(session_id: str) -> dict:
    resume_text = get_all_chunks(f"resume_{session_id}")
    jd_text = get_all_chunks(f"jd_{session_id}")

    if not resume_text:
        raise ValueError(f"No resume found for session: {session_id}")
    if not jd_text:
        raise ValueError(f"No JD found for session: {session_id}")

    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=os.getenv("GEMINI_API_KEY"),
        temperature=0.2,
    )

    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        ("human", USER_PROMPT),
    ])

    parser = JsonOutputParser(pydantic_object=GapAnalysisResult)
    chain = prompt | llm | parser

    result = chain.invoke({
        "resume_text": resume_text[:6000],
        "jd_text": jd_text[:3000],
    })

    return result

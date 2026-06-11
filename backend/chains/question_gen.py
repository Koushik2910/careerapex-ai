import os
from typing import List
from pydantic import BaseModel, Field
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser

from rag.chroma_client import get_or_create_collection


class InterviewQuestion(BaseModel):
    question: str = Field(description="The interview question")
    category: str = Field(description="technical / behavioural / resume / situational")
    difficulty: str = Field(description="easy / medium / hard")
    hint: str = Field(description="A brief hint on what a good answer covers")


class QuestionsResult(BaseModel):
    questions: List[InterviewQuestion]


def get_all_chunks(collection_name: str) -> str:
    collection = get_or_create_collection(collection_name)
    results = collection.get()
    if not results or not results.get("documents"):
        return ""
    return "\n\n".join(results["documents"])


SYSTEM_PROMPT = """You are an expert technical interviewer with 15 years of experience hiring AI and software engineers.

Generate a set of targeted interview questions based on the resume and job description provided.

Return ONLY valid JSON — no markdown, no explanation:
{{
  "questions": [
    {{
      "question": "<the interview question>",
      "category": "<technical|behavioural|resume|situational>",
      "difficulty": "<easy|medium|hard>",
      "hint": "<brief hint on what a strong answer should cover>"
    }}
  ]
}}

Generate exactly {count} questions distributed across these categories:
- technical: questions about skills, tools, and concepts required by the JD
- behavioural: STAR-format questions about past experience
- resume: questions that directly challenge or probe items on the resume
- situational: hypothetical scenario questions relevant to the role

Mix difficulty levels: 30% easy, 50% medium, 20% hard."""

USER_PROMPT = """RESUME:
{resume_text}

JOB DESCRIPTION:
{jd_text}

Generate {count} interview questions targeted to this specific resume and JD."""


def generate_questions(session_id: str, count: int = 10) -> dict:
    resume_text = get_all_chunks(f"resume_{session_id}")
    jd_text = get_all_chunks(f"jd_{session_id}")

    if not resume_text:
        raise ValueError(f"No resume found for session: {session_id}")
    if not jd_text:
        raise ValueError(f"No JD found for session: {session_id}")

    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=os.getenv("GEMINI_API_KEY"),
        temperature=0.4,
    )

    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        ("human", USER_PROMPT),
    ])

    parser = JsonOutputParser(pydantic_object=QuestionsResult)
    chain = prompt | llm | parser

    result = chain.invoke({
        "resume_text": resume_text[:5000],
        "jd_text": jd_text[:2500],
        "count": count,
    })

    return result

import os
from typing import List
from pydantic import BaseModel, Field
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser


class AnswerEvalResult(BaseModel):
    score: int = Field(description="Overall answer quality score 0-100")
    confidence_score: int = Field(description="Confidence and clarity score 0-100")
    feedback: str = Field(description="2-3 sentence overall feedback")
    strengths: List[str] = Field(description="2-3 things the candidate did well")
    improvements: List[str] = Field(description="2-3 specific things to improve")
    model_answer_hint: str = Field(description="Brief hint of what an ideal answer would cover")


SYSTEM_PROMPT = """You are a strict but fair senior technical interviewer evaluating a candidate's answer.

Score the answer honestly. Do not inflate scores. A average answer scores 50-65. A strong answer scores 75-85. An exceptional answer scores 90+.

Return ONLY valid JSON — no markdown, no explanation:
{{
  "score": <integer 0-100>,
  "confidence_score": <integer 0-100>,
  "feedback": "<2-3 sentence overall feedback>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>"],
  "model_answer_hint": "<what an ideal answer would cover in 2-3 sentences>"
}}

Scoring rubric:
- score: measures correctness, depth, relevance, and structure of the answer
- confidence_score: measures clarity, assertiveness, specificity, and use of concrete examples"""

USER_PROMPT = """QUESTION: {question}
CATEGORY: {category}
CANDIDATE'S ANSWER: {answer}

Evaluate this answer and return the JSON assessment."""


def evaluate_answer(question: str, answer: str, category: str = "technical") -> dict:
    if not answer or len(answer.strip()) < 10:
        return {
            "score": 0,
            "confidence_score": 0,
            "feedback": "No answer provided or answer is too short to evaluate.",
            "strengths": [],
            "improvements": ["Please provide a detailed answer of at least 2-3 sentences."],
            "model_answer_hint": "A complete answer is required for evaluation.",
        }

    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=os.getenv("GEMINI_API_KEY"),
        temperature=0.1,
    )

    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        ("human", USER_PROMPT),
    ])

    parser = JsonOutputParser(pydantic_object=AnswerEvalResult)
    chain = prompt | llm | parser

    result = chain.invoke({
        "question": question,
        "answer": answer,
        "category": category,
    })

    return result

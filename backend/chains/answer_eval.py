import os
from typing import List
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser


class AnswerEvalResult(BaseModel):
    score: int = Field(description="Overall answer quality score 0-100")
    confidence_score: int = Field(description="Confidence and clarity score 0-100")
    feedback: str = Field(description="2-3 sentence overall feedback")
    strengths: List[str] = Field(description="2-3 things the candidate did well")
    improvements: List[str] = Field(description="2-3 specific things to improve")
    model_answer_hint: str = Field(description="Brief hint of what an ideal answer would cover")


def get_llm(temperature: float = 0.1) -> ChatOpenAI:
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


SYSTEM_PROMPT = """You are a strict but fair senior technical interviewer evaluating a candidate's answer.

Score honestly. Average answer: 50-65. Strong: 75-85. Exceptional: 90+.

Return ONLY valid JSON — no markdown:
{{
  "score": <integer 0-100>,
  "confidence_score": <integer 0-100>,
  "feedback": "<2-3 sentence feedback>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>"],
  "model_answer_hint": "<ideal answer in 2-3 sentences>"
}}"""

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

    llm = get_llm(temperature=0.1)
    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        ("human", USER_PROMPT),
    ])
    parser = JsonOutputParser(pydantic_object=AnswerEvalResult)
    chain = prompt | llm | parser

    return chain.invoke({
        "question": question,
        "answer": answer,
        "category": category,
    })

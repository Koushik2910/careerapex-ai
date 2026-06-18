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


SYSTEM_PROMPT = """You are a strict, honest technical interviewer evaluating a candidate's spoken answer.

SCORING RULES — follow these exactly, no exceptions:
- Irrelevant answer (candidate refused, changed topic, said "I cannot tell"): score 0-10
- Very short or vague answer (under 10 words, no technical content): score 5-20
- Partial answer (some relevant content but missing key points): score 30-55
- Average answer (addresses the question but lacks depth): score 50-65
- Good answer (addresses question with some technical depth): score 65-80
- Strong answer (thorough, specific, technical details, examples): score 80-90
- Exceptional (comprehensive, structured, impressive depth): score 90-100

CRITICAL: Do NOT give 65 as a default. Analyse the actual content of the answer.
If the answer is off-topic or a refusal, give 0-15. Be honest — this helps the candidate improve.

Return ONLY valid JSON — no markdown:
{{
  "score": <integer 0-100>,
  "confidence_score": <integer 0-100>,
  "feedback": "<2-3 sentence honest feedback about this specific answer>",
  "strengths": ["<specific strength from this answer>" or "<empty list if none>"],
  "improvements": ["<specific thing to improve based on this answer>"],
  "model_answer_hint": "<what a strong answer to this question would include>"
}}"""

USER_PROMPT = """INTERVIEW QUESTION: {question}

CANDIDATE'S SPOKEN ANSWER: {answer}

ANSWER LENGTH: {word_count} words

Evaluate this specific answer honestly. If the answer is short, vague, off-topic, or a refusal, score it low (0-20). Do not give a generous default score."""


def evaluate_answer(question: str, answer: str, category: str = "technical") -> dict:
    answer = answer.strip()
    word_count = len(answer.split())

    # Immediate low score for clearly bad answers
    if not answer or word_count < 3:
        return {
            "score": 0,
            "confidence_score": 0,
            "feedback": "No answer was provided.",
            "strengths": [],
            "improvements": ["Please provide a detailed answer of at least 2-3 sentences."],
            "model_answer_hint": "A complete, specific answer is required.",
        }

    # Detect obvious refusals / off-topic answers
    refusal_phrases = [
        "i cannot", "i can't", "i don't know", "no i cannot", "sorry i can't",
        "i would like to tell", "i used this audio", "test paper data",
        "sorry no", "i'm not sure", "i don't have",
    ]
    answer_lower = answer.lower()
    is_likely_refusal = any(phrase in answer_lower for phrase in refusal_phrases) and word_count < 15

    if is_likely_refusal:
        return {
            "score": 5,
            "confidence_score": 5,
            "feedback": f"The answer did not address the question. The candidate said: '{answer}'. This does not demonstrate knowledge of the topic.",
            "strengths": [],
            "improvements": [
                "Answer the question being asked — do not refuse or redirect.",
                "If unsure, attempt to explain what you know about the topic.",
                "Prepare answers for projects and skills listed on your resume.",
            ],
            "model_answer_hint": "A strong answer would directly address the technical question with specific examples from experience.",
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
        "word_count": word_count,
        "category": category,
    })

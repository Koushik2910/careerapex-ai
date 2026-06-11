from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum


class UploadResponse(BaseModel):
    session_id: str
    file_type: str  # "resume" or "jd"
    filename: str
    chunks: int
    message: str


class SkillGap(BaseModel):
    skill: str
    required_level: str
    current_level: str
    gap_score: int = Field(..., ge=0, le=100)
    priority: str  # high / medium / low


class AnalyseResponse(BaseModel):
    session_id: str
    overall_match_score: int = Field(..., ge=0, le=100)
    skill_gaps: List[SkillGap]
    strengths: List[str]
    recommendations: List[str]
    summary: str


class QuestionCategory(str, Enum):
    TECHNICAL = "technical"
    BEHAVIOURAL = "behavioural"
    RESUME = "resume"
    SITUATIONAL = "situational"


class InterviewQuestion(BaseModel):
    question: str
    category: QuestionCategory
    difficulty: str  # easy / medium / hard
    hint: Optional[str] = None


class QuestionsResponse(BaseModel):
    session_id: str
    questions: List[InterviewQuestion]


class AnswerEvalRequest(BaseModel):
    session_id: str
    question: str
    answer: str
    category: Optional[str] = None


class AnswerEvalResponse(BaseModel):
    score: int = Field(..., ge=0, le=100)
    confidence_score: int = Field(..., ge=0, le=100)
    feedback: str
    strengths: List[str]
    improvements: List[str]
    model_answer_hint: str


class CoverLetterRequest(BaseModel):
    session_id: str
    tone: Optional[str] = "professional"


class CoverLetterResponse(BaseModel):
    cover_letter: str
    word_count: int


class SessionInfo(BaseModel):
    session_id: str
    has_resume: bool
    has_jd: bool
    resume_filename: Optional[str]
    jd_filename: Optional[str]

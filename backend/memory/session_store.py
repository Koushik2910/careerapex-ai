"""
Career Memory — Session Store with JD filename support.
"""

import json
from datetime import datetime
from typing import Optional, List
import chromadb
from langchain_huggingface import HuggingFaceEmbeddings

client = chromadb.PersistentClient(path="./chroma_store")
embedder = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")


def get_memory_collection():
    return client.get_or_create_collection(
        name="career_memory",
        metadata={"hnsw:space": "cosine"},
    )


def save_session(
    session_id: str,
    resume_filename: str = "",
    jd_filename: str = "",
    match_score: int = 0,
    skill_gaps: list = None,
    strengths: list = None,
    questions_asked: int = 0,
    avg_answer_score: float = 0.0,
    analysis_data: dict = None,
    user_id: str = "default",
) -> dict:
    collection = get_memory_collection()

    gap_skills = []
    for g in (skill_gaps or []):
        if isinstance(g, dict):
            gap_skills.append(g.get("skill", str(g)))
        else:
            gap_skills.append(str(g))

    text = (
        f"Resume: {resume_filename}. JD: {jd_filename}. "
        f"Match score: {match_score}. "
        f"Strengths: {', '.join(strengths or [])}. "
        f"Skill gaps: {', '.join(gap_skills)}"
    )

    embedding = embedder.embed_query(text)
    timestamp = datetime.utcnow().isoformat()

    metadata = {
        "session_id": session_id,
        "user_id": user_id,
        "resume_filename": resume_filename or session_id,
        "jd_filename": jd_filename or "",
        "match_score": int(match_score),
        "questions_asked": int(questions_asked),
        "avg_answer_score": float(avg_answer_score),
        "timestamp": timestamp,
        "analysis_data": json.dumps(analysis_data) if analysis_data else "{}",
        "skill_gaps": json.dumps(gap_skills),
        "strengths": json.dumps(strengths or []),
    }

    collection.upsert(
        ids=[session_id],
        embeddings=[embedding],
        documents=[text],
        metadatas=[metadata],
    )

    return {
        "session_id": session_id,
        "saved_at": timestamp,
        "resume_filename": resume_filename,
        "jd_filename": jd_filename,
        "match_score": match_score,
    }


def get_session(session_id: str) -> Optional[dict]:
    collection = get_memory_collection()
    try:
        result = collection.get(ids=[session_id], include=["metadatas"])
        if not result["ids"]:
            return None
        return _format_session(result["metadatas"][0])
    except Exception:
        return None


def delete_session(session_id: str) -> bool:
    collection = get_memory_collection()
    try:
        existing = collection.get(ids=[session_id])
        if not existing["ids"]:
            return False
        collection.delete(ids=[session_id])
        return True
    except Exception:
        return False


def list_sessions(user_id: str = "default", limit: int = 100) -> List[dict]:
    collection = get_memory_collection()
    try:
        result = collection.get(include=["metadatas"])
        sessions = [_format_session(m) for m in result["metadatas"]]
        sessions.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        return sessions[:limit]
    except Exception:
        return []


def search_sessions(query: str, n_results: int = 5) -> List[dict]:
    collection = get_memory_collection()
    try:
        count = collection.count()
        if count == 0:
            return []
        embedding = embedder.embed_query(query)
        result = collection.query(
            query_embeddings=[embedding],
            n_results=min(n_results, count),
            include=["metadatas"],
        )
        return [_format_session(m) for m in result["metadatas"][0]]
    except Exception:
        return []


def get_progress_summary(user_id: str = "default") -> dict:
    sessions = list_sessions(user_id=user_id)
    if not sessions:
        return {
            "sessions_count": 0,
            "latest_match_score": 0,
            "previous_match_score": 0,
            "match_score_delta": 0,
            "latest_avg_answer_score": 0,
            "message": "No sessions yet. Upload your resume to get started.",
        }
    latest = sessions[0]
    previous = sessions[1] if len(sessions) > 1 else None
    latest_score = latest.get("match_score", 0)
    prev_score = previous.get("match_score", 0) if previous else 0
    delta = latest_score - prev_score
    return {
        "sessions_count": len(sessions),
        "latest_match_score": latest_score,
        "previous_match_score": prev_score,
        "match_score_delta": delta,
        "latest_avg_answer_score": latest.get("avg_answer_score", 0),
        "message": _progress_message(delta, latest_score),
    }


def _format_session(meta: dict) -> dict:
    try:
        skill_gaps = json.loads(meta.get("skill_gaps", "[]"))
    except Exception:
        skill_gaps = []
    try:
        strengths = json.loads(meta.get("strengths", "[]"))
    except Exception:
        strengths = []
    try:
        analysis_data = json.loads(meta.get("analysis_data", "{}"))
    except Exception:
        analysis_data = {}
    return {
        "session_id": meta.get("session_id", ""),
        "resume_filename": meta.get("resume_filename", meta.get("session_id", "")),
        "jd_filename": meta.get("jd_filename", ""),
        "match_score": int(meta.get("match_score", 0)),
        "questions_asked": int(meta.get("questions_asked", 0)),
        "avg_answer_score": float(meta.get("avg_answer_score", 0)),
        "timestamp": meta.get("timestamp", ""),
        "skill_gaps": skill_gaps,
        "strengths": strengths,
        "analysis_data": analysis_data,
        "user_id": meta.get("user_id", "default"),
    }


def _progress_message(delta: int, latest: int) -> str:
    if delta > 0:
        return f"Match score improved by {delta} points since last session."
    elif delta < 0:
        return f"Match score dropped by {abs(delta)} points since last session."
    return f"Match score consistent at {latest}/100."

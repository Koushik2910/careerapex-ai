import os
import json
from datetime import datetime
from typing import Optional, List, Dict, Any
from langchain_huggingface import HuggingFaceEmbeddings
from rag.chroma_client import get_or_create_collection


# ── Embeddings ─────────────────────────────────────────────────────────────────

embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")


# ── Save session ───────────────────────────────────────────────────────────────

def save_session(
    session_id: str,
    user_id: str = "default",
    match_score: Optional[int] = None,
    skill_gaps: Optional[List[Dict]] = None,
    strengths: Optional[List[str]] = None,
    questions_asked: int = 0,
    avg_answer_score: Optional[float] = None,
    resume_filename: Optional[str] = None,
    jd_filename: Optional[str] = None,
    notes: Optional[str] = None,
) -> dict:
    """
    Save a session summary to ChromaDB memory collection.
    """
    collection = get_or_create_collection("career_memory")

    timestamp = datetime.utcnow().isoformat()

    # Build a human-readable summary for semantic search
    gap_text = ""
    if skill_gaps:
        gap_text = "Skill gaps: " + ", ".join(
            [f"{g['skill']} (priority: {g.get('priority', 'medium')})" for g in skill_gaps]
        )

    strength_text = ""
    if strengths:
        strength_text = "Strengths: " + ", ".join(strengths)

    summary_text = (
        f"Session {session_id} on {timestamp}. "
        f"Resume: {resume_filename or 'unknown'}. "
        f"JD: {jd_filename or 'unknown'}. "
        f"Match score: {match_score or 0}/100. "
        f"{gap_text}. "
        f"{strength_text}. "
        f"Questions asked: {questions_asked}. "
        f"Average answer score: {avg_answer_score or 0}/100. "
        f"{notes or ''}"
    )

    metadata = {
        "session_id": session_id,
        "user_id": user_id,
        "timestamp": timestamp,
        "match_score": match_score or 0,
        "questions_asked": questions_asked,
        "avg_answer_score": avg_answer_score or 0.0,
        "resume_filename": resume_filename or "",
        "jd_filename": jd_filename or "",
        "skill_gaps_json": json.dumps(skill_gaps or []),
        "strengths_json": json.dumps(strengths or []),
        "notes": notes or "",
    }

    embedding = embeddings.embed_documents([summary_text])[0]

    # Use session_id as the doc ID so re-saving updates it
    try:
        collection.delete(ids=[session_id])
    except Exception:
        pass

    collection.add(
        ids=[session_id],
        embeddings=[embedding],
        documents=[summary_text],
        metadatas=[metadata],
    )

    return {"session_id": session_id, "saved_at": timestamp, "summary": summary_text}


# ── Get session ────────────────────────────────────────────────────────────────

def get_session(session_id: str) -> Optional[dict]:
    """Retrieve a specific session by ID."""
    collection = get_or_create_collection("career_memory")

    try:
        result = collection.get(ids=[session_id])
        if not result or not result.get("ids"):
            return None

        metadata = result["metadatas"][0]
        metadata["skill_gaps"] = json.loads(metadata.get("skill_gaps_json", "[]"))
        metadata["strengths"] = json.loads(metadata.get("strengths_json", "[]"))
        metadata["summary"] = result["documents"][0]
        return metadata
    except Exception:
        return None


# ── Get all sessions for a user ────────────────────────────────────────────────

def get_user_sessions(user_id: str = "default") -> List[dict]:
    """Get all sessions for a user, sorted by timestamp descending."""
    collection = get_or_create_collection("career_memory")

    try:
        result = collection.get(where={"user_id": user_id})
        if not result or not result.get("ids"):
            return []

        sessions = []
        for i, meta in enumerate(result["metadatas"]):
            meta["skill_gaps"] = json.loads(meta.get("skill_gaps_json", "[]"))
            meta["strengths"] = json.loads(meta.get("strengths_json", "[]"))
            meta["summary"] = result["documents"][i]
            sessions.append(meta)

        # Sort by timestamp descending
        sessions.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        return sessions
    except Exception:
        return []


# ── Semantic search across memory ──────────────────────────────────────────────

def search_memory(query: str, user_id: str = "default", top_k: int = 3) -> List[dict]:
    """
    Semantic search across past sessions.
    e.g. 'sessions where I struggled with system design'
    """
    collection = get_or_create_collection("career_memory")

    query_embedding = embeddings.embed_query(query)

    try:
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            where={"user_id": user_id},
        )

        sessions = []
        if results and results.get("metadatas"):
            for i, meta in enumerate(results["metadatas"][0]):
                meta["skill_gaps"] = json.loads(meta.get("skill_gaps_json", "[]"))
                meta["strengths"] = json.loads(meta.get("strengths_json", "[]"))
                meta["summary"] = results["documents"][0][i]
                sessions.append(meta)

        return sessions
    except Exception:
        return []


# ── Progress comparison ────────────────────────────────────────────────────────

def get_progress_summary(user_id: str = "default") -> dict:
    """
    Compare latest session vs previous session.
    Returns improvement deltas.
    """
    sessions = get_user_sessions(user_id)

    if len(sessions) == 0:
        return {"message": "No sessions found. Upload a resume and JD to get started."}

    if len(sessions) == 1:
        s = sessions[0]
        return {
            "message": "First session recorded.",
            "latest_match_score": s.get("match_score", 0),
            "latest_avg_answer_score": s.get("avg_answer_score", 0),
            "sessions_count": 1,
        }

    latest = sessions[0]
    previous = sessions[1]

    match_delta = latest.get("match_score", 0) - previous.get("match_score", 0)
    answer_delta = latest.get("avg_answer_score", 0) - previous.get("avg_answer_score", 0)

    return {
        "sessions_count": len(sessions),
        "latest_session_id": latest.get("session_id"),
        "previous_session_id": previous.get("session_id"),
        "latest_match_score": latest.get("match_score", 0),
        "previous_match_score": previous.get("match_score", 0),
        "match_score_delta": match_delta,
        "latest_avg_answer_score": latest.get("avg_answer_score", 0),
        "previous_avg_answer_score": previous.get("avg_answer_score", 0),
        "answer_score_delta": round(answer_delta, 1),
        "message": (
            f"Match score {'improved' if match_delta >= 0 else 'dropped'} by "
            f"{abs(match_delta)} points since last session."
        ),
    }

import os
import json
from typing import List, Dict, Optional
from datetime import datetime
from rag.chroma_client import get_or_create_collection


# ── Save a single answer score ─────────────────────────────────────────────────

def save_answer_score(
    session_id: str,
    question: str,
    answer: str,
    category: str,
    score: int,
    confidence_score: int,
    feedback: str,
    question_index: int,
) -> dict:
    """
    Save one answer's score to ChromaDB for this session.
    """
    collection = get_or_create_collection(f"confidence_{session_id}")

    timestamp = datetime.utcnow().isoformat()
    doc_id = f"{session_id}_q{question_index}"

    document = (
        f"Q{question_index}: {question} | "
        f"Answer: {answer[:200]} | "
        f"Score: {score} | Confidence: {confidence_score} | "
        f"Category: {category}"
    )

    metadata = {
        "session_id": session_id,
        "question_index": question_index,
        "question": question[:500],
        "answer": answer[:500],
        "category": category,
        "score": score,
        "confidence_score": confidence_score,
        "feedback": feedback[:500],
        "timestamp": timestamp,
    }

    try:
        collection.delete(ids=[doc_id])
    except Exception:
        pass

    collection.add(
        ids=[doc_id],
        documents=[document],
        metadatas=[metadata],
    )

    return {
        "saved": True,
        "doc_id": doc_id,
        "question_index": question_index,
        "score": score,
        "confidence_score": confidence_score,
    }


# ── Get all scores for a session ───────────────────────────────────────────────

def get_session_scores(session_id: str) -> List[Dict]:
    """
    Get all answer scores for a session, sorted by question index.
    """
    collection = get_or_create_collection(f"confidence_{session_id}")

    try:
        results = collection.get()
        if not results or not results.get("ids"):
            return []

        scores = []
        for meta in results["metadatas"]:
            scores.append({
                "question_index": meta.get("question_index", 0),
                "question": meta.get("question", ""),
                "category": meta.get("category", ""),
                "score": meta.get("score", 0),
                "confidence_score": meta.get("confidence_score", 0),
                "feedback": meta.get("feedback", ""),
                "timestamp": meta.get("timestamp", ""),
            })

        scores.sort(key=lambda x: x["question_index"])
        return scores

    except Exception:
        return []


# ── Compute tracker summary ────────────────────────────────────────────────────

def get_confidence_summary(session_id: str) -> dict:
    """
    Compute full confidence tracker summary for a session.
    Returns avg scores, trend, weak categories, strong categories.
    """
    scores = get_session_scores(session_id)

    if not scores:
        return {
            "session_id": session_id,
            "total_questions": 0,
            "avg_score": 0,
            "avg_confidence": 0,
            "trend": "no data",
            "weak_categories": [],
            "strong_categories": [],
            "scores": [],
            "message": "No answers recorded yet for this session.",
        }

    total = len(scores)
    avg_score = round(sum(s["score"] for s in scores) / total, 1)
    avg_confidence = round(sum(s["confidence_score"] for s in scores) / total, 1)

    # Trend: compare first half vs second half
    if total >= 4:
        mid = total // 2
        first_half_avg = sum(s["score"] for s in scores[:mid]) / mid
        second_half_avg = sum(s["score"] for s in scores[mid:]) / (total - mid)
        delta = second_half_avg - first_half_avg
        if delta > 5:
            trend = "improving"
        elif delta < -5:
            trend = "declining"
        else:
            trend = "consistent"
    else:
        trend = "not enough data"

    # Category breakdown
    category_scores: Dict[str, List[int]] = {}
    for s in scores:
        cat = s["category"]
        if cat not in category_scores:
            category_scores[cat] = []
        category_scores[cat].append(s["score"])

    category_avgs = {
        cat: round(sum(v) / len(v), 1)
        for cat, v in category_scores.items()
    }

    weak_categories = [cat for cat, avg in category_avgs.items() if avg < 65]
    strong_categories = [cat for cat, avg in category_avgs.items() if avg >= 75]

    # Identify weakest and strongest individual questions
    sorted_by_score = sorted(scores, key=lambda x: x["score"])
    weakest = sorted_by_score[:2] if len(sorted_by_score) >= 2 else sorted_by_score
    strongest = sorted_by_score[-2:] if len(sorted_by_score) >= 2 else sorted_by_score

    return {
        "session_id": session_id,
        "total_questions": total,
        "avg_score": avg_score,
        "avg_confidence": avg_confidence,
        "trend": trend,
        "category_breakdown": category_avgs,
        "weak_categories": weak_categories,
        "strong_categories": strong_categories,
        "weakest_answers": weakest,
        "strongest_answers": strongest,
        "scores": scores,
    }

import os
from typing import Annotated, TypedDict, List
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.tools import tool
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode

from chains.gap_analyser import run_gap_analysis
from chains.question_gen import generate_questions
from chains.answer_eval import evaluate_answer


# ── Agent State ────────────────────────────────────────────────────────────────

class AgentState(TypedDict):
    messages: Annotated[list, add_messages]
    session_id: str


# ── Tools ──────────────────────────────────────────────────────────────────────

@tool
def tool_gap_analysis(session_id: str) -> str:
    """
    Run a skill gap analysis comparing the candidate's resume against the job description.
    Returns overall match score, skill gaps, strengths, and recommendations.
    Use this when the user wants to know how well they match a job or what skills they are missing.
    """
    try:
        result = run_gap_analysis(session_id)
        gaps = result.get("skill_gaps", [])
        strengths = result.get("strengths", [])
        score = result.get("overall_match_score", 0)
        summary = result.get("summary", "")

        gap_lines = "\n".join(
            [f"  - {g['skill']} (gap: {g['gap_score']}/100, priority: {g['priority']})" for g in gaps]
        )
        strength_lines = "\n".join([f"  - {s}" for s in strengths])

        return (
            f"Gap Analysis Complete.\n"
            f"Overall Match Score: {score}/100\n\n"
            f"Skill Gaps:\n{gap_lines}\n\n"
            f"Strengths:\n{strength_lines}\n\n"
            f"Summary: {summary}"
        )
    except Exception as e:
        return f"Gap analysis failed: {str(e)}"


@tool
def tool_generate_questions(session_id: str, count: int = 10) -> str:
    """
    Generate targeted interview questions based on the resume and job description.
    Use this when the user wants practice questions or wants to prepare for an interview.
    count should be between 5 and 20.
    """
    try:
        result = generate_questions(session_id, count=count)
        questions = result.get("questions", [])
        lines = []
        for i, q in enumerate(questions, 1):
            lines.append(
                f"{i}. [{q['category'].upper()} | {q['difficulty']}] {q['question']}\n"
                f"   Hint: {q['hint']}"
            )
        return f"Generated {len(questions)} Interview Questions:\n\n" + "\n\n".join(lines)
    except Exception as e:
        return f"Question generation failed: {str(e)}"


@tool
def tool_evaluate_answer(question: str, answer: str, category: str = "technical") -> str:
    """
    Evaluate a candidate's answer to an interview question.
    Returns score, confidence score, feedback, strengths, and improvements.
    Use this when the user provides an answer and wants it assessed.
    """
    try:
        result = evaluate_answer(question=question, answer=answer, category=category)
        strengths = "\n".join([f"  + {s}" for s in result.get("strengths", [])])
        improvements = "\n".join([f"  - {i}" for i in result.get("improvements", [])])
        return (
            f"Answer Evaluation:\n"
            f"Score: {result.get('score')}/100\n"
            f"Confidence: {result.get('confidence_score')}/100\n\n"
            f"Feedback: {result.get('feedback')}\n\n"
            f"Strengths:\n{strengths}\n\n"
            f"Areas to Improve:\n{improvements}\n\n"
            f"Model Answer Hint: {result.get('model_answer_hint')}"
        )
    except Exception as e:
        return f"Answer evaluation failed: {str(e)}"


@tool
def tool_career_advice(topic: str) -> str:
    """
    Provide general career advice on topics like salary negotiation, LinkedIn optimization,
    interview tips, career transitions, or resume writing.
    Use this for general career questions that don't require resume or JD data.
    """
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=os.getenv("GEMINI_API_KEY"),
        temperature=0.5,
    )
    response = llm.invoke([
        SystemMessage(content="You are an expert career coach. Give practical, actionable advice."),
        HumanMessage(content=f"Give me career advice on: {topic}"),
    ])
    return response.content


# ── Agent Builder ──────────────────────────────────────────────────────────────

tools = [
    tool_gap_analysis,
    tool_generate_questions,
    tool_evaluate_answer,
    tool_career_advice,
]


def build_career_agent():
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=os.getenv("GEMINI_API_KEY"),
        temperature=0.3,
    ).bind_tools(tools)

    tool_node = ToolNode(tools)

    SYSTEM = """You are CareerApex AI — an expert AI career coach and interview preparation assistant.

You help candidates:
- Analyse their resume against job descriptions
- Identify skill gaps and strengths
- Generate targeted interview questions
- Evaluate their answers with detailed feedback
- Provide career advice on any topic

You have access to tools. Always use the appropriate tool when the user asks about their resume, gaps, questions, or answer evaluation.
When calling tools that need session_id, use the session_id provided in the conversation context.
Be concise, direct, and encouraging."""

    def call_model(state: AgentState):
        messages = state["messages"]
        session_id = state.get("session_id", "")
        system_msg = SystemMessage(
            content=f"{SYSTEM}\n\nCurrent session_id: {session_id}"
        )
        response = llm.invoke([system_msg] + messages)
        return {"messages": [response]}

    def should_continue(state: AgentState):
        last_message = state["messages"][-1]
        if hasattr(last_message, "tool_calls") and last_message.tool_calls:
            return "tools"
        return END

    graph = StateGraph(AgentState)
    graph.add_node("agent", call_model)
    graph.add_node("tools", tool_node)
    graph.set_entry_point("agent")
    graph.add_conditional_edges("agent", should_continue)
    graph.add_edge("tools", "agent")

    return graph.compile()


def run_career_agent(session_id: str, message: str, history: list = None) -> str:
    agent = build_career_agent()
    messages = []
    if history:
        for h in history:
            if h["role"] == "user":
                messages.append(HumanMessage(content=h["content"]))
            else:
                messages.append(AIMessage(content=h["content"]))
    messages.append(HumanMessage(content=message))
    result = agent.invoke({
        "messages": messages,
        "session_id": session_id,
    })
    last_message = result["messages"][-1]
    content = last_message.content
    # Gemini returns content as list of blocks — extract text
    if isinstance(content, list):
        return " ".join(
            block.get("text", "") if isinstance(block, dict) else str(block)
            for block in content
        )
    return content

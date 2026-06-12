import os
from typing import Annotated, TypedDict, List
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.tools import tool
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode

from chains.gap_analyser import run_gap_analysis
from chains.question_gen import generate_questions
from chains.answer_eval import evaluate_answer


class AgentState(TypedDict):
    messages: Annotated[list, add_messages]
    session_id: str


def get_llm(temperature: float = 0.3) -> ChatOpenAI:
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


@tool
def tool_gap_analysis(session_id: str) -> str:
    """Run skill gap analysis comparing resume vs job description. Returns match score, gaps, strengths."""
    try:
        result = run_gap_analysis(session_id)
        gaps = result.get("skill_gaps", [])
        score = result.get("overall_match_score", 0)
        summary = result.get("summary", "")
        gap_lines = "\n".join([f"  - {g['skill']} (gap: {g['gap_score']}/100, priority: {g['priority']})" for g in gaps])
        strength_lines = "\n".join([f"  - {s}" for s in result.get("strengths", [])])
        return f"Match Score: {score}/100\n\nGaps:\n{gap_lines}\n\nStrengths:\n{strength_lines}\n\nSummary: {summary}"
    except Exception as e:
        return f"Gap analysis failed: {str(e)}"


@tool
def tool_generate_questions(session_id: str, count: int = 10) -> str:
    """Generate targeted interview questions from resume and JD. count between 5-20."""
    try:
        result = generate_questions(session_id, count=count)
        questions = result.get("questions", [])
        lines = [f"{i}. [{q['category'].upper()} | {q['difficulty']}] {q['question']}\n   Hint: {q['hint']}" for i, q in enumerate(questions, 1)]
        return f"Generated {len(questions)} questions:\n\n" + "\n\n".join(lines)
    except Exception as e:
        return f"Question generation failed: {str(e)}"


@tool
def tool_evaluate_answer(question: str, answer: str, category: str = "technical") -> str:
    """Evaluate a candidate's answer. Returns score, confidence, feedback, improvements."""
    try:
        result = evaluate_answer(question=question, answer=answer, category=category)
        return (
            f"Score: {result.get('score')}/100 | Confidence: {result.get('confidence_score')}/100\n"
            f"Feedback: {result.get('feedback')}\n"
            f"Strengths: {', '.join(result.get('strengths', []))}\n"
            f"Improve: {', '.join(result.get('improvements', []))}"
        )
    except Exception as e:
        return f"Evaluation failed: {str(e)}"


@tool
def tool_career_advice(topic: str) -> str:
    """General career advice on salary, LinkedIn, interviews, transitions."""
    llm = get_llm(temperature=0.5)
    response = llm.invoke([
        SystemMessage(content="You are an expert career coach. Give practical, actionable advice."),
        HumanMessage(content=f"Career advice on: {topic}"),
    ])
    return response.content


tools = [tool_gap_analysis, tool_generate_questions, tool_evaluate_answer, tool_career_advice]


def build_career_agent():
    llm = get_llm(temperature=0.3).bind_tools(tools)
    tool_node = ToolNode(tools)

    SYSTEM = """You are CareerApex AI — an expert AI career coach.
You help candidates analyse resumes, identify skill gaps, generate interview questions,
evaluate answers, and provide career advice.
Use tools when appropriate. session_id is provided in context.
Be concise, direct, and encouraging."""

    def call_model(state: AgentState):
        session_id = state.get("session_id", "")
        system_msg = SystemMessage(content=f"{SYSTEM}\n\nCurrent session_id: {session_id}")
        response = llm.invoke([system_msg] + state["messages"])
        return {"messages": [response]}

    def should_continue(state: AgentState):
        last = state["messages"][-1]
        if hasattr(last, "tool_calls") and last.tool_calls:
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
            messages.append(HumanMessage(content=h["content"]) if h["role"] == "user" else AIMessage(content=h["content"]))
    messages.append(HumanMessage(content=message))

    result = agent.invoke({"messages": messages, "session_id": session_id})
    last = result["messages"][-1]
    content = last.content
    if isinstance(content, list):
        return " ".join(block.get("text", "") if isinstance(block, dict) else str(block) for block in content)
    return content

import os
from typing import List, Dict, Optional
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage


SCRIPT_SYSTEM = """You are an expert salary negotiation coach with 20 years of experience 
helping candidates at top tech companies negotiate compensation packages.

You are direct, strategic, and data-driven. You know exactly what works and what doesn't.

Given the candidate's situation, generate a complete negotiation strategy and opening script."""

SCRIPT_PROMPT = """CANDIDATE SITUATION:
Current Offer: {current_offer} LPA
Target Salary: {target_salary} LPA
Role: {role}
Company: {company}
Years of Experience: {experience_years} years
Competing Offers: {competing_offers}
Key Strengths: {strengths}

Generate a complete salary negotiation strategy with:
1. Opening statement (word for word script they can say/email)
2. Key leverage points to use
3. Anchoring strategy
4. How to handle pushback
5. Minimum acceptable offer and walk-away point
6. Counter-offer script if they say "this is our best offer"

Be specific, tactical, and direct. Use exact numbers."""

ROLEPLAY_SYSTEM = """You are playing the role of an HR Manager / Recruiter at {company}.

The candidate is trying to negotiate their salary from {current_offer} LPA to {target_salary} LPA.

Your role:
- Start friendly but firm — the offer is already "competitive"
- Push back on unreasonable asks
- Give ground slowly and only when well-argued
- Use classic HR tactics: "budget constraints", "internal equity", "let me check with the team"
- If the candidate makes a strong argument, acknowledge it and move slightly
- After 6 exchanges, make a final offer somewhere between current and target
- Be realistic — not a pushover, not impossible

Stay in character throughout. This is a roleplay to help the candidate practice."""

COACH_SYSTEM = """You are a salary negotiation coach observing a practice negotiation session.

After each candidate response in the roleplay, provide:
1. Quick assessment of their last response (1-2 sentences)
2. What they did well
3. What to improve or say differently
4. The next tactical move they should make

Be brief, direct, and tactical."""


def generate_negotiation_script(
    current_offer: float,
    target_salary: float,
    role: str,
    company: str,
    experience_years: int,
    competing_offers: str = "None",
    strengths: str = "Not specified",
) -> str:
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=os.getenv("GEMINI_API_KEY"),
        temperature=0.4,
    )

    prompt = SCRIPT_PROMPT.format(
        current_offer=current_offer,
        target_salary=target_salary,
        role=role,
        company=company,
        experience_years=experience_years,
        competing_offers=competing_offers,
        strengths=strengths,
    )

    response = llm.invoke([
        SystemMessage(content=SCRIPT_SYSTEM),
        HumanMessage(content=prompt),
    ])
    return response.content


def run_negotiation_roleplay(
    current_offer: float,
    target_salary: float,
    company: str,
    user_message: str,
    history: List[Dict],
    mode: str = "roleplay",
) -> str:
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=os.getenv("GEMINI_API_KEY"),
        temperature=0.6,
    )

    system_content = COACH_SYSTEM if mode == "coach" else ROLEPLAY_SYSTEM.format(
        company=company,
        current_offer=current_offer,
        target_salary=target_salary,
    )

    messages = [SystemMessage(content=system_content)]
    for h in history:
        if h["role"] == "user":
            messages.append(HumanMessage(content=h["content"]))
        else:
            messages.append(AIMessage(content=h["content"]))
    messages.append(HumanMessage(content=user_message))

    response = llm.invoke(messages)
    return response.content


def start_negotiation_roleplay(
    current_offer: float,
    target_salary: float,
    company: str,
) -> str:
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=os.getenv("GEMINI_API_KEY"),
        temperature=0.5,
    )

    system = ROLEPLAY_SYSTEM.format(
        company=company,
        current_offer=current_offer,
        target_salary=target_salary,
    )

    response = llm.invoke([
        SystemMessage(content=system),
        HumanMessage(content=(
            f"Start the negotiation call. You've just extended an offer of {current_offer} LPA "
            f"to the candidate. Call them to discuss the offer. Be warm but firm."
        )),
    ])
    return response.content

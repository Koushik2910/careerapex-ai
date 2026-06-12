import os
from typing import List, Dict
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage


def get_llm(temperature: float = 0.5) -> ChatOpenAI:
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


SCRIPT_SYSTEM = """You are an expert salary negotiation coach with 20 years of experience.
Generate a complete negotiation strategy — direct, tactical, with exact numbers."""

SCRIPT_PROMPT = """Current Offer: {current_offer} LPA
Target Salary: {target_salary} LPA
Role: {role} | Company: {company}
Experience: {experience_years} years
Competing Offers: {competing_offers}
Strengths: {strengths}

Generate:
1. Opening statement (word-for-word script)
2. Key leverage points
3. Anchoring strategy
4. How to handle pushback
5. Minimum acceptable offer and walk-away point
6. Counter-offer script"""

ROLEPLAY_SYSTEM = """You are an HR Manager at {company}. The candidate wants {target_salary} LPA but you offered {current_offer} LPA.
Be friendly but firm. Give ground slowly. After 6 exchanges make a final offer between current and target."""

COACH_SYSTEM = """You are a salary negotiation coach. After each candidate response give:
1. Quick assessment (1-2 sentences)
2. What they did well
3. What to improve
4. Next tactical move"""


def generate_negotiation_script(current_offer, target_salary, role, company, experience_years, competing_offers="None", strengths="Not specified") -> str:
    llm = get_llm(temperature=0.4)
    response = llm.invoke([
        SystemMessage(content=SCRIPT_SYSTEM),
        HumanMessage(content=SCRIPT_PROMPT.format(
            current_offer=current_offer, target_salary=target_salary,
            role=role, company=company, experience_years=experience_years,
            competing_offers=competing_offers, strengths=strengths,
        )),
    ])
    return response.content


def run_negotiation_roleplay(current_offer, target_salary, company, user_message, history: List[Dict], mode="roleplay") -> str:
    llm = get_llm(temperature=0.6)
    system_content = COACH_SYSTEM if mode == "coach" else ROLEPLAY_SYSTEM.format(
        company=company, current_offer=current_offer, target_salary=target_salary,
    )
    messages = [SystemMessage(content=system_content)]
    for h in history:
        messages.append(HumanMessage(content=h["content"]) if h["role"] == "user" else AIMessage(content=h["content"]))
    messages.append(HumanMessage(content=user_message))
    return llm.invoke(messages).content


def start_negotiation_roleplay(current_offer, target_salary, company) -> str:
    llm = get_llm(temperature=0.5)
    system = ROLEPLAY_SYSTEM.format(company=company, current_offer=current_offer, target_salary=target_salary)
    response = llm.invoke([
        SystemMessage(content=system),
        HumanMessage(content=f"Start the call. You extended {current_offer} LPA. Be warm but firm."),
    ])
    return response.content

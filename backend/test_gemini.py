"""
test_gemini.py — Verify Gemini 2.5 Flash API key is working.
Run from: careerapex/backend
Command:  python test_gemini.py
"""

import os
import sys
from dotenv import load_dotenv

load_dotenv()

def test_gemini_connection():
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        print("❌ GEMINI_API_KEY not found in .env file")
        print("   Add GEMINI_API_KEY=your_key_here to backend/.env")
        sys.exit(1)

    print(f"✓ GEMINI_API_KEY found ({api_key[:8]}...)")

    try:
        from langchain_google_genai import ChatGoogleGenerativeAI
        from langchain_core.messages import HumanMessage

        llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=api_key,
            temperature=0.1,
        )

        print("✓ ChatGoogleGenerativeAI initialized")
        print("  Sending test message to Gemini 2.5 Flash...")

        response = llm.invoke([
            HumanMessage(content="Reply with exactly: GEMINI_OK")
        ])

        reply = response.content.strip()
        print(f"  Response: {reply}")

        if "GEMINI_OK" in reply:
            print("✅ Gemini 2.5 Flash is working correctly!")
        else:
            print(f"⚠️  Got response but unexpected content: {reply}")
            print("   API is working — model responded successfully")

    except ImportError:
        print("❌ langchain-google-genai not installed")
        print("   Run: pip install langchain-google-genai")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Gemini API call failed: {str(e)}")
        sys.exit(1)


def test_json_output():
    """Test structured JSON output — used by gap analyser and question gen."""
    from langchain_google_genai import ChatGoogleGenerativeAI
    from langchain_core.messages import HumanMessage, SystemMessage

    api_key = os.getenv("GEMINI_API_KEY")
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=api_key,
        temperature=0.1,
    )

    print("\n  Testing JSON structured output...")
    response = llm.invoke([
        SystemMessage(content="Return ONLY valid JSON, no markdown."),
        HumanMessage(content='Return this exact JSON: {"status": "ok", "model": "gemini-2.5-flash"}'),
    ])

    import json
    content = response.content.strip()
    if content.startswith("```"):
        content = content.split("```")[1]
        if content.startswith("json"):
            content = content[4:]

    parsed = json.loads(content)
    assert parsed["status"] == "ok"
    print("✅ JSON structured output working!")


if __name__ == "__main__":
    print("=" * 50)
    print("CareerApex — Gemini 2.5 Flash Verification")
    print("=" * 50)
    test_gemini_connection()
    test_json_output()
    print("\n✅ All checks passed. Ready to use Gemini 2.5 Flash.")

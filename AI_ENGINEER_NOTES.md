# CAREERAPEX AI — AI ENGINEER NOTES
**Purpose:** Interview-ready explanations of every AI concept implemented in CareerApex.

---

## 1. RAG (Retrieval Augmented Generation)

**What it is:** Instead of sending the full resume and JD to the LLM every time (expensive, slow), we first find the most relevant pieces, then send only those.

**Where implemented:** `backend/chains/gap_analyser.py`, `interview_chain.py`, `cover_letter.py`

**How it works in CareerApex:**
1. User uploads resume PDF → PyPDF extracts text
2. Text split into ~500-char chunks (RecursiveCharacterTextSplitter, chunk_overlap=50)
3. Each chunk converted to 384-dimensional vector by HuggingFace all-MiniLM-L6-v2
4. Vectors stored in ChromaDB collection `resume_{session_id}`
5. Same for JD → stored in `jd_{session_id}`
6. At analysis time: retrieve ALL chunks from both collections → inject into LLM prompt
7. LLM generates gap analysis grounded in actual resume content

**Why not fine-tuning?** Each user has a different resume. Fine-tuning requires thousands of examples and retraining per user — impossible at scale. RAG injects any user's data as context at query time, zero training cost.

**Interview answer:** "I implemented RAG using HuggingFace all-MiniLM-L6-v2 for local embeddings — no API cost, no rate limits. Chunks are stored in ChromaDB namespaced by session ID. At analysis time, all relevant chunks are retrieved and injected into the LLM prompt as context, so Gemini only generates responses grounded in the actual resume text."

---

## 2. LangChain LCEL (LangChain Expression Language)

**What it is:** A framework for building AI pipelines by chaining prompts, LLMs, and output parsers using the `|` operator.

**Where implemented:** All 8 chain files in `backend/chains/`

**Pattern used:**
```python
chain = prompt_template | llm | output_parser
result = chain.invoke({"resume_text": ..., "jd_text": ...})
```

**Why used:**
- Clean, readable chain composition
- Built-in LangSmith tracing (zero extra code)
- Output parsers with automatic retry on malformed JSON
- Consistent interface across all chains

**Chains built:**
- `gap_analyser.py` — JsonOutputParser with Pydantic schema validation
- `answer_eval.py` — strict scoring with refusal detection before LLM call
- `interview_chain.py` — mode-switching (text vs voice) with different system prompts
- `cover_letter.py` — StrOutputParser (plain text output)
- Others — negotiation, LinkedIn, question gen

**Interview answer:** "I built 8 LangChain LCEL chains. Each uses the pipe operator to compose prompt template, ChatOpenAI with OpenRouter, and an output parser. The gap analyser uses JsonOutputParser with a Pydantic schema for structured output validation. LangSmith tracing fires automatically — I can see every prompt, response, token count, and cost without any extra code."

---

## 3. LangGraph (ReAct Agent)

**What it is:** An extension of LangChain that adds agent loops with conditional edges and state management. The LLM decides which tool to call based on user input.

**Where implemented:** `backend/agents/career_agent.py`

**How it works:**
1. User sends a free-form career question
2. LangGraph ReAct loop: Reason → Act (call tool) → Observe → Reason again
3. Agent has 4 tools: gap_analysis_tool, question_generator_tool, answer_evaluator_tool, career_advice_tool
4. Agent decides which tools to call based on intent
5. Loop terminates when agent has enough to answer

**Why LangGraph over simple if/else:** Users write free-form natural language. Can't write if/else for every possible question. LangGraph lets the LLM decide the tool routing dynamically.

**Interview answer:** "I built a LangGraph ReAct agent with 4 custom tools. The agent determines user intent from natural language and decides which tools to call — it can chain multiple tools in a single turn. For example, 'give me my gaps and practice questions' → agent calls gap_analysis_tool, reads result, then calls question_generator_tool. LangGraph manages the state machine and loop termination."

---

## 4. Embeddings

**What it is:** Converting text into a list of numbers (vector) that represents its meaning. Similar texts produce similar vectors.

**Where implemented:** `backend/routers/upload.py` (HuggingFaceEmbeddings loaded at module level)

**Model used:** `all-MiniLM-L6-v2`
- 384 dimensions
- ~90MB, runs on CPU
- Free, local, no API calls, no rate limits

**Why local embeddings over OpenAI:** OpenAI embeddings cost $0.0001/1000 tokens and require internet. Local HuggingFace runs free, fast, with no external dependency. Trade-off: slightly lower quality than text-embedding-3-large, but sufficient for resume-scale documents.

**How they work in CareerApex:**
- `embeddings.embed_documents(chunks)` → converts each text chunk to 384-dim vector
- Vectors stored in ChromaDB alongside original text
- At retrieval time: query is embedded, ChromaDB finds chunks with highest cosine similarity

**Interview answer:** "I chose HuggingFace all-MiniLM-L6-v2 for embeddings because it runs locally — zero cost, no rate limits, no data sent to third parties. It produces 384-dimensional vectors. The model is loaded once at module startup and stays in memory, so subsequent embedding calls are fast."

---

## 5. ChromaDB (Vector Database)

**What it is:** A database that stores text as vectors (numbers) and finds similar text by measuring the angle between vectors (cosine similarity).

**Where implemented:** `backend/rag/chroma_client.py` — `get_or_create_collection()` helper used everywhere

**Collections in CareerApex:**
| Collection | Stores | Used by |
|---|---|---|
| `resume_{session_id}` | Resume chunks + embeddings | Gap analysis, interview, cover letter |
| `jd_{session_id}` | JD chunks + embeddings | Gap analysis, questions |
| `career_memory` | Session metadata | Dashboard, Memory, Debrief |
| `confidence_{session_id}` | Per-answer scores | Debrief (zero LLM) |

**Why ChromaDB over Pinecone:** ChromaDB is free, local, zero cloud setup — perfect for portfolio. Pinecone is paid managed cloud — better at scale but overkill for a portfolio project. Migration would be minimal since ChromaDB is behind a helper function abstraction.

**Cosine similarity (simple explanation):** Think of each text as an arrow pointing in a direction. Cosine similarity measures the angle between two arrows. Small angle = similar meaning. Large angle = different meaning.

**Interview answer:** "I use ChromaDB as a vector store with four session-namespaced collections. All ChromaDB access goes through a single get_or_create_collection() helper, so migrating to Pinecone in production would mean changing one file. The cache-first architecture means 5 of 11 pages make zero LLM calls — they just read from ChromaDB."

---

## 6. Prompt Engineering

**Where implemented:** Every chain file's SYSTEM_PROMPT and USER_PROMPT constants.

**Techniques used:**

**Structured output prompting (gap_analyser.py, answer_eval.py, linkedin_optimizer.py):**
```
Return ONLY valid JSON — no markdown, no explanation:
{
  "overall_match_score": <integer 0-100>,
  ...
}
```

**Explicit scoring rubric (answer_eval.py):**
```
Score rubric:
- Refuses/off-topic: 0-10
- Vague/no examples: 5-20
- Average/some detail: 50-65
- Good/specific examples: 65-80
- Excellent/measurable impact: 85-95
```

**Mode-specific system prompts (interview_chain.py):**
- VOICE_INTERVIEW_SYSTEM: strict question-only rules, no feedback
- INTERVIEW_SYSTEM: conversational, give feedback
- DEFENSE_SYSTEM: aggressive challenge mode

**Role prompting:**
```
You are a senior technical interviewer conducting a structured voice interview.
STRICT RULES:
- You ONLY ask ONE interview question per turn. Nothing else.
- Do NOT give feedback on the candidate's previous answer.
```

**Topic injection to prevent repetition:**
```
Topics already covered: Q1: "Your resume mentions LangGraph..."; Q2: "Can you explain ChromaDB..."
Do NOT ask about these again — pick a completely different aspect.
```

**Interview answer:** "I use structured output prompting with explicit JSON schemas to get reliable structured responses from Gemini. For answer evaluation, I include an explicit scoring rubric in the prompt — without it, the LLM defaults to safe middle-ground scores. I also implemented refusal detection before the LLM call — obvious non-answers get score 5 immediately without wasting tokens on an LLM call."

---

## 7. Session Management

**What it is:** Each user's resume + JD + interview data is linked by a session ID. No auth — session ID IS the user identity.

**Where implemented:** Frontend `lib/utils.ts` generates, all pages pass to backend.

**Session ID format:** `session-{timestamp}-{random}` e.g. `session-1750000000000-abc123`

**How cross-page continuity works:**
1. Analyse page generates session ID on mount
2. User copies session ID
3. Interview/Voice Studio — user pastes session ID
4. Backend finds `resume_{session_id}` and `jd_{session_id}` in ChromaDB
5. All analysis, scores, cover letter linked to same session ID

**Session ID is consistent in Voice Studio:**
- Setup screen → interview → feedback → Debrief
- Same session ID throughout — "View in Debrief" passes it as URL param

---

## 8. Cache-First Architecture

**What it is:** Save expensive LLM results after first computation. All subsequent reads go to ChromaDB — zero LLM calls.

**Where implemented:** Across multiple pages.

**Pages with ZERO LLM calls:**
- Dashboard — reads `career_memory` aggregate stats
- Skill Gaps — reads cached gap analysis from `career_memory`
- Career Memory — reads `career_memory` session list
- Debrief — reads `confidence_{session_id}` tracker data
- Legacy Voice page — just a redirect card

**Pages that trigger LLM:**
- Analyse — 1 LLM call for gap analysis (then cached)
- Interview/Voice Studio — per question + per answer eval
- Negotiate — per generation
- LinkedIn — per generation
- Roadmap — per generation
- Debrief cover letter — user-triggered

**Interview answer:** "I implemented a cache-first architecture where 5 of 11 pages make zero LLM calls. After the initial gap analysis, results are cached in ChromaDB. Skill Gaps, Dashboard, Memory, and Debrief all read from cache — response times drop from 5+ seconds to under 100ms. This significantly reduces both cost and latency."

---

## 9. Voice Interview Architecture

**What it is:** Browser-native Web Speech API (not a paid service) for text-to-speech and speech-to-text.

**Where implemented:** `frontend/app/voice-studio/page.tsx`

**Key technical decisions:**

**Why continuous=true + silence timer:**
- `continuous=false` (default): SpeechRecognition stops on first natural pause mid-sentence
- `continuous=true`: mic stays open indefinitely
- 2.5-second silence timer: after 2.5s of no new speech events, process the answer
- Allows users to pause and think mid-sentence

**Why all state in useRef (not useState):**
- useState values inside useCallback are stale (capture value at closure creation time)
- useRef always gives current value in any async callback
- `questionCountRef.current` is always accurate even inside async speech recognition handlers

**Why voice mode strips history:**
- With history: LLM sees Q1 answer → responds to it ("Great answer!") instead of asking Q2
- Without history: LLM only sees the question instruction → asks Q2 cleanly
- Detection: "Ask Question X of Y" in message = voice mode

**Topic tracking to prevent repeats:**
- `coveredTopicsRef` array stores first 12 words of each question Alex asked
- Before fetching next question: build `avoidClause` string → inject into message
- LLM receives explicit instruction: "Do NOT ask about these topics again"

**Interview answer:** "The AI Voice Studio uses the browser's built-in Web Speech API — no paid service, no API key. I use SpeechSynthesis for Alex's voice and SpeechRecognition in continuous mode with a 2.5-second silence timer. All interview state is in useRef rather than useState because async speech recognition callbacks capture stale closure values with useState. I also implemented topic tracking — the first 12 words of each question are stored and injected into the next question prompt to prevent repetition."

---

## 10. LLM Observability (LangSmith)

**What it is:** Automatic tracing of every LangChain chain run — exact prompts, responses, token counts, costs, latency.

**Where implemented:** Set `LANGCHAIN_TRACING_V2=true` as env var. Zero code changes needed.

**What it shows:**
- Full prompt text sent to Gemini
- Full response received
- Input + output token counts
- Cost per call
- Latency per chain step
- Chain step breakdown (prompt → llm → parser)

**Interview answer:** "I integrated LangSmith for full observability. With just one environment variable, every chain run is automatically traced. When a chain returns an unexpected answer, I can see the exact prompt that was sent and the exact response received — no debugging blind spots."


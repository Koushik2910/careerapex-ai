"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, Volume2, Square, MessageSquare, User, ChevronRight,
  AlertCircle, Radio, BarChart2, CheckCircle, Clock,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

// ── Constants ──────────────────────────────────────────────────────────────────
const INTERVIEWER_NAME = "Alex";
const MAX_QUESTIONS = 5;
const PREFERRED_VOICES = ["Google US English", "Microsoft David", "Alex", "en-US"];

// ── Types ──────────────────────────────────────────────────────────────────────
type Status = "setup" | "ai-speaking" | "listening" | "processing" | "feedback" | "error";

interface FeedbackItem {
  question: string;
  answer: string;
  score: number;
  confidence_score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

// ── Voice helpers (defined outside component — never recreated) ────────────────
function getVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  for (const name of PREFERRED_VOICES) {
    const found = voices.find(v => v.name.includes(name) && v.lang.startsWith("en"));
    if (found) return found;
  }
  return voices.find(v => v.lang.startsWith("en-US")) || voices[0] || null;
}

function speak(
  text: string,
  onEnd: () => void,
  stoppedRef: React.MutableRefObject<boolean>
) {
  if (stoppedRef.current) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = "en-US";
  utt.rate = 0.90;
  utt.pitch = 1.0;
  utt.volume = 1.0;
  const assignVoice = () => {
    const v = getVoice();
    if (v) utt.voice = v;
  };
  if (window.speechSynthesis.getVoices().length > 0) assignVoice();
  else window.speechSynthesis.onvoiceschanged = assignVoice;
  utt.onend = () => { if (!stoppedRef.current) onEnd(); };
  utt.onerror = () => { if (!stoppedRef.current) onEnd(); };
  window.speechSynthesis.speak(utt);
}

// ── Score color ────────────────────────────────────────────────────────────────
function scoreColor(s: number) {
  return s >= 80 ? "#10B981" : s >= 60 ? "#F59E0B" : "#EF4444";
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function VoiceStudioPage() {
  // ── Setup state ──────────────────────────────────────────────────────────────
  const [sessionId, setSessionId] = useState("");
  const [status, setStatus] = useState<Status>("setup");
  const [error, setError] = useState("");

  // ── Interview state ──────────────────────────────────────────────────────────
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [transcript, setTranscript] = useState("");
  const [questionCount, setQuestionCount] = useState(0);
  const [history, setHistory] = useState<{ role: string; content: string }[]>([]);
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [overallScore, setOverallScore] = useState(0);

  // ── Refs (stable across renders — critical for callbacks) ─────────────────────
  const stoppedRef = useRef(false);
  const recognitionRef = useRef<any>(null);
  const currentQuestionRef = useRef("");
  const questionCountRef = useRef(0);
  const historyRef = useRef<{ role: string; content: string }[]>([]);
  const feedbackListRef = useRef<FeedbackItem[]>([]);
  const sessionIdRef = useRef("");
  const coveredTopicsRef = useRef<string[]>([]); // tracks topics asked so Alex doesn't repeat

  // Keep refs in sync
  useEffect(() => { currentQuestionRef.current = currentQuestion; }, [currentQuestion]);
  useEffect(() => { questionCountRef.current = questionCount; }, [questionCount]);
  useEffect(() => { historyRef.current = history; }, [history]);
  useEffect(() => { feedbackListRef.current = feedbackList; }, [feedbackList]);
  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────────
  useEffect(() => () => {
    stoppedRef.current = true;
    window.speechSynthesis.cancel();
    recognitionRef.current?.abort();
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
  }, []);

  // ── Wake Railway on mount ─────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_BASE}/health`).catch(() => {});
  }, []);

  // ── Save answer to tracker (for Debrief) ─────────────────────────────────────
  const saveToTracker = async (
    question: string,
    answer: string,
    evalResult: any,
    qIndex: number
  ) => {
    try {
      await fetch(`${API_BASE}/tracker/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionIdRef.current,
          question,
          answer,
          category: "technical",
          score: evalResult.score || 0,
          confidence_score: evalResult.confidence_score || 0,
          feedback: evalResult.feedback || "",
          question_index: qIndex,
        }),
      });
    } catch { /* non-blocking — debrief still works from local feedbackList */ }
  };

  // ── Evaluate answer via backend ───────────────────────────────────────────────
  const evaluateAnswer = async (question: string, answer: string): Promise<any> => {
    try {
      const res = await fetch(`${API_BASE}/analyse/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, answer, category: "technical" }),
      });
      if (res.ok) return await res.json();
    } catch {}
    // Fallback if eval fails — use 0 so we don't show fake scores
    return {
      score: 0,
      confidence_score: 0,
      feedback: "Could not evaluate this answer (connection issue). Score not counted.",
      strengths: [],
      improvements: ["Ensure backend is running when answering for accurate evaluation."],
      model_answer_hint: "",
      evalFailed: true,
    };
  };

  // ── Extract topic keywords from a question (used to avoid repeats) ─────────────
  const extractTopic = (questionText: string): string => {
    // Pull the most distinctive noun phrases — first 12 words is usually enough
    return questionText.split(" ").slice(0, 12).join(" ");
  };

  // ── Get next question from backend — with retry ───────────────────────────────
  const getNextQuestion = async (
    count: number,
    currentHistory: { role: string; content: string }[]
  ): Promise<string> => {
    const remaining = MAX_QUESTIONS - count;
    let warningPrefix = "";
    if (remaining === 1) warningPrefix = "This is the final question. ";
    else if (remaining === 2) warningPrefix = "Two questions remaining. ";

    // Build the avoid-topics instruction from what's been asked so far
    const covered = coveredTopicsRef.current;
    const avoidClause = covered.length > 0
      ? ` Topics already covered: ${covered.map((t, i) => `Q${i + 1}: "${t}"`).join("; ")}. Do NOT ask about these topics again — pick a completely different aspect of the resume or JD.`
      : "";

    const message =
      count === 0
        ? `You are ${INTERVIEWER_NAME}, a senior technical interviewer. Introduce yourself briefly as ${INTERVIEWER_NAME} and ask Question 1 of ${MAX_QUESTIONS}. Base it specifically on the candidate's resume and the job description — reference actual skills or projects from their resume. Keep it concise.`
        : `Ask Question ${count + 1} of ${MAX_QUESTIONS}. ${warningPrefix}Base it on the resume and job description.${avoidClause} Keep it concise and direct.`;

    // Retry up to 2 times
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(`${API_BASE}/interview/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionIdRef.current,
            message,
            history: currentHistory,
            mode: "standard",
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || `HTTP ${res.status}`);
        }
        const data = await res.json();
        const text = data.response || data.message || "";
        if (!text) throw new Error("Empty response from backend");
        const finalText = warningPrefix && !text.toLowerCase().includes("final")
          ? `${warningPrefix}${text}`
          : text;
        // Record this topic so next question avoids it
        coveredTopicsRef.current = [...coveredTopicsRef.current, extractTopic(finalText)];
        return finalText;
      } catch (e) {
        if (attempt === 1) throw e; // rethrow on last attempt
        await new Promise(r => setTimeout(r, 1500)); // wait before retry
      }
    }
    throw new Error("Failed after retries");
  };

  // ── Silence timer ref — cleared on every speech result ──────────────────────
  const silenceTimerRef = useRef<any>(null);
  const SILENCE_MS = 2500; // wait 2.5s of silence before processing answer

  // ── Start listening ───────────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    if (stoppedRef.current) return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setError("Speech recognition not supported. Please use Chrome.");
      setStatus("error");
      return;
    }

    setTranscript("");
    setStatus("listening");

    const rec = new SR();
    recognitionRef.current = rec;
    rec.continuous = true;       // keep mic open — don't stop after first pause
    rec.interimResults = true;
    rec.lang = "en-US";
    rec.maxAlternatives = 1;

    let accumulatedTranscript = "";
    let hasSpoken = false;

    const clearSilenceTimer = () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    };

    const startSilenceTimer = () => {
      clearSilenceTimer();
      silenceTimerRef.current = setTimeout(() => {
        // 2.5s of silence — stop recognition and process answer
        if (!stoppedRef.current && hasSpoken) {
          try { rec.stop(); } catch {}
        }
      }, SILENCE_MS);
    };

    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          accumulatedTranscript += t + " ";
          hasSpoken = true;
        } else {
          interim += t;
          hasSpoken = true;
        }
      }
      const fullText = (accumulatedTranscript + interim).trim();
      setTranscript(fullText);
      // Reset silence timer on every new speech input
      startSilenceTimer();
    };

    rec.onend = () => {
      clearSilenceTimer();
      if (stoppedRef.current) return;
      const answer = accumulatedTranscript.trim();
      if (answer && answer.length > 2) {
        handleAnswer(answer);
      } else {
        // Nothing heard — ask again
        setStatus("ai-speaking");
        speak(
          "I didn't catch that. Could you please repeat your answer?",
          () => startListening(),
          stoppedRef
        );
      }
    };

    rec.onerror = (e: any) => {
      clearSilenceTimer();
      if (stoppedRef.current) return;
      if (e.error === "no-speech") {
        setStatus("ai-speaking");
        speak(
          "I didn't hear anything. Please speak clearly after the mic turns green.",
          () => startListening(),
          stoppedRef
        );
      } else if (e.error !== "aborted") {
        setError(`Microphone error: ${e.error}. Please check permissions.`);
        setStatus("error");
      }
    };

    try { rec.start(); }
    catch { /* recognition already started */ }
  }, []);

  // ── Handle user's answer ──────────────────────────────────────────────────────
  const handleAnswer = useCallback(async (answer: string) => {
    if (stoppedRef.current) return;
    setStatus("processing");
    setTranscript("");

    const question = currentQuestionRef.current;
    const newCount = questionCountRef.current + 1;
    setQuestionCount(newCount);
    questionCountRef.current = newCount;

    // Update history with user answer
    const updatedHistory = [
      ...historyRef.current,
      { role: "user", content: answer },
    ];
    setHistory(updatedHistory);
    historyRef.current = updatedHistory;

    // Evaluate answer — non-blocking parallel call
    const evalResult = await evaluateAnswer(question, answer);

    const newFeedbackItem: FeedbackItem = {
      question,
      answer,
      score: evalResult.evalFailed ? 0 : (evalResult.score ?? 0),
      confidence_score: evalResult.evalFailed ? 0 : (evalResult.confidence_score ?? 0),
      feedback: evalResult.feedback || "No feedback available.",
      strengths: evalResult.strengths || [],
      improvements: evalResult.improvements || [],
    };

    const updatedFeedback = [...feedbackListRef.current, newFeedbackItem];
    setFeedbackList(updatedFeedback);
    feedbackListRef.current = updatedFeedback;

    // Save to tracker for Debrief page
    await saveToTracker(question, answer, evalResult, newCount);

    // All questions done → show feedback
    if (newCount >= MAX_QUESTIONS) {
      if (stoppedRef.current) return;
      const avg = Math.round(
        updatedFeedback.reduce((sum, f) => sum + f.score, 0) / updatedFeedback.length
      );
      setOverallScore(avg);

      const closing = `That was your final question. Great effort today! I'll now show you your detailed interview feedback. Well done!`;
      setStatus("ai-speaking");
      speak(
        closing,
        () => { if (!stoppedRef.current) setStatus("feedback"); },
        stoppedRef
      );
      return;
    }

    // Ask next question
    await askQuestion(newCount, updatedHistory);
  }, [startListening]);

  // ── Ask a question ────────────────────────────────────────────────────────────
  const askQuestion = useCallback(async (
    count: number,
    currentHistory: { role: string; content: string }[]
  ) => {
    if (stoppedRef.current) return;
    setStatus("processing");

    try {
      const aiText = await getNextQuestion(count, currentHistory);

      if (stoppedRef.current) return;

      currentQuestionRef.current = aiText;
      setCurrentQuestion(aiText);

      // Add AI message to history
      const updatedHistory = [
        ...currentHistory,
        { role: "assistant", content: aiText },
      ];
      setHistory(updatedHistory);
      historyRef.current = updatedHistory;

      setStatus("ai-speaking");
      speak(aiText, () => startListening(), stoppedRef);
    } catch (e: any) {
      if (!stoppedRef.current) {
        setError(`Failed to get question: ${e.message || "Please check your connection and try again."}`);
        setStatus("error");
      }
    }
  }, [startListening]);

  // ── Start interview ───────────────────────────────────────────────────────────
  const startInterview = async () => {
    const sid = sessionId.trim();
    if (!sid) {
      setError("Please enter a session ID from the Analyse page.");
      return;
    }

    // Verify session has resume
    try {
      const check = await fetch(`${API_BASE}/upload/session/${sid}`);
      if (check.ok) {
        const data = await check.json();
        if (!data.has_resume) {
          setError("No resume found for this session. Please run an analysis first on the Analyse page.");
          return;
        }
      }
    } catch { /* non-blocking check */ }

    stoppedRef.current = false;
    setHistory([]);
    historyRef.current = [];
    setFeedbackList([]);
    feedbackListRef.current = [];
    setQuestionCount(0);
    questionCountRef.current = 0;
    setCurrentQuestion("");
    setTranscript("");
    setOverallScore(0);
    setError("");
    coveredTopicsRef.current = [];

    await askQuestion(0, []);
  };

  // ── End session manually ──────────────────────────────────────────────────────
  const endSession = () => {
    stoppedRef.current = true;
    window.speechSynthesis.cancel();
    recognitionRef.current?.abort();

    const current = feedbackListRef.current;
    if (current.length === 0) {
      reset();
      return;
    }
    const avg = Math.round(current.reduce((s, f) => s + f.score, 0) / current.length);
    setOverallScore(avg);
    setStatus("feedback");
  };

  // ── Reset ─────────────────────────────────────────────────────────────────────
  const reset = () => {
    stoppedRef.current = true;
    window.speechSynthesis.cancel();
    recognitionRef.current?.abort();
    setStatus("setup");
    setCurrentQuestion("");
    setTranscript("");
    setHistory([]);
    historyRef.current = [];
    setFeedbackList([]);
    feedbackListRef.current = [];
    setQuestionCount(0);
    questionCountRef.current = 0;
    setOverallScore(0);
    setError("");
    coveredTopicsRef.current = [];
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="page-content gradient-bg">
        <div className="page-inner">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            style={{
              paddingBottom: 28, marginBottom: 32,
              borderBottom: "1px solid var(--border-subtle)",
              display: "flex", justifyContent: "space-between", alignItems: "flex-start",
            }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 9,
                  background: "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))",
                  border: "1px solid rgba(59,130,246,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Radio size={16} color="#3B82F6" />
                </div>
                <h1 style={{ fontSize: 26, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                  AI Voice Studio
                </h1>
                <span className="badge badge-blue" style={{ fontSize: 10.5 }}>BETA</span>
              </div>
              <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
                {INTERVIEWER_NAME} asks · you speak · real-time evaluation · {MAX_QUESTIONS} questions
              </p>
            </div>

            {/* Status + controls when active */}
            {status !== "setup" && status !== "feedback" && (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {status !== "error" && (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 550 }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: "50%",
                        background: status === "listening" ? "#10B981" : status === "ai-speaking" ? "#3B82F6" : "#F59E0B",
                        animation: "pulse 1.5s infinite",
                      }} />
                      <span style={{ color: status === "listening" ? "#10B981" : status === "ai-speaking" ? "#3B82F6" : "#F59E0B" }}>
                        {status === "ai-speaking" ? `${INTERVIEWER_NAME} speaking` : status === "listening" ? "Listening…" : "Processing…"}
                      </span>
                    </div>
                    <div style={{
                      fontSize: 12, color: "var(--text-tertiary)",
                      background: "var(--bg-elevated)", padding: "4px 10px",
                      borderRadius: 20, border: "1px solid var(--border-subtle)",
                    }}>
                      Q{questionCount}/{MAX_QUESTIONS}
                    </div>
                  </>
                )}
                <button className="btn btn-danger btn-sm" onClick={endSession}>
                  <Square size={12} /> End Session
                </button>
              </div>
            )}
          </motion.div>

          {/* ── SETUP SCREEN ── */}
          {status === "setup" && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              style={{ maxWidth: 540, margin: "0 auto" }}>

              {/* Alex card */}
              <div className="card" style={{ padding: "28px 30px" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 16, marginBottom: 28,
                  padding: "16px 18px", borderRadius: 14,
                  background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.12)",
                }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: "50%",
                    background: "linear-gradient(135deg, #3B82F6, #8B5CF6)",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    boxShadow: "0 4px 16px rgba(59,130,246,0.25)",
                  }}>
                    <User size={22} color="white" />
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{INTERVIEWER_NAME}</div>
                    <div style={{ fontSize: 12.5, color: "#3B82F6", marginTop: 2, fontWeight: 500 }}>Senior Technical Interviewer · AI</div>
                    <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 4 }}>
                      Asks {MAX_QUESTIONS} questions · Evaluates each answer · Saves to Debrief
                    </div>
                  </div>
                </div>

                {/* Session ID input */}
                <div style={{ marginBottom: 20 }}>
                  <label className="field-label">Session ID *</label>
                  <input
                    className="input"
                    style={{ marginTop: 6, fontFamily: "monospace", fontSize: 12.5 }}
                    placeholder="session-1234567890-abc123"
                    value={sessionId}
                    onChange={e => { setSessionId(e.target.value); setError(""); }}
                  />
                  <div style={{ fontSize: 11.5, color: "var(--text-disabled)", marginTop: 5 }}>
                    Copy from the Analyse page after uploading your resume + JD
                  </div>
                </div>

                {error && (
                  <div style={{
                    marginBottom: 16, padding: "10px 14px", borderRadius: 10,
                    background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)",
                    display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: "#EF4444",
                  }}>
                    <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                    {error}
                  </div>
                )}

                {/* Tips */}
                <div style={{
                  marginBottom: 24, padding: "14px 16px", borderRadius: 12,
                  background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)",
                  fontSize: 12.5, color: "var(--text-tertiary)",
                }}>
                  <div style={{ fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>Before you start</div>
                  {[
                    "Use Chrome browser for best speech recognition",
                    "Allow microphone access when prompted",
                    "Speak clearly — mic turns green when listening",
                    `${INTERVIEWER_NAME} asks exactly ${MAX_QUESTIONS} questions from your resume`,
                    "Results auto-save to Debrief page after interview",
                  ].map((tip, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, marginBottom: 5 }}>
                      <span style={{ color: "#3B82F6", flexShrink: 0 }}>·</span>{tip}
                    </div>
                  ))}
                </div>

                <button className="btn btn-primary btn-xl btn-full" onClick={startInterview}
                  style={{ background: "linear-gradient(135deg, #3B82F6, #6366F1)" }}>
                  <Mic size={16} /> Start Interview with {INTERVIEWER_NAME}
                </button>
              </div>
            </motion.div>
          )}

          {/* ── ACTIVE INTERVIEW ── */}
          {(status === "ai-speaking" || status === "listening" || status === "processing" || status === "error") && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ maxWidth: 700, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Progress bar */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {Array.from({ length: MAX_QUESTIONS }).map((_, i) => (
                  <div key={i} style={{
                    flex: 1, height: 5, borderRadius: 99,
                    background: i < questionCount
                      ? "#3B82F6"
                      : i === questionCount
                      ? "rgba(59,130,246,0.3)"
                      : "var(--bg-overlay)",
                    transition: "all 0.4s",
                  }} />
                ))}
                <span style={{ fontSize: 12, color: "var(--text-tertiary)", flexShrink: 0 }}>
                  {questionCount}/{MAX_QUESTIONS}
                </span>
              </div>

              {/* Error state */}
              {status === "error" && (
                <div style={{
                  padding: "32px 28px", borderRadius: 16, textAlign: "center",
                  background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)",
                }}>
                  <AlertCircle size={36} color="#EF4444" style={{ marginBottom: 14 }} />
                  <p style={{ fontSize: 15, color: "#EF4444", fontWeight: 600, marginBottom: 8 }}>{error}</p>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 20, lineHeight: 1.6 }}>
                    If the backend is sleeping, open the{" "}
                    <a href={`${API_BASE}/health`} target="_blank" rel="noreferrer" style={{ color: "#3B82F6" }}>
                      health endpoint
                    </a>
                    {" "}in a new tab, wait for it to respond, then try again.
                  </p>
                  <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                    <button className="btn btn-ghost" onClick={reset}>← Back to Setup</button>
                    {questionCount > 0 && (
                      <button className="btn btn-secondary" onClick={endSession}>
                        <BarChart2 size={14} /> View Results So Far
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Current question card */}
              {status !== "error" && currentQuestion && (
                <motion.div
                  key={currentQuestion}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="card" style={{ padding: "22px 26px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: "50%",
                      background: "linear-gradient(135deg, #3B82F6, #8B5CF6)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <User size={14} color="white" />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#3B82F6" }}>{INTERVIEWER_NAME}</span>
                    {status === "ai-speaking" && (
                      <div style={{ display: "flex", gap: 3, marginLeft: 4 }}>
                        {[0, 1, 2].map(i => (
                          <motion.div key={i}
                            style={{ width: 4, height: 4, borderRadius: "50%", background: "#3B82F6" }}
                            animate={{ scale: [1, 1.6, 1] }}
                            transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                          />
                        ))}
                      </div>
                    )}
                    <span style={{ marginLeft: "auto", fontSize: 11.5, color: "var(--text-disabled)" }}>
                      Q{questionCount + 1} of {MAX_QUESTIONS}
                    </span>
                  </div>
                  <p style={{ fontSize: 15, color: "var(--text-primary)", lineHeight: 1.7 }}>
                    {currentQuestion}
                  </p>
                </motion.div>
              )}

              {/* Processing skeleton */}
              {status === "processing" && !currentQuestion && (
                <div className="card" style={{ padding: "22px 26px" }}>
                  <div className="skeleton" style={{ width: "60%", height: 14, marginBottom: 10 }} />
                  <div className="skeleton" style={{ width: "100%", height: 14, marginBottom: 8 }} />
                  <div className="skeleton" style={{ width: "80%", height: 14 }} />
                </div>
              )}

              {/* Voice orb */}
              {status !== "error" && (
                <div style={{
                  display: "flex", flexDirection: "column",
                  alignItems: "center", gap: 18, padding: "24px 0",
                }}>
                  <div style={{ position: "relative" }}>
                    {status === "listening" && (
                      <>
                        <motion.div style={{
                          position: "absolute", inset: -16, borderRadius: "50%",
                          border: "2px solid #10B981", opacity: 0.3,
                        }}
                          animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.05, 0.3] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                        />
                        <motion.div style={{
                          position: "absolute", inset: -8, borderRadius: "50%",
                          border: "1px solid #10B981", opacity: 0.5,
                        }}
                          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.1, 0.5] }}
                          transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
                        />
                      </>
                    )}
                    <motion.div
                      animate={status === "listening" ? { scale: [1, 1.05, 1] } : {}}
                      transition={{ repeat: Infinity, duration: 1.2 }}
                      style={{
                        width: 80, height: 80, borderRadius: "50%",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background:
                          status === "listening"
                            ? "linear-gradient(135deg, #10B981, #059669)"
                            : status === "ai-speaking"
                            ? "linear-gradient(135deg, #3B82F6, #6366F1)"
                            : "linear-gradient(135deg, #F59E0B, #D97706)",
                        boxShadow:
                          status === "listening"
                            ? "0 0 0 10px rgba(16,185,129,0.12)"
                            : status === "ai-speaking"
                            ? "0 0 0 10px rgba(59,130,246,0.12)"
                            : "0 0 0 10px rgba(245,158,11,0.12)",
                        transition: "background 0.3s, box-shadow 0.3s",
                      }}>
                      {status === "listening"
                        ? <Mic size={30} color="white" />
                        : status === "ai-speaking"
                        ? <Volume2 size={30} color="white" />
                        : <div style={{
                            width: 22, height: 22,
                            border: "3px solid white",
                            borderTopColor: "transparent",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite",
                          }} />
                      }
                    </motion.div>
                  </div>

                  <div style={{
                    fontSize: 14, fontWeight: 600,
                    color:
                      status === "listening" ? "#10B981"
                      : status === "ai-speaking" ? "#3B82F6"
                      : "var(--text-secondary)",
                  }}>
                    {status === "listening"
                      ? "Listening — speak your answer now"
                      : status === "ai-speaking"
                      ? `${INTERVIEWER_NAME} is speaking…`
                      : "Processing your answer…"}
                  </div>

                  {/* Live transcript */}
                  {status === "listening" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: transcript ? 1 : 0.4, height: "auto" }}
                      style={{
                        maxWidth: 560, width: "100%", textAlign: "center",
                        fontSize: 14, color: transcript ? "var(--text-primary)" : "var(--text-disabled)",
                        fontStyle: transcript ? "italic" : "normal",
                        lineHeight: 1.6, padding: "12px 18px", borderRadius: 12,
                        background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)",
                        minHeight: 52,
                      }}>
                      <span id="transcript-text">
                        {transcript || "Waiting for you to speak…"}
                      </span>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Previous answers mini-log — scores hidden during interview to avoid pressure */}
              {feedbackList.length > 0 && status !== "error" && (
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-disabled)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                    <MessageSquare size={12} /> {feedbackList.length} of {MAX_QUESTIONS} answered
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {feedbackList.map((f, i) => (
                      <div key={i} style={{
                        padding: "10px 14px", borderRadius: 10,
                        background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)",
                        display: "flex", alignItems: "center", gap: 12,
                      }}>
                        <div style={{
                          width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                          background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.2)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <CheckCircle size={12} color="#10B981" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12.5, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            Q{i + 1}: {f.question.slice(0, 90)}{f.question.length > 90 ? "…" : ""}
                          </div>
                          <div style={{ fontSize: 11.5, color: "var(--text-disabled)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            Your answer recorded ✓
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ── FEEDBACK SCREEN ── */}
          {status === "feedback" && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              style={{ maxWidth: 720, margin: "0 auto" }}>

              {/* Score header */}
              <div className="card-accent" style={{ padding: "28px 32px", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{
                      fontSize: 11.5, fontWeight: 600, color: "var(--text-tertiary)",
                      textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8,
                    }}>
                      {INTERVIEWER_NAME}'s Assessment · {feedbackList.length} Questions
                    </div>
                    <div style={{
                      fontSize: 52, fontWeight: 800, color: scoreColor(overallScore),
                      letterSpacing: "-0.03em", lineHeight: 1,
                    }}>
                      {overallScore}
                      <span style={{ fontSize: 22, color: "var(--text-tertiary)", fontWeight: 400 }}>/100</span>
                    </div>
                    <div style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 10 }}>
                      {overallScore >= 80
                        ? "Excellent performance! You're well-prepared."
                        : overallScore >= 65
                        ? "Good effort — a few areas to strengthen before interviews."
                        : "Keep practising — focus on the weak areas below."}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                    <div style={{
                      padding: "8px 16px", borderRadius: 10,
                      background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.15)",
                      fontSize: 12.5, color: "#3B82F6", fontWeight: 550,
                    }}>
                      <Clock size={12} style={{ display: "inline", marginRight: 5 }} />
                      Session: {sessionId}
                    </div>
                  </div>
                </div>
              </div>

              {/* Per-question breakdown */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
                {feedbackList.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="card" style={{ padding: "20px 24px" }}>

                    {/* Q header */}
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 14 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: 10.5, fontWeight: 700, color: "var(--text-disabled)",
                          textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6,
                        }}>
                          Question {i + 1}
                        </div>
                        <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.55 }}>
                          {item.question}
                        </div>
                      </div>
                      <div style={{ textAlign: "center", flexShrink: 0 }}>
                        <div style={{ fontSize: 28, fontWeight: 800, color: scoreColor(item.score) }}>
                          {item.score}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-disabled)" }}>/100</div>
                      </div>
                    </div>

                    {/* Your answer */}
                    <div style={{
                      padding: "10px 14px", borderRadius: 10,
                      background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)",
                      marginBottom: 12,
                    }}>
                      <div style={{ fontSize: 10.5, fontWeight: 600, color: "var(--text-disabled)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        Your Answer
                      </div>
                      <div style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.6, fontStyle: "italic" }}>
                        "{item.answer}"
                      </div>
                    </div>

                    {/* Feedback */}
                    <div style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.65, marginBottom: 12, display: "flex", gap: 8 }}>
                      <span style={{ color: "#F59E0B", flexShrink: 0 }}>→</span>
                      {item.feedback}
                    </div>

                    {/* Strengths + improvements */}
                    {(item.strengths.length > 0 || item.improvements.length > 0) && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        {item.strengths.length > 0 && (
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: "#10B981", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                              <CheckCircle size={11} /> Strengths
                            </div>
                            {item.strengths.map((s, j) => (
                              <div key={j} style={{ fontSize: 12.5, color: "var(--text-secondary)", display: "flex", gap: 6, marginBottom: 4, lineHeight: 1.5 }}>
                                <span style={{ color: "#10B981", flexShrink: 0 }}>✓</span>{s}
                              </div>
                            ))}
                          </div>
                        )}
                        {item.improvements.length > 0 && (
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: "#F59E0B", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                              <AlertCircle size={11} /> Improve
                            </div>
                            {item.improvements.map((s, j) => (
                              <div key={j} style={{ fontSize: 12.5, color: "var(--text-secondary)", display: "flex", gap: 6, marginBottom: 4, lineHeight: 1.5 }}>
                                <span style={{ color: "#F59E0B", flexShrink: 0 }}>→</span>{s}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", gap: 12 }}>
                <button className="btn btn-primary" style={{ flex: 1, background: "linear-gradient(135deg, #3B82F6, #6366F1)" }} onClick={reset}>
                  <Mic size={14} /> Practice Again with {INTERVIEWER_NAME}
                </button>
                <button className="btn btn-secondary" style={{ flex: 1 }}
                  onClick={() => window.location.href = `/debrief?session=${sessionId}`}>
                  <BarChart2 size={14} /> View in Debrief
                </button>
              </div>

              {/* Session ID reminder */}
              <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: 10, background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", fontSize: 12, color: "var(--text-tertiary)" }}>
                <div style={{ marginBottom: 4, fontWeight: 550, color: "var(--text-secondary)" }}>Results saved to Debrief</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span>Session ID:</span>
                  <span style={{ fontFamily: "monospace", fontSize: 11.5, color: "var(--text-primary)", background: "var(--bg-base)", padding: "3px 8px", borderRadius: 6, border: "1px solid var(--border-subtle)", userSelect: "all", cursor: "text" }}>
                    {sessionId}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--text-disabled)" }}>(click to select all)</span>
                </div>
              </div>
            </motion.div>
          )}

        </div>
      </main>
    </div>
  );
}

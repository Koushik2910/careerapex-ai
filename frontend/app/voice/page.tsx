"use client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Volume2, Square, MessageSquare, User, ChevronRight, AlertCircle } from "lucide-react";
import Sidebar from "@/components/Sidebar";

// ── Interviewer identity — consistent across all sessions ──────────────────────
const INTERVIEWER_NAME = "Alex";
const INTERVIEWER_VOICE_LANG = "en-US";
const PREFERRED_VOICE_NAMES = ["Google US English", "Microsoft David", "Alex", "en-US"];
const MAX_QUESTIONS = 5;

type Status = "setup" | "ai-speaking" | "listening" | "processing" | "feedback" | "ended";
type Mode = "standard" | "defense";

interface Message { role: "ai" | "user"; content: string; }
interface FeedbackItem { question: string; answer: string; score: number; feedback: string; }

// ── Pick a consistent voice ────────────────────────────────────────────────────
function getVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  for (const preferred of PREFERRED_VOICE_NAMES) {
    const found = voices.find(v => v.name.includes(preferred) && v.lang.startsWith("en"));
    if (found) return found;
  }
  return voices.find(v => v.lang.startsWith("en-US")) || voices[0] || null;
}

// ── Speak helper ───────────────────────────────────────────────────────────────
function speak(text: string, onEnd: () => void, stoppedRef: React.MutableRefObject<boolean>) {
  if (stoppedRef.current) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = INTERVIEWER_VOICE_LANG;
  utterance.rate = 0.92;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;
  // Wait for voices to load if needed
  const assignVoice = () => {
    const voice = getVoice();
    if (voice) utterance.voice = voice;
  };
  if (window.speechSynthesis.getVoices().length > 0) {
    assignVoice();
  } else {
    window.speechSynthesis.onvoiceschanged = assignVoice;
  }
  utterance.onend = () => { if (!stoppedRef.current) onEnd(); };
  utterance.onerror = () => { if (!stoppedRef.current) onEnd(); };
  window.speechSynthesis.speak(utterance);
}

export default function VoicePage() {
  const [mode, setMode] = useState<Mode>("standard");
  const [sessionId, setSessionId] = useState("");
  const [status, setStatus] = useState<Status>("setup");
  const [messages, setMessages] = useState<Message[]>([]);
  const [transcript, setTranscript] = useState("");
  const [questionCount, setQuestionCount] = useState(0);
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [overallScore, setOverallScore] = useState(0);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<{ role: string; content: string }[]>([]);

  const stoppedRef = useRef(false);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentQuestionRef = useRef("");
  const currentAnswerRef = useRef("");
  const questionCountRef = useRef(0);

  useEffect(() => { questionCountRef.current = questionCount; }, [questionCount]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────────
  useEffect(() => () => {
    stoppedRef.current = true;
    window.speechSynthesis.cancel();
    recognitionRef.current?.abort();
  }, []);

  // ── Start listening via Web Speech API ────────────────────────────────────────
  const startListening = useCallback(() => {
    if (stoppedRef.current) return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setError("Speech recognition not supported. Please use Chrome."); return; }

    setTranscript("");
    setStatus("listening");

    const recognition = new SR();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (e: any) => {
      const text = Array.from(e.results).map((r: any) => r[0].transcript).join("");
      setTranscript(text);
      currentAnswerRef.current = text;
    };

    recognition.onend = () => {
      if (stoppedRef.current) return;
      const answer = currentAnswerRef.current.trim();
      if (answer) {
        processAnswer(answer);
      } else {
        // No answer heard — prompt again
        setStatus("ai-speaking");
        speak("I didn't catch that. Could you please repeat your answer?", startListening, stoppedRef);
      }
    };

    recognition.onerror = (e: any) => {
      if (stoppedRef.current) return;
      if (e.error === "no-speech") {
        setStatus("ai-speaking");
        speak("I didn't hear anything. Please speak after the mic turns green.", startListening, stoppedRef);
      }
    };

    recognition.start();
  }, []);

  // ── Process user's answer ─────────────────────────────────────────────────────
  const processAnswer = useCallback(async (answer: string) => {
    if (stoppedRef.current) return;
    setStatus("processing");
    setTranscript("");

    const answeredQuestion = currentQuestionRef.current;
    const newCount = questionCountRef.current + 1;
    setQuestionCount(newCount);
    questionCountRef.current = newCount;

    // Add user message to UI
    setMessages(prev => [...prev, { role: "user", content: answer }]);

    // Build updated history
    const updatedHistory = [
      ...history,
      { role: "user", content: answer },
    ];
    setHistory(updatedHistory);

    // Evaluate answer with timeout so it never blocks the flow
    let evalScore = 70;
    let evalFeedback = "Good answer.";
    try {
      const timeoutPromise = new Promise<null>((_, reject) => setTimeout(() => reject(new Error("timeout")), 8000));
      const evalPromise = fetch(`${API_BASE}/analyse/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, question: answeredQuestion, answer }),
      }).then(r => r.ok ? r.json() : null);
      const evalData = await Promise.race([evalPromise, timeoutPromise]).catch(() => null);
      if (evalData) {
        evalScore = evalData.score || 70;
        evalFeedback = evalData.feedback || "Good answer.";
      }
    } catch {}

    setFeedbackList(prev => [...prev, {
      question: answeredQuestion,
      answer,
      score: evalScore,
      feedback: evalFeedback,
    }]);

    // Last question — end session and show feedback
    if (newCount >= MAX_QUESTIONS) {
      if (stoppedRef.current) return;
      setStatus("ai-speaking");
      const closingText = `That was your final question. Thank you for your time, ${sessionId ? "and great effort today" : "I hope you found this helpful"}. I'll now show you your interview feedback. Well done!`;
      setMessages(prev => [...prev, { role: "ai", content: closingText }]);
      speak(closingText, () => {
        if (!stoppedRef.current) {
          setOverallScore(Math.round((feedbackList.reduce((sum, f) => sum + f.score, 0) + evalScore) / MAX_QUESTIONS));
          setStatus("feedback");
        }
      }, stoppedRef);
      return;
    }

    // Get next question from backend
    await askNextQuestion(newCount, updatedHistory, evalScore);
  }, [history, sessionId, feedbackList]);

  // ── Ask next question ─────────────────────────────────────────────────────────
  const askNextQuestion = useCallback(async (
    count: number,
    currentHistory: { role: string; content: string }[],
    lastScore?: number
  ) => {
    if (stoppedRef.current) return;
    setStatus("processing");

    const remaining = MAX_QUESTIONS - count;
    let warningPrefix = "";
    if (remaining === 1) warningPrefix = "This is your final question. ";
    else if (remaining === 2) warningPrefix = "We have 2 questions remaining. ";

    try {
      const res = await fetch(`${API_BASE}/interview/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          message: count === 0
            ? `You are ${INTERVIEWER_NAME}, a senior technical interviewer. Start the interview by introducing yourself as ${INTERVIEWER_NAME} and asking question 1 of ${MAX_QUESTIONS}. Base your question on the candidate's resume and the job description. Be specific — reference actual skills or projects from the resume.`
            : `Ask question ${count + 1} of ${MAX_QUESTIONS}. ${warningPrefix}Base it on the resume and job description. Do not repeat previous topics. Keep the question concise.`,
          history: currentHistory,
          mode,
          interviewer_name: INTERVIEWER_NAME,
          max_questions: MAX_QUESTIONS,
          current_question_number: count + 1,
        }),
      });

      if (!res.ok) throw new Error("Failed to get question");
      const data = await res.json();
      let aiText = data.response || data.message || "";

      // Prepend warning if backend didn't include it
      if (warningPrefix && !aiText.includes("question") ) {
        aiText = `${warningPrefix}${aiText}`;
      }

      currentQuestionRef.current = aiText;
      setMessages(prev => [...prev, { role: "ai", content: aiText }]);
      setHistory(prev => [...prev, { role: "assistant", content: aiText }]);

      setStatus("ai-speaking");
      speak(aiText, startListening, stoppedRef);
    } catch (e) {
      // Show error but keep session alive so user can see what happened
      setError("Connection error — please wait a moment and try ending and restarting the session.");
      setStatus("ended");
    }
  }, [sessionId, mode, startListening]);

  // ── Start interview ───────────────────────────────────────────────────────────
  // Ping backend on mount to wake Railway from sleep
  useEffect(() => {
    const API_BASE_LOCAL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
    fetch(`${API_BASE_LOCAL}/health`).catch(() => {});
  }, []);

  const startInterview = async () => {
    if (!sessionId.trim()) {
      setError("Please enter a session ID to load your resume and JD context.");
      return;
    }
    stoppedRef.current = false;
    setMessages([]);
    setHistory([]);
    setFeedbackList([]);
    setQuestionCount(0);
    questionCountRef.current = 0;
    setOverallScore(0);
    setError("");
    setTranscript("");
    setStatus("processing");

    await askNextQuestion(0, []);
  };

  // ── End session manually ──────────────────────────────────────────────────────
  const endSession = () => {
    stoppedRef.current = true;
    window.speechSynthesis.cancel();
    recognitionRef.current?.abort();
    const score = feedbackList.length > 0
      ? Math.round(feedbackList.reduce((sum, f) => sum + f.score, 0) / feedbackList.length)
      : 0;
    setOverallScore(score);
    setStatus("feedback");
  };

  const resetSession = () => {
    stoppedRef.current = true;
    window.speechSynthesis.cancel();
    recognitionRef.current?.abort();
    setStatus("setup");
    setMessages([]);
    setHistory([]);
    setFeedbackList([]);
    setQuestionCount(0);
    setOverallScore(0);
    setError("");
    setTranscript("");
  };

  const scoreColor = (s: number) => s >= 80 ? "#10B981" : s >= 60 ? "#F59E0B" : "#EF4444";

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="page-content gradient-bg">
        <div className="page-inner">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            style={{ paddingBottom: 28, marginBottom: 32, borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>Voice Interview</h1>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 5 }}>
                AI speaks · You answer · {MAX_QUESTIONS} questions · Feedback at the end
              </p>
            </div>
            {status !== "setup" && status !== "feedback" && (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 550 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: status === "listening" ? "#10B981" : status === "ai-speaking" ? "#3B82F6" : "#F59E0B", animation: "pulse 1.5s infinite" }} />
                  <span style={{ color: status === "listening" ? "#10B981" : status === "ai-speaking" ? "#3B82F6" : "#F59E0B" }}>
                    {status === "ai-speaking" ? `${INTERVIEWER_NAME} speaking` : status === "listening" ? "Listening…" : "Processing…"}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "var(--text-tertiary)", background: "var(--bg-elevated)", padding: "4px 10px", borderRadius: 20, border: "1px solid var(--border-subtle)" }}>
                  Q{questionCount}/{MAX_QUESTIONS}
                </div>
                <button className="btn btn-danger btn-sm" onClick={endSession}>
                  <Square size={12} /> End Session
                </button>
              </div>
            )}
          </motion.div>

          {/* ── SETUP SCREEN ── */}
          {status === "setup" && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              style={{ maxWidth: 520, margin: "0 auto" }}>
              <div className="card" style={{ padding: "28px 30px" }}>
                {/* Interviewer card */}
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24, padding: "14px 16px", borderRadius: 12, background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)" }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg, #3B82F6, #8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <User size={20} color="white" />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{INTERVIEWER_NAME}</div>
                    <div style={{ fontSize: 12.5, color: "var(--text-tertiary)", marginTop: 2 }}>Senior Technical Interviewer · AI-powered</div>
                    <div style={{ fontSize: 11.5, color: "#3B82F6", marginTop: 3 }}>Will ask {MAX_QUESTIONS} questions based on your resume + JD</div>
                  </div>
                </div>

                {/* Mode selection */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Interview Mode</div>
                  {[
                    { id: "standard", label: "Standard Interview", desc: "Supportive questions, encouragement, constructive feedback" },
                    { id: "defense", label: "Resume Defense Mode", desc: `${INTERVIEWER_NAME} challenges your claims — high pressure, realistic` },
                  ].map(m => (
                    <div key={m.id} onClick={() => setMode(m.id as Mode)}
                      style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 10, marginBottom: 8, cursor: "pointer", border: `1px solid ${mode === m.id ? "rgba(245,158,11,0.3)" : "var(--border-subtle)"}`, background: mode === m.id ? "rgba(245,158,11,0.06)" : "var(--bg-elevated)", transition: "all 0.15s" }}>
                      <div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${mode === m.id ? "#F59E0B" : "var(--border-default)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {mode === m.id && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#F59E0B" }} />}
                      </div>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-primary)" }}>{m.label}</div>
                        <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 2 }}>{m.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Session ID */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                    Session ID <span style={{ color: "#EF4444" }}>*</span>
                  </div>
                  <input
                    className="input"
                    placeholder="session-1234567890-abc123"
                    value={sessionId}
                    onChange={e => { setSessionId(e.target.value); setError(""); }}
                    style={{ fontFamily: "monospace", fontSize: 12.5 }}
                  />
                  <div style={{ fontSize: 11.5, color: "var(--text-disabled)", marginTop: 6 }}>
                    Get this from the Analyse page — {INTERVIEWER_NAME} will ask questions from your resume + JD
                  </div>
                  {error && (
                    <div style={{ marginTop: 8, fontSize: 12.5, color: "#EF4444", display: "flex", alignItems: "center", gap: 6 }}>
                      <AlertCircle size={13} /> {error}
                    </div>
                  )}
                </div>

                {/* Tips */}
                <div style={{ marginBottom: 22, padding: "12px 14px", borderRadius: 10, background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", fontSize: 12.5, color: "var(--text-tertiary)" }}>
                  <div style={{ fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>Before you start</div>
                  {["Allow microphone access when prompted", "Use Chrome for best results", "Speak clearly after mic turns green", `${INTERVIEWER_NAME} will ask exactly ${MAX_QUESTIONS} questions`, "Your feedback appears automatically after Q5"].map((tip, i) => (
                    <div key={i} style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                      <span style={{ color: "#F59E0B" }}>·</span> {tip}
                    </div>
                  ))}
                </div>

                <button className="btn btn-primary btn-xl btn-full" onClick={startInterview}>
                  <Mic size={16} /> Start Voice Interview with {INTERVIEWER_NAME}
                </button>
              </div>
            </motion.div>
          )}

          {/* ── ACTIVE INTERVIEW ── */}
          {(status === "ai-speaking" || status === "listening" || status === "processing" || status === "ended") && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ maxWidth: 680, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Progress bar */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {Array.from({ length: MAX_QUESTIONS }).map((_, i) => (
                  <div key={i} style={{ flex: 1, height: 4, borderRadius: 99, background: i < questionCount ? "#F59E0B" : i === questionCount ? "rgba(245,158,11,0.3)" : "var(--bg-overlay)", transition: "all 0.4s" }} />
                ))}
                <span style={{ fontSize: 12, color: "var(--text-tertiary)", flexShrink: 0 }}>
                  {questionCount}/{MAX_QUESTIONS}
                </span>
              </div>

              {/* Current AI message */}
              {messages.length > 0 && messages[messages.length - 1].role === "ai" && (
                <motion.div key={messages.length} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="card" style={{ padding: "22px 26px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg, #3B82F6, #8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Volume2 size={14} color="white" />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#3B82F6" }}>{INTERVIEWER_NAME}</span>
                    {status === "ai-speaking" && (
                      <div style={{ display: "flex", gap: 3, marginLeft: 4 }}>
                        {[0, 1, 2].map(i => (
                          <motion.div key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: "#3B82F6" }}
                            animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }} />
                        ))}
                      </div>
                    )}
                  </div>
                  <p style={{ fontSize: 15, color: "var(--text-primary)", lineHeight: 1.65 }}>
                    {messages[messages.length - 1].content}
                  </p>
                </motion.div>
              )}

              {/* Voice orb */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "20px 0" }}>
                <div style={{ position: "relative" }}>
                  {status === "listening" && (
                    <motion.div style={{ position: "absolute", inset: -12, borderRadius: "50%", border: "2px solid #10B981", opacity: 0.4 }}
                      animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }} />
                  )}
                  <div style={{
                    width: 72, height: 72, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                    background: status === "listening" ? "linear-gradient(135deg, #10B981, #059669)"
                      : status === "ai-speaking" ? "linear-gradient(135deg, #3B82F6, #6366F1)"
                      : "linear-gradient(135deg, #F59E0B, #D97706)",
                    boxShadow: status === "listening" ? "0 0 0 8px rgba(16,185,129,0.15)"
                      : status === "ai-speaking" ? "0 0 0 8px rgba(59,130,246,0.15)"
                      : "0 0 0 8px rgba(245,158,11,0.15)",
                    transition: "all 0.3s",
                  }}>
                    {status === "listening" ? <Mic size={28} color="white" />
                      : status === "ai-speaking" ? <Volume2 size={28} color="white" />
                      : <div style={{ width: 20, height: 20, border: "3px solid white", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />}
                  </div>
                </div>

                <div style={{ fontSize: 13.5, fontWeight: 550, color: status === "listening" ? "#10B981" : status === "ai-speaking" ? "#3B82F6" : "var(--text-secondary)" }}>
                  {status === "listening" ? "Listening — speak now" : status === "ai-speaking" ? `${INTERVIEWER_NAME} is speaking…` : "Processing your answer…"}
                </div>

                {/* Live transcript */}
                {status === "listening" && transcript && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{ maxWidth: 500, textAlign: "center", fontSize: 13.5, color: "var(--text-secondary)", fontStyle: "italic", lineHeight: 1.5, padding: "10px 16px", borderRadius: 10, background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
                    "{transcript}"
                  </motion.div>
                )}
              </div>

              {/* Conversation history */}
              {messages.length > 1 && (
                <div>
                  <button onClick={() => {}} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)", fontSize: 12.5, display: "flex", alignItems: "center", gap: 4, marginBottom: 10 }}>
                    <MessageSquare size={13} /> {messages.length} messages
                  </button>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 200, overflowY: "auto" }}>
                    {messages.slice(0, -1).map((msg, i) => (
                      <div key={i} style={{ padding: "10px 14px", borderRadius: 10, background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                        <span style={{ fontWeight: 600, color: msg.role === "ai" ? "#3B82F6" : "#F59E0B", marginRight: 6 }}>
                          {msg.role === "ai" ? INTERVIEWER_NAME : "You"}:
                        </span>
                        {msg.content.slice(0, 120)}{msg.content.length > 120 ? "…" : ""}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ── FEEDBACK SCREEN ── */}
          {status === "feedback" && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              style={{ maxWidth: 680, margin: "0 auto" }}>

              {/* Header card */}
              <div className="card-accent" style={{ padding: "24px 28px", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                      Interview Complete · {INTERVIEWER_NAME}'s Assessment
                    </div>
                    <div style={{ fontSize: 40, fontWeight: 800, color: scoreColor(overallScore), letterSpacing: "-0.02em" }}>
                      {overallScore}<span style={{ fontSize: 18, color: "var(--text-tertiary)", fontWeight: 400 }}>/100</span>
                    </div>
                    <div style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 6 }}>
                      {overallScore >= 80 ? "Excellent performance! You're ready." : overallScore >= 60 ? "Good effort — a few areas to strengthen." : "Keep practising — focus on the weak areas below."}
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 13, color: "var(--text-tertiary)" }}>{feedbackList.length} questions</div>
                    <div style={{ fontSize: 13, color: "var(--text-tertiary)", marginTop: 4 }}>answered</div>
                  </div>
                </div>
              </div>

              {/* Per-question feedback */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
                {feedbackList.map((item, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                    className="card" style={{ padding: "18px 22px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-disabled)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                          Question {i + 1}
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 550, color: "var(--text-primary)", lineHeight: 1.5 }}>
                          {item.question}
                        </div>
                      </div>
                      <div style={{ textAlign: "center", flexShrink: 0 }}>
                        <div style={{ fontSize: 22, fontWeight: 700, color: scoreColor(item.score) }}>{item.score}</div>
                        <div style={{ fontSize: 10.5, color: "var(--text-disabled)" }}>/100</div>
                      </div>
                    </div>
                    <div style={{ padding: "10px 12px", borderRadius: 8, background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", marginBottom: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-disabled)", marginBottom: 4 }}>YOUR ANSWER</div>
                      <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, fontStyle: "italic" }}>"{item.answer}"</div>
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.55, display: "flex", gap: 8 }}>
                      <span style={{ color: "#F59E0B", flexShrink: 0 }}>→</span>
                      <span>{item.feedback}</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", gap: 12 }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={resetSession}>
                  <Mic size={14} /> Practice Again with {INTERVIEWER_NAME}
                </button>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => window.location.href = "/debrief"}>
                  <ChevronRight size={14} /> View Full Debrief
                </button>
              </div>
            </motion.div>
          )}

        </div>
      </main>
    </div>
  );
}




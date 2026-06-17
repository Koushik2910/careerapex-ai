"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Shield, Send, Loader2, RotateCcw, Bot, User, ChevronRight } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { startInterview, interviewChat } from "@/lib/api";

type Mode = "standard" | "defense";
interface Message { role: "user" | "assistant"; content: string; }

function TypingText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed(""); setDone(false);
    let i = 0;
    const t = setInterval(() => {
      if (i < text.length) { setDisplayed(text.slice(0, ++i)); }
      else { setDone(true); clearInterval(t); }
    }, 10);
    return () => clearInterval(t);
  }, [text]);
  return <span>{displayed}{!done && <span className="cursor-blink" style={{ color: "#F59E0B" }}>|</span>}</span>;
}

export default function InterviewPage() {
  const [sessionId, setSessionId] = useState("");
  const [mode, setMode] = useState<Mode>("standard");
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastAiIndex, setLastAiIndex] = useState(-1);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleStart = async () => {
    const sid = sessionId.trim() || `session-${Date.now()}`;
    setSessionId(sid); setLoading(true); setMessages([]);
    try {
      const res: any = await startInterview(sid, mode);
      setMessages([{ role: "assistant", content: res.message }]);
      setLastAiIndex(0); setStarted(true);
    } catch { alert("Failed to start. Make sure your resume is uploaded via Analyse."); }
    finally { setLoading(false); }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages); setInput(""); setLoading(true);
    try {
      const history = newMessages.map(m => ({ role: m.role, content: m.content }));
      const res: any = await interviewChat(sessionId, userMsg.content, history.slice(0, -1), mode);
      const updated = [...newMessages, { role: "assistant" as const, content: res.response }];
      setMessages(updated); setLastAiIndex(updated.length - 1);
    } catch { alert("Failed to get response."); }
    finally { setLoading(false); setTimeout(() => inputRef.current?.focus(), 100); }
  };

  const modeConfig = {
    standard: { color: "#3B82F6", bg: "var(--blue-dim)", border: "rgba(59,130,246,0.25)", label: "Standard Interview", icon: MessageSquare },
    defense:  { color: "#EF4444", bg: "var(--red-dim)",  border: "rgba(239,68,68,0.25)",  label: "Resume Defense",   icon: Shield },
  };
  const mc = modeConfig[mode];

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="page-content" style={{ display: "flex", flexDirection: "column" }}>

        {/* Header bar */}
        <div style={{ padding: "16px 32px", borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-surface)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>Mock Interview</h1>
            <p style={{ fontSize: 12.5, color: "var(--text-secondary)", marginTop: 2 }}>AI-powered interview practice with real-time feedback</p>
          </div>
          {started && (
            <button className="btn btn-secondary btn-sm" onClick={() => { setStarted(false); setMessages([]); setSessionId(""); }}>
              <RotateCcw size={13} /> New Session
            </button>
          )}
        </div>

        {!started ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ width: "100%", maxWidth: 480 }}>
              <div className="card" style={{ padding: 28 }}>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>Choose Interview Mode</h2>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 22, lineHeight: 1.5 }}>
                  Make sure your resume is uploaded via the Analyse page first.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 }}>
                  {(["standard", "defense"] as Mode[]).map(m => {
                    const cfg = modeConfig[m];
                    const Icon = cfg.icon;
                    const sel = mode === m;
                    return (
                      <div key={m} onClick={() => setMode(m)} style={{
                        padding: "14px 16px", borderRadius: 10, cursor: "pointer",
                        background: sel ? cfg.bg : "var(--bg-elevated)",
                        border: `1.5px solid ${sel ? cfg.color : "var(--border-subtle)"}`,
                        transition: "all 0.15s",
                        display: "flex", gap: 12, alignItems: "flex-start",
                      }}>
                        <div style={{ width: 34, height: 34, borderRadius: 8, background: `${cfg.color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Icon size={16} color={cfg.color} />
                        </div>
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-primary)" }}>{cfg.label}</div>
                          <div style={{ fontSize: 12.5, color: "var(--text-tertiary)", marginTop: 3, lineHeight: 1.4 }}>
                            {m === "standard"
                              ? "AI asks targeted questions from your resume. Gives feedback after each answer."
                              : "AI attacks your resume line by line. Defend every claim. Brutal but effective."}
                          </div>
                        </div>
                        {sel && <ChevronRight size={14} color={cfg.color} style={{ marginLeft: "auto", flexShrink: 0, marginTop: 10 }} />}
                      </div>
                    );
                  })}
                </div>

                <div style={{ marginBottom: 22 }}>
                  <label className="field-label">Session ID</label>
                  <input className="input" value={sessionId} onChange={e => setSessionId(e.target.value)}
                    placeholder="e.g. test-session-001" />
                  <div style={{ fontSize: 11.5, color: "var(--text-disabled)", marginTop: 5 }}>
                    Use the same session ID from your resume upload for personalised questions.
                  </div>
                </div>

                <button className="btn btn-primary btn-xl btn-full" onClick={handleStart} disabled={loading}
                  style={{ background: mode === "defense" ? "linear-gradient(135deg,#EF4444,#DC2626)" : undefined, color: mode === "defense" ? "#fff" : undefined }}>
                  {loading ? <><Loader2 size={15} className="animate-spin" /> Starting…</> : <><mc.icon size={15} /> Start {mc.label}</>}
                </button>
              </div>
            </motion.div>
          </div>
        ) : (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
            {/* Mode bar */}
            <div style={{ padding: "8px 24px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-elevated)", flexShrink: 0 }}>
              <span className={`badge badge-${mode === "defense" ? "red" : "blue"}`}>
                {mode === "defense" ? "⚔ Resume Defense" : "💬 Standard Interview"}
              </span>
              <span style={{ fontSize: 12, color: "var(--text-disabled)" }}>Session: {sessionId}</span>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
              {messages.map((msg, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  style={{ display: "flex", gap: 10, flexDirection: msg.role === "user" ? "row-reverse" : "row", alignItems: "flex-start" }}>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                    background: msg.role === "assistant" ? `${mc.color}20` : "rgba(245,158,11,0.15)" }}>
                    {msg.role === "assistant" ? <Bot size={14} color={mc.color} /> : <User size={14} color="#F59E0B" />}
                  </div>
                  <div className={msg.role === "assistant" ? "bubble-ai" : "bubble-user"}
                    style={{ maxWidth: "72%", padding: "11px 15px", fontSize: 13.5, lineHeight: 1.65, color: "var(--text-primary)" }}>
                    {msg.role === "assistant" && i === lastAiIndex ? <TypingText text={msg.content} /> : <span style={{ whiteSpace: "pre-wrap" }}>{msg.content}</span>}
                  </div>
                </motion.div>
              ))}
              {loading && (
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: `${mc.color}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Bot size={14} color={mc.color} />
                  </div>
                  <div className="bubble-ai" style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 4, alignItems: "center", height: 16 }}>
                      {[0,1,2].map(i => <div key={i} className="skeleton" style={{ width: 6, height: 6, borderRadius: "50%", animationDelay: `${i*0.2}s` }} />)}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{ padding: "14px 24px", borderTop: "1px solid var(--border-subtle)", background: "var(--bg-surface)", flexShrink: 0 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                <textarea ref={inputRef} className="textarea" value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Type your answer… (Enter to send, Shift+Enter for new line)"
                  rows={2} style={{ flex: 1, lineHeight: 1.5 }} />
                <button className="btn btn-primary" onClick={handleSend} disabled={!input.trim() || loading}
                  style={{ width: 42, height: 42, padding: 0, justifyContent: "center" }}>
                  <Send size={15} />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

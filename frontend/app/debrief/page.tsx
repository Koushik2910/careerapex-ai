"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy, TrendingUp, TrendingDown, Minus, Loader2, FileText,
  RotateCcw, ChevronDown, ChevronUp, Copy, Check, Radio, AlertCircle,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from "recharts";
import Sidebar from "@/components/Sidebar";
import { generateCoverLetter } from "@/lib/api";
import { getScoreColor } from "@/lib/utils";

// ── Score ring ─────────────────────────────────────────────────────────────────
function Ring({ score, size = 84, color }: { score: number; size?: number; color: string }) {
  const r = size * 0.38;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg-hover)" strokeWidth={size * 0.07} />
        <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}
          strokeWidth={size * 0.07} strokeLinecap="round" strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - (score / 100) * circ }}
          transition={{ duration: 1.2, ease: "easeOut" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: size * 0.21, fontWeight: 700, color, letterSpacing: "-0.02em" }}>{score}</span>
      </div>
    </div>
  );
}

// ── Inner component (uses useSearchParams) ─────────────────────────────────────
function DebriefInner() {
  const searchParams = useSearchParams();
  const urlSession = searchParams.get("session") || "";

  const [sessionId, setSessionId] = useState(urlSession);
  const [sessions, setSessions] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [autoLoading, setAutoLoading] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [coverLoading, setCoverLoading] = useState(false);
  const [showCover, setShowCover] = useState(false);
  const [expandedAnswer, setExpandedAnswer] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  // Load sessions list on mount
  useEffect(() => {
    fetch(`${API_BASE}/memory/sessions`)
      .then(r => r.json())
      .then(d => {
        const s = d?.sessions || [];
        setSessions(s);
        // If no URL param, pre-fill with latest session
        if (!urlSession && s.length > 0) {
          setSessionId(s[0].session_id);
        }
      })
      .catch(() => {});
  }, []);

  // Auto-load if session ID came from URL (e.g. from Voice Studio "View in Debrief")
  useEffect(() => {
    if (urlSession) {
      setSessionId(urlSession);
      loadSummary(urlSession);
    }
  }, [urlSession]);

  const loadSummary = useCallback(async (sid: string) => {
    const id = sid.trim();
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      // Cache-first: check tracker (ChromaDB confidence_{session_id})
      const res = await fetch(`${API_BASE}/tracker/summary/${id}`);
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();
      if (data.total_questions === 0) {
        setError("No interview data found for this session. Complete a Voice Interview or Mock Interview first.");
        setLoading(false);
        return;
      }
      setSummary(data);
    } catch {
      setError("No interview data found. Complete a Voice or Mock Interview with this session ID first.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLoad = () => loadSummary(sessionId);

  const handleCover = async () => {
    setCoverLoading(true);
    try {
      const r: any = await generateCoverLetter(sessionId);
      setCoverLetter(r.cover_letter);
      setShowCover(true);
    } catch {
      alert("Cover letter generation failed. Make sure resume + JD are uploaded for this session.");
    } finally {
      setCoverLoading(false);
    }
  };

  const copyCover = () => {
    navigator.clipboard.writeText(coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const chartData = summary?.scores?.map((s: any) => ({
    q: `Q${s.question_index}`,
    Score: s.score,
    Confidence: s.confidence_score,
  })) || [];

  const radarData = summary?.category_breakdown
    ? Object.entries(summary.category_breakdown).map(([k, v]) => ({
        category: k.charAt(0).toUpperCase() + k.slice(1),
        score: v,
      }))
    : [];

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
              <h1 style={{ fontSize: 26, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                Interview Debrief
              </h1>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 5 }}>
                Post-interview scorecard · Powered by cached tracker data · No extra LLM calls
              </p>
            </div>
            {summary && (
              <button className="btn btn-ghost btn-sm"
                onClick={() => { setSummary(null); setCoverLetter(""); setShowCover(false); setError(""); }}>
                <RotateCcw size={13} /> Different Session
              </button>
            )}
          </motion.div>

          {/* Session input — always visible when no summary loaded */}
          {!summary && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="card" style={{ padding: "24px 26px", maxWidth: 560, marginBottom: 20 }}>

              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <Radio size={15} color="#3B82F6" />
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-primary)" }}>
                  Load Interview Results
                </div>
              </div>

              <label className="field-label">Session ID</label>
              <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                <input
                  className="input"
                  value={sessionId}
                  onChange={e => { setSessionId(e.target.value); setError(""); }}
                  placeholder="session-1234567890-abc123"
                  style={{ fontFamily: "monospace", fontSize: 12.5 }}
                  onKeyDown={e => { if (e.key === "Enter") handleLoad(); }}
                />
                <button className="btn btn-primary" onClick={handleLoad}
                  disabled={loading || !sessionId.trim()} style={{ flexShrink: 0 }}>
                  {loading
                    ? <><Loader2 size={14} className="animate-spin" /> Loading…</>
                    : <><Trophy size={14} /> Load</>}
                </button>
              </div>

              {/* Quick-select from history */}
              {sessions.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-disabled)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                    Recent Sessions
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {sessions.slice(0, 5).map(s => (
                      <div key={s.session_id}
                        onClick={() => { setSessionId(s.session_id); setError(""); }}
                        style={{
                          padding: "9px 12px", borderRadius: 9, cursor: "pointer",
                          background: sessionId === s.session_id ? "rgba(245,158,11,0.06)" : "var(--bg-elevated)",
                          border: `1px solid ${sessionId === s.session_id ? "rgba(245,158,11,0.2)" : "var(--border-subtle)"}`,
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={e => { if (sessionId !== s.session_id) (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
                        onMouseLeave={e => { if (sessionId !== s.session_id) (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)"; }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 550, color: "var(--text-primary)" }}>
                            {s.resume_filename || s.session_id}
                          </div>
                          <div style={{ fontSize: 11.5, color: "var(--text-disabled)", fontFamily: "monospace", marginTop: 2 }}>
                            {s.session_id}
                          </div>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: getScoreColor(s.match_score), flexShrink: 0, marginLeft: 12 }}>
                          {s.match_score} match
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <div style={{
                  marginTop: 14, padding: "10px 14px", borderRadius: 10,
                  background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)",
                  display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13, color: "#EF4444",
                }}>
                  <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>{error}</span>
                </div>
              )}
            </motion.div>
          )}

          {/* ── Results ── */}
          <AnimatePresence>
            {summary && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                style={{ display: "flex", flexDirection: "column", gap: 18 }}>

                {/* Session badge */}
                <div style={{
                  padding: "10px 16px", borderRadius: 10,
                  background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.12)",
                  display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12.5,
                }}>
                  <span style={{ color: "var(--text-secondary)" }}>
                    Session: <span style={{ fontFamily: "monospace", color: "var(--text-primary)" }}>{sessionId}</span>
                  </span>
                  <span className="badge badge-blue">Cached · No LLM call</span>
                </div>

                {/* Overview */}
                <div className="card-accent" style={{ padding: "24px 28px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
                    <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>
                      Performance Overview
                    </h2>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 550,
                      color: summary.trend === "improving" ? "#10B981" : summary.trend === "declining" ? "#EF4444" : "var(--text-tertiary)",
                    }}>
                      {summary.trend === "improving"
                        ? <TrendingUp size={14} />
                        : summary.trend === "declining"
                        ? <TrendingDown size={14} />
                        : <Minus size={14} />}
                      {summary.trend || "consistent"}
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-around", marginBottom: 24 }}>
                    {[
                      { score: Math.round(summary.avg_score), label: "Avg Score", color: getScoreColor(summary.avg_score) },
                      { score: Math.round(summary.avg_confidence), label: "Confidence", color: "#3B82F6" },
                      { score: Math.min(summary.total_questions * 20, 100), label: "Completion", color: "#8B5CF6" },
                    ].map(r => (
                      <div key={r.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                        <Ring score={r.score} color={r.color} />
                        <span style={{ fontSize: 12, color: "var(--text-tertiary)", fontWeight: 500 }}>{r.label}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{
                    display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12,
                    paddingTop: 20, borderTop: "1px solid var(--border-subtle)",
                  }}>
                    {[
                      { label: "Questions Answered", value: summary.total_questions },
                      { label: "Strong Categories", value: summary.strong_categories?.join(", ") || "—" },
                      { label: "Weak Categories", value: summary.weak_categories?.join(", ") || "None" },
                    ].map(s => (
                      <div key={s.label} style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>{s.value}</div>
                        <div style={{ fontSize: 11.5, color: "var(--text-tertiary)", marginTop: 4 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Charts */}
                {chartData.length > 1 && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div className="card" style={{ padding: "20px 22px" }}>
                      <div className="section-title" style={{ marginBottom: 16 }}>Score Progression</div>
                      <ResponsiveContainer width="100%" height={180}>
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                          <XAxis dataKey="q" stroke="var(--text-disabled)" tick={{ fontSize: 11 }} />
                          <YAxis domain={[0, 100]} stroke="var(--text-disabled)" tick={{ fontSize: 11 }} />
                          <Tooltip contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: 8, fontSize: 12 }} />
                          <Line type="monotone" dataKey="Score" stroke="#F59E0B" strokeWidth={2} dot={{ fill: "#F59E0B", r: 3 }} />
                          <Line type="monotone" dataKey="Confidence" stroke="#3B82F6" strokeWidth={2} dot={{ fill: "#3B82F6", r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    {radarData.length > 0 && (
                      <div className="card" style={{ padding: "20px 22px" }}>
                        <div className="section-title" style={{ marginBottom: 16 }}>Category Breakdown</div>
                        <ResponsiveContainer width="100%" height={180}>
                          <RadarChart data={radarData}>
                            <PolarGrid stroke="var(--border-subtle)" />
                            <PolarAngleAxis dataKey="category" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
                            <Radar dataKey="score" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.12} strokeWidth={1.5} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                )}

                {/* All answers with feedback */}
                {summary.scores?.length > 0 && (
                  <div className="card" style={{ padding: "20px 24px" }}>
                    <div className="section-header" style={{ marginBottom: 16 }}>
                      <span className="section-title">Answer-by-Answer Breakdown</span>
                      <span className="badge badge-amber">{summary.scores.length} answers</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {[...(summary.scores || [])].sort((a: any, b: any) => a.question_index - b.question_index).map((ans: any, i: number) => {
                        const key = `answer-${i}`;
                        const isOpen = expandedAnswer === key;
                        return (
                          <div key={i} style={{
                            padding: "14px 16px", borderRadius: 12,
                            background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)",
                          }}>
                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-disabled)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 5 }}>
                                  Question {ans.question_index}
                                </div>
                                <div style={{ fontSize: 13.5, fontWeight: 550, color: "var(--text-primary)", lineHeight: 1.55 }}>
                                  {ans.question}
                                </div>
                              </div>
                              <div style={{ textAlign: "center", flexShrink: 0 }}>
                                <div style={{ fontSize: 22, fontWeight: 800, color: getScoreColor(ans.score) }}>{ans.score}</div>
                                <div style={{ fontSize: 10, color: "var(--text-disabled)" }}>/100</div>
                              </div>
                            </div>

                            {/* Answer preview */}
                            <div style={{
                              marginTop: 10, padding: "8px 12px", borderRadius: 8,
                              background: "var(--bg-base)", border: "1px solid var(--border-subtle)",
                            }}>
                              <div style={{ fontSize: 10.5, fontWeight: 600, color: "var(--text-disabled)", marginBottom: 3, textTransform: "uppercase" }}>
                                Your Answer
                              </div>
                              <div style={{ fontSize: 13, color: ans.answer ? "var(--text-secondary)" : "var(--text-disabled)", fontStyle: "italic", lineHeight: 1.55 }}>
                                {ans.answer ? `"${ans.answer}"` : "No answer recorded for this question."}
                              </div>
                            </div>

                            <button
                              onClick={() => setExpandedAnswer(isOpen ? null : key)}
                              style={{
                                fontSize: 12, color: "var(--text-tertiary)", background: "none",
                                border: "none", cursor: "pointer", marginTop: 8,
                                display: "flex", alignItems: "center", gap: 4, padding: 0,
                              }}>
                              {isOpen ? <><ChevronUp size={12} /> Hide feedback</> : <><ChevronDown size={12} /> Show feedback</>}
                            </button>

                            {isOpen && ans.feedback && (
                              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                                style={{ marginTop: 10, fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.65, display: "flex", gap: 8 }}>
                                <span style={{ color: "#F59E0B", flexShrink: 0 }}>→</span>
                                {ans.feedback}
                              </motion.div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Weakest / Strongest */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  {[
                    { title: "Needs Improvement", items: summary.weakest_answers, color: "#EF4444", bg: "rgba(239,68,68,0.04)", border: "rgba(239,68,68,0.1)" },
                    { title: "Best Answers", items: summary.strongest_answers, color: "#10B981", bg: "rgba(16,185,129,0.04)", border: "rgba(16,185,129,0.1)" },
                  ].map(section => (
                    <div key={section.title} className="card"
                      style={{ padding: "18px 20px", background: section.bg, borderColor: section.border }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: section.color, marginBottom: 12 }}>
                        {section.title}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {section.items?.map((ans: any, i: number) => (
                          <div key={i} style={{
                            padding: "10px 12px", borderRadius: 9,
                            background: "var(--bg-base)", border: "1px solid var(--border-subtle)",
                          }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                              <p style={{ fontSize: 12.5, color: "var(--text-secondary)", flex: 1, lineHeight: 1.5 }}>
                                Q{ans.question_index}: {ans.question.slice(0, 80)}…
                              </p>
                              <span style={{ fontSize: 15, fontWeight: 700, color: section.color, marginLeft: 10, flexShrink: 0 }}>
                                {ans.score}
                              </span>
                            </div>
                            {ans.feedback && (
                              <p style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 6, lineHeight: 1.5 }}>
                                {ans.feedback}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Cover letter */}
                <div className="card" style={{ padding: "20px 24px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: showCover ? 16 : 0 }}>
                    <div>
                      <div className="section-title">Cover Letter</div>
                      <div style={{ fontSize: 12.5, color: "var(--text-tertiary)", marginTop: 3 }}>
                        Generate a targeted cover letter from your resume + JD
                      </div>
                    </div>
                    <button className="btn btn-secondary btn-sm" onClick={handleCover} disabled={coverLoading}>
                      {coverLoading
                        ? <><Loader2 size={13} className="animate-spin" /> Generating…</>
                        : <><FileText size={13} /> Generate</>}
                    </button>
                  </div>
                  {showCover && coverLetter && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <div style={{
                        padding: "16px 18px", borderRadius: 10,
                        background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)",
                        fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.75, whiteSpace: "pre-wrap",
                      }}>
                        {coverLetter}
                      </div>
                      <button className="btn btn-ghost btn-sm" onClick={copyCover} style={{ marginTop: 10 }}>
                        {copied
                          ? <><Check size={13} color="#10B981" /> Copied</>
                          : <><Copy size={13} /> Copy to clipboard</>}
                      </button>
                    </motion.div>
                  )}
                </div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// ── Wrap in Suspense for useSearchParams ───────────────────────────────────────
export default function DebriefPage() {
  return (
    <Suspense fallback={
      <div className="app-shell">
        <Sidebar />
        <main className="page-content gradient-bg">
          <div className="page-inner" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
            <Loader2 size={24} className="animate-spin" color="var(--text-tertiary)" />
          </div>
        </main>
      </div>
    }>
      <DebriefInner />
    </Suspense>
  );
}

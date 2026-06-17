"use client";

import { useState, useEffect } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, TrendingUp, TrendingDown, Minus, Loader2, FileText, RotateCcw, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis } from "recharts";
import Sidebar from "@/components/Sidebar";
import { getConfidenceSummary, generateCoverLetter } from "@/lib/api";
import { getScoreColor } from "@/lib/utils";

function Ring({ score, size = 84, color }: { score: number; size?: number; color: string }) {
  const r = size * 0.38; const circ = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg-hover)" strokeWidth={size*0.07} />
        <motion.circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={size*0.07} strokeLinecap="round"
          strokeDasharray={circ} initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: circ - (score/100)*circ }}
          transition={{ duration: 1.2, ease: "easeOut" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: size*0.21, fontWeight: 700, color, letterSpacing: "-0.02em" }}>{score}</span>
      </div>
    </div>
  );
}

export default function DebriefPage() {
  const [sessionId, setSessionId] = useState("");
  const [sessions, setSessions] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Auto-load sessions from memory on mount
  useEffect(() => {
    fetch(`${API_BASE}/memory/sessions`)
      .then(r => r.json())
      .then(d => {
        const s = d?.sessions || [];
        setSessions(s);
        if (s.length > 0) setSessionId(s[0].session_id);
      })
      .catch(() => {});
  }, []);
  const [coverLetter, setCoverLetter] = useState("");
  const [coverLoading, setCoverLoading] = useState(false);
  const [showCover, setShowCover] = useState(false);
  const [expandedAnswer, setExpandedAnswer] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true); setError("");
    try { setSummary(await getConfidenceSummary(sessionId.trim())); }
    catch { setError("No data found for this session."); }
    finally { setLoading(false); }
  };

  const handleCover = async () => {
    setCoverLoading(true);
    try { const r: any = await generateCoverLetter(sessionId); setCoverLetter(r.cover_letter); setShowCover(true); }
    catch { alert("Cover letter generation failed."); }
    finally { setCoverLoading(false); }
  };

  const copyCover = () => {
    navigator.clipboard.writeText(coverLetter);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const chartData = summary?.scores?.map((s: any) => ({ q: `Q${s.question_index}`, Score: s.score, Confidence: s.confidence_score })) || [];
  const radarData = summary?.category_breakdown ? Object.entries(summary.category_breakdown).map(([k, v]) => ({ category: k.charAt(0).toUpperCase() + k.slice(1), score: v })) : [];
  const delta = summary?.trend;

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="page-content gradient-bg">
        <div className="page-inner">
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            style={{ paddingBottom: 28, marginBottom: 32, borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>Interview Debrief</h1>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 5 }}>Post-interview scorecard and confidence analysis</p>
            </div>
            {summary && (
              <button className="btn btn-ghost btn-sm" onClick={() => { setSummary(null); setCoverLetter(""); setShowCover(false); }}>
                <RotateCcw size={13} /> Different session
              </button>
            )}
          </motion.div>

          {!summary && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: 24, maxWidth: 480 }}>
              <label className="field-label">Session ID</label>
              <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                <input className="input" value={sessionId} onChange={e => setSessionId(e.target.value)} placeholder="e.g. test-session-001" />
                <button className="btn btn-primary" onClick={load} disabled={loading} style={{ flexShrink: 0 }}>
                  {loading ? <><Loader2 size={14} className="animate-spin" /> Loading…</> : <><Trophy size={14} /> Load</>}
                </button>
              </div>
              {error && <div style={{ marginTop: 10, fontSize: 13, color: "#EF4444" }}>{error}</div>}
            </motion.div>
          )}

          <AnimatePresence>
            {summary && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", flexDirection: "column", gap: 18 }}>

                {/* Overview */}
                <div className="card-accent" style={{ padding: "22px 26px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                    <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>Performance Overview</h2>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: delta === "improving" ? "#10B981" : delta === "declining" ? "#EF4444" : "var(--text-tertiary)", fontWeight: 550 }}>
                      {delta === "improving" ? <TrendingUp size={14} /> : delta === "declining" ? <TrendingDown size={14} /> : <Minus size={14} />}
                      {delta || "consistent"}
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-around", marginBottom: 22 }}>
                    {[
                      { score: summary.avg_score, label: "Avg Score", color: getScoreColor(summary.avg_score) },
                      { score: summary.avg_confidence, label: "Confidence", color: "#3B82F6" },
                      { score: Math.min(summary.total_questions * 10, 100), label: "Completion", color: "#8B5CF6" },
                    ].map(r => (
                      <div key={r.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                        <Ring score={r.score} color={r.color} />
                        <span style={{ fontSize: 12, color: "var(--text-tertiary)", fontWeight: 500 }}>{r.label}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, paddingTop: 18, borderTop: "1px solid var(--border-subtle)" }}>
                    {[
                      { label: "Questions Answered", value: summary.total_questions },
                      { label: "Strong Categories", value: summary.strong_categories?.join(", ") || "—" },
                      { label: "Weak Categories", value: summary.weak_categories?.join(", ") || "None" },
                    ].map(s => (
                      <div key={s.label} style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 19, fontWeight: 700, color: "var(--text-primary)" }}>{s.value}</div>
                        <div style={{ fontSize: 11.5, color: "var(--text-tertiary)", marginTop: 3 }}>{s.label}</div>
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
                          <YAxis domain={[0,100]} stroke="var(--text-disabled)" tick={{ fontSize: 11 }} />
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

                {/* Weakest / Strongest */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  {[
                    { title: "Needs Improvement", items: summary.weakest_answers, color: "#EF4444", bg: "rgba(239,68,68,0.04)", border: "rgba(239,68,68,0.1)" },
                    { title: "Best Answers", items: summary.strongest_answers, color: "#10B981", bg: "rgba(16,185,129,0.04)", border: "rgba(16,185,129,0.1)" },
                  ].map(section => (
                    <div key={section.title} className="card" style={{ padding: "18px 20px", background: section.bg, borderColor: section.border }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: section.color, marginBottom: 12 }}>{section.title}</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {section.items?.map((ans: any, i: number) => {
                          const key = `${section.title}-${i}`;
                          return (
                            <div key={i} style={{ padding: "10px 12px", borderRadius: 9, background: "var(--bg-base)", border: "1px solid var(--border-subtle)" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <p style={{ fontSize: 12.5, color: "var(--text-secondary)", flex: 1, lineHeight: 1.5 }}>
                                  Q{ans.question_index}: {ans.question.slice(0, 70)}…
                                </p>
                                <span style={{ fontSize: 14, fontWeight: 700, color: section.color, marginLeft: 10, flexShrink: 0 }}>{ans.score}</span>
                              </div>
                              <button onClick={() => setExpandedAnswer(expandedAnswer === key ? null : key)}
                                style={{ fontSize: 11.5, color: "var(--text-tertiary)", background: "none", border: "none", cursor: "pointer", marginTop: 6, display: "flex", alignItems: "center", gap: 3 }}>
                                {expandedAnswer === key ? <><ChevronUp size={11} /> Hide</> : <><ChevronDown size={11} /> Feedback</>}
                              </button>
                              {expandedAnswer === key && (
                                <p style={{ fontSize: 12.5, color: "var(--text-tertiary)", marginTop: 8, lineHeight: 1.55 }}>{ans.feedback}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Cover letter */}
                <div className="card" style={{ padding: "20px 24px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: showCover ? 16 : 0 }}>
                    <div>
                      <div className="section-title">Cover Letter</div>
                      <div style={{ fontSize: 12.5, color: "var(--text-tertiary)", marginTop: 3 }}>Generate a targeted cover letter from your resume + JD</div>
                    </div>
                    <button className="btn btn-secondary btn-sm" onClick={handleCover} disabled={coverLoading}>
                      {coverLoading ? <><Loader2 size={13} className="animate-spin" /> Generating…</> : <><FileText size={13} /> Generate</>}
                    </button>
                  </div>
                  {showCover && coverLetter && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <div style={{ padding: "16px 18px", borderRadius: 10, background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>
                        {coverLetter}
                      </div>
                      <button className="btn btn-ghost btn-sm" onClick={copyCover} style={{ marginTop: 10 }}>
                        {copied ? <><Check size={13} color="#10B981" /> Copied</> : <><Copy size={13} /> Copy to clipboard</>}
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


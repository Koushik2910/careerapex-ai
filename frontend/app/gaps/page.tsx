"use client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GitBranch, Loader2, RotateCcw, CheckCircle, AlertTriangle,
  ChevronDown, Calendar, Target,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import Sidebar from "@/components/Sidebar";
import { getScoreColor } from "@/lib/utils";

const priorityColor: Record<string, string> = {
  high: "#EF4444", medium: "#F59E0B", low: "#10B981",
};

export default function GapsPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/memory/sessions`)
      .then(r => r.json())
      .then(d => setSessions(d?.sessions || []))
      .catch(() => setSessions([]))
      .finally(() => setSessionsLoading(false));
  }, []);

  const handleSelectSession = async (session: any) => {
    setSelectedSession(session);
    setDropdownOpen(false);
    setError("");

    // Use cached analysis_data first — zero LLM calls
    if (session.analysis_data && Object.keys(session.analysis_data).length > 0) {
      setData(session.analysis_data);
      return;
    }

    // Fallback: call analyse endpoint
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/analyse/gaps/${session.session_id}`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error("Analysis failed");
      setData(await res.json());
    } catch {
      setError("Failed to load analysis. Try running analysis from the Analyse page first.");
    } finally {
      setLoading(false);
    }
  };

  const barData = data?.skill_gaps?.map((g: any) => ({
    skill: g.skill?.length > 16 ? g.skill.slice(0, 16) + "…" : g.skill,
    gap: g.gap_score,
    full: g.skill,
  })) || [];

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="page-content gradient-bg">
        <div className="page-inner">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            style={{ paddingBottom: 28, marginBottom: 32, borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                Skill Gap Analysis
              </h1>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 5 }}>
                Select a session to view cached skill gap results — no LLM calls
              </p>
            </div>
            {data && (
              <button className="btn btn-ghost btn-sm" onClick={() => { setData(null); setSelectedSession(null); }}>
                <RotateCcw size={13} /> Change Session
              </button>
            )}
          </motion.div>

          {/* Session dropdown — always visible at top */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="card" style={{ padding: "20px 24px", marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
              Select Session
            </div>

            {sessionsLoading ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-tertiary)" }}>
                <Loader2 size={14} className="animate-spin" /> Loading sessions…
              </div>
            ) : sessions.length === 0 ? (
              <div style={{ fontSize: 13, color: "var(--text-tertiary)" }}>
                No sessions found. Upload a resume and run analysis on the Analyse page first.
              </div>
            ) : (
              <div style={{ position: "relative" }}>
                {/* Trigger */}
                <button onClick={() => setDropdownOpen(o => !o)} style={{
                  width: "100%", padding: "12px 16px", borderRadius: 10,
                  background: "var(--bg-base)", border: "1px solid var(--border-default)",
                  color: selectedSession ? "var(--text-primary)" : "var(--text-disabled)",
                  fontSize: 13.5, cursor: "pointer", textAlign: "left",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  {selectedSession ? (
                    <span>
                      <strong>{selectedSession.resume_filename || selectedSession.session_id}</strong>
                      {" · "}
                      {new Date(selectedSession.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      {" · Match "}
                      <span style={{ color: getScoreColor(selectedSession.match_score), fontWeight: 700 }}>
                        {selectedSession.match_score}
                      </span>
                    </span>
                  ) : (
                    "Choose a session to view skill gaps…"
                  )}
                  <ChevronDown size={15} color="var(--text-tertiary)" style={{ flexShrink: 0, marginLeft: 8 }} />
                </button>

                {/* Dropdown list */}
                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                      style={{
                        position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 100,
                        background: "var(--bg-elevated)", border: "1px solid var(--border-default)",
                        borderRadius: 12, overflow: "hidden", boxShadow: "var(--shadow-lg)",
                        maxHeight: 320, overflowY: "auto",
                      }}>
                      {sessions.map((s, i) => (
                        <div key={s.session_id} onClick={() => handleSelectSession(s)}
                          style={{
                            padding: "13px 16px", cursor: "pointer",
                            borderBottom: i < sessions.length - 1 ? "1px solid var(--border-subtle)" : "none",
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            background: selectedSession?.session_id === s.session_id ? "rgba(245,158,11,0.06)" : "transparent",
                            transition: "background 0.12s",
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = selectedSession?.session_id === s.session_id ? "rgba(245,158,11,0.06)" : "transparent"; }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {s.resume_filename || s.session_id}
                            </div>
                            <div style={{ fontSize: 11.5, color: "var(--text-tertiary)", marginTop: 3, display: "flex", alignItems: "center", gap: 8 }}>
                              <Calendar size={10} />
                              {new Date(s.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                              <span style={{ fontSize: 11, color: "var(--text-disabled)", fontFamily: "monospace" }}>
                                {s.session_id}
                              </span>
                            </div>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 16 }}>
                            <div style={{ fontSize: 17, fontWeight: 700, color: getScoreColor(s.match_score) }}>{s.match_score}</div>
                            <div style={{ fontSize: 10.5, color: "var(--text-disabled)" }}>match</div>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {loading && (
              <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#F59E0B" }}>
                <Loader2 size={14} className="animate-spin" /> Loading analysis…
              </div>
            )}
            {error && (
              <div style={{ marginTop: 10, fontSize: 13, color: "#EF4444", padding: "8px 12px", borderRadius: 8, background: "var(--red-dim)", border: "1px solid rgba(239,68,68,0.2)" }}>
                {error}
              </div>
            )}
          </motion.div>

          {/* Results */}
          <AnimatePresence>
            {data && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                style={{ display: "flex", flexDirection: "column", gap: 18 }}>

                {/* Cache badge */}
                <div style={{ padding: "10px 16px", borderRadius: 10, background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12.5 }}>
                  <span style={{ color: "var(--text-secondary)" }}>
                    Showing results for{" "}
                    <strong style={{ color: "var(--text-primary)" }}>{selectedSession?.resume_filename || selectedSession?.session_id}</strong>
                    {selectedSession?.jd_filename ? <span style={{ color: "var(--text-tertiary)" }}> vs <span style={{ color: "#3B82F6" }}>{selectedSession.jd_filename}</span></span> : ""}
                  </span>
                  <span className="badge badge-green">Cached · No LLM call</span>
                </div>

                {/* KPI row */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
                  {[
                    { label: "Match Score", value: `${data.overall_match_score}/100`, color: getScoreColor(data.overall_match_score) },
                    { label: "Gaps Found", value: String(data.skill_gaps?.length || 0), color: "#EF4444" },
                    { label: "Strengths", value: String(data.strengths?.length || 0), color: "#10B981" },
                  ].map(kpi => (
                    <div key={kpi.label} className="card kpi-card">
                      <div className="kpi-label">{kpi.label}</div>
                      <div className="kpi-value" style={{ color: kpi.color, marginTop: 4 }}>{kpi.value}</div>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                {data.summary && (
                  <div className="card" style={{ padding: "16px 20px" }}>
                    <p style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.65 }}>{data.summary}</p>
                  </div>
                )}

                {/* Bar chart */}
                {barData.length > 0 && (
                  <div className="card" style={{ padding: "20px 24px" }}>
                    <div className="section-title" style={{ marginBottom: 16 }}>Gap Score by Skill</div>
                    <ResponsiveContainer width="100%" height={210}>
                      <BarChart data={barData} margin={{ left: -10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                        <XAxis dataKey="skill" stroke="var(--text-disabled)" tick={{ fontSize: 10 }} />
                        <YAxis domain={[0, 100]} stroke="var(--text-disabled)" tick={{ fontSize: 11 }} />
                        <Tooltip contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: 8, fontSize: 12 }}
                          formatter={(v: any, n: any, p: any) => [v, p?.payload?.full || n]} />
                        <Bar dataKey="gap" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Gap list */}
                {data.skill_gaps?.length > 0 && (
                  <div className="card" style={{ padding: "20px 24px" }}>
                    <div className="section-header">
                      <span className="section-title">All Skill Gaps</span>
                      <span className="badge badge-red">{data.skill_gaps.length} found</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {data.skill_gaps.map((gap: any, i: number) => (
                        <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                          style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", borderRadius: 10, background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                              <span style={{ fontSize: 13.5, fontWeight: 550, color: "var(--text-primary)" }}>{gap.skill}</span>
                              <span className={`badge badge-${gap.priority === "high" ? "red" : gap.priority === "medium" ? "amber" : "green"}`}>{gap.priority}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div className="progress-track" style={{ flex: 1 }}>
                                <motion.div initial={{ width: 0 }} animate={{ width: `${gap.gap_score}%` }}
                                  transition={{ duration: 0.8, delay: i * 0.06 }}
                                  style={{ height: "100%", borderRadius: 99, background: priorityColor[gap.priority] || "#F59E0B" }} />
                              </div>
                              <span style={{ fontSize: 12, color: "var(--text-tertiary)", width: 28, textAlign: "right", flexShrink: 0 }}>{gap.gap_score}</span>
                            </div>
                            <div style={{ fontSize: 11.5, color: "var(--text-disabled)", marginTop: 4 }}>
                              Required: {gap.required_level} · Current: {gap.current_level}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Strengths + Recommendations */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div className="card" style={{ padding: "18px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
                      <CheckCircle size={15} color="#10B981" />
                      <span className="section-title">Strengths</span>
                    </div>
                    <ul style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {data.strengths?.map((item: string, i: number) => (
                        <li key={i} style={{ display: "flex", gap: 8, fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                          <span style={{ color: "#10B981", flexShrink: 0 }}>✓</span>{item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="card" style={{ padding: "18px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
                      <AlertTriangle size={15} color="#F59E0B" />
                      <span className="section-title">Recommendations</span>
                    </div>
                    <ul style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {data.recommendations?.map((item: string, i: number) => (
                        <li key={i} style={{ display: "flex", gap: 8, fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                          <span style={{ color: "#F59E0B", flexShrink: 0 }}>→</span>{item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </main>
    </div>
  );
}


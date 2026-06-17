"use client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, TrendingUp, TrendingDown, Minus, Loader2,
  Calendar, MessageSquare, FileText, RefreshCw, Trash2, X,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { getScoreColor } from "@/lib/utils";

export default function MemoryPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const loadData = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true); else setLoading(true);
    try {
      const [sessRes, progRes] = await Promise.all([
        fetch(`${API_BASE}/memory/sessions`).then(r => r.json()),
        fetch(`${API_BASE}/memory/progress`).then(r => r.json()),
      ]);
      const sorted = (sessRes?.sessions || []).sort((a: any, b: any) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setSessions(sorted);
      setProgress(progRes);
      if (sorted.length > 0 && !selected) setSelected(sorted[0]);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    const handler = () => { if (document.visibilityState === "visible") loadData(true); };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  const handleDelete = async (sessionId: string) => {
    setDeleting(sessionId);
    try {
      await fetch(`${API_BASE}/memory/session/${sessionId}`, { method: "DELETE" });
      const updated = sessions.filter(s => s.session_id !== sessionId);
      setSessions(updated);
      if (selected?.session_id === sessionId) setSelected(updated[0] || null);
    } catch { alert("Delete failed. Please try again."); }
    finally { setDeleting(null); setConfirmDelete(null); }
  };

  const delta = progress?.match_score_delta || 0;

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="page-content gradient-bg">
        <div className="page-inner">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            style={{ paddingBottom: 28, marginBottom: 32, borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>Career Memory</h1>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 5 }}>Your full session history and progress over time</p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => loadData(true)} disabled={refreshing}>
              <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} /> Refresh
            </button>
          </motion.div>

          {/* Progress summary */}
          {progress && progress.sessions_count > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="card-accent" style={{ padding: "20px 24px", marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <span className="section-title">Progress Summary</span>
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 550, color: delta > 0 ? "#10B981" : delta < 0 ? "#EF4444" : "var(--text-tertiary)" }}>
                  {delta > 0 ? <TrendingUp size={13} /> : delta < 0 ? <TrendingDown size={13} /> : <Minus size={13} />}
                  {delta > 0 ? "+" : ""}{delta} pts
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                {[
                  { label: "Total Sessions", value: sessions.length, color: "#F59E0B" },
                  { label: "Latest Match", value: `${progress.latest_match_score}/100`, color: "#3B82F6" },
                  { label: "Previous Match", value: `${progress.previous_match_score || 0}/100`, color: "var(--text-tertiary)" },
                  { label: "Avg Answer", value: `${Math.round(progress.latest_avg_answer_score || 0)}/100`, color: "#10B981" },
                ].map(s => (
                  <div key={s.label} style={{ padding: "12px 14px", borderRadius: 10, background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", textAlign: "center" }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 11.5, color: "var(--text-tertiary)", marginTop: 3 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 14 }}>{progress.message}</p>
            </motion.div>
          )}

          {/* Confirm delete modal */}
          <AnimatePresence>
            {confirmDelete && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <motion.div initial={{ scale: 0.95, y: 8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 8 }}
                  className="card" style={{ padding: "24px 28px", maxWidth: 380, width: "90%" }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>Delete Session?</div>
                  <p style={{ fontSize: 13.5, color: "var(--text-secondary)", marginBottom: 20, lineHeight: 1.5 }}>
                    This will permanently remove this session from Career Memory. This cannot be undone.
                  </p>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => handleDelete(confirmDelete)} disabled={!!deleting}>
                      {deleting === confirmDelete ? <><Loader2 size={13} className="animate-spin" /> Deleting…</> : <><Trash2 size={13} /> Delete</>}
                    </button>
                    <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setConfirmDelete(null)}>
                      <X size={13} /> Cancel
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 64, borderRadius: 12 }} />)}
            </div>
          ) : sessions.length === 0 ? (
            <div className="card empty-state">
              <div className="empty-state-icon"><Brain size={22} color="var(--text-tertiary)" /></div>
              <h3>No sessions yet</h3>
              <p>Complete an analysis on the Analyse page to see your history here.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 18, alignItems: "start" }}>

              {/* Session list */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-disabled)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>
                  {sessions.length} Sessions
                </div>
                {sessions.map((s, i) => (
                  <motion.div key={s.session_id}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    onClick={() => setSelected(s)}
                    style={{
                      padding: "12px 14px", borderRadius: 10, cursor: "pointer",
                      background: selected?.session_id === s.session_id ? "rgba(245,158,11,0.08)" : "var(--bg-surface)",
                      border: `1px solid ${selected?.session_id === s.session_id ? "rgba(245,158,11,0.25)" : "var(--border-subtle)"}`,
                      transition: "all 0.15s", position: "relative",
                    }}
                    onMouseEnter={e => { if (selected?.session_id !== s.session_id) (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)"; }}
                    onMouseLeave={e => { if (selected?.session_id !== s.session_id) (e.currentTarget as HTMLElement).style.background = "var(--bg-surface)"; }}>

                    {/* Delete button */}
                    <button onClick={e => { e.stopPropagation(); setConfirmDelete(s.session_id); }}
                      style={{ position: "absolute", top: 8, right: 8, background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6, color: "var(--text-disabled)", transition: "color 0.15s" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#EF4444"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--text-disabled)"; }}
                      title="Delete session">
                      <Trash2 size={12} />
                    </button>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingRight: 20 }}>
                      <div style={{ fontSize: 13, fontWeight: 550, color: "var(--text-primary)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {s.resume_filename || s.session_id}
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: getScoreColor(s.match_score), flexShrink: 0 }}>{s.match_score}</span>
                    </div>
                    {s.jd_filename && (
                      <div style={{ fontSize: 11.5, color: "#3B82F6", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 20 }}>
                        vs {s.jd_filename}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 10, marginTop: 4, fontSize: 11.5, color: "var(--text-disabled)" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <Calendar size={10} />
                        {new Date(s.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <MessageSquare size={10} /> {s.questions_asked}q
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Detail panel */}
              {selected ? (
                <motion.div key={selected.session_id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                  className="card" style={{ padding: "22px 24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                    <div className="section-title">Session Detail</div>
                    <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(selected.session_id)}>
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
                    {[
                      { label: "Match Score", value: `${selected.match_score}/100`, color: getScoreColor(selected.match_score) },
                      { label: "Avg Answer", value: `${Math.round(selected.avg_answer_score)}/100`, color: "#3B82F6" },
                      { label: "Questions", value: selected.questions_asked, color: "#8B5CF6" },
                    ].map(s => (
                      <div key={s.label} style={{ padding: "12px 14px", borderRadius: 10, background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", textAlign: "center" }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: 11.5, color: "var(--text-tertiary)", marginTop: 3 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-disabled)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Files</div>
                      <div style={{ fontSize: 13.5, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                        <FileText size={13} /> Resume: <strong style={{ color: "var(--text-primary)" }}>{selected.resume_filename || "—"}</strong>
                      </div>
                      <div style={{ fontSize: 13.5, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6 }}>
                        <FileText size={13} color="#3B82F6" /> JD: <strong style={{ color: "#3B82F6" }}>{selected.jd_filename || "—"}</strong>
                      </div>
                    </div>

                    {selected.strengths?.length > 0 && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-disabled)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Strengths</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {selected.strengths.map((s: string, i: number) => (
                            <span key={i} className="badge badge-green">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {selected.skill_gaps?.length > 0 && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-disabled)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Skill Gaps</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {selected.skill_gaps.map((g: any, i: number) => (
                            <span key={i} className="badge badge-red">{typeof g === "string" ? g : g.skill || g}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-disabled)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Session ID</div>
                      <div style={{ fontSize: 12, color: "var(--text-disabled)", fontFamily: "monospace" }}>{selected.session_id}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-disabled)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Date</div>
                      <div style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>
                        {new Date(selected.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="card empty-state">
                  <div className="empty-state-icon"><Brain size={20} color="var(--text-tertiary)" /></div>
                  <h3>Select a session</h3>
                  <p>Click any session on the left to view its details.</p>
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}


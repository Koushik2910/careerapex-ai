"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Map, Loader2, CheckCircle, Circle, ChevronDown, ChevronUp, Sparkles, Calendar } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { getScoreColor } from "@/lib/utils";

interface RoadmapItem { week: string; title: string; tasks: string[]; resources: string[]; }

export default function RoadmapPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [targetRole, setTargetRole] = useState("AI Automation Engineer");
  const [timeframe, setTimeframe] = useState("3 months");
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState<RoadmapItem[]>([]);
  const [expanded, setExpanded] = useState<number | null>(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("http://localhost:8001/memory/sessions")
      .then(r => r.json())
      .then(d => {
        const s = d?.sessions || [];
        setSessions(s);
        if (s.length > 0) setSelectedSession(s[0]);
      })
      .catch(() => setSessions([]))
      .finally(() => setSessionsLoading(false));
  }, []);

  const parseRoadmap = (text: string): RoadmapItem[] => {
    const items: RoadmapItem[] = [];
    const blocks = text.split(/WEEK \d+:/i).filter(Boolean);
    blocks.forEach((block, i) => {
      const lines = block.trim().split("\n").filter(Boolean);
      const title = lines[0]?.replace(/^[\[\]]/g, "").trim() || `Week ${i + 1}`;
      const tasks: string[] = []; const resources: string[] = [];
      let section = "";
      lines.slice(1).forEach(line => {
        const t = line.trim();
        if (t.toLowerCase().includes("task")) { section = "tasks"; return; }
        if (t.toLowerCase().includes("resource")) { section = "resources"; return; }
        if (t.startsWith("-") || t.startsWith("•") || t.startsWith("*")) {
          const c = t.replace(/^[-•*]\s*/, "");
          if (section === "tasks") tasks.push(c);
          else if (section === "resources") resources.push(c);
          else tasks.push(c);
        }
      });
      if (title || tasks.length > 0) items.push({ week: `Week ${i + 1}`, title, tasks, resources });
    });
    if (!items.length && text.length > 50) {
      return [{ week: "Roadmap", title: `${targetRole} Learning Path`, tasks: text.split("\n").filter(l => l.trim()).slice(0, 15), resources: [] }];
    }
    return items;
  };

  const handleGenerate = async () => {
    if (!selectedSession) { setError("Please select a session first."); return; }
    setLoading(true); setError(""); setRoadmap([]);
    try {
      const weeks = timeframe === "1 month" ? "4" : timeframe === "3 months" ? "12" : "8";
      const msg = `Generate a detailed ${timeframe} learning roadmap to become a ${targetRole}.\n\nFor each week use this exact format:\nWEEK 1: [Week Title]\nTasks:\n- task 1\n- task 2\nResources:\n- resource 1\n\nGenerate exactly ${weeks} weeks. Do not use tools. Write the roadmap directly now.`;
      const res = await fetch("http://localhost:8001/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: selectedSession.session_id, message: msg, history: [] }),
      });
      const data = await res.json();
      setRoadmap(parseRoadmap(data.response || ""));
    } catch { setError("Failed to generate. Make sure your resume is uploaded."); }
    finally { setLoading(false); }
  };

  const toggle = (i: number) => {
    const s = new Set(completed);
    s.has(i) ? s.delete(i) : s.add(i);
    setCompleted(s);
  };

  const progress = roadmap.length > 0 ? Math.round((completed.size / roadmap.length) * 100) : 0;

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="page-content gradient-bg">
        <div className="page-inner">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            style={{ paddingBottom: 28, marginBottom: 32, borderBottom: "1px solid var(--border-subtle)" }}>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>Career Roadmap</h1>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 5 }}>Personalised learning path based on your resume and skill gaps</p>
          </motion.div>

          {/* Config card */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: "20px 24px", marginBottom: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 160px 160px", gap: 14, alignItems: "flex-end" }}>

              {/* Session dropdown */}
              <div>
                <label className="field-label">Session</label>
                <div style={{ position: "relative", marginTop: 4 }}>
                  <button onClick={() => setDropdownOpen(o => !o)} style={{
                    width: "100%", padding: "10px 14px", borderRadius: 9,
                    background: "var(--bg-base)", border: "1px solid var(--border-default)",
                    color: selectedSession ? "var(--text-primary)" : "var(--text-disabled)",
                    fontSize: 13, cursor: "pointer", textAlign: "left",
                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                  }}>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {sessionsLoading ? "Loading…" : selectedSession ? (selectedSession.resume_filename || selectedSession.session_id) : "Select session…"}
                    </span>
                    <ChevronDown size={13} color="var(--text-tertiary)" style={{ flexShrink: 0 }} />
                  </button>

                  <AnimatePresence>
                    {dropdownOpen && sessions.length > 0 && (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 100, background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: 10, overflow: "hidden", boxShadow: "var(--shadow-lg)", maxHeight: 240, overflowY: "auto" }}>
                        {sessions.map((s, i) => (
                          <div key={s.session_id} onClick={() => { setSelectedSession(s); setDropdownOpen(false); }}
                            style={{ padding: "10px 14px", cursor: "pointer", borderBottom: i < sessions.length - 1 ? "1px solid var(--border-subtle)" : "none", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "background 0.1s" }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 550, color: "var(--text-primary)" }}>{s.resume_filename || s.session_id}</div>
                              <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                                <Calendar size={9} /> {new Date(s.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                              </div>
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: getScoreColor(s.match_score), flexShrink: 0, marginLeft: 10 }}>{s.match_score}</span>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div>
                <label className="field-label">Target Role</label>
                <input className="input" value={targetRole} onChange={e => setTargetRole(e.target.value)} style={{ marginTop: 4 }} />
              </div>
              <div>
                <label className="field-label">Timeframe</label>
                <select className="select" value={timeframe} onChange={e => setTimeframe(e.target.value)} style={{ marginTop: 4 }}>
                  <option value="1 month">1 Month</option>
                  <option value="2 months">2 Months</option>
                  <option value="3 months">3 Months</option>
                </select>
              </div>
              <button className="btn btn-primary" onClick={handleGenerate} disabled={loading || !selectedSession}>
                {loading ? <><Loader2 size={14} className="animate-spin" /> Generating…</> : <><Sparkles size={14} /> Generate</>}
              </button>
            </div>
            {error && <div style={{ marginTop: 12, fontSize: 13, color: "#EF4444" }}>{error}</div>}
          </motion.div>

          {/* Progress bar */}
          {roadmap.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card" style={{ padding: "14px 20px", marginBottom: 18, display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7, fontSize: 12.5 }}>
                  <span style={{ color: "var(--text-secondary)" }}>Roadmap Progress</span>
                  <span style={{ color: "#F59E0B", fontWeight: 600 }}>{completed.size}/{roadmap.length} weeks</span>
                </div>
                <div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
              </div>
              <span style={{ fontSize: 20, fontWeight: 700, color: "#F59E0B", letterSpacing: "-0.02em" }}>{progress}%</span>
            </motion.div>
          )}

          {/* Roadmap items */}
          <AnimatePresence>
            {roadmap.map((item, i) => {
              const done = completed.has(i); const open = expanded === i;
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="card" style={{ marginBottom: 10, overflow: "hidden", borderColor: done ? "rgba(16,185,129,0.2)" : "var(--border-subtle)", background: done ? "rgba(16,185,129,0.02)" : "var(--bg-surface)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", cursor: "pointer" }} onClick={() => setExpanded(open ? null : i)}>
                    <button onClick={e => { e.stopPropagation(); toggle(i); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0 }}>
                      {done ? <CheckCircle size={19} color="#10B981" /> : <Circle size={19} color="var(--text-tertiary)" />}
                    </button>
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10 }}>
                      <span className="badge badge-amber">{item.week}</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: done ? "#10B981" : "var(--text-primary)" }}>{item.title}</span>
                    </div>
                    {!open && <span style={{ fontSize: 12, color: "var(--text-disabled)" }}>{item.tasks.length} tasks</span>}
                    {open ? <ChevronUp size={15} color="var(--text-tertiary)" /> : <ChevronDown size={15} color="var(--text-tertiary)" />}
                  </div>
                  {open && (
                    <div style={{ padding: "0 20px 18px", display: "grid", gridTemplateColumns: item.resources.length > 0 ? "1fr 1fr" : "1fr", gap: 18, borderTop: "1px solid var(--border-subtle)", paddingTop: 16 }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-disabled)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Tasks</div>
                        {item.tasks.map((t, j) => (
                          <div key={j} style={{ display: "flex", gap: 8, fontSize: 13.5, color: "var(--text-primary)", lineHeight: 1.55, marginBottom: 8 }}>
                            <span style={{ color: "#F59E0B", flexShrink: 0 }}>→</span>{t}
                          </div>
                        ))}
                      </div>
                      {item.resources.length > 0 && (
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-disabled)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Resources</div>
                          {item.resources.map((r, j) => (
                            <div key={j} style={{ display: "flex", gap: 8, fontSize: 13.5, color: "#3B82F6", lineHeight: 1.55, marginBottom: 8 }}>
                              <span style={{ flexShrink: 0 }}>·</span>{r}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {!loading && roadmap.length === 0 && (
            <div className="card empty-state">
              <div className="empty-state-icon"><Map size={22} color="var(--text-tertiary)" /></div>
              <h3>No roadmap yet</h3>
              <p>Select a session, set your target role and timeframe, then click Generate.</p>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

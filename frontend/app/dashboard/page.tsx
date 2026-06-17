"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  FileSearch, MessageSquare, Mic, Trophy, TrendingUp, TrendingDown,
  ArrowRight, Brain, DollarSign, LinkIcon, GitBranch, Map, Zap,
  Activity, Clock, Target,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { getProgress, getSessions } from "@/lib/api";
import { getScoreColor } from "@/lib/utils";

function ScoreRing({ score, size = 88, color }: { score: number; size?: number; color: string }) {
  const r = size * 0.38;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg-hover)" strokeWidth={size*0.07} />
        <motion.circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={size*0.07} strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.4, ease: "easeOut" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: size * 0.22, fontWeight: 700, color, letterSpacing: "-0.02em" }}>{score}</span>
      </div>
    </div>
  );
}

const quickActions = [
  { href: "/analyse",   icon: FileSearch,    label: "Analyse Resume",       desc: "Upload resume + JD for instant gap analysis",       color: "#3B82F6" },
  { href: "/interview", icon: MessageSquare, label: "Mock Interview",        desc: "Text-based AI interview practice",                   color: "#10B981" },
  { href: "/voice",     icon: Mic,           label: "Voice Interview",       desc: "Speak your answers — AI listens and scores",         color: "#F59E0B" },
  { href: "/gaps",      icon: GitBranch,     label: "Skill Gap Analysis",    desc: "Visual breakdown of your resume vs JD",              color: "#8B5CF6" },
  { href: "/negotiate", icon: DollarSign,    label: "Salary Negotiation",    desc: "Roleplay negotiation with AI HR manager",            color: "#EC4899" },
  { href: "/linkedin",  icon: LinkIcon,      label: "LinkedIn Optimizer",    desc: "Optimize headline and about section",                color: "#0EA5E9" },
  { href: "/debrief",   icon: Trophy,        label: "Interview Debrief",     desc: "Post-interview scorecard and confidence analysis",   color: "#F97316" },
  { href: "/roadmap",   icon: Map,           label: "Career Roadmap",        desc: "Personalized learning plan to close skill gaps",     color: "#14B8A6" },
];

export default function DashboardPage() {
  const [progress, setProgress] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getProgress(), getSessions()])
      .then(([prog, sess]: any) => {
        setProgress(prog);
        setSessions(sess?.sessions || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const matchScore = progress?.latest_match_score || 0;
  const answerScore = Math.round(progress?.latest_avg_answer_score || 0);
  const sessionCount = progress?.sessions_count || 0;
  const delta = progress?.match_score_delta || 0;

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="page-content gradient-bg">
        <div className="page-inner">

          {/* Page header */}
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            style={{ paddingBottom: 32, marginBottom: 32, borderBottom: "1px solid var(--border-subtle)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <h1 style={{ fontSize: 26, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                  Career Dashboard
                </h1>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 5 }}>
                  Your AI career health at a glance
                </p>
              </div>
              <Link href="/analyse">
                <button className="btn btn-primary btn-sm">
                  <Zap size={13} /> New Session
                </button>
              </Link>
            </div>
          </motion.div>

          {/* KPI row */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
            {[
              { label: "Match Score", value: matchScore, color: "#F59E0B", sublabel: "vs job description", ring: true },
              { label: "Avg Answer Score", value: answerScore, color: "#3B82F6", sublabel: "across all sessions", ring: true },
              { label: "Sessions", value: sessionCount, color: "#10B981", sublabel: "completed total", ring: false },
            ].map((kpi, i) => (
              <motion.div key={kpi.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * i }}
                className="card kpi-card"
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                <div>
                  <div className="kpi-label">{kpi.label}</div>
                  <div className="kpi-value" style={{ color: kpi.color, marginTop: 4 }}>
                    {loading ? (
                      <div className="skeleton" style={{ width: 60, height: 32 }} />
                    ) : (
                      <>{kpi.value}{kpi.ring ? <span style={{ fontSize: 16, color: "var(--text-tertiary)", fontWeight: 400 }}>/100</span> : ""}</>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 4 }}>{kpi.sublabel}</div>
                  {i === 0 && delta !== 0 && !loading && (
                    <div className="kpi-delta" style={{ color: delta > 0 ? "#10B981" : "#EF4444" }}>
                      {delta > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {delta > 0 ? "+" : ""}{delta} pts from last session
                    </div>
                  )}
                </div>
                {kpi.ring && !loading && (
                  <ScoreRing score={kpi.value} color={kpi.color} size={80} />
                )}
              </motion.div>
            ))}
          </motion.div>

          {/* Quick actions */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div className="section-header">
              <span className="section-title">Quick Actions</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
              {quickActions.map((action, i) => {
                const Icon = action.icon;
                return (
                  <motion.div key={action.href} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * i }}>
                    <Link href={action.href} style={{ textDecoration: "none" }}>
                      <div
                        className="card"
                        style={{ padding: "16px", cursor: "pointer", transition: "all 0.18s ease" }}
                        onMouseEnter={e => {
                          const el = e.currentTarget as HTMLElement;
                          el.style.transform = "translateY(-2px)";
                          el.style.borderColor = `${action.color}30`;
                          el.style.boxShadow = `0 8px 24px rgba(0,0,0,0.3), 0 0 0 1px ${action.color}20`;
                        }}
                        onMouseLeave={e => {
                          const el = e.currentTarget as HTMLElement;
                          el.style.transform = "translateY(0)";
                          el.style.borderColor = "var(--border-subtle)";
                          el.style.boxShadow = "var(--shadow-sm)";
                        }}
                      >
                        <div style={{
                          width: 34, height: 34, borderRadius: 9,
                          background: `${action.color}15`,
                          border: `1px solid ${action.color}25`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          marginBottom: 11,
                        }}>
                          <Icon size={15} color={action.color} />
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4, letterSpacing: "-0.005em" }}>
                          {action.label}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-tertiary)", lineHeight: 1.5 }}>
                          {action.desc}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 12, fontSize: 12, color: action.color, fontWeight: 550 }}>
                          Open <ArrowRight size={11} />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Recent sessions */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <div className="section-header">
              <span className="section-title">Recent Sessions</span>
              {sessions.length > 0 && (
                <Link href="/memory">
                  <button className="btn btn-ghost btn-sm">View all <ArrowRight size={12} /></button>
                </Link>
              )}
            </div>

            <div className="card" style={{ overflow: "hidden" }}>
              {loading ? (
                <div style={{ padding: "20px 22px" }}>
                  {[1,2,3].map(i => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                      <div className="skeleton" style={{ width: 200, height: 16 }} />
                      <div className="skeleton" style={{ width: 60, height: 16 }} />
                    </div>
                  ))}
                </div>
              ) : sessions.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon"><Activity size={22} color="var(--text-tertiary)" /></div>
                  <h3>No sessions yet</h3>
                  <p>Upload your resume and a job description to run your first analysis.</p>
                  <Link href="/analyse" style={{ marginTop: 16 }}>
                    <button className="btn btn-primary btn-sm">Start analysing</button>
                  </Link>
                </div>
              ) : (
                sessions.slice(0, 6).map((s, i) => (
                  <div key={s.session_id} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "13px 20px",
                    borderBottom: i < sessions.length - 1 ? "1px solid var(--border-subtle)" : "none",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <FileSearch size={14} color="var(--text-tertiary)" />
                      </div>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 550, color: "var(--text-primary)" }}>
                          {s.resume_filename || s.session_id}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-tertiary)", display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                          <Clock size={10} />
                          {new Date(s.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: getScoreColor(s.match_score) }}>{s.match_score}</div>
                        <div style={{ fontSize: 11, color: "var(--text-disabled)" }}>match</div>
                      </div>
                      <span className="badge badge-amber" style={{ fontSize: 11 }}>{s.match_score >= 80 ? "Strong" : s.match_score >= 60 ? "Good" : "Gap"}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>

        </div>
      </main>
    </div>
  );
}

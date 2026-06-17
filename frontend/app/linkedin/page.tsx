"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LinkIcon, Loader2, Sparkles, Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { optimizeLinkedIn, getHeadlineVariants } from "@/lib/api";

type Tab = "optimize" | "headlines";

export default function LinkedInPage() {
  const [tab, setTab] = useState<Tab>("optimize");
  const [optForm, setOptForm] = useState({ session_id: "test-session-001", headline: "Senior QA Automation Engineer | Playwright | Selenium | Python", about: "I am a Senior QA Automation Engineer with 5 years of experience in test automation, CI/CD, and AI-powered testing tools." });
  const [optResult, setOptResult] = useState<any>(null); const [optLoading, setOptLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>("headline");
  const [hlForm, setHlForm] = useState({ current_role: "Senior QA Automation Engineer", target_role: "AI Automation Engineer", top_skills: "LangChain, LangGraph, RAG, FastAPI, Playwright, Python", years_experience: "5" });
  const [headlines, setHeadlines] = useState<string[]>([]); const [hlLoading, setHlLoading] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);

  const handleOpt = async () => {
    setOptLoading(true); setOptResult(null);
    try { setOptResult(await optimizeLinkedIn({ session_id: optForm.session_id, headline: optForm.headline, about: optForm.about })); }
    catch { alert("Optimization failed. Make sure resume is uploaded."); } finally { setOptLoading(false); }
  };

  const handleHL = async () => {
    setHlLoading(true); setHeadlines([]);
    try { const r: any = await getHeadlineVariants({ ...hlForm, years_experience: parseInt(hlForm.years_experience) }); setHeadlines(r.variants || []); }
    catch { alert("Failed."); } finally { setHlLoading(false); }
  };

  const copy = (text: string, i: number) => { navigator.clipboard.writeText(text); setCopied(i); setTimeout(() => setCopied(null), 2000); };

  const Field = ({ label, k, state, setState, multiline = false }: any) => (
    <div>
      <label className="field-label">{label}</label>
      {multiline
        ? <textarea className="textarea" rows={4} value={state[k]} onChange={e => setState({ ...state, [k]: e.target.value })} style={{ marginTop: 4 }} />
        : <input className="input" value={state[k]} onChange={e => setState({ ...state, [k]: e.target.value })} style={{ marginTop: 4 }} />}
    </div>
  );

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="page-content gradient-bg">
        <div className="page-inner">
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            style={{ paddingBottom: 28, marginBottom: 32, borderBottom: "1px solid var(--border-subtle)" }}>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>LinkedIn Optimizer</h1>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 5 }}>Optimize your profile to attract recruiters for AI engineering roles</p>
          </motion.div>

          <div className="tabs" style={{ marginBottom: 24 }}>
            <div className={`tab ${tab === "optimize" ? "active" : ""}`} onClick={() => setTab("optimize")}>Full Profile Optimizer</div>
            <div className={`tab ${tab === "headlines" ? "active" : ""}`} onClick={() => setTab("headlines")}>Headline Generator</div>
          </div>

          <AnimatePresence mode="wait">
            {tab === "optimize" ? (
              <motion.div key="opt" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 20 }}>
                <div className="card" style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
                  <div className="section-title">Current Profile</div>
                  <Field label="Session ID" k="session_id" state={optForm} setState={setOptForm} />
                  <Field label="Current Headline" k="headline" state={optForm} setState={setOptForm} />
                  <Field label="Current About" k="about" state={optForm} setState={setOptForm} multiline />
                  <button className="btn btn-primary btn-full" onClick={handleOpt} disabled={optLoading} style={{ marginTop: 4 }}>
                    {optLoading ? <><Loader2 size={14} className="animate-spin" /> Optimizing…</> : <><Sparkles size={14} /> Optimize Profile</>}
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {!optResult ? (
                    <div className="card empty-state">
                      <div className="empty-state-icon"><LinkIcon size={20} color="var(--text-tertiary)" /></div>
                      <h3>No results yet</h3><p>Fill in your profile and click Optimize</p>
                    </div>
                  ) : (
                    <>
                      <div className="card" style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div className="section-title">Profile Strength Score</div>
                          <div style={{ fontSize: 12.5, color: "var(--text-tertiary)", marginTop: 3 }}>Based on keywords, completeness, and recruiter appeal</div>
                        </div>
                        <div style={{ fontSize: 42, fontWeight: 800, color: "#F59E0B", letterSpacing: "-0.03em" }}>
                          {optResult.profile_strength_score}<span style={{ fontSize: 18, color: "var(--text-tertiary)", fontWeight: 400 }}>/100</span>
                        </div>
                      </div>

                      {["headline", "about"].map(key => {
                        const section = optResult[key];
                        const open = expanded === key;
                        return (
                          <div key={key} className="card" style={{ overflow: "hidden" }}>
                            <button onClick={() => setExpanded(open ? null : key)}
                              style={{ width: "100%", padding: "14px 18px", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{key === "headline" ? "Headline" : "About Section"}</span>
                              {open ? <ChevronUp size={15} color="var(--text-tertiary)" /> : <ChevronDown size={15} color="var(--text-tertiary)" />}
                            </button>
                            {open && section && (
                              <div style={{ padding: "0 18px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
                                <div style={{ padding: "11px 14px", borderRadius: 9, background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.12)" }}>
                                  <div style={{ fontSize: 11, fontWeight: 600, color: "#EF4444", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Original</div>
                                  <p style={{ fontSize: 13.5, color: "var(--text-secondary)" }}>{section.original}</p>
                                </div>
                                <div style={{ padding: "11px 14px", borderRadius: 9, background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.15)" }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                                    <div style={{ fontSize: 11, fontWeight: 600, color: "#10B981", textTransform: "uppercase", letterSpacing: "0.05em" }}>Optimized</div>
                                    <button onClick={() => copy(section.optimized, 99)} style={{ fontSize: 11.5, color: "#3B82F6", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                                      <Copy size={11} /> Copy
                                    </button>
                                  </div>
                                  <p style={{ fontSize: 13.5, color: "var(--text-primary)", lineHeight: 1.6 }}>{section.optimized}</p>
                                </div>
                                {section.keywords_added?.length > 0 && (
                                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                    {section.keywords_added.map((kw: string, i: number) => (
                                      <span key={i} className="badge badge-blue">+{kw}</span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {optResult.skills_to_add?.length > 0 && (
                        <div className="card" style={{ padding: "16px 20px" }}>
                          <div className="section-title" style={{ marginBottom: 12 }}>Skills to Add</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                            {optResult.skills_to_add.map((s: string, i: number) => <span key={i} className="badge badge-purple">{s}</span>)}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div key="hl" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20 }}>
                <div className="card" style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
                  <div className="section-title">Your Details</div>
                  {[["Current Role", "current_role"], ["Target Role", "target_role"], ["Top Skills", "top_skills"], ["Years of Experience", "years_experience"]].map(([label, k]) => (
                    <Field key={k} label={label} k={k} state={hlForm} setState={setHlForm} />
                  ))}
                  <button className="btn btn-primary btn-full" onClick={handleHL} disabled={hlLoading} style={{ marginTop: 4 }}>
                    {hlLoading ? <><Loader2 size={14} className="animate-spin" /> Generating…</> : <><Sparkles size={14} /> Generate Headlines</>}
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {headlines.length === 0 ? (
                    <div className="card empty-state">
                      <div className="empty-state-icon"><Sparkles size={20} color="var(--text-tertiary)" /></div>
                      <h3>No headlines yet</h3><p>Generate 5 optimized headline variants</p>
                    </div>
                  ) : headlines.map((h, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                      className="card" style={{ padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
                        <span className="badge badge-amber">{i + 1}</span>
                        <p style={{ fontSize: 13.5, color: "var(--text-primary)", lineHeight: 1.5 }}>{h}</p>
                      </div>
                      <button onClick={() => copy(h, i)} className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }}>
                        {copied === i ? <><Check size={12} color="#10B981" /> Copied</> : <><Copy size={12} /> Copy</>}
                      </button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

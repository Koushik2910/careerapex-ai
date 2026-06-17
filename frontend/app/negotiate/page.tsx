"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DollarSign, Loader2, Send, RotateCcw, Bot, User, FileText, Copy, Check } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { getNegotiationScript, startNegotiationRoleplay, negotiationRoleplayChat } from "@/lib/api";

type Tab = "script" | "roleplay";
interface Message { role: "user" | "assistant"; content: string; }

export default function NegotiatePage() {
  const [tab, setTab] = useState<Tab>("script");
  const [scriptForm, setScriptForm] = useState({ current_offer: "18", target_salary: "26", role: "AI Automation Engineer", company: "Thomson Reuters", experience_years: "5", competing_offers: "One offer at 22 LPA from a fintech startup", strengths: "LangChain, LangGraph, RAG pipelines, 8 AI projects" });
  const [script, setScript] = useState(""); const [scriptLoading, setScriptLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [roleplayForm, setRoleplayForm] = useState({ current_offer: "18", target_salary: "26", company: "Thomson Reuters" });
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState(""); const [roleplayStarted, setRoleplayStarted] = useState(false); const [roleplayLoading, setRoleplayLoading] = useState(false);

  const handleGetScript = async () => {
    setScriptLoading(true); setScript("");
    try {
      const r: any = await getNegotiationScript({ ...scriptForm, current_offer: parseFloat(scriptForm.current_offer), target_salary: parseFloat(scriptForm.target_salary), experience_years: parseInt(scriptForm.experience_years) });
      setScript(r.script);
    } catch { alert("Script generation failed."); } finally { setScriptLoading(false); }
  };

  const handleStartRoleplay = async () => {
    setRoleplayLoading(true); setMessages([]);
    try {
      const r: any = await startNegotiationRoleplay({ current_offer: parseFloat(roleplayForm.current_offer), target_salary: parseFloat(roleplayForm.target_salary), company: roleplayForm.company });
      setMessages([{ role: "assistant", content: r.message }]); setRoleplayStarted(true);
    } catch { alert("Failed to start roleplay."); } finally { setRoleplayLoading(false); }
  };

  const handleSend = async () => {
    if (!input.trim() || roleplayLoading) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    const newMsgs = [...messages, userMsg]; setMessages(newMsgs); setInput(""); setRoleplayLoading(true);
    try {
      const r: any = await negotiationRoleplayChat({ current_offer: parseFloat(roleplayForm.current_offer), target_salary: parseFloat(roleplayForm.target_salary), company: roleplayForm.company, message: userMsg.content, history: newMsgs.slice(0,-1).map(m => ({ role: m.role, content: m.content })), mode: "roleplay" });
      setMessages([...newMsgs, { role: "assistant", content: r.response }]);
    } catch { alert("Failed."); } finally { setRoleplayLoading(false); }
  };

  const Field = ({ label, k, state, setState, placeholder = "" }: any) => (
    <div>
      <label className="field-label">{label}</label>
      <input className="input" value={state[k]} onChange={e => setState({ ...state, [k]: e.target.value })} placeholder={placeholder} style={{ marginTop: 4 }} />
    </div>
  );

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="page-content gradient-bg">
        <div className="page-inner">
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            style={{ paddingBottom: 28, marginBottom: 32, borderBottom: "1px solid var(--border-subtle)" }}>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>Salary Negotiation</h1>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 5 }}>Get a tailored negotiation script or practice with an AI HR manager</p>
          </motion.div>

          <div className="tabs" style={{ marginBottom: 24 }}>
            <div className={`tab ${tab === "script" ? "active" : ""}`} onClick={() => setTab("script")}>
              <FileText size={13} style={{ display: "inline", marginRight: 6 }} />Negotiation Script
            </div>
            <div className={`tab ${tab === "roleplay" ? "active" : ""}`} onClick={() => setTab("roleplay")}>
              <Bot size={13} style={{ display: "inline", marginRight: 6 }} />Roleplay Practice
            </div>
          </div>

          <AnimatePresence mode="wait">
            {tab === "script" ? (
              <motion.div key="script" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20 }}>
                <div className="card" style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
                  <div className="section-title">Your Situation</div>
                  <Field label="Current Offer (LPA)" k="current_offer" state={scriptForm} setState={setScriptForm} />
                  <Field label="Target Salary (LPA)" k="target_salary" state={scriptForm} setState={setScriptForm} />
                  <Field label="Role" k="role" state={scriptForm} setState={setScriptForm} />
                  <Field label="Company" k="company" state={scriptForm} setState={setScriptForm} />
                  <Field label="Years of Experience" k="experience_years" state={scriptForm} setState={setScriptForm} />
                  <Field label="Competing Offers" k="competing_offers" state={scriptForm} setState={setScriptForm} />
                  <Field label="Key Strengths" k="strengths" state={scriptForm} setState={setScriptForm} />
                  <button className="btn btn-primary btn-full" onClick={handleGetScript} disabled={scriptLoading} style={{ marginTop: 4 }}>
                    {scriptLoading ? <><Loader2 size={14} className="animate-spin" /> Generating…</> : <><FileText size={14} /> Generate Script</>}
                  </button>
                </div>

                <div className="card" style={{ padding: "20px 24px" }}>
                  <div className="section-header" style={{ marginBottom: script ? 16 : 0 }}>
                    <span className="section-title">Negotiation Strategy</span>
                    {script && (
                      <button className="btn btn-ghost btn-sm" onClick={() => { navigator.clipboard.writeText(script); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
                        {copied ? <><Check size={13} color="#10B981" /> Copied</> : <><Copy size={13} /> Copy</>}
                      </button>
                    )}
                  </div>
                  {script ? (
                    <div style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.75, whiteSpace: "pre-wrap", overflowY: "auto", maxHeight: 560 }}>{script}</div>
                  ) : (
                    <div className="empty-state">
                      <div className="empty-state-icon"><DollarSign size={20} color="var(--text-tertiary)" /></div>
                      <h3>No script yet</h3>
                      <p>Fill in your details and click Generate Script</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div key="roleplay" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20 }}>
                <div>
                  {!roleplayStarted ? (
                    <div className="card" style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
                      <div className="section-title">Setup Roleplay</div>
                      <Field label="Current Offer (LPA)" k="current_offer" state={roleplayForm} setState={setRoleplayForm} />
                      <Field label="Target Salary (LPA)" k="target_salary" state={roleplayForm} setState={setRoleplayForm} />
                      <Field label="Company" k="company" state={roleplayForm} setState={setRoleplayForm} />
                      <div style={{ padding: "10px 12px", borderRadius: 9, background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)", fontSize: 12.5, color: "var(--text-tertiary)", lineHeight: 1.5 }}>
                        AI plays HR. You negotiate. Try to reach your target.
                      </div>
                      <button className="btn btn-full" onClick={handleStartRoleplay} disabled={roleplayLoading}
                        style={{ background: "linear-gradient(135deg,#8B5CF6,#7C3AED)", color: "#fff", padding: "10px 18px", borderRadius: 9, fontSize: 13.5, fontWeight: 550, cursor: "pointer", border: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                        {roleplayLoading ? <><Loader2 size={14} className="animate-spin" /> Starting…</> : <><Bot size={14} /> Start Roleplay</>}
                      </button>
                    </div>
                  ) : (
                    <div className="card" style={{ padding: "18px 20px" }}>
                      <div className="section-title" style={{ marginBottom: 14 }}>Session</div>
                      {[["Offer", `${roleplayForm.current_offer} LPA`], ["Target", `${roleplayForm.target_salary} LPA`], ["Company", roleplayForm.company], ["Gap", `${(parseFloat(roleplayForm.target_salary) - parseFloat(roleplayForm.current_offer)).toFixed(1)} LPA`]].map(([l, v]) => (
                        <div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 13 }}>
                          <span style={{ color: "var(--text-tertiary)" }}>{l}</span>
                          <span style={{ color: "var(--text-primary)", fontWeight: 550 }}>{v}</span>
                        </div>
                      ))}
                      <button className="btn btn-ghost btn-sm btn-full" style={{ marginTop: 8 }} onClick={() => { setRoleplayStarted(false); setMessages([]); }}>
                        <RotateCcw size={12} /> New session
                      </button>
                    </div>
                  )}
                </div>

                <div className="card" style={{ display: "flex", flexDirection: "column", height: 580 }}>
                  <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border-subtle)", flexShrink: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>Roleplay — {roleplayForm.company}</div>
                    <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 2 }}>Negotiate from {roleplayForm.current_offer} → {roleplayForm.target_salary} LPA</div>
                  </div>
                  <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
                    {messages.length === 0 && (
                      <div className="empty-state"><div className="empty-state-icon"><Bot size={18} color="var(--text-tertiary)" /></div><h3>Start the roleplay</h3><p>Click the button to begin your negotiation</p></div>
                    )}
                    {messages.map((m, i) => (
                      <div key={i} style={{ display: "flex", gap: 9, flexDirection: m.role === "user" ? "row-reverse" : "row", alignItems: "flex-start" }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: m.role === "assistant" ? "rgba(139,92,246,0.18)" : "rgba(245,158,11,0.15)" }}>
                          {m.role === "assistant" ? <Bot size={13} color="#8B5CF6" /> : <User size={13} color="#F59E0B" />}
                        </div>
                        <div className={m.role === "assistant" ? "bubble-ai" : "bubble-user"}
                          style={{ maxWidth: "75%", padding: "10px 14px", fontSize: 13.5, lineHeight: 1.65, color: "var(--text-primary)" }}>
                          {m.content}
                        </div>
                      </div>
                    ))}
                    {roleplayLoading && (
                      <div style={{ display: "flex", gap: 9 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(139,92,246,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}><Bot size={13} color="#8B5CF6" /></div>
                        <div className="bubble-ai" style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", gap: 4 }}>{[0,1,2].map(i => <div key={i} className="skeleton" style={{ width: 6, height: 6, borderRadius: "50%" }} />)}</div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border-subtle)", flexShrink: 0, display: "flex", gap: 9 }}>
                    <input className="input" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSend()} placeholder={roleplayStarted ? "Type your response…" : "Start the roleplay first"} disabled={!roleplayStarted} />
                    <button className="btn btn-primary" onClick={handleSend} disabled={!input.trim() || roleplayLoading || !roleplayStarted} style={{ width: 40, padding: 0, justifyContent: "center" }}>
                      <Send size={14} />
                    </button>
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

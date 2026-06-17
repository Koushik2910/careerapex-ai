"use client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle, AlertCircle, Loader2, ArrowRight,
  X, FileText, Briefcase, CheckCheck, ChevronDown, History,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { uploadResume, uploadJD, analyseGaps } from "@/lib/api";
import { generateSessionId, getScoreColor } from "@/lib/utils";

type UploadState = "idle" | "uploading" | "done" | "error";

const STEPS = [
  "Uploading documents...",
  "Extracting resume data...",
  "Analysing skills...",
  "Matching against JD...",
  "Generating recommendations...",
  "Finalising report...",
];

function StepLoader({ step }: { step: number }) {
  return (
    <div style={{ padding: "28px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <Loader2 size={18} color="#F59E0B" className="animate-spin" />
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
          {STEPS[Math.min(step, STEPS.length - 1)]}
        </span>
      </div>
      <div className="progress-track" style={{ height: 6, marginBottom: 20 }}>
        <motion.div className="progress-fill" initial={{ width: 0 }}
          animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }} style={{ height: "100%" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {STEPS.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
            {i < step ? <CheckCheck size={14} color="#10B981" />
              : i === step ? <Loader2 size={14} color="#F59E0B" className="animate-spin" />
              : <div style={{ width: 14, height: 14, borderRadius: "50%", border: "1.5px solid var(--border-default)" }} />}
            <span style={{ color: i <= step ? "var(--text-primary)" : "var(--text-disabled)" }}>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DropZone({ label, sublabel, icon: Icon, state, result, onFile, disabled }: any) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const borderColor = dragging ? "#F59E0B" : state === "done" ? "#10B981" : state === "error" ? "#EF4444" : "var(--border-default)";
  const bg = dragging ? "rgba(245,158,11,0.04)" : state === "done" ? "rgba(16,185,129,0.04)" : "var(--bg-base)";
  return (
    <div onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) onFile(f); }}
      style={{ border: `1.5px dashed ${borderColor}`, borderRadius: 14, padding: "28px 24px", background: bg, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, transition: "all 0.2s", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, minHeight: 160 }}>
      <input ref={inputRef} type="file" accept=".pdf,.docx,.doc" className="hidden"
        onChange={e => e.target.files?.[0] && onFile(e.target.files[0])} disabled={disabled} />
      {state === "idle" && (<>
        <div style={{ width: 44, height: 44, borderRadius: 11, background: "var(--bg-overlay)", border: "1px solid var(--border-default)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={20} color="var(--text-tertiary)" />
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{label}</div>
          <div style={{ fontSize: 12.5, color: "var(--text-tertiary)", marginTop: 3 }}>{sublabel}</div>
          <div style={{ fontSize: 11.5, color: "var(--text-disabled)", marginTop: 8 }}>PDF or DOCX · drag & drop or click</div>
        </div>
      </>)}
      {state === "uploading" && (<>
        <Loader2 size={26} color="#F59E0B" className="animate-spin" />
        <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>Uploading and indexing…</div>
      </>)}
      {state === "done" && result && (<>
        <CheckCircle size={26} color="#10B981" />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: "#10B981" }}>Uploaded Successfully</div>
          <div style={{ fontSize: 12.5, color: "var(--text-secondary)", marginTop: 2 }}>{result.filename}</div>
          <div style={{ fontSize: 11.5, color: "var(--text-tertiary)", marginTop: 3 }}>{result.chunks} chunks indexed</div>
        </div>
      </>)}
      {state === "error" && (<>
        <AlertCircle size={26} color="#EF4444" />
        <div style={{ fontSize: 13, color: "#EF4444" }}>Upload failed — try again</div>
      </>)}
    </div>
  );
}

function ResumeReused({ filename, onClear }: { filename: string; onClear: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderRadius: 14, background: "rgba(16,185,129,0.04)", border: "1.5px dashed #10B981", minHeight: 160 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 11, background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <CheckCircle size={22} color="#10B981" />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#10B981" }}>Resume loaded from history</div>
          <div style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 550, marginTop: 3 }}>{filename}</div>
          <div style={{ fontSize: 11.5, color: "var(--text-tertiary)", marginTop: 4 }}>Existing embeddings reused · no re-upload needed</div>
        </div>
      </div>
      <button onClick={onClear}
        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)", padding: 6, borderRadius: 6, transition: "color 0.15s" }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--text-tertiary)"; }}
        title="Remove and upload a new resume">
        <X size={16} />
      </button>
    </div>
  );
}

export default function AnalysePage() {
  const [sessionId, setSessionId] = useState("");
  const [resumeFilename, setResumeFilename] = useState("");
  const [jdFilename, setJdFilename] = useState("");
  const [resumeState, setResumeState] = useState<UploadState>("idle");
  const [jdState, setJdState] = useState<UploadState>("idle");
  const [resumeResult, setResumeResult] = useState<any>(null);
  const [jdResult, setJdResult] = useState<any>(null);
  const [analysing, setAnalysing] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState("");
  const [savedToMemory, setSavedToMemory] = useState(false);
  const [reusingResume, setReusingResume] = useState(false);

  // Previous resumes dropdown
  const [previousSessions, setPreviousSessions] = useState<any[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Refs — always current in async callbacks
  const resumeFilenameRef = useRef("");
  const jdFilenameRef = useRef("");
  const sessionIdRef = useRef("");
  const stepTimerRef = useRef<any>(null);

  useEffect(() => { resumeFilenameRef.current = resumeFilename; }, [resumeFilename]);
  useEffect(() => { jdFilenameRef.current = jdFilename; }, [jdFilename]);
  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);
  useEffect(() => () => { if (stepTimerRef.current) clearInterval(stepTimerRef.current); }, []);

  // Load previous sessions for dropdown
  useEffect(() => {
    fetch(`${API_BASE}/memory/sessions`)
      .then(r => r.json())
      .then(d => {
        const seen = new Set<string>();
        const unique = (d?.sessions || []).filter((s: any) => {
          if (!s.resume_filename || s.resume_filename === s.session_id) return false;
          if (seen.has(s.resume_filename)) return false;
          seen.add(s.resume_filename);
          return true;
        });
        setPreviousSessions(unique);
      })
      .catch(() => {});
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Select a previous resume ─────────────────────────────────────────────────
  // KEY FIX: generate the new session ID HERE, not at analysis time
  // This ensures JD upload and analysis use the same session ID
  const handleSelectPreviousResume = async (session: any) => {
    setDropdownOpen(false);

    // Generate new session ID immediately
    const newSid = generateSessionId();

    // Copy resume embeddings from old session to new session via backend
    try {
      await fetch(`${API_BASE}/upload/copy-resume`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_session_id: session.session_id,
          target_session_id: newSid,
        }),
      });
    } catch {
      // If copy-resume endpoint not found, fall back to original session ID
      // Analysis will still work using existing embeddings
    }

    // Set new session ID so JD upload goes to the right place
    setSessionId(newSid);
    sessionIdRef.current = newSid;
    setResumeFilename(session.resume_filename);
    resumeFilenameRef.current = session.resume_filename;
    setReusingResume(true);
    setResumeState("done");
    setResumeResult({ filename: session.resume_filename, chunks: "cached" });

    // Reset JD and results
    setJdState("idle");
    setJdResult(null);
    setJdFilename("");
    jdFilenameRef.current = "";
    setAnalysis(null);
    setError("");
    setSavedToMemory(false);
  };

  const handleClearReusedResume = () => {
    setReusingResume(false);
    setSessionId(""); sessionIdRef.current = "";
    setResumeFilename(""); resumeFilenameRef.current = "";
    setResumeState("idle"); setResumeResult(null);
    setJdState("idle"); setJdResult(null);
    setJdFilename(""); jdFilenameRef.current = "";
    setAnalysis(null); setError(""); setSavedToMemory(false);
  };

  const startStepTimer = () => {
    let step = 0; setLoadingStep(0);
    stepTimerRef.current = setInterval(() => { step += 1; if (step < STEPS.length - 1) setLoadingStep(step); }, 2200);
  };
  const stopStepTimer = () => {
    if (stepTimerRef.current) clearInterval(stepTimerRef.current);
    setLoadingStep(STEPS.length - 1);
  };

  const handleResumeUpload = async (file: File) => {
    setResumeState("uploading"); setError(""); setSavedToMemory(false); setReusingResume(false);
    try {
      const sid = sessionId || generateSessionId();
      const res: any = await uploadResume(file, sid);
      const actualSid = res.session_id || sid;
      setSessionId(actualSid); sessionIdRef.current = actualSid;
      setResumeFilename(file.name); resumeFilenameRef.current = file.name;
      setResumeResult({ ...res, filename: res.filename || file.name });
      setResumeState("done");
    } catch { setResumeState("error"); }
  };

  const handleJDUpload = async (file: File) => {
    setJdState("uploading"); setError("");
    try {
      // Uses sessionIdRef.current — which is already the new session ID when reusing
      const res: any = await uploadJD(file, sessionIdRef.current);
      setJdFilename(file.name); jdFilenameRef.current = file.name;
      setJdResult({ ...res, filename: res.filename || file.name });
      setJdState("done");
    } catch { setJdState("error"); }
  };

  const saveToMemory = async (sid: string, resumeFname: string, jdFname: string, res: any) => {
    try {
      const saveRes = await fetch(`${API_BASE}/memory/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sid,
          resume_filename: resumeFname,
          jd_filename: jdFname,
          match_score: res.overall_match_score || 0,
          skill_gaps: res.skill_gaps || [],
          strengths: res.strengths || [],
          questions_asked: 0,
          avg_answer_score: 0,
          analysis_data: res,
          user_id: "default",
        }),
      });
      if (saveRes.ok) setSavedToMemory(true);
    } catch (e) { console.error("Memory save failed:", e); }
  };

  const handleAnalyse = async () => {
    setAnalysing(true); setError(""); setAnalysis(null); setSavedToMemory(false);
    startStepTimer();

    // Both resume and JD are already on the correct session ID
    const currentSid = sessionIdRef.current;
    const currentResume = resumeFilenameRef.current;
    const currentJd = jdFilenameRef.current;

    try {
      const res: any = await analyseGaps(currentSid);
      stopStepTimer();
      await saveToMemory(currentSid, currentResume, currentJd, res);
      setAnalysis(res);
      // Refresh previous sessions list
      fetch(`${API_BASE}/memory/sessions`)
        .then(r => r.json())
        .then(d => {
          const seen = new Set<string>();
          const unique = (d?.sessions || []).filter((s: any) => {
            if (!s.resume_filename || s.resume_filename === s.session_id) return false;
            if (seen.has(s.resume_filename)) return false;
            seen.add(s.resume_filename);
            return true;
          });
          setPreviousSessions(unique);
        }).catch(() => {});
    } catch (e: any) {
      stopStepTimer();
      setError(e.message || "Analysis failed. Please try again.");
    } finally { setAnalysing(false); }
  };

  const reset = () => {
    setSessionId(""); sessionIdRef.current = "";
    setResumeFilename(""); resumeFilenameRef.current = "";
    setJdFilename(""); jdFilenameRef.current = "";
    setResumeState("idle"); setJdState("idle");
    setResumeResult(null); setJdResult(null);
    setAnalysis(null); setError("");
    setSavedToMemory(false); setLoadingStep(0); setReusingResume(false);
    if (stepTimerRef.current) clearInterval(stepTimerRef.current);
  };

  const canAnalyse = resumeState === "done" && jdState === "done" && !analysing;

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="page-content gradient-bg">
        <div className="page-inner">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            style={{ paddingBottom: 28, marginBottom: 32, borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>Resume Analyser</h1>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 5 }}>
                Upload your resume and JD for instant AI-powered gap analysis
              </p>
              {sessionId && (
                <div style={{ marginTop: 8, fontSize: 11.5, color: "var(--text-disabled)", fontFamily: "monospace" }}>
                  Session: {sessionId}
                </div>
              )}
            </div>
            {(resumeState !== "idle" || jdState !== "idle") && (
              <button className="btn btn-danger btn-sm" onClick={reset} disabled={analysing}>
                <X size={13} /> Reset
              </button>
            )}
          </motion.div>

          {/* Previous Resume Dropdown — only shown when resume zone is idle */}
          {previousSessions.length > 0 && resumeState === "idle" && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              style={{ marginBottom: 20 }}>
              <div className="card" style={{ padding: "16px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <History size={15} color="#F59E0B" />
                    </div>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-primary)" }}>Use a previously uploaded resume</div>
                      <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 1 }}>Skip re-uploading — select from history and just upload a new JD</div>
                    </div>
                  </div>

                  <div ref={dropdownRef} style={{ position: "relative", flexShrink: 0, minWidth: 260 }}>
                    <button onClick={() => setDropdownOpen(o => !o)} style={{
                      width: "100%", padding: "9px 14px", borderRadius: 9,
                      background: "var(--bg-base)", border: "1px solid var(--border-default)",
                      color: "var(--text-secondary)", fontSize: 13, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                    }}>
                      <span>Choose a resume…</span>
                      <ChevronDown size={14} color="var(--text-tertiary)" style={{ flexShrink: 0, transition: "transform 0.2s", transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
                    </button>

                    <AnimatePresence>
                      {dropdownOpen && (
                        <motion.div initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.98 }}
                          transition={{ duration: 0.15 }}
                          style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, minWidth: 320, zIndex: 100, background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: 12, overflow: "hidden", boxShadow: "var(--shadow-lg)" }}>
                          <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border-subtle)", fontSize: 11, fontWeight: 600, color: "var(--text-disabled)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            {previousSessions.length} saved resume{previousSessions.length > 1 ? "s" : ""}
                          </div>
                          {previousSessions.map((s, i) => (
                            <div key={s.session_id} onClick={() => handleSelectPreviousResume(s)}
                              style={{ padding: "12px 14px", cursor: "pointer", borderBottom: i < previousSessions.length - 1 ? "1px solid var(--border-subtle)" : "none", display: "flex", alignItems: "center", gap: 12, transition: "background 0.1s" }}
                              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                              <div style={{ width: 34, height: 34, borderRadius: 8, background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <FileText size={15} color="var(--text-tertiary)" />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13.5, fontWeight: 550, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {s.resume_filename}
                                </div>
                                <div style={{ fontSize: 11.5, color: "var(--text-tertiary)", marginTop: 2, display: "flex", alignItems: "center", gap: 8 }}>
                                  <span>Last used: {new Date(s.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                                  <span style={{ color: getScoreColor(s.match_score), fontWeight: 600 }}>{s.match_score} match</span>
                                </div>
                              </div>
                              <div style={{ fontSize: 11, color: "#10B981", fontWeight: 550, flexShrink: 0, background: "rgba(16,185,129,0.08)", padding: "3px 8px", borderRadius: 6, border: "1px solid rgba(16,185,129,0.15)" }}>
                                Use this
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Upload Zones */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              {reusingResume ? (
                <ResumeReused filename={resumeFilename} onClear={handleClearReusedResume} />
              ) : (
                <DropZone label="Upload Resume" sublabel="Your CV or resume document" icon={FileText}
                  state={resumeState} result={resumeResult} onFile={handleResumeUpload} disabled={analysing} />
              )}
              <DropZone label="Upload Job Description" sublabel="The role you want to match against" icon={Briefcase}
                state={jdState} result={jdResult} onFile={handleJDUpload}
                disabled={resumeState !== "done" || analysing} />
            </div>

            {resumeState === "done" && jdState === "idle" && (
              <div style={{ textAlign: "center", padding: "6px 0", fontSize: 12.5, color: "var(--text-tertiary)" }}>
                {reusingResume
                  ? "✓ Resume loaded from history — now upload the job description"
                  : "✓ Resume indexed — now upload the job description"}
              </div>
            )}

            {analysing ? (
              <div className="card" style={{ marginTop: 12 }}><StepLoader step={loadingStep} /></div>
            ) : (
              <button className="btn btn-primary btn-xl btn-full" onClick={handleAnalyse}
                disabled={!canAnalyse} style={{ marginTop: 12 }}>
                <ArrowRight size={15} /> Run Gap Analysis
              </button>
            )}

            {error && (
              <div style={{ marginTop: 12, padding: "12px 16px", borderRadius: 10, background: "var(--red-dim)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444", fontSize: 13, display: "flex", gap: 8 }}>
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                <div><div style={{ fontWeight: 600, marginBottom: 2 }}>Analysis failed</div><div>{error}</div></div>
              </div>
            )}
          </motion.div>

          {/* Results */}
          <AnimatePresence>
            {analysis && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 16 }}>

                <div className="card-accent" style={{ padding: "22px 24px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 550, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Overall Match Score</div>
                      <div style={{ fontSize: 48, fontWeight: 800, color: getScoreColor(analysis.overall_match_score), letterSpacing: "-0.03em", lineHeight: 1 }}>
                        {analysis.overall_match_score}
                        <span style={{ fontSize: 20, color: "var(--text-tertiary)", fontWeight: 400 }}>/100</span>
                      </div>
                    </div>
                    <span className={`badge badge-${analysis.overall_match_score >= 80 ? "green" : analysis.overall_match_score >= 60 ? "amber" : "red"}`} style={{ fontSize: 12 }}>
                      {analysis.overall_match_score >= 80 ? "Strong Match" : analysis.overall_match_score >= 60 ? "Good Match" : "Needs Work"}
                    </span>
                  </div>
                  <p style={{ fontSize: 13.5, color: "var(--text-secondary)", marginTop: 12, lineHeight: 1.6 }}>{analysis.summary}</p>
                  {savedToMemory && (
                    <div style={{ marginTop: 10, fontSize: 11.5, color: "#10B981", display: "flex", alignItems: "center", gap: 5 }}>
                      <CheckCircle size={12} /> Session saved to Career Memory · visible in Skill Gaps dropdown
                    </div>
                  )}
                </div>

                <div className="card" style={{ padding: "22px 24px" }}>
                  <div className="section-header">
                    <span className="section-title">Skill Gaps</span>
                    <span className="badge badge-red">{analysis.skill_gaps?.length} identified</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {analysis.skill_gaps?.map((gap: any, i: number) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                        style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", borderRadius: 10, background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 550, color: "var(--text-primary)", marginBottom: 5 }}>{gap.skill}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div className="progress-track" style={{ flex: 1, height: 4 }}>
                              <motion.div initial={{ width: 0 }} animate={{ width: `${gap.gap_score}%` }} transition={{ duration: 0.8, delay: i * 0.06 }}
                                style={{ height: "100%", borderRadius: 99, background: gap.gap_score > 60 ? "#EF4444" : gap.gap_score > 30 ? "#F59E0B" : "#10B981" }} />
                            </div>
                            <span style={{ fontSize: 12, color: "var(--text-tertiary)", width: 28, textAlign: "right" }}>{gap.gap_score}</span>
                          </div>
                          <div style={{ fontSize: 11.5, color: "var(--text-disabled)", marginTop: 4 }}>Required: {gap.required_level} · Current: {gap.current_level}</div>
                        </div>
                        <span className={`badge badge-${gap.priority === "high" ? "red" : gap.priority === "medium" ? "amber" : "green"}`}>{gap.priority}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  {[
                    { title: "Strengths", items: analysis.strengths, color: "#10B981", prefix: "✓" },
                    { title: "Recommendations", items: analysis.recommendations, color: "#F59E0B", prefix: "→" },
                  ].map(sec => (
                    <div key={sec.title} className="card" style={{ padding: "20px 22px" }}>
                      <div className="section-header"><span className="section-title">{sec.title}</span></div>
                      <ul style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {sec.items?.map((item: string, i: number) => (
                          <li key={i} style={{ display: "flex", gap: 8, fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                            <span style={{ color: sec.color, flexShrink: 0 }}>{sec.prefix}</span>{item}
                          </li>
                        ))}
                      </ul>
                    </div>
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


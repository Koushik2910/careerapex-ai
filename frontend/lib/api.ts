const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Upload ─────────────────────────────────────────────────────────────────────

export async function uploadResume(file: File, sessionId?: string) {
  const form = new FormData();
  form.append("file", file);
  if (sessionId) form.append("session_id", sessionId);
  const res = await fetch(`${API_BASE}/upload/resume`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error("Resume upload failed");
  return res.json();
}

export async function uploadJD(file: File, sessionId: string) {
  const form = new FormData();
  form.append("file", file);
  form.append("session_id", sessionId);
  const res = await fetch(`${API_BASE}/upload/jd`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error("JD upload failed");
  return res.json();
}

// ── Analyse ────────────────────────────────────────────────────────────────────

export async function analyseGaps(sessionId: string) {
  return request(`/analyse/gaps/${sessionId}`, { method: "POST" });
}

export async function generateQuestions(sessionId: string, count = 10) {
  return request(`/analyse/questions/${sessionId}?count=${count}`, {
    method: "POST",
  });
}

export async function evaluateAnswer(
  question: string,
  answer: string,
  category = "technical"
) {
  return request("/analyse/evaluate", {
    method: "POST",
    body: JSON.stringify({ question, answer, category }),
  });
}

// ── Interview ──────────────────────────────────────────────────────────────────

export async function startInterview(sessionId: string, mode = "standard") {
  return request("/interview/start", {
    method: "POST",
    body: JSON.stringify({ session_id: sessionId, mode }),
  });
}

export async function interviewChat(
  sessionId: string,
  message: string,
  history: { role: string; content: string }[],
  mode = "standard"
) {
  return request("/interview/chat", {
    method: "POST",
    body: JSON.stringify({
      session_id: sessionId,
      message,
      history,
      mode,
    }),
  });
}

export async function generateCoverLetter(sessionId: string, tone = "professional") {
  return request("/interview/cover-letter", {
    method: "POST",
    body: JSON.stringify({ session_id: sessionId, tone }),
  });
}

// ── Agent ──────────────────────────────────────────────────────────────────────

export async function agentChat(
  sessionId: string,
  message: string,
  history: { role: string; content: string }[]
) {
  return request("/agent/chat", {
    method: "POST",
    body: JSON.stringify({ session_id: sessionId, message, history }),
  });
}

// ── Tracker ────────────────────────────────────────────────────────────────────

export async function saveAnswerScore(data: {
  session_id: string;
  question: string;
  answer: string;
  category: string;
  score: number;
  confidence_score: number;
  feedback: string;
  question_index: number;
}) {
  return request("/tracker/save", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getConfidenceSummary(sessionId: string) {
  return request(`/tracker/summary/${sessionId}`);
}

// ── Memory ─────────────────────────────────────────────────────────────────────

export async function saveSession(data: object) {
  return request("/memory/save", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getProgress() {
  return request("/memory/progress");
}

export async function getSessions() {
  return request("/memory/sessions");
}

// ── Negotiate ──────────────────────────────────────────────────────────────────

export async function getNegotiationScript(data: object) {
  return request("/negotiate/script", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function startNegotiationRoleplay(data: object) {
  return request("/negotiate/roleplay/start", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function negotiationRoleplayChat(data: object) {
  return request("/negotiate/roleplay/chat", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ── LinkedIn ───────────────────────────────────────────────────────────────────

export async function optimizeLinkedIn(data: object) {
  return request("/linkedin/optimize", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getHeadlineVariants(data: object) {
  return request("/linkedin/headlines", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

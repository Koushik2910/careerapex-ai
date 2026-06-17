import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function formatScore(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 65) return "Good";
  if (score >= 50) return "Average";
  return "Needs Work";
}

export function getScoreColor(score: number): string {
  if (score >= 80) return "#10B981"; // green
  if (score >= 65) return "#F59E0B"; // amber
  if (score >= 50) return "#F97316"; // orange
  return "#EF4444"; // red
}

export function getPriorityColor(priority: string): string {
  switch (priority.toLowerCase()) {
    case "high": return "#EF4444";
    case "medium": return "#F59E0B";
    case "low": return "#10B981";
    default: return "#6B7280";
  }
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard, FileSearch, GitBranch, MessageSquare,
  Mic, Trophy, Brain, DollarSign, Link as LinkIcon, Map, ChevronRight,
  Zap,
} from "lucide-react";

const nav = [
  { href: "/dashboard",  label: "Dashboard",       icon: LayoutDashboard, group: "main" },
  { href: "/analyse",    label: "Analyse",          icon: FileSearch,      group: "main" },
  { href: "/gaps",       label: "Skill Gaps",       icon: GitBranch,       group: "main" },
  { href: "/interview",  label: "Interview",        icon: MessageSquare,   group: "practice" },
  { href: "/voice",      label: "Voice Interview",  icon: Mic,             group: "practice" },
  { href: "/debrief",    label: "Debrief",          icon: Trophy,          group: "practice" },
  { href: "/memory",     label: "Memory",           icon: Brain,           group: "tools" },
  { href: "/negotiate",  label: "Negotiate",        icon: DollarSign,      group: "tools" },
  { href: "/linkedin",   label: "LinkedIn",         icon: LinkIcon,        group: "tools" },
  { href: "/roadmap",    label: "Roadmap",          icon: Map,             group: "tools" },
];

const groups: Record<string, string> = {
  main: "WORKSPACE",
  practice: "PRACTICE",
  tools: "TOOLS",
};

export default function Sidebar() {
  const pathname = usePathname();
  const renderedGroups = new Set<string>();

  return (
    <aside style={{
      position: "fixed", left: 0, top: 0, height: "100vh", width: "240px",
      background: "var(--bg-surface)",
      borderRight: "1px solid var(--border-subtle)",
      display: "flex", flexDirection: "column", zIndex: 50,
    }}>

      {/* Logo */}
      <div style={{ padding: "20px 18px 16px", borderBottom: "1px solid var(--border-subtle)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 8px rgba(245,158,11,0.3)",
            flexShrink: 0,
          }}>
            <Zap size={16} color="#000" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
              CareerApex
            </div>
            <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 500, letterSpacing: "0.02em" }}>
              AI Career OS
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
        {nav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          const showGroupLabel = !renderedGroups.has(item.group);
          if (showGroupLabel) renderedGroups.add(item.group);

          return (
            <div key={item.href}>
              {showGroupLabel && (
                <div style={{
                  fontSize: 10.5, fontWeight: 600, letterSpacing: "0.06em",
                  color: "var(--text-disabled)", padding: "14px 10px 6px",
                  textTransform: "uppercase",
                }}>
                  {groups[item.group]}
                </div>
              )}
              <Link href={item.href} style={{ textDecoration: "none" }}>
                <motion.div
                  whileHover={{ x: 1 }}
                  transition={{ duration: 0.1 }}
                  style={{
                    display: "flex", alignItems: "center", gap: 9,
                    padding: "8px 10px", borderRadius: 8,
                    marginBottom: 1, cursor: "pointer",
                    background: active ? "rgba(245,158,11,0.08)" : "transparent",
                    border: `1px solid ${active ? "rgba(245,158,11,0.2)" : "transparent"}`,
                    transition: "all 0.15s ease",
                    color: active ? "#F59E0B" : "var(--text-tertiary)",
                  }}
                  onMouseEnter={e => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)";
                      (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                      (e.currentTarget as HTMLElement).style.color = "var(--text-tertiary)";
                    }
                  }}
                >
                  <Icon size={15} strokeWidth={active ? 2.2 : 1.8} />
                  <span style={{ fontSize: 13.5, fontWeight: active ? 600 : 450, flex: 1, letterSpacing: "-0.005em" }}>
                    {item.label}
                  </span>
                  {active && <ChevronRight size={12} strokeWidth={2} />}
                </motion.div>
              </Link>
            </div>
          );
        })}
      </nav>

      {/* User */}
      <div style={{ padding: "12px 14px", borderTop: "1px solid var(--border-subtle)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{
            width: 30, height: 30, borderRadius: "50%",
            background: "linear-gradient(135deg, rgba(245,158,11,0.25), rgba(245,158,11,0.1))",
            border: "1px solid rgba(245,158,11,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, color: "#F59E0B", flexShrink: 0,
          }}>K</div>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.3 }}>Koushik Gattu</div>
            <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>AI Engineer</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

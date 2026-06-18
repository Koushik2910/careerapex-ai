"use client";

import { motion } from "framer-motion";
import { Mic, ArrowRight, Wrench } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";

export default function VoicePage() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="page-content gradient-bg">
        <div className="page-inner">
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            style={{ paddingBottom: 28, marginBottom: 32, borderBottom: "1px solid var(--border-subtle)" }}>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
              Voice Interview
            </h1>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 5 }}>
              This feature is being upgraded
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{ maxWidth: 520, margin: "60px auto 0", textAlign: "center" }}>
            <div className="card" style={{ padding: "48px 40px" }}>
              <div style={{
                width: 64, height: 64, borderRadius: 18,
                background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 24px",
              }}>
                <Wrench size={28} color="#F59E0B" />
              </div>

              <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12, letterSpacing: "-0.01em" }}>
                Upgrading to AI Voice Studio
              </h2>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 28 }}>
                The original Voice Interview feature is temporarily offline while we rebuild it with a
                more reliable architecture. The new <strong style={{ color: "var(--text-primary)" }}>AI Voice Studio</strong> is
                ready to use right now.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Link href="/voice-studio" style={{ textDecoration: "none" }}>
                  <button className="btn btn-primary btn-xl btn-full">
                    <Mic size={16} /> Open AI Voice Studio
                  </button>
                </Link>
                <Link href="/interview" style={{ textDecoration: "none" }}>
                  <button className="btn btn-ghost btn-full">
                    Try Text Interview instead <ArrowRight size={14} />
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

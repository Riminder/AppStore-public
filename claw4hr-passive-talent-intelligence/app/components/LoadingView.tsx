"use client";

import { useEffect, useRef, useState } from "react";
import { PixelSprite, SOURCE_CONFIG, type AgentSource, type AgentState } from "./PixelAgent";
import type { FeedLog } from "@/app/lib/types";

interface LoadingViewProps {
  query: string;
  profileCount: number;
  agentStatuses: Record<AgentSource, AgentState>;
  feedLogs: FeedLog[];
}

const LOG_TYPE_COLORS: Record<FeedLog["type"], string> = {
  info:  "#6b7280",
  found: "#059669",
  score: "#4f46e5",
  done:  "#9ca3af",
};

const BADGE_COLORS: Record<AgentSource, { bg: string; text: string; label: string }> = {
  github:   { bg: "#1f2937", text: "#e5e7eb", label: "GitHub" },
  linkedin: { bg: "#0077b5", text: "#ffffff", label: "LinkedIn" },
  reddit:   { bg: "#ff4500", text: "#ffffff", label: "Reddit" },
  internet: { bg: "#4f46e5", text: "#ffffff", label: "Web" },
};

const AGENT_NAMES: Record<AgentSource, string> = {
  github:   "Agent GitHub",
  linkedin: "Agent LinkedIn",
  reddit:   "Agent Reddit",
  internet: "Agent Web",
};

const AGENT_SUBTITLES: Record<AgentSource, string> = {
  github:   "Open source · Repos · Commits",
  linkedin: "Profils · Expériences · Skills",
  reddit:   "Posts · Karma · Contributeurs",
  internet: "Blogs · Portfolios · Confs",
};

const AGENT_SCAN_TOTALS: Record<AgentSource, number> = {
  github:   2847,
  linkedin: 1240,
  reddit:   847,
  internet: 3200,
};

function AgentCard({
  source,
  state,
  foundCount,
}: {
  source: AgentSource;
  state: AgentState;
  foundCount: number;
}) {
  const config = SOURCE_CONFIG[source];
  const [frame, setFrame] = useState(0);
  const [scanCount, setScanCount] = useState(0);

  useEffect(() => {
    if (state !== "running") return;
    const t = setInterval(() => setFrame((f) => (f + 1) % 3), 150);
    return () => clearInterval(t);
  }, [state]);

  useEffect(() => {
    if (state === "idle") return;
    const total = AGENT_SCAN_TOTALS[source];
    const steps = 60;
    const increment = total / steps;
    let current = 0;
    const t = setInterval(() => {
      current = Math.min(current + increment, total);
      setScanCount(Math.floor(current));
      if (current >= total) clearInterval(t);
    }, 4000 / steps);
    return () => clearInterval(t);
  }, [state, source]);

  const isRunning = state === "running";
  const isDone = state === "done";
  const isIdle = state === "idle";

  return (
    <div
      style={{
        position: "relative",
        background: "#ffffff",
        border: `1.5px solid ${isDone ? "#10b98140" : isRunning ? `${config.color}30` : "#e5e7eb"}`,
        borderRadius: 16,
        padding: "20px 16px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        minWidth: 0,
        overflow: "hidden",
        transition: "border-color 0.4s ease, box-shadow 0.4s ease",
        boxShadow: isRunning
          ? `0 4px 24px ${config.color}18, 0 1px 0 rgba(0,0,0,0.03)`
          : isDone
          ? "0 4px 16px rgba(16,185,129,0.08), 0 1px 0 rgba(0,0,0,0.03)"
          : "0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      {/* Top accent bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "20%",
          right: "20%",
          height: 3,
          background: isDone
            ? "linear-gradient(90deg, transparent, #10b981, transparent)"
            : isRunning
            ? `linear-gradient(90deg, transparent, ${config.color}, transparent)`
            : "transparent",
          borderRadius: "0 0 3px 3px",
          transition: "background 0.4s",
        }}
      />

      {/* Scan shimmer when running */}
      {isRunning && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            overflow: "hidden",
            borderRadius: 16,
            pointerEvents: "none",
          }}
        >
          <div
            className="animate-agent-scan-bar"
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              width: "40%",
              background: `linear-gradient(90deg, transparent, ${config.color}08, transparent)`,
              animationDuration: "2.5s",
              animationTimingFunction: "linear",
              animationIterationCount: "infinite",
            }}
          />
        </div>
      )}

      {/* Sprite */}
      <div
        style={{
          transform: isIdle ? "scale(1.5)" : "scale(2)",
          transformOrigin: "center",
          marginTop: 4,
          opacity: isIdle ? 0.25 : 1,
          transition: "opacity 0.3s, transform 0.3s",
        }}
        className={isRunning ? "animate-pixel-bounce" : ""}
      >
        <PixelSprite color={config.color} frame={frame} />
      </div>

      {/* Name */}
      <div
        style={{
          color: isDone ? "#059669" : isIdle ? "#d1d5db" : config.color,
          fontFamily: "monospace",
          fontWeight: 700,
          fontSize: 10,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          transition: "color 0.3s",
        }}
      >
        {AGENT_NAMES[source]}
      </div>

      {/* Subtitle */}
      <div
        style={{
          color: "#9ca3af",
          fontFamily: "monospace",
          fontSize: 9,
          textAlign: "center",
          lineHeight: 1.5,
        }}
      >
        {AGENT_SUBTITLES[source]}
      </div>

      {/* Divider */}
      <div style={{ width: "100%", height: 1, background: "#f3f4f6" }} />

      {/* Stats */}
      <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "#9ca3af", fontFamily: "monospace", fontSize: 9 }}>
          {isIdle ? "—" : `${scanCount.toLocaleString("fr-FR")}`}
        </span>
        {isDone ? (
          <span style={{ color: "#059669", fontFamily: "monospace", fontSize: 9, fontWeight: 700 }}>
            ✓ Terminé
          </span>
        ) : isRunning ? (
          <span style={{ display: "flex", alignItems: "center", gap: 4, color: config.color, fontFamily: "monospace", fontSize: 9 }}>
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: config.color,
                display: "inline-block",
                animation: "pulse-dot 1s ease-in-out infinite",
              }}
            />
            LIVE
          </span>
        ) : null}
      </div>

      {foundCount > 0 && (
        <div
          style={{
            background: `${config.color}10`,
            border: `1px solid ${config.color}25`,
            borderRadius: 8,
            padding: "2px 10px",
            color: config.color,
            fontFamily: "monospace",
            fontSize: 10,
            fontWeight: 700,
          }}
        >
          {foundCount} trouvé{foundCount > 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}

export default function LoadingView({
  query,
  profileCount,
  agentStatuses,
  feedLogs,
}: LoadingViewProps) {
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [elapsed, setElapsed] = useState(0);
  const [dots, setDots] = useState(".");

  useEffect(() => {
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setDots((d) => (d.length >= 3 ? "." : d + ".")), 500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [feedLogs]);

  const agents: { source: AgentSource; state: AgentState }[] = (
    ["linkedin", "github", "reddit", "internet"] as AgentSource[]
  ).map((source) => ({ source, state: agentStatuses[source] ?? "idle" }));

  const doneCount = agents.filter((a) => a.state === "done").length;
  const runningCount = agents.filter((a) => a.state === "running").length;
  const progress = (doneCount / agents.length) * 100;

  const foundPerSource: Record<AgentSource, number> = { linkedin: 0, github: 0, reddit: 0, internet: 0 };
  feedLogs.forEach((log) => { if (log.type === "found") foundPerSource[log.source]++; });

  const elapsedStr = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start px-8 py-12 overflow-y-auto"
      style={{ background: "#f8f9fa" }}
    >
      {/* Header */}
      <div className="mb-8 text-center w-full max-w-3xl">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5 text-xs font-semibold uppercase tracking-wider"
          style={{ background: "rgba(79,70,229,0.08)", color: "#4f46e5", border: "1px solid rgba(79,70,229,0.15)" }}
        >
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#4f46e5" }} />
          {runningCount > 0 ? `${runningCount} agent${runningCount > 1 ? "s" : ""} actif${runningCount > 1 ? "s" : ""}` : "Analyse en cours"}
          <span style={{ color: "#9ca3af", marginLeft: 4, fontWeight: 400 }}>{elapsedStr}</span>
        </div>
        <h2 className="text-2xl font-bold mb-3 tracking-tight" style={{ color: "#111827" }}>
          Nos agents partent chasser pour vous{dots}
        </h2>
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-mono"
          style={{ background: "#fff", border: "1px solid #e5e7eb", color: "#374151" }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
          {query}
        </div>
      </div>

      {/* Agent cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
          width: "100%",
          maxWidth: 780,
          marginBottom: 24,
        }}
      >
        {agents.map((a) => (
          <AgentCard
            key={a.source}
            source={a.source}
            state={a.state}
            foundCount={foundPerSource[a.source]}
          />
        ))}
      </div>

      {/* Progress bar + profile counter */}
      <div style={{ width: "100%", maxWidth: 780, marginBottom: 24 }}>
        <div
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            padding: "14px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* Progress ring */}
              <div style={{ position: "relative", width: 28, height: 28, flexShrink: 0 }}>
                <svg width="28" height="28" viewBox="0 0 28 28">
                  <circle cx="14" cy="14" r="11" fill="none" stroke="#f3f4f6" strokeWidth="2.5" />
                  <circle
                    cx="14" cy="14" r="11"
                    fill="none"
                    stroke="#4f46e5"
                    strokeWidth="2.5"
                    strokeDasharray={`${2 * Math.PI * 11}`}
                    strokeDashoffset={`${2 * Math.PI * 11 * (1 - progress / 100)}`}
                    strokeLinecap="round"
                    transform="rotate(-90 14 14)"
                    style={{ transition: "stroke-dashoffset 0.8s ease" }}
                  />
                </svg>
                <span
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "monospace",
                    fontSize: 7,
                    fontWeight: 700,
                    color: "#4f46e5",
                  }}
                >
                  {Math.round(progress)}%
                </span>
              </div>
              <span style={{ color: "#6b7280", fontFamily: "monospace", fontSize: 12 }}>
                {doneCount}/{agents.length} agents terminés
              </span>
            </div>

            {profileCount > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "rgba(16,185,129,0.08)",
                  border: "1px solid rgba(16,185,129,0.2)",
                  borderRadius: 10,
                  padding: "4px 12px",
                }}
              >
                <span style={{ color: "#059669", fontSize: 13 }}>✦</span>
                <span style={{ color: "#059669", fontFamily: "monospace", fontSize: 13, fontWeight: 700 }}>
                  {profileCount} profil{profileCount > 1 ? "s" : ""} trouvé{profileCount > 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div style={{ width: "100%", height: 4, background: "#f3f4f6", borderRadius: 2, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${progress}%`,
                background: "linear-gradient(90deg, #4f46e5, #7c3aed)",
                borderRadius: 2,
                transition: "width 0.8s ease",
              }}
            />
          </div>
        </div>
      </div>

      {/* Terminal */}
      {feedLogs.length > 0 && (
        <div
          style={{
            width: "100%",
            maxWidth: 780,
            borderRadius: 16,
            overflow: "hidden",
            border: "1px solid #e5e7eb",
            boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
          }}
        >
          {/* Terminal header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 16px",
              background: "#111827",
              borderBottom: "1px solid #1f2937",
            }}
          >
            <div style={{ display: "flex", gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b" }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#22c55e" }} />
            </div>
            <span style={{ color: "#6b7280", fontFamily: "monospace", fontSize: 11, marginLeft: 8 }}>
              claw4hr — agent feed
            </span>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#22c55e",
                  display: "inline-block",
                  animation: "pulse-dot 1.2s ease-in-out infinite",
                }}
              />
              <span style={{ color: "#22c55e", fontFamily: "monospace", fontSize: 10, fontWeight: 700 }}>LIVE</span>
            </div>
          </div>

          {/* Log lines */}
          <div
            style={{
              background: "#0d1117",
              padding: "12px 16px",
              fontFamily: "monospace",
              fontSize: 11,
              display: "flex",
              flexDirection: "column",
              gap: 6,
              maxHeight: 260,
              overflowY: "auto",
            }}
          >
            {feedLogs.slice(-20).map((log, i) => {
              const src = BADGE_COLORS[log.source];
              const textColor = LOG_TYPE_COLORS[log.type];
              const totalShown = Math.min(feedLogs.length, 20);
              const opacity = Math.min(1, (i + 2) / Math.min(totalShown, 5) + 0.3);
              return (
                <div key={log.id} style={{ display: "flex", alignItems: "flex-start", gap: 8, opacity }}>
                  <span style={{ color: "#374151", fontSize: 9, paddingTop: 1, flexShrink: 0 }}>
                    {new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>
                  <span
                    style={{
                      flexShrink: 0,
                      fontSize: 8,
                      fontWeight: 700,
                      padding: "1px 6px",
                      borderRadius: 4,
                      background: src.bg,
                      color: src.text,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {src.label}
                  </span>
                  <span style={{ color: textColor, lineHeight: 1.5 }}>
                    {log.type === "found" && <span style={{ color: "#10b981" }}>→ </span>}
                    {log.type === "score" && <span style={{ color: "#818cf8" }}>★ </span>}
                    {log.message}
                  </span>
                </div>
              );
            })}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
              <span style={{ color: "#374151", fontSize: 9 }}>
                {new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
              <span
                style={{
                  display: "inline-block",
                  width: 7,
                  height: 12,
                  background: "#4f46e5",
                  animation: "pulse-dot 0.8s ease-in-out infinite",
                }}
              />
            </div>
            <div ref={logsEndRef} />
          </div>
        </div>
      )}
    </div>
  );
}

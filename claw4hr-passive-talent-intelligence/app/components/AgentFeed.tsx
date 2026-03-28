"use client";

import { useEffect, useRef } from "react";
import type { FeedEvent } from "@/app/lib/types";

interface AgentFeedProps {
  events: FeedEvent[];
  totalProfiles: number;
  cvCount: number;
}

const TYPE_ICONS: Record<FeedEvent["type"], string> = {
  connect: "M13 10V3L4 14h7v7l9-11h-7z",
  parse: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6",
  score: "M12 20V10 M18 20V4 M6 20v-4",
  source: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  analyze: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
  notify: "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0",
};

export default function AgentFeed({ events, totalProfiles, cvCount }: AgentFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const doneCount = events.filter((e) => e.status === "done").length;
  const runningCount = events.filter((e) => e.status === "running").length;
  const progress = events.length > 0 ? (doneCount / events.length) * 100 : 0;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [events]);

  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-[var(--bg-surface)]">
        <div className="flex items-center gap-2.5">
          <div className="relative w-2.5 h-2.5">
            <div className={`absolute inset-0 rounded-full ${runningCount > 0 ? "bg-[var(--accent-cyan)] animate-pulse-dot" : doneCount > 0 ? "bg-[var(--accent-emerald)]" : "bg-[var(--text-muted)]"}`} />
            <div className={`w-2.5 h-2.5 rounded-full ${runningCount > 0 ? "bg-[var(--accent-cyan)]" : doneCount > 0 ? "bg-[var(--accent-emerald)]" : "bg-[var(--text-muted)]"}`} />
          </div>
          <p className="text-[13px] font-semibold text-[var(--text-primary)]">Pipeline Agent</p>
          {runningCount > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent-cyan-dim)] text-[var(--accent-cyan)] font-medium animate-pulse">
              En cours
            </span>
          )}
        </div>

        {events.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-[var(--text-muted)]">
              {doneCount}/{events.length}
            </span>
            <div className="w-24 h-1.5 rounded-full bg-[var(--bg-card)] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-emerald)] transition-all duration-700 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Feed items */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {events.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-[var(--accent-cyan)]/30 border-t-[var(--accent-cyan)] animate-spin-slow" />
            <p className="text-[12px] text-[var(--text-muted)]">En attente du recruteur...</p>
          </div>
        )}

        {events.map((item, i) => (
          <FeedRow key={item.id} item={item} index={i} />
        ))}
      </div>

      {/* Bottom stats bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/[0.06] bg-[var(--bg-surface)]">
        <div className="flex items-center gap-4">
          <Stat label="CVs" value={cvCount > 0 ? String(cvCount) : "—"} />
          <Stat label="Profils" value={totalProfiles > 0 ? totalProfiles.toLocaleString("fr-FR") : "—"} />
          <Stat label="Q&A" value={String(events.filter((e) => e.type === "analyze").length)} />
        </div>
        <span className="text-[10px] font-mono text-[var(--text-muted)]">
          {events.length} ops
        </span>
      </div>
    </div>
  );
}

function FeedRow({ item, index }: { item: FeedEvent; index: number }) {
  const statusEl =
    item.status === "done" ? (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-emerald)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ) : item.status === "running" ? (
      <div className="w-3.5 h-3.5 rounded-full border-2 border-[var(--accent-cyan)] border-t-transparent animate-spin-slow" />
    ) : (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-rose)" strokeWidth="2.5" strokeLinecap="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    );

  const iconPaths = TYPE_ICONS[item.type];

  return (
    <div
      className={`animate-fade-in-left flex items-start gap-3 px-4 py-2.5 border-b border-white/[0.03] transition-colors hover:bg-white/[0.02] ${
        item.status === "running" ? "bg-[var(--accent-cyan-dim)]/30" : ""
      }`}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="flex flex-col items-center gap-1 pt-0.5">
        {statusEl}
      </div>

      <div className="flex items-center justify-center w-7 h-7 rounded-md bg-white/[0.04] shrink-0 mt-0.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d={iconPaths} />
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <p className={`text-[12px] font-medium truncate ${
            item.status === "running" ? "text-[var(--accent-cyan)]"
            : item.status === "error" ? "text-[var(--accent-rose)]"
            : "text-[var(--text-primary)]"
          }`}>
            {item.action}
          </p>
          <span className="text-[10px] font-mono text-[var(--text-muted)] shrink-0">{item.time}</span>
        </div>
        <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">{item.detail}</p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[12px] font-mono font-semibold text-[var(--accent-cyan)]">{value}</span>
      <span className="text-[10px] text-[var(--text-muted)]">{label}</span>
    </div>
  );
}

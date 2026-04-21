"use client";

import { useEffect, useMemo, useState } from "react";
import type { SourcedProfile } from "@/app/lib/types";
import { PixelSprite, SOURCE_CONFIG } from "./PixelAgent";
import type { AgentSource, AgentState } from "./PixelAgent";
import CandidateCard from "./CandidateCard";

type SortMode = "score-desc" | "score-asc" | "high-only" | "arrival";
type ViewMode = "grid" | "list";

interface ResultsViewProps {
  profiles: SourcedProfile[];
  query: string;
  isStreaming: boolean;
  agentStatuses: Record<AgentSource, AgentState>;
  savedProfiles: Set<string>;
  onSelect: (profile: SourcedProfile) => void;
  onSave: (profile: SourcedProfile) => void;
  onContact: (profile: SourcedProfile) => void;
  onNewSearch: () => void;
}

function MiniAgentPill({ source, state }: { source: AgentSource; state: AgentState }) {
  const config = SOURCE_CONFIG[source];
  const [walkFrame, setWalkFrame] = useState(0);
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    if (state !== "running") return;
    const t = setInterval(() => setWalkFrame((f) => (f + 1) % 3), 180);
    return () => clearInterval(t);
  }, [state]);

  useEffect(() => {
    if (state !== "running") return;
    const t = setInterval(() => setMsgIndex((i) => (i + 1) % config.messages.length), 1800);
    return () => clearInterval(t);
  }, [state, config.messages.length]);

  const msg =
    state === "done" ? "Terminé"
    : state === "error" ? "Erreur"
    : state === "idle" ? "En attente"
    : config.messages[msgIndex].replace("> ", "");

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-300"
      style={{
        background: state === "done" ? "#f0fdf4" : "#fff",
        border: `1px solid ${state === "done" ? "#bbf7d0" : "#e5e7eb"}`,
        opacity: state === "error" ? 0.4 : 1,
      }}
    >
      <div style={{ opacity: state === "idle" ? 0.4 : 1 }}>
        <PixelSprite color={config.color} frame={state === "running" ? walkFrame : 0} />
      </div>
      <div>
        <p className="font-mono font-bold text-[10px] uppercase tracking-wider" style={{ color: config.color }}>
          {config.label}
        </p>
        <p className="font-mono text-[9px] truncate" style={{ color: state === "done" ? "#16a34a" : "#9ca3af", maxWidth: 72 }}>
          {msg}
        </p>
      </div>
    </div>
  );
}

function useAnalytics(profiles: SourcedProfile[]) {
  return useMemo(() => {
    const scored = profiles.filter((p) => p.hrflow_score >= 0);
    const avgScore =
      scored.length > 0
        ? Math.round(scored.reduce((s, p) => s + p.hrflow_score, 0) / scored.length)
        : 0;
    const skillCount: Record<string, number> = {};
    for (const p of profiles) {
      for (const sk of p.skills) {
        skillCount[sk] = (skillCount[sk] || 0) + 1;
      }
    }
    const topSkill = Object.entries(skillCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
    const sourceTypes = new Set<string>();
    for (const p of profiles) {
      for (const src of p.sources) sourceTypes.add(src.type);
    }
    return { avgScore, topSkill, activeSources: sourceTypes.size };
  }, [profiles]);
}

function sortProfiles(profiles: SourcedProfile[], mode: SortMode): SourcedProfile[] {
  const copy = [...profiles];
  switch (mode) {
    case "score-desc": return copy.sort((a, b) => b.hrflow_score - a.hrflow_score);
    case "score-asc": return copy.sort((a, b) => a.hrflow_score - b.hrflow_score);
    case "high-only": return copy.filter((p) => p.hrflow_score >= 70).sort((a, b) => b.hrflow_score - a.hrflow_score);
    case "arrival": return copy;
  }
}

const SORT_OPTIONS: { mode: SortMode; label: string }[] = [
  { mode: "score-desc", label: "Score ↓" },
  { mode: "score-asc", label: "Score ↑" },
  { mode: "high-only", label: "≥ 70%" },
  { mode: "arrival", label: "Arrivée" },
];

export default function ResultsView({
  profiles,
  query,
  isStreaming,
  agentStatuses,
  savedProfiles,
  onSelect,
  onSave,
  onContact,
  onNewSearch,
}: ResultsViewProps) {
  const [sort, setSort] = useState<SortMode>("score-desc");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const sorted = sortProfiles(profiles, sort);
  const { avgScore, topSkill, activeSources } = useAnalytics(profiles);

  const agents = (["github", "linkedin", "reddit", "internet"] as AgentSource[]).map((s) => ({
    source: s,
    state: agentStatuses[s] ?? "idle",
  }));
  const allDone = agents.every((a) => a.state === "done" || a.state === "error");

  return (
    <div className="min-h-screen" style={{ background: "#f8f9fa" }}>
      {/* Sticky sub-header */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-6 py-3.5"
        style={{
          background: "rgba(248,249,250,0.95)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-mono"
            style={{ background: "#fff", border: "1px solid #e5e7eb", color: "#1a1a2e" }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FF6B6B" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
            <span className="truncate max-w-[240px]">{query}</span>
          </div>
          {isStreaming && (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono"
              style={{ background: "rgba(255,107,107,0.08)", color: "#FF6B6B" }}
            >
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#FF6B6B" }} />
              En cours…
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div
            className="flex items-center rounded-lg p-0.5"
            style={{ background: "#fff", border: "1px solid #e5e7eb" }}
          >
            <button
              onClick={() => setViewMode("grid")}
              className="p-1.5 rounded-md transition-all"
              style={{
                background: viewMode === "grid" ? "#1a1a2e" : "transparent",
                color: viewMode === "grid" ? "#fff" : "#6b7280",
              }}
              title="Vue grille"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className="p-1.5 rounded-md transition-all"
              style={{
                background: viewMode === "list" ? "#1a1a2e" : "transparent",
                color: viewMode === "list" ? "#fff" : "#6b7280",
              }}
              title="Vue liste"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>

          <span className="text-xs font-mono" style={{ color: "#9ca3af" }}>
            {profiles.length} profil{profiles.length > 1 ? "s" : ""}
          </span>

          <button
            onClick={onNewSearch}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{ background: "#1a1a2e", color: "#fff" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#FF6B6B")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#1a1a2e")}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Nouvelle recherche
          </button>
        </div>
      </div>

      {/* Agent strip */}
      <div
        className="overflow-hidden transition-all duration-500"
        style={{ maxHeight: isStreaming && !allDone ? 64 : 0, opacity: isStreaming && !allDone ? 1 : 0 }}
      >
        <div
          className="mx-6 mt-3 flex items-center gap-2 px-4 py-2 rounded-xl"
          style={{ background: "#fff", border: "1px solid #e5e7eb" }}
        >
          <div className="flex items-center gap-1.5 mr-1 flex-shrink-0">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#FF6B6B" }} />
            <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: "#9ca3af" }}>Agents</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {agents.map(({ source, state }) => (
              <MiniAgentPill key={source} source={source} state={state} />
            ))}
          </div>
        </div>
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between px-6 py-4">
        {/* Sort */}
        <div className="flex gap-1.5">
          {SORT_OPTIONS.map(({ mode, label }) => (
            <button
              key={mode}
              onClick={() => setSort(mode)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: sort === mode ? "#1a1a2e" : "#fff",
                color: sort === mode ? "#fff" : "#6b7280",
                border: `1px solid ${sort === mode ? "#1a1a2e" : "#e5e7eb"}`,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Stats */}
        {profiles.length > 0 && (
          <div className="flex items-center gap-4">
            <StatPill label="Score moy." value={`${avgScore}%`} />
            <StatPill label="Top skill" value={topSkill} truncate />
            <StatPill label="Sources" value={`${activeSources}/4`} />
          </div>
        )}
      </div>

      {/* Results */}
      <div className="px-6 pb-12">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            {sort === "high-only" ? (
              <>
                <p className="text-base font-medium text-center" style={{ color: "#6b7280" }}>
                  Aucun profil avec un score ≥ 70% pour cette recherche.
                </p>
                <button
                  onClick={() => setSort("score-desc")}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: "#1a1a2e", color: "#fff" }}
                >
                  Voir tous les profils
                </button>
              </>
            ) : (
              <p className="text-base font-medium" style={{ color: "#6b7280" }}>
                Recherche en cours…
              </p>
            )}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sorted.map((p, i) => (
              <CandidateCard
                key={p.key}
                profile={p}
                index={i}
                isSaved={savedProfiles.has(p.key)}
                onSelect={onSelect}
                onSave={onSave}
                onContact={onContact}
                viewMode="grid"
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {sorted.map((p, i) => (
              <CandidateCard
                key={p.key}
                profile={p}
                index={i}
                isSaved={savedProfiles.has(p.key)}
                onSelect={onSelect}
                onSave={onSave}
                onContact={onContact}
                viewMode="list"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatPill({ label, value, truncate }: { label: string; value: string; truncate?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-mono uppercase tracking-wide" style={{ color: "#9ca3af" }}>{label}</span>
      <span
        className="text-xs font-semibold font-mono"
        style={{
          color: "#1a1a2e",
          maxWidth: truncate ? 100 : undefined,
          overflow: truncate ? "hidden" : undefined,
          textOverflow: truncate ? "ellipsis" : undefined,
          whiteSpace: truncate ? "nowrap" : undefined,
        }}
      >
        {value}
      </span>
    </div>
  );
}

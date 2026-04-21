"use client";

import { useEffect, useState } from "react";
import type { SavedSearch, SourcedProfile, SourceType } from "@/app/lib/types";

interface HistoryViewProps {
  sessionId: string;
  onRelaunch: (query: string) => void;
}

const SOURCE_COLORS: Record<SourceType, string> = {
  github: "#1a1a2e",
  linkedin: "#0077b5",
  reddit: "#ff4500",
  internet: "#6b7280",
  indeed: "#2164f3",
  hellowork: "#e05c2a",
};

const SOURCE_LABELS: Record<SourceType, string> = {
  github: "GitHub",
  linkedin: "LinkedIn",
  reddit: "Reddit",
  internet: "Web",
  indeed: "Indeed",
  hellowork: "HelloWork",
};

function Avatar({ name, color }: { name: string; color: string }) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
      style={{ width: 40, height: 40, background: color, fontSize: 14 }}
    >
      {initials}
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 85 ? "#10b981" : score >= 75 ? "#f59e0b" : "#6b7280";
  return (
    <span
      className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full flex-shrink-0"
      style={{ background: `${color}18`, color }}
    >
      {score}%
    </span>
  );
}

function ProfileMiniCard({ profile }: { profile: SourcedProfile }) {
  const primarySource = profile.sources[0];
  const sourceColor = primarySource ? SOURCE_COLORS[primarySource.type] : "#6b7280";
  const sourceLabel = primarySource ? SOURCE_LABELS[primarySource.type] : "";

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
      style={{ background: "#fff", border: "1px solid #e5e7eb" }}
    >
      <Avatar name={profile.name} color={profile.avatar_color} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-sm truncate" style={{ color: "#1a1a2e" }}>{profile.name}</p>
          <ScoreBadge score={profile.hrflow_score} />
        </div>
        <p className="text-xs truncate mt-0.5" style={{ color: "#6b7280" }}>{profile.title}</p>
        <div className="flex items-center gap-2 mt-1">
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded"
            style={{ background: `${sourceColor}14`, color: sourceColor }}
          >
            {sourceLabel}
          </span>
          <span className="text-[10px]" style={{ color: "#9ca3af" }}>{profile.location}</span>
        </div>
      </div>
    </div>
  );
}

export default function HistoryView({ sessionId, onRelaunch }: HistoryViewProps) {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId || sessionId === "ssr") return;
    fetch(`/api/account/searches?session_id=${sessionId}`)
      .then((r) => r.json())
      .then((data) => setSearches(data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sessionId]);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  }

  function handleDelete(id: string) {
    setSearches((prev) => prev.filter((s) => s.id !== id));
    if (expanded === id) setExpanded(null);
    fetch("/api/account/searches", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, id }),
    }).catch(() => {});
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => (prev === id ? null : id));
  }

  return (
    <div className="min-h-screen px-8 py-8" style={{ background: "#f8f9fa" }}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF6B6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
          <h1 className="text-xl font-bold" style={{ color: "#1a1a2e" }}>Historique</h1>
        </div>
        <p className="text-sm" style={{ color: "#6b7280" }}>
          {loading ? "Chargement…" : `${searches.length} recherche${searches.length !== 1 ? "s" : ""} effectuée${searches.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full animate-bounce"
                style={{ background: "#FF6B6B", animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        </div>
      ) : searches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.15)" }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FF6B6B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
          </div>
          <div className="text-center">
            <p className="font-semibold text-base mb-1" style={{ color: "#1a1a2e" }}>Aucune recherche</p>
            <p className="text-sm" style={{ color: "#6b7280" }}>Votre historique de recherches apparaîtra ici.</p>
          </div>
        </div>
      ) : (
        <div className="max-w-3xl flex flex-col gap-3">
          {searches.map((search, i) => {
            const hasResults = search.results && search.results.length > 0;
            const isExpanded = expanded === search.id;

            return (
              <div
                key={search.id}
                className="rounded-xl overflow-hidden transition-all"
                style={{
                  background: "#fff",
                  border: isExpanded ? "1px solid #FF6B6B" : "1px solid #e5e7eb",
                  animationDelay: `${i * 40}ms`,
                }}
              >
                {/* Row */}
                <div className="flex items-center justify-between px-5 py-4">
                  <div
                    className="flex items-center gap-4 min-w-0 flex-1 cursor-pointer"
                    onClick={() => hasResults && toggleExpand(search.id)}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(255,107,107,0.08)" }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF6B6B" strokeWidth="2" strokeLinecap="round">
                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate" style={{ color: "#1a1a2e" }}>{search.query}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        {search.created_at && (
                          <span className="text-[11px] font-mono" style={{ color: "#9ca3af" }}>
                            {formatDate(search.created_at)}
                          </span>
                        )}
                        {search.profile_count > 0 && (
                          <span
                            className="text-[11px] font-mono px-2 py-0.5 rounded-full"
                            style={{ background: "rgba(255,107,107,0.08)", color: "#FF6B6B" }}
                          >
                            {search.profile_count} profils
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    {hasResults && (
                      <button
                        onClick={() => toggleExpand(search.id)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                        style={{
                          background: isExpanded ? "rgba(255,107,107,0.08)" : "#f3f4f6",
                          color: isExpanded ? "#FF6B6B" : "#6b7280",
                          border: isExpanded ? "1px solid rgba(255,107,107,0.2)" : "1px solid transparent",
                        }}
                      >
                        {isExpanded ? "Masquer" : "Voir profils"}
                        <svg
                          width="11"
                          height="11"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          style={{ transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => onRelaunch(search.query)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all"
                      style={{ background: "#1a1a2e", color: "#fff" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#FF6B6B")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#1a1a2e")}
                    >
                      Relancer
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(search.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
                      style={{ background: "#f9fafb", border: "1px solid #e5e7eb", color: "#9ca3af" }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = "#fee2e2";
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "#fca5a5";
                        (e.currentTarget as HTMLButtonElement).style.color = "#ef4444";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = "#f9fafb";
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "#e5e7eb";
                        (e.currentTarget as HTMLButtonElement).style.color = "#9ca3af";
                      }}
                      title="Supprimer"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Expanded profiles */}
                {isExpanded && hasResults && (
                  <div
                    className="px-5 pb-5"
                    style={{ borderTop: "1px solid #f3f4f6" }}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-wider mt-4 mb-3" style={{ color: "#9ca3af" }}>
                      Profils trouvés — triés par score HrFlow
                    </p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {search.results!.map((profile) => (
                        <ProfileMiniCard key={profile.key} profile={profile} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

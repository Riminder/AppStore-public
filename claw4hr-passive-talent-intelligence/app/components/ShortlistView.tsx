"use client";

import { useEffect, useState } from "react";
import type { ShortlistEntry, SourcedProfile } from "@/app/lib/types";
import CandidateCard from "./CandidateCard";

interface ShortlistViewProps {
  sessionId: string;
  onOpenProfile: (profile: SourcedProfile) => void;
  onContact: (profile: SourcedProfile) => void;
}

export default function ShortlistView({ sessionId, onOpenProfile, onContact }: ShortlistViewProps) {
  const [entries, setEntries] = useState<ShortlistEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId || sessionId === "ssr") return;
    fetch(`/api/account/shortlist?session_id=${sessionId}`)
      .then((r) => r.json())
      .then((data) => setEntries(data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sessionId]);

  const savedKeys = new Set(entries.map((e) => e.profile_key));

  function handleDelete(profileKey: string) {
    setEntries((prev) => prev.filter((e) => e.profile_key !== profileKey));
    fetch("/api/account/shortlist", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, profile_key: profileKey }),
    }).catch(() => {});
  }

  return (
    <div className="min-h-screen px-8 py-8" style={{ background: "#f8f9fa" }}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF6B6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <h1 className="text-xl font-bold" style={{ color: "#1a1a2e" }}>Shortlist</h1>
        </div>
        <p className="text-sm" style={{ color: "#6b7280" }}>
          {loading ? "Chargement…" : `${entries.length} profil${entries.length !== 1 ? "s" : ""} sauvegardé${entries.length !== 1 ? "s" : ""}`}
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
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.15)" }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FF6B6B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <div className="text-center">
            <p className="font-semibold text-base mb-1" style={{ color: "#1a1a2e" }}>Aucun profil sauvegardé</p>
            <p className="text-sm" style={{ color: "#6b7280" }}>Lancez une recherche et sauvegardez les profils qui vous intéressent.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {entries.map((entry, i) => (
            <div key={entry.id} className="relative group/card">
              <CandidateCard
                profile={entry.profile_data}
                index={i}
                isSaved={savedKeys.has(entry.profile_key)}
                onSelect={onOpenProfile}
                onSave={() => {}}
                onContact={onContact}
              />
              <button
                onClick={() => handleDelete(entry.profile_key)}
                className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg opacity-0 group-hover/card:opacity-100 transition-all z-10"
                style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#ef4444" }}
                title="Retirer de la shortlist"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

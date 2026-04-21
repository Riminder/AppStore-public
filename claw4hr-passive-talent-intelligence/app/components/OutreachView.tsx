"use client";

import { useEffect, useState } from "react";
import type { OutreachEntry } from "@/app/lib/types";

interface OutreachViewProps {
  sessionId: string;
}

// For demo: assign a deterministic pseudo-status to each entry
const STATUSES = ["sent", "sent", "waiting", "replied"] as const;
type OutreachStatus = (typeof STATUSES)[number];

const STATUS_META: Record<OutreachStatus, { label: string; color: string; bg: string }> = {
  sent:    { label: "Envoyé",              color: "#6b7280", bg: "#f3f4f6" },
  waiting: { label: "En attente",          color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  replied: { label: "Réponse reçue ✓",    color: "#10b981", bg: "rgba(16,185,129,0.1)" },
};

function getStatus(entry: OutreachEntry, index: number): OutreachStatus {
  return STATUSES[index % STATUSES.length];
}

export default function OutreachView({ sessionId }: OutreachViewProps) {
  const [entries, setEntries] = useState<OutreachEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<OutreachEntry | null>(null);
  const [copied, setCopied] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId || sessionId === "ssr") return;
    fetch(`/api/account/outreach?session_id=${sessionId}`)
      .then((r) => r.json())
      .then((data) => setEntries(data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sessionId]);

  async function handleCopy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* no-op */ }
  }

  async function handleDelete(entry: OutreachEntry) {
    setDeletingId(entry.id);
    try {
      await fetch("/api/account/outreach", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, outreach_id: entry.id }),
      });
      setEntries((prev) => prev.filter((e) => e.id !== entry.id));
      if (selected?.id === entry.id) setSelected(null);
    } catch { /* no-op */ }
    setDeletingId(null);
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  }

  const repliedCount = entries.filter((e, i) => getStatus(e, i) === "replied").length;
  const waitingCount = entries.filter((e, i) => getStatus(e, i) === "waiting").length;

  return (
    <div className="min-h-screen" style={{ background: "#f8f9fa" }}>
      <div className="flex h-screen overflow-hidden">
        {/* Left: list */}
        <div
          className="flex flex-col overflow-hidden flex-shrink-0"
          style={{
            width: selected ? 380 : 520,
            borderRight: "1px solid #e5e7eb",
            background: "#fff",
            transition: "width 200ms ease",
          }}
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-4 flex-shrink-0" style={{ borderBottom: "1px solid #f3f4f6" }}>
            <h1 className="text-xl font-bold mb-1" style={{ color: "#1a1a2e" }}>Messages d&apos;approche</h1>
            <p className="text-xs" style={{ color: "#9ca3af" }}>
              Messages personnalisés générés par l&apos;IA et envoyés à vos candidats passifs
            </p>
            {entries.length > 0 && (
              <div className="flex gap-3 mt-4">
                <Chip label={`${entries.length} envoyé${entries.length > 1 ? "s" : ""}`} color="#4f46e5" />
                {waitingCount > 0 && <Chip label={`${waitingCount} en attente`} color="#f59e0b" />}
                {repliedCount > 0 && <Chip label={`${repliedCount} réponse${repliedCount > 1 ? "s" : ""}`} color="#10b981" />}
              </div>
            )}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-2 h-2 rounded-full animate-bounce" style={{ background: "#FF6B6B", animationDelay: `${i * 150}ms` }} />
                  ))}
                </div>
              </div>
            ) : entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4 px-8">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.15)" }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FF6B6B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-base mb-1" style={{ color: "#1a1a2e" }}>Aucun message envoyé</p>
                  <p className="text-sm" style={{ color: "#6b7280" }}>Sourcez des candidats et cliquez &quot;Contacter&quot; pour générer votre premier message personnalisé.</p>
                </div>
              </div>
            ) : (
              <div>
                {entries.map((entry, i) => {
                  const status = getStatus(entry, i);
                  const st = STATUS_META[status];
                  const isSelected = selected?.id === entry.id;
                  return (
                    <div
                      key={entry.id}
                      className="relative flex items-start gap-3 px-5 py-4 cursor-pointer transition-colors group"
                      style={{
                        borderBottom: "1px solid #f3f4f6",
                        background: isSelected ? "rgba(79,70,229,0.04)" : "transparent",
                      }}
                      onClick={() => { setSelected(entry); setCopied(false); }}
                      onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = "#f9fafb"; }}
                      onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                    >
                      {/* Active indicator */}
                      {isSelected && <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full" style={{ background: "#4f46e5" }} />}

                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5" style={{ background: "linear-gradient(135deg, #FF6B6B, #CC4444)" }}>
                        {entry.profile_name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="font-semibold text-sm truncate" style={{ color: "#1a1a2e" }}>{entry.profile_name}</p>
                          <span className="text-[11px] flex-shrink-0 font-mono" style={{ color: "#9ca3af" }}>
                            {entry.created_at ? formatDate(entry.created_at) : ""}
                          </span>
                        </div>
                        <p className="text-xs line-clamp-1 leading-relaxed mb-2" style={{ color: "#6b7280" }}>
                          {entry.message.slice(0, 80)}…
                        </p>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: st.bg, color: st.color }}>
                          {st.label}
                        </span>
                      </div>

                      {/* Delete button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(entry); }}
                        disabled={deletingId === entry.id}
                        className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5"
                        style={{ background: "#fee2e2", color: "#ef4444" }}
                        title="Supprimer"
                      >
                        {deletingId === entry.id ? (
                          <div className="w-3 h-3 rounded-full border border-t-transparent animate-spin" style={{ borderColor: "#ef4444", borderTopColor: "transparent" }} />
                        ) : (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: message detail */}
        {selected ? (
          <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "#f8f9fa" }}>
            <div className="flex items-center justify-between px-8 py-5 flex-shrink-0" style={{ background: "#fff", borderBottom: "1px solid #e5e7eb" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ background: "linear-gradient(135deg, #FF6B6B, #CC4444)" }}>
                  {selected.profile_name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-base" style={{ color: "#1a1a2e" }}>{selected.profile_name}</p>
                  <p className="text-xs font-mono mt-0.5" style={{ color: "#9ca3af" }}>
                    {selected.created_at ? `Généré le ${formatDate(selected.created_at)}` : "Message personnalisé"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(selected.message)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                  style={{ background: copied ? "#10b981" : "#4f46e5", color: "#fff" }}
                >
                  {copied ? (
                    <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg> Copié</>
                  ) : (
                    <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copier</>
                  )}
                </button>
                <button
                  onClick={() => setSelected(null)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors"
                  style={{ background: "#f3f4f6", color: "#6b7280" }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-8">
              <div className="max-w-2xl">
                {/* Info bar */}
                <div className="flex items-center gap-3 mb-5 px-4 py-3 rounded-xl" style={{ background: "rgba(79,70,229,0.05)", border: "1px solid rgba(79,70,229,0.1)" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  <p className="text-xs" style={{ color: "#4f46e5" }}>
                    Message généré par l&apos;IA Claw4HR · Personnalisé pour {selected.profile_name.split(" ")[0]}
                  </p>
                </div>

                {/* Message body */}
                <div className="rounded-2xl p-8" style={{ background: "#fff", border: "1px solid #e5e7eb", lineHeight: 1.8 }}>
                  <p className="text-sm whitespace-pre-wrap" style={{ color: "#374151" }}>{selected.message}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Empty state when nothing selected */
          entries.length > 0 && (
            <div className="flex-1 flex items-center justify-center" style={{ background: "#f8f9fa" }}>
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(79,70,229,0.08)", border: "1px solid rgba(79,70,229,0.12)" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <p className="text-sm font-medium" style={{ color: "#6b7280" }}>Sélectionnez un message pour le lire</p>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function Chip({ label, color }: { label: string; color: string }) {
  return (
    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: `${color}18`, color }}>
      {label}
    </span>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ShortlistEntry, OutreachEntry, SourcedProfile } from "@/app/lib/types";

interface PipelineViewProps {
  sessionId: string;
  onOpenProfile: (profile: SourcedProfile) => void;
  onContact: (profile: SourcedProfile) => void;
}

type StageId = "shortlisted" | "contacted" | "discussing" | "archived";

const COLUMNS: {
  id: StageId;
  label: string;
  sub: string;
  color: string;
  bg: string;
}[] = [
  { id: "shortlisted", label: "Shortlistés",   sub: "Sélectionnés",          color: "#4f46e5", bg: "rgba(79,70,229,0.05)" },
  { id: "contacted",  label: "Contactés",      sub: "Outreach envoyé",       color: "#f59e0b", bg: "rgba(245,158,11,0.05)" },
  { id: "discussing", label: "En discussion",  sub: "Échanges en cours",     color: "#10b981", bg: "rgba(16,185,129,0.05)" },
  { id: "archived",   label: "Archivés",       sub: "Candidatures closes",   color: "#6b7280", bg: "rgba(107,114,128,0.05)" },
];

interface PipelineCard {
  key: string;
  profile: SourcedProfile;
  stage: StageId;
  outreach?: OutreachEntry;
}

interface UndoToast {
  id: string;
  profileName: string;
  profileKey: string;
  stage: StageId;
  profile: SourcedProfile;
  outreach?: OutreachEntry;
  timer: ReturnType<typeof setTimeout>;
}

const SOURCE_COLORS: Record<string, string> = {
  github: "#1f2937", linkedin: "#0077b5", reddit: "#ff4500", internet: "#7c3aed",
};

export default function PipelineView({ sessionId, onOpenProfile, onContact }: PipelineViewProps) {
  const [cards, setCards] = useState<PipelineCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [undoToast, setUndoToast] = useState<UndoToast | null>(null);
  const [dragOverCol, setDragOverCol] = useState<StageId | null>(null);
  const dragKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!sessionId || sessionId === "ssr") return;
    Promise.all([
      fetch(`/api/account/shortlist?session_id=${sessionId}`).then((r) => r.json()),
      fetch(`/api/account/outreach?session_id=${sessionId}`).then((r) => r.json()),
    ]).then(([sl, o]) => {
      const shortlist: ShortlistEntry[] = sl.data ?? [];
      const outreach: OutreachEntry[] = o.data ?? [];
      const outreachMap = new Map(outreach.map((o) => [o.profile_key, o]));

      const initial: PipelineCard[] = shortlist.map((e) => ({
        key: e.profile_key,
        profile: e.profile_data,
        stage: (e.pipeline_stage as StageId) ?? (outreachMap.has(e.profile_key) ? "contacted" : "shortlisted"),
        outreach: outreachMap.get(e.profile_key),
      }));

      setCards(initial);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [sessionId]);

  useEffect(() => {
    return () => {
      if (undoToast) clearTimeout(undoToast.timer);
    };
  }, [undoToast]);

  const moveCard = useCallback((profileKey: string, newStage: StageId) => {
    setCards((prev) => prev.map((c) => c.key === profileKey ? { ...c, stage: newStage } : c));
    fetch("/api/account/shortlist", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, profile_key: profileKey, pipeline_stage: newStage }),
    }).catch(() => {});
  }, [sessionId]);

  const deleteCard = useCallback((card: PipelineCard) => {
    setCards((prev) => prev.filter((c) => c.key !== card.key));

    const timer = setTimeout(() => {
      fetch("/api/account/shortlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, profile_key: card.key }),
      }).catch(() => {});
      setUndoToast(null);
    }, 4000);

    setUndoToast((prev) => {
      if (prev) clearTimeout(prev.timer);
      return { id: card.key, profileName: card.profile.name, profileKey: card.key, stage: card.stage, profile: card.profile, outreach: card.outreach, timer };
    });
  }, [sessionId]);

  const undoDelete = useCallback(() => {
    if (!undoToast) return;
    clearTimeout(undoToast.timer);
    setCards((prev) => {
      if (prev.some((c) => c.key === undoToast.profileKey)) return prev;
      return [...prev, { key: undoToast.profileKey, profile: undoToast.profile, stage: undoToast.stage, outreach: undoToast.outreach }];
    });
    setUndoToast(null);
  }, [undoToast]);

  const handleDragStart = useCallback((e: React.DragEvent, profileKey: string) => {
    dragKeyRef.current = profileKey;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", profileKey);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, colId: StageId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCol(colId);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, colId: StageId) => {
    e.preventDefault();
    const key = e.dataTransfer.getData("text/plain") || dragKeyRef.current;
    setDragOverCol(null);
    if (key) moveCard(key, colId);
    dragKeyRef.current = null;
  }, [moveCard]);

  const handleDragEnd = useCallback(() => {
    setDragOverCol(null);
    dragKeyRef.current = null;
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: "#f8f9fa" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#4f46e5", borderTopColor: "transparent" }} />
          <p className="text-sm" style={{ color: "#9ca3af" }}>Chargement du pipeline…</p>
        </div>
      </div>
    );
  }

  const total = cards.length;

  return (
    <div className="min-h-screen overflow-auto" style={{ background: "#f8f9fa" }}>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Pipeline</h1>
          <p className="text-sm mt-1" style={{ color: "#6b7280" }}>
            {total} candidat{total !== 1 ? "s" : ""} · Glissez-déposez pour changer de statut
          </p>
        </div>

        <div className="flex gap-4 pb-4" style={{ minWidth: "max-content" }}>
          {COLUMNS.map((col) => {
            const colCards = cards.filter((c) => c.stage === col.id);
            const isDragTarget = dragOverCol === col.id;
            return (
              <div
                key={col.id}
                className="flex flex-col gap-3 transition-all duration-150"
                style={{ width: 240 }}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={(e) => {
                  const col = e.currentTarget as HTMLElement;
                  if (!col.contains(e.relatedTarget as Node)) {
                    setDragOverCol(null);
                  }
                }}
                onDrop={(e) => handleDrop(e, col.id)}
              >
                <div
                  className="flex items-center justify-between px-3.5 py-3 rounded-xl transition-all duration-150"
                  style={{
                    background: isDragTarget ? `${col.color}12` : col.bg,
                    border: `1px solid ${isDragTarget ? col.color + "60" : col.color + "22"}`,
                    boxShadow: isDragTarget ? `0 0 0 2px ${col.color}30` : "none",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                    <span className="text-sm font-semibold" style={{ color: "#111827" }}>{col.label}</span>
                  </div>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: `${col.color}20`, color: col.color }}
                  >
                    {colCards.length}
                  </span>
                </div>

                <div
                  className="flex flex-col gap-2.5 min-h-[80px] rounded-xl transition-all duration-150 p-1"
                  style={{
                    background: isDragTarget ? `${col.color}06` : "transparent",
                    border: isDragTarget ? `2px dashed ${col.color}40` : "2px dashed transparent",
                  }}
                >
                  {colCards.length === 0 ? (
                    <div
                      className="rounded-xl p-4 text-center"
                      style={{ border: "1px dashed #d1d5db" }}
                    >
                      <p className="text-xs" style={{ color: "#9ca3af" }}>
                        {isDragTarget ? "Déposer ici" : "Aucun candidat"}
                      </p>
                    </div>
                  ) : (
                    colCards.map((card) => (
                      <PipelineCardItem
                        key={card.key}
                        card={card}
                        accentColor={col.color}
                        onOpenProfile={onOpenProfile}
                        onContact={onContact}
                        onDelete={deleteCard}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {undoToast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg z-50"
          style={{ background: "#1a1a2e", color: "#fff", minWidth: 280 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#f87171", flexShrink: 0 }}>
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          </svg>
          <p className="text-xs flex-1">{undoToast.profileName} supprimé</p>
          <button
            onClick={undoDelete}
            className="text-xs font-semibold px-2.5 py-1 rounded-lg transition-all"
            style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.25)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.15)")}
          >
            Annuler
          </button>
        </div>
      )}
    </div>
  );
}

function PipelineCardItem({
  card,
  accentColor,
  onOpenProfile,
  onContact,
  onDelete,
  onDragStart,
  onDragEnd,
}: {
  card: PipelineCard;
  accentColor: string;
  onOpenProfile: (p: SourcedProfile) => void;
  onContact: (p: SourcedProfile) => void;
  onDelete: (card: PipelineCard) => void;
  onDragStart: (e: React.DragEvent, key: string) => void;
  onDragEnd: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const { profile, outreach } = card;
  const initials = profile.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const primarySource = profile.sources?.[0];
  const sourceColor = primarySource ? (SOURCE_COLORS[primarySource.type] ?? "#6b7280") : profile.avatar_color ?? "#6b7280";

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, card.key)}
      onDragEnd={onDragEnd}
      className="bg-white rounded-xl p-3.5 flex flex-col gap-2.5 cursor-grab active:cursor-grabbing transition-all duration-150 relative group"
      style={{
        border: `1px solid ${hovered ? accentColor + "44" : "#e5e7eb"}`,
        boxShadow: hovered ? "0 4px 16px rgba(0,0,0,0.08)" : "0 1px 3px rgba(0,0,0,0.04)",
        userSelect: "none",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(card); }}
        className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
        style={{ background: "#fee2e2", color: "#ef4444" }}
        title="Supprimer"
      >
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>

      <div className="flex items-center gap-2.5 cursor-pointer pr-4" onClick={() => onOpenProfile(profile)}>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
          style={{ background: profile.avatar_color ?? sourceColor }}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 truncate">{profile.name}</p>
          <p className="text-[11px] truncate" style={{ color: "#6b7280" }}>{profile.title || "—"}</p>
        </div>
        {profile.hrflow_score > 0 && (
          <div
            className="flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
            style={{
              background: profile.hrflow_score >= 70 ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)",
              color: profile.hrflow_score >= 70 ? "#10b981" : "#f59e0b",
            }}
          >
            {profile.hrflow_score}%
          </div>
        )}
      </div>

      {profile.skills && profile.skills.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {profile.skills.slice(0, 3).map((skill) => (
            <span key={skill} className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: "#f3f4f6", color: "#374151" }}>
              {skill}
            </span>
          ))}
          {profile.skills.length > 3 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "#f3f4f6", color: "#9ca3af" }}>
              +{profile.skills.length - 3}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {primarySource && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: `${sourceColor}18`, color: sourceColor }}>
              {primarySource.type}
            </span>
          )}
          {profile.location && (
            <span className="text-[10px]" style={{ color: "#9ca3af" }}>{profile.location}</span>
          )}
        </div>
        {card.stage !== "contacted" && card.stage !== "discussing" && card.stage !== "archived" ? (
          <button
            onClick={(e) => { e.stopPropagation(); onContact(profile); }}
            className="text-[10px] font-semibold px-2 py-1 rounded-lg transition-all opacity-0 group-hover:opacity-100"
            style={{ background: `${accentColor}15`, color: accentColor, border: `1px solid ${accentColor}30` }}
          >
            Contacter
          </button>
        ) : outreach ? (
          <span className="text-[10px] font-medium" style={{ color: "#10b981" }}>✓ Envoyé</span>
        ) : null}
      </div>

      {outreach && (
        <div
          className="text-[11px] px-2.5 py-1.5 rounded-lg line-clamp-2 leading-relaxed"
          style={{ background: "rgba(245,158,11,0.06)", color: "#78716c", borderLeft: "2px solid #f59e0b" }}
        >
          {outreach.message.slice(0, 90)}…
        </div>
      )}
    </div>
  );
}

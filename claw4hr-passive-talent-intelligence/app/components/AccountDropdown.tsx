"use client";

import { useEffect, useRef, useState } from "react";
import type { SavedSearch, ShortlistEntry, OutreachEntry, SourcedProfile } from "@/app/lib/types";

interface AccountDropdownProps {
  sessionId: string;
  shortlistKeys: Set<string>;
  onRelaunchSearch: (query: string) => void;
  onOpenProfile: (profile: SourcedProfile) => void;
  onClose: () => void;
}

export default function AccountDropdown({
  sessionId,
  shortlistKeys,
  onRelaunchSearch,
  onOpenProfile,
  onClose,
}: AccountDropdownProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [shortlist, setShortlist] = useState<ShortlistEntry[]>([]);
  const [outreach, setOutreach] = useState<OutreachEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOutreach, setSelectedOutreach] = useState<OutreachEntry | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      const [s, sl, o] = await Promise.all([
        fetch(`/api/account/searches?session_id=${sessionId}`).then((r) => r.json()),
        fetch(`/api/account/shortlist?session_id=${sessionId}`).then((r) => r.json()),
        fetch(`/api/account/outreach?session_id=${sessionId}`).then((r) => r.json()),
      ]);
      setSearches(s.data ?? []);
      setShortlist(sl.data ?? []);
      setOutreach(o.data ?? []);
      setLoading(false);
    }
    load();
  }, [sessionId]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-[calc(100%+8px)] w-80 rounded-xl overflow-hidden z-50"
      style={{
        background: "#fff",
        border: "2px solid var(--ink)",
        boxShadow: "6px 6px 0 0 var(--ink)",
      }}
    >
      {loading ? (
        <div className="p-4 text-center text-sm font-mono" style={{ color: "var(--muted-text)" }}>
          Chargement...
        </div>
      ) : (
        <>
          <Section icon="🔍" title="Recherches récentes" empty={searches.length === 0} emptyText="Aucune recherche">
            {searches.slice(0, 5).map((s) => (
              <button
                key={s.id}
                onClick={() => { onRelaunchSearch(s.query); onClose(); }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--cream)] transition-colors flex items-center justify-between gap-2"
              >
                <span className="truncate font-mono" style={{ color: "var(--ink)" }}>{s.query}</span>
                {s.profile_count > 0 && (
                  <span className="text-xs flex-shrink-0" style={{ color: "var(--muted-text)" }}>
                    {s.profile_count} profils
                  </span>
                )}
              </button>
            ))}
          </Section>

          <Divider />

          <Section
            icon="★"
            title={`Ma Shortlist${shortlist.length > 0 ? ` (${shortlist.length})` : ""}`}
            empty={shortlist.length === 0}
            emptyText="Aucun profil sauvegardé"
          >
            {shortlist.slice(0, 5).map((entry) => (
              <button
                key={entry.id}
                onClick={() => { onOpenProfile(entry.profile_data); onClose(); }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--cream)] transition-colors flex items-center gap-3"
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                  style={{ backgroundColor: entry.profile_data.avatar_color }}
                >
                  {entry.profile_data.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-bold truncate text-xs" style={{ color: "var(--ink)" }}>
                    {entry.profile_data.name}
                  </p>
                  <p className="truncate text-[11px]" style={{ color: "var(--muted-text)" }}>
                    {entry.profile_data.title}
                  </p>
                </div>
              </button>
            ))}
          </Section>

          <Divider />

          <Section
            icon="✉"
            title={`Outreach${outreach.length > 0 ? ` (${outreach.length})` : ""}`}
            empty={outreach.length === 0}
            emptyText="Aucun message envoyé"
          >
            {outreach.slice(0, 5).map((o) => (
              <button
                key={o.id}
                onClick={() => { setSelectedOutreach(o); setCopied(false); }}
                className="w-full text-left px-4 py-2 hover:bg-[var(--cream)] transition-colors"
              >
                <p className="font-bold text-xs truncate" style={{ color: "var(--ink)" }}>
                  ✉ {o.profile_name}
                </p>
                <p className="text-[11px] line-clamp-2 mt-0.5" style={{ color: "var(--muted-text)" }}>
                  {o.message.slice(0, 80)}…
                </p>
              </button>
            ))}
          </Section>
        </>
      )}
      {selectedOutreach && (
        <div
          className="absolute inset-0 z-10 flex flex-col rounded-xl overflow-hidden"
          style={{ background: "#fff" }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 flex-shrink-0"
            style={{ background: "var(--cream)", borderBottom: "2px solid var(--ink)" }}
          >
            <div className="min-w-0">
              <p className="text-xs font-mono font-bold uppercase tracking-wider" style={{ color: "var(--ink)" }}>
                ✉ Message envoyé
              </p>
              <p className="text-[11px] truncate mt-0.5" style={{ color: "var(--muted-text)" }}>
                {selectedOutreach.profile_name}
              </p>
            </div>
            <button
              onClick={() => setSelectedOutreach(null)}
              className="ml-2 flex-shrink-0 text-lg leading-none"
              style={{ color: "var(--muted-text)" }}
            >
              ×
            </button>
          </div>

          {/* Message */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            <p
              className="text-sm whitespace-pre-wrap"
              style={{ color: "var(--ink)", fontFamily: "Georgia, serif", lineHeight: 1.6 }}
            >
              {selectedOutreach.message}
            </p>
          </div>

          {/* Copy button */}
          <div className="px-4 py-3 flex-shrink-0" style={{ borderTop: "1px solid #e5e7eb" }}>
            <button
              onClick={() => {
                navigator.clipboard.writeText(selectedOutreach.message);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="w-full py-2 text-sm font-mono font-bold uppercase tracking-wider transition-all"
              style={{
                background: copied ? "#22c55e" : "var(--coral)",
                color: "#fff",
                boxShadow: copied ? "3px 3px 0 0 #15803d" : "3px 3px 0 0 var(--coral-deep)",
              }}
            >
              {copied ? "✓ Copié !" : "Copier le message"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({
  icon, title, empty, emptyText, children,
}: {
  icon: string; title: string; empty: boolean; emptyText: string; children?: React.ReactNode;
}) {
  return (
    <div>
      <div className="px-4 py-2 flex items-center gap-2" style={{ background: "var(--cream)", borderBottom: "1px solid #e5e7eb" }}>
        <span className="text-sm">{icon}</span>
        <span className="text-xs font-mono font-bold uppercase tracking-wider" style={{ color: "var(--ink)" }}>
          {title}
        </span>
      </div>
      {empty ? (
        <p className="px-4 py-3 text-xs font-mono" style={{ color: "var(--muted-text)" }}>{emptyText}</p>
      ) : children}
    </div>
  );
}

function Divider() {
  return <div style={{ borderTop: "1px solid #e5e7eb" }} />;
}

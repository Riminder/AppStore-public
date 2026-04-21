"use client";

import { useState, useRef, useEffect } from "react";
import type { SourceType } from "@/app/lib/types";

interface SearchViewProps {
  onSearch: (query: string, count: number) => void;
  initialQuery?: string;
  initialCount?: number;
}

const SUGGESTIONS = [
  "Data Scientist NLP — Paris",
  "Lead DevOps AWS/GCP — Remote",
  "Full-Stack React/Node — Lyon",
];

const CONNECTORS: { type: SourceType; label: string; color: string; active: boolean }[] = [
  { type: "github",    label: "GitHub",    color: "#1a1a2e", active: true },
  { type: "linkedin",  label: "LinkedIn",  color: "#0077b5", active: true },
  { type: "reddit",    label: "Reddit",    color: "#ff4500", active: true },
  { type: "internet",  label: "Web",       color: "#6b7280", active: true },
  { type: "indeed",    label: "Indeed",    color: "#2164f3", active: false },
  { type: "hellowork", label: "HelloWork", color: "#e05c2a", active: false },
];

const COUNT_OPTIONS = [5, 10, 20, 50];

export default function SearchView({ onSearch, initialQuery, initialCount = 10 }: SearchViewProps) {
  const [query, setQuery] = useState(initialQuery ?? "");
  const [count, setCount] = useState(initialCount);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialQuery) setQuery(initialQuery);
  }, [initialQuery]);

  function handleSubmit() {
    const q = query.trim();
    if (!q) return;
    onSearch(q, count);
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-8"
      style={{ background: "#f8f9fa" }}
    >
      <div className="w-full max-w-2xl">
        {/* Headline */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold mb-2 tracking-tight" style={{ color: "#1a1a2e" }}>
            Votre prochain recrutement commence ici.
          </h1>
          <p className="text-sm" style={{ color: "#6b7280" }}>
            Décrivez le profil idéal en langage naturel — nos agents s&apos;occupent du reste.
          </p>
        </div>

        {/* Search card */}
        <div
          className="rounded-2xl p-2"
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
          }}
        >
          <div className="flex items-center gap-3 px-4 py-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF6B6B" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="Ex: Lead Data Scientist Python, 5 ans d'XP, Paris..."
              className="flex-1 bg-transparent outline-none text-[15px]"
              style={{ color: "#1a1a2e", fontFamily: "var(--font-sans)" }}
              autoFocus
            />
            {/* Profile count selector */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-[11px] font-mono" style={{ color: "#9ca3af" }}>profils</span>
              <select
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="text-xs font-semibold rounded-lg px-2 py-1.5 outline-none cursor-pointer"
                style={{
                  background: "#f3f4f6",
                  border: "1px solid #e5e7eb",
                  color: "#374151",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {COUNT_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleSubmit}
              disabled={!query.trim()}
              className="px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: query.trim() ? "#FF6B6B" : "#e5e7eb",
                color: query.trim() ? "#fff" : "#9ca3af",
                boxShadow: query.trim() ? "0 2px 8px rgba(255,107,107,0.35)" : "none",
              }}
            >
              Chercher →
            </button>
          </div>
        </div>

        {/* Suggestions */}
        <div className="flex flex-wrap gap-2 mt-4 justify-center">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => { setQuery(s); inputRef.current?.focus(); }}
              className="px-4 py-2 rounded-full text-xs font-medium transition-all duration-150"
              style={{
                border: "1px solid #e5e7eb",
                color: "#6b7280",
                background: "#fff",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#FF6B6B";
                (e.currentTarget as HTMLButtonElement).style.color = "#FF6B6B";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#e5e7eb";
                (e.currentTarget as HTMLButtonElement).style.color = "#6b7280";
              }}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Connectors */}
        <div className="mt-12 flex flex-wrap gap-2.5 justify-center">
          <p className="w-full text-center text-[11px] font-mono uppercase tracking-widest mb-1" style={{ color: "#d1d5db" }}>
            Sources connectées
          </p>
          {CONNECTORS.map((c) => (
            <div
              key={c.type}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{
                border: `1px solid ${c.active ? `${c.color}30` : "#e5e7eb"}`,
                background: c.active ? `${c.color}08` : "transparent",
                opacity: c.active ? 1 : 0.45,
              }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: c.active ? c.color : "#d1d5db" }}
              />
              <span
                className="text-xs font-mono"
                style={{ color: c.active ? c.color : "#9ca3af" }}
              >
                {c.label}
                {!c.active && " (bientôt)"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import type { ShortlistEntry, OutreachEntry, SavedSearch } from "@/app/lib/types";

interface AnalyseViewProps {
  sessionId: string;
}

interface Stats {
  searches: SavedSearch[];
  shortlist: ShortlistEntry[];
  outreach: OutreachEntry[];
}

const ACCENT = "#4f46e5";

export default function AnalyseView({ sessionId }: AnalyseViewProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId || sessionId === "ssr") return;
    Promise.all([
      fetch(`/api/account/searches?session_id=${sessionId}`).then((r) => r.json()),
      fetch(`/api/account/shortlist?session_id=${sessionId}`).then((r) => r.json()),
      fetch(`/api/account/outreach?session_id=${sessionId}`).then((r) => r.json()),
    ]).then(([s, sl, o]) => {
      setStats({ searches: s.data ?? [], shortlist: sl.data ?? [], outreach: o.data ?? [] });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [sessionId]);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen" style={{ background: "#f8f9fa" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: ACCENT, borderTopColor: "transparent" }} />
          <p className="text-sm" style={{ color: "#9ca3af" }}>Chargement des données…</p>
        </div>
      </div>
    );
  }

  const totalSourced = stats.searches.reduce((sum, s) => sum + (s.profile_count ?? 0), 0);
  const shortlistCount = stats.shortlist.length;
  const outreachCount = stats.outreach.length;
  const conversionRate = totalSourced > 0 ? Math.round((shortlistCount / totalSourced) * 100) : 0;
  const outreachRate = shortlistCount > 0 ? Math.round((outreachCount / shortlistCount) * 100) : 0;

  // Source breakdown from shortlist
  const sourceCounts: Record<string, number> = {};
  stats.shortlist.forEach((entry) => {
    entry.profile_data.sources?.forEach((src) => {
      sourceCounts[src.type] = (sourceCounts[src.type] ?? 0) + 1;
    });
  });

  // Avg score from shortlisted profiles
  const scored = stats.shortlist.filter((e) => e.profile_data.hrflow_score > 0);
  const avgScore = scored.length > 0
    ? Math.round(scored.reduce((sum, e) => sum + e.profile_data.hrflow_score, 0) / scored.length)
    : null;

  // Recent activity (last 5 searches)
  const recentSearches = [...stats.searches].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

  const stageCounts: Record<string, number> = {};
  stats.shortlist.forEach((e) => {
    const stage = (e as { pipeline_stage?: string }).pipeline_stage ?? "shortlisted";
    stageCounts[stage] = (stageCounts[stage] ?? 0) + 1;
  });
  const STAGE_META: Record<string, { label: string; color: string }> = {
    shortlisted: { label: "Shortlistés",    color: "#4f46e5" },
    contacted:   { label: "Contactés",      color: "#f59e0b" },
    waiting:     { label: "En attente",     color: "#3b82f6" },
    discussing:  { label: "En discussion",  color: "#10b981" },
    archived:    { label: "Archivés",       color: "#6b7280" },
  };

  return (
    <div className="min-h-screen p-8 overflow-y-auto" style={{ background: "#f8f9fa" }}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Analyse de campagne</h1>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide" style={{ background: "rgba(79,70,229,0.1)", color: "#4f46e5" }}>
            Powered by HrFlow
          </span>
        </div>
        <p className="text-sm mt-1" style={{ color: "#6b7280" }}>Suivi en temps réel de votre activité de sourcing</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard
          label="Profils sourcés"
          value={totalSourced}
          icon={<SearchIcon />}
          sub={`${stats.searches.length} recherche${stats.searches.length > 1 ? "s" : ""}`}
          accent={ACCENT}
        />
        <KpiCard
          label="Shortlistés"
          value={shortlistCount}
          icon={<StarIcon />}
          sub={`${conversionRate}% de conversion`}
          accent="#10b981"
        />
        <KpiCard
          label="Contactés"
          value={outreachCount}
          icon={<MailIcon />}
          sub={`${outreachRate}% du shortlist`}
          accent="#f59e0b"
        />
        <div className="rounded-2xl" style={{ boxShadow: `0 0 0 2px rgba(79,70,229,0.2)` }}>
          <KpiCard
            label="Score IA moyen HrFlow"
            value={avgScore !== null ? `${avgScore}%` : "—"}
            icon={<ScoreIcon />}
            sub={scored.length > 0 ? `sur ${scored.length} profil${scored.length > 1 ? "s" : ""} scoré${scored.length > 1 ? "s" : ""}` : "Aucun score HrFlow"}
            accent={ACCENT}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Funnel */}
        <div className="bg-white rounded-2xl p-6" style={{ border: "1px solid #e5e7eb" }}>
          <h2 className="text-sm font-semibold text-gray-900 mb-5">Entonnoir de recrutement</h2>
          <div className="flex flex-col gap-3">
            <FunnelBar label="Sourcés" value={totalSourced} max={totalSourced} color={ACCENT} />
            <FunnelBar label="Shortlistés" value={shortlistCount} max={totalSourced} color="#10b981" />
            <FunnelBar label="Contactés" value={outreachCount} max={totalSourced} color="#f59e0b" />
          </div>
        </div>

        {/* Sources */}
        <div className="bg-white rounded-2xl p-6" style={{ border: "1px solid #e5e7eb" }}>
          <h2 className="text-sm font-semibold text-gray-900 mb-5">Sources de candidats</h2>
          {Object.keys(sourceCounts).length === 0 ? (
            <p className="text-sm" style={{ color: "#9ca3af" }}>Aucune donnée de source disponible</p>
          ) : (
            <div className="flex flex-col gap-3">
              {Object.entries(sourceCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([type, count]) => (
                  <SourceRow key={type} type={type} count={count} total={shortlistCount} />
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Pipeline stage breakdown */}
      {Object.keys(stageCounts).length > 0 && (
        <div className="bg-white rounded-2xl p-6 mb-8" style={{ border: "1px solid #e5e7eb" }}>
          <h2 className="text-sm font-semibold text-gray-900 mb-5">Répartition par étape (Pipeline)</h2>
          <div className="flex flex-col gap-3">
            {Object.entries(stageCounts).map(([stage, count]) => {
              const meta = STAGE_META[stage] ?? { label: stage, color: "#6b7280" };
              return (
                <div key={stage} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: meta.color }} />
                  <span className="text-xs font-medium w-28 flex-shrink-0" style={{ color: "#374151" }}>{meta.label}</span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "#f3f4f6" }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.max((count / shortlistCount) * 100, 4)}%`, background: meta.color }} />
                  </div>
                  <span className="text-xs font-semibold w-6 text-right flex-shrink-0" style={{ color: "#374151" }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent searches */}
      <div className="bg-white rounded-2xl p-6" style={{ border: "1px solid #e5e7eb" }}>
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Recherches récentes</h2>
        {recentSearches.length === 0 ? (
          <p className="text-sm" style={{ color: "#9ca3af" }}>Aucune recherche effectuée</p>
        ) : (
          <div className="flex flex-col divide-y divide-gray-100">
            {recentSearches.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(139,124,248,0.1)" }}>
                    <SearchIcon color={ACCENT} size={13} />
                  </div>
                  <span className="text-sm font-medium text-gray-800 truncate max-w-xs">{s.query}</span>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                  <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: "rgba(139,124,248,0.1)", color: ACCENT }}>
                    {s.profile_count ?? 0} profil{(s.profile_count ?? 0) > 1 ? "s" : ""}
                  </span>
                  <span className="text-xs" style={{ color: "#9ca3af" }}>
                    {new Date(s.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({ label, value, icon, sub, accent }: { label: string; value: number | string; icon: React.ReactNode; sub: string; accent: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 flex flex-col gap-3" style={{ border: "1px solid #e5e7eb" }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: "#6b7280" }}>{label}</span>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${accent}18` }}>
          <span style={{ color: accent }}>{icon}</span>
        </div>
      </div>
      <p className="text-3xl font-bold tracking-tight" style={{ color: "#111827" }}>{value}</p>
      <p className="text-xs" style={{ color: "#9ca3af" }}>{sub}</p>
    </div>
  );
}

function FunnelBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.max((value / max) * 100, value > 0 ? 4 : 0) : 0;
  const displayPct = max > 0 && value > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-medium w-24 flex-shrink-0" style={{ color: "#374151" }}>{label}</span>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "#f3f4f6" }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="flex items-center gap-1.5 w-16 justify-end flex-shrink-0">
        <span className="text-xs font-semibold" style={{ color: "#374151" }}>{value}</span>
        {max > 0 && <span className="text-[10px]" style={{ color: "#9ca3af" }}>({displayPct}%)</span>}
      </div>
    </div>
  );
}

const SOURCE_META: Record<string, { label: string; color: string }> = {
  github: { label: "GitHub", color: "#1f2937" },
  linkedin: { label: "LinkedIn", color: "#0077b5" },
  reddit: { label: "Reddit", color: "#ff4500" },
  internet: { label: "Web", color: "#7c3aed" },
};

function SourceRow({ type, count, total }: { type: string; count: number; total: number }) {
  const meta = SOURCE_META[type] ?? { label: type, color: "#6b7280" };
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-semibold w-16 flex-shrink-0" style={{ color: meta.color }}>{meta.label}</span>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "#f3f4f6" }}>
        <div className="h-full rounded-full" style={{ width: `${Math.max(pct, count > 0 ? 4 : 0)}%`, background: meta.color }} />
      </div>
      <span className="text-xs text-right w-12 flex-shrink-0" style={{ color: "#6b7280" }}>{count} ({pct}%)</span>
    </div>
  );
}

function SearchIcon({ color = "currentColor", size = 14 }: { color?: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;
}
function StarIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
}
function MailIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
}
function ScoreIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
}

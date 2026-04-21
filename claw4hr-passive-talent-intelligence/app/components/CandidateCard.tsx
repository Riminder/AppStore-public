"use client";

import type { SourcedProfile, SourceType } from "@/app/lib/types";
import ScoreRing from "./ScoreRing";

interface CandidateCardProps {
  profile: SourcedProfile;
  index: number;
  isSaved: boolean;
  onSelect: (profile: SourcedProfile) => void;
  onSave: (profile: SourcedProfile) => void;
  onContact?: (profile: SourcedProfile) => void;
  viewMode?: "grid" | "list";
}

const SOURCE_LABELS: Record<SourceType, string> = {
  github: "GitHub",
  linkedin: "LinkedIn",
  reddit: "Reddit",
  internet: "Web",
  indeed: "Indeed",
  hellowork: "HelloWork",
};

const SOURCE_COLORS: Record<SourceType, string> = {
  github: "#1a1a2e",
  linkedin: "#0077b5",
  reddit: "#ff4500",
  internet: "#6b7280",
  indeed: "#2164f3",
  hellowork: "#e05c2a",
};

function Avatar({ name, color, size = 44 }: { name: string; color: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
      style={{
        width: size,
        height: size,
        background: color,
        fontSize: size * 0.33,
      }}
    >
      {initials}
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#6b7280";
  if (score < 0) return null;
  return (
    <span
      className="text-xs font-mono font-bold px-2 py-0.5 rounded-full"
      style={{ background: `${color}14`, color }}
    >
      {score}%
    </span>
  );
}

export default function CandidateCard({
  profile,
  index,
  isSaved,
  onSelect,
  onSave,
  onContact,
  viewMode = "grid",
}: CandidateCardProps) {
  if (viewMode === "list") {
    return (
      <div
        className="flex items-center gap-4 px-5 py-3.5 rounded-xl cursor-pointer transition-all duration-150 group"
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          animationDelay: `${index * 40}ms`,
        }}
        onClick={() => onSelect(profile)}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = "#FF6B6B";
          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 12px rgba(255,107,107,0.1)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = "#e5e7eb";
          (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
        }}
      >
        <Avatar name={profile.name} color={profile.avatar_color} size={36} />

        {/* Name + title */}
        <div className="min-w-0 w-[200px] flex-shrink-0">
          <p className="font-semibold text-sm truncate" style={{ color: "#1a1a2e" }}>{profile.name}</p>
          <p className="text-xs truncate" style={{ color: "#6b7280" }}>{profile.title}</p>
        </div>

        {/* Location + XP */}
        <div className="hidden md:block min-w-0 w-[140px] flex-shrink-0">
          <p className="text-xs truncate font-mono" style={{ color: "#9ca3af" }}>
            {profile.location}
          </p>
          <p className="text-xs font-mono" style={{ color: "#9ca3af" }}>
            {profile.experience_years} ans XP
          </p>
        </div>

        {/* Skills */}
        <div className="hidden lg:flex flex-wrap gap-1.5 flex-1 min-w-0">
          {profile.skills.slice(0, 3).map((skill) => (
            <span
              key={skill}
              className="px-2 py-0.5 rounded text-[11px] font-mono"
              style={{ background: "#f3f4f6", color: "#4b5563" }}
            >
              {skill}
            </span>
          ))}
          {profile.skills.length > 3 && (
            <span className="px-2 py-0.5 rounded text-[11px] font-mono" style={{ background: "#f3f4f6", color: "#FF6B6B" }}>
              +{profile.skills.length - 3}
            </span>
          )}
        </div>

        {/* Sources */}
        <div className="hidden xl:flex items-center gap-1.5 flex-shrink-0">
          {profile.sources.map((s) => (
            <span
              key={s.url}
              className="w-5 h-5 rounded text-[9px] font-bold flex items-center justify-center"
              style={{ background: `${SOURCE_COLORS[s.type]}15`, color: SOURCE_COLORS[s.type] }}
              title={SOURCE_LABELS[s.type]}
            >
              {SOURCE_LABELS[s.type][0]}
            </span>
          ))}
        </div>

        {/* Score */}
        <div className="flex-shrink-0 ml-auto">
          <ScoreBadge score={profile.hrflow_score} />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onSave(profile)}
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-all"
            style={{
              background: isSaved ? "#fff8e7" : "#f9fafb",
              border: `1px solid ${isSaved ? "#f59e0b" : "#e5e7eb"}`,
              color: isSaved ? "#f59e0b" : "#9ca3af",
              fontSize: 13,
            }}
            title={isSaved ? "Retirer de la shortlist" : "Ajouter à la shortlist"}
          >
            {isSaved ? "★" : "☆"}
          </button>
          {onContact && (
            <button
              onClick={() => onContact(profile)}
              className="w-7 h-7 flex items-center justify-center rounded-lg transition-all"
              style={{ background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.2)" }}
              title="Contacter"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FF6B6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </button>
          )}
          <button
            onClick={() => onSelect(profile)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all opacity-0 group-hover:opacity-100"
            style={{ background: "#1a1a2e", color: "#fff" }}
          >
            Voir →
          </button>
        </div>
      </div>
    );
  }

  // Grid mode
  const MAX_SKILLS = 4;
  const extra = profile.skills.length - MAX_SKILLS;

  return (
    <div
      className="animate-card-reveal cursor-pointer group"
      style={{ animationDelay: `${index * 60}ms` }}
      onClick={() => onSelect(profile)}
    >
      <div
        className="flex flex-col gap-4 p-5 rounded-xl transition-all duration-200"
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 6px 24px rgba(255,107,107,0.12)";
          (e.currentTarget as HTMLDivElement).style.borderColor = "#FF6B6B";
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.05)";
          (e.currentTarget as HTMLDivElement).style.borderColor = "#e5e7eb";
          (e.currentTarget as HTMLDivElement).style.transform = "none";
        }}
      >
        {/* Top row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar name={profile.name} color={profile.avatar_color} />
            <div className="min-w-0">
              <p className="font-bold text-[15px] truncate" style={{ color: "#1a1a2e" }}>
                {profile.name}
              </p>
              <p className="text-sm truncate" style={{ color: "#6b7280" }}>
                {profile.title}
              </p>
              <p className="text-xs font-mono mt-0.5" style={{ color: "#9ca3af" }}>
                {profile.location} · {profile.experience_years} ans
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onSave(profile); }}
              className="w-7 h-7 flex items-center justify-center rounded-lg transition-all"
              style={{
                background: isSaved ? "#fff8e7" : "#f9fafb",
                border: `1px solid ${isSaved ? "#f59e0b" : "#e5e7eb"}`,
                color: isSaved ? "#f59e0b" : "#9ca3af",
                fontSize: 13,
              }}
              title={isSaved ? "Retirer de la shortlist" : "Ajouter"}
            >
              {isSaved ? "★" : "☆"}
            </button>
            <ScoreRing score={profile.hrflow_score} size={48} />
          </div>
        </div>

        {/* Source badges */}
        <div className="flex gap-1.5 flex-wrap">
          {profile.sources.map((s) => (
            <a
              key={s.url}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono transition-colors"
              style={{
                background: `${SOURCE_COLORS[s.type]}0d`,
                color: SOURCE_COLORS[s.type],
                border: `1px solid ${SOURCE_COLORS[s.type]}20`,
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = `${SOURCE_COLORS[s.type]}1a`)}
              onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = `${SOURCE_COLORS[s.type]}0d`)}
            >
              {SOURCE_LABELS[s.type]}
            </a>
          ))}
        </div>

        {/* Skills */}
        <div className="flex gap-1.5 flex-wrap">
          {profile.skills.slice(0, MAX_SKILLS).map((skill) => (
            <span
              key={skill}
              className="px-2.5 py-1 rounded-md text-[11px] font-mono"
              style={{ background: "#f3f4f6", color: "#4b5563" }}
            >
              {skill}
            </span>
          ))}
          {extra > 0 && (
            <span
              className="px-2.5 py-1 rounded-md text-[11px] font-mono"
              style={{ background: "rgba(255,107,107,0.08)", color: "#FF6B6B" }}
            >
              +{extra}
            </span>
          )}
        </div>

        {/* CTA */}
        <div className="flex gap-2">
          <button
            className="flex-1 py-2.5 font-semibold text-xs tracking-wide rounded-xl transition-all duration-200"
            style={{
              background: "#1a1a2e",
              color: "#fff",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#FF6B6B")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#1a1a2e")}
          >
            Voir le profil →
          </button>
          {onContact && (
            <button
              onClick={(e) => { e.stopPropagation(); onContact(profile); }}
              className="px-3 py-2.5 rounded-xl transition-all duration-200"
              style={{
                background: "rgba(255,107,107,0.08)",
                border: "1px solid rgba(255,107,107,0.2)",
              }}
              title="Contacter"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF6B6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

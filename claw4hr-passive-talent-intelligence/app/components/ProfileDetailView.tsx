"use client";

import { useState } from "react";
import type { SourcedProfile, ChatMessage, SourceType } from "@/app/lib/types";
import ScoreRing from "./ScoreRing";
import QAPanel from "./QAPanel";
import HrFlowSWOT from "./HrFlowSWOT";

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

type RightTab = "swot" | "chat";

interface ProfileDetailViewProps {
  profile: SourcedProfile;
  messages: ChatMessage[];
  asking: boolean;
  isSaved: boolean;
  onBack: () => void;
  onSend: (question: string) => void;
  onSave: (profile: SourcedProfile) => void;
  onContact: (profile: SourcedProfile) => void;
}

export default function ProfileDetailView({
  profile,
  messages,
  asking,
  isSaved,
  onBack,
  onSend,
  onSave,
  onContact,
}: ProfileDetailViewProps) {
  const [activeTab, setActiveTab] = useState<RightTab>("swot");

  const initials = profile.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex" style={{ height: "100vh", overflow: "hidden" }}>
      {/* ─── Left panel: Profile info ─────────────────────────── */}
      <div
        className="flex flex-col overflow-hidden flex-shrink-0"
        style={{ width: 440, borderRight: "1px solid #e5e7eb", background: "#fff" }}
      >
        {/* Action bar */}
        <div
          className="flex items-center gap-2 px-5 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid #f3f4f6" }}
        >
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-all"
            style={{ color: "#6b7280", background: "#f9fafb", border: "1px solid #e5e7eb" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#1a1a2e")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#6b7280")}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Retour
          </button>
          <button
            onClick={() => onSave(profile)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-all"
            style={{
              color: isSaved ? "#f59e0b" : "#6b7280",
              background: isSaved ? "#fff8e7" : "#f9fafb",
              border: `1px solid ${isSaved ? "#fcd34d" : "#e5e7eb"}`,
            }}
          >
            {isSaved ? "★ Sauvegardé" : "☆ Sauvegarder"}
          </button>
          <button
            onClick={() => onContact(profile)}
            className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg transition-all ml-auto"
            style={{ background: "#FF6B6B", color: "#fff", boxShadow: "0 2px 8px rgba(255,107,107,0.3)" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#CC4444")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#FF6B6B")}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            Contacter
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Hero */}
          <div className="px-6 py-6" style={{ borderBottom: "1px solid #f3f4f6" }}>
            <div className="flex items-start gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-white text-lg flex-shrink-0"
                style={{ background: profile.avatar_color }}
              >
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold mb-0.5 leading-tight" style={{ color: "#1a1a2e" }}>
                  {profile.name}
                </h1>
                <p className="text-sm mb-1" style={{ color: "#6b7280" }}>{profile.title}</p>
                <p className="text-xs font-mono" style={{ color: "#9ca3af" }}>
                  {profile.location} · {profile.experience_years} ans d&apos;expérience
                </p>
              </div>
              <ScoreRing score={profile.hrflow_score} size={56} strokeWidth={4} />
            </div>

            {/* Sources */}
            <div className="flex gap-2 flex-wrap mt-4">
              {profile.sources.map((s) => (
                <a
                  key={s.url}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors"
                  style={{
                    background: `${SOURCE_COLORS[s.type]}0d`,
                    color: SOURCE_COLORS[s.type],
                    border: `1px solid ${SOURCE_COLORS[s.type]}20`,
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = `${SOURCE_COLORS[s.type]}1a`)}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = `${SOURCE_COLORS[s.type]}0d`)}
                >
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: SOURCE_COLORS[s.type] }} />
                  {SOURCE_LABELS[s.type]}
                </a>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="px-6 py-5" style={{ borderBottom: "1px solid #f3f4f6" }}>
            <p className="text-[11px] font-mono uppercase tracking-widest mb-3" style={{ color: "#9ca3af" }}>Résumé</p>
            <p className="text-sm leading-relaxed" style={{ color: "#374151" }}>{profile.summary}</p>
          </div>

          {/* Skills */}
          <div className="px-6 py-5" style={{ borderBottom: "1px solid #f3f4f6" }}>
            <p className="text-[11px] font-mono uppercase tracking-widest mb-3" style={{ color: "#9ca3af" }}>Compétences</p>
            <div className="flex flex-wrap gap-1.5">
              {profile.skills.map((skill) => (
                <span
                  key={skill}
                  className="px-2.5 py-1 rounded-md text-xs font-mono"
                  style={{ background: "#f3f4f6", color: "#374151" }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Experiences */}
          {profile.experiences.length > 0 && (
            <div className="px-6 py-5" style={{ borderBottom: "1px solid #f3f4f6" }}>
              <p className="text-[11px] font-mono uppercase tracking-widest mb-4" style={{ color: "#9ca3af" }}>Expériences</p>
              <div className="space-y-5">
                {profile.experiences.map((exp, i) => (
                  <div key={i} className="flex gap-3">
                    <div
                      className="w-0.5 flex-shrink-0 rounded-full mt-1"
                      style={{ background: i === 0 ? "#FF6B6B" : "#e5e7eb", minHeight: 40 }}
                    />
                    <div>
                      <p className="font-semibold text-sm" style={{ color: "#1a1a2e" }}>{exp.title}</p>
                      <p className="text-xs font-mono" style={{ color: "#FF6B6B" }}>{exp.company}</p>
                      <p className="text-xs font-mono mb-1.5" style={{ color: "#9ca3af" }}>
                        {exp.location} · {exp.period}
                      </p>
                      <p className="text-xs leading-relaxed" style={{ color: "#6b7280" }}>{exp.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Educations */}
          {profile.educations.length > 0 && (
            <div className="px-6 py-5">
              <p className="text-[11px] font-mono uppercase tracking-widest mb-4" style={{ color: "#9ca3af" }}>Formation</p>
              <div className="space-y-3">
                {profile.educations.map((edu, i) => (
                  <div key={i}>
                    <p className="font-semibold text-sm" style={{ color: "#1a1a2e" }}>{edu.degree}</p>
                    <p className="text-xs font-mono" style={{ color: "#FF6B6B" }}>{edu.school}</p>
                    <p className="text-xs font-mono" style={{ color: "#9ca3af" }}>{edu.period}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Right panel: tabs ────────────────────────────────── */}
      <div className="flex flex-col overflow-hidden flex-1" style={{ minWidth: 380, background: "#f8f9fa" }}>
        {/* Tab bar */}
        <div
          className="flex flex-shrink-0"
          style={{ background: "#fff", borderBottom: "1px solid #e5e7eb" }}
        >
          <TabButton
            label="Analyse HrFlow"
            icon={
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            }
            isActive={activeTab === "swot"}
            onClick={() => setActiveTab("swot")}
          />
          <TabButton
            label="Chat IA"
            icon={
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            }
            isActive={activeTab === "chat"}
            onClick={() => setActiveTab("chat")}
            badge={messages.length > 0 ? messages.length : undefined}
          />
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "swot" && (
            <div className="h-full overflow-y-auto p-5">
              <HrFlowSWOT profile={profile} />
            </div>
          )}
          {activeTab === "chat" && (
            <div className="h-full p-4 flex flex-col">
              <QAPanel profile={profile} messages={messages} asking={asking} onSend={onSend} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TabButton({
  label,
  icon,
  isActive,
  onClick,
  badge,
}: {
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  badge?: number;
}) {
  const ACCENT = "#4f46e5";
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-3 text-xs font-semibold transition-all relative flex-1 justify-center"
      style={{
        color: isActive ? ACCENT : "#6b7280",
        background: "transparent",
        borderBottom: isActive ? `2px solid ${ACCENT}` : "2px solid transparent",
      }}
    >
      <span style={{ color: isActive ? ACCENT : "#9ca3af" }}>{icon}</span>
      {label}
      {badge != null && badge > 0 && (
        <span
          className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
          style={{ background: `${ACCENT}20`, color: ACCENT }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

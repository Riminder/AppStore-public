"use client";

import { useState } from "react";

interface TeamViewProps {
  companyName: string;
}

const ACCENT = "#4f46e5";

const DEMO_MEMBERS = [
  { name: "Sophie Martin",   role: "Responsable RH",        status: "active"  as const },
  { name: "Lucas Bernard",   role: "Chargé de recrutement", status: "active"  as const },
  { name: "Émilie Rousseau", role: "Talent Acquisition",    status: "offline" as const },
];

type MemberStatus = "active" | "offline" | "you";

interface Member {
  name: string;
  role: string;
  status: MemberStatus;
}

export default function TeamView({ companyName }: TeamViewProps) {
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [role, setRole] = useState<"recruiter" | "admin">("recruiter");

  function generateToken() {
    const newToken = crypto.randomUUID().slice(0, 8).toUpperCase();
    setToken(newToken);
    setCopied(false);
  }

  async function copyLink() {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(`https://claw4hr.io/invite/${token}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available — no-op
    }
  }

  const members: Member[] = [
    ...DEMO_MEMBERS,
    { name: "Vous", role: "Admin", status: "you" },
  ];

  return (
    <div className="min-h-screen p-8 overflow-y-auto" style={{ background: "#f8f9fa" }}>
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#111827" }}>Équipe</h1>
          <p className="text-sm mt-1" style={{ color: "#6b7280" }}>
            {companyName || "Votre entreprise"} · {members.length} membre{members.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Members */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "#fff", border: "1px solid #e5e7eb" }}
        >
          <div className="px-5 py-4" style={{ borderBottom: "1px solid #f3f4f6" }}>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#9ca3af" }}>Membres</p>
          </div>
          <div className="flex flex-col divide-y divide-gray-50">
            {members.map((m) => (
              <MemberRow key={m.name} member={m} />
            ))}
          </div>
        </div>

        {/* Invite section */}
        <div
          className="rounded-2xl p-6 flex flex-col gap-4"
          style={{ background: "#fff", border: "1px solid #e5e7eb" }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold" style={{ color: "#111827" }}>Inviter un recruteur</p>
              <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>
                Générez un lien sécurisé à envoyer par email.
              </p>
            </div>
          </div>

          {/* Role selector */}
          <div className="flex gap-2">
            {(["recruiter", "admin"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: role === r ? ACCENT : "#f3f4f6",
                  color: role === r ? "#fff" : "#374151",
                  border: `1px solid ${role === r ? ACCENT : "#e5e7eb"}`,
                }}
              >
                {r === "recruiter" ? "Recruteur" : "Admin"}
              </button>
            ))}
          </div>

          {/* Token display */}
          {token ? (
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: "rgba(79,70,229,0.06)", border: "1px solid rgba(79,70,229,0.15)" }}
            >
              <code className="text-xs font-mono flex-1" style={{ color: ACCENT }}>
                claw4hr.io/invite/{token}
              </code>
              <button
                onClick={copyLink}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                style={{
                  background: copied ? "rgba(16,185,129,0.1)" : `${ACCENT}20`,
                  color: copied ? "#10b981" : ACCENT,
                  border: `1px solid ${copied ? "rgba(16,185,129,0.3)" : `${ACCENT}30`}`,
                }}
              >
                {copied ? (
                  <>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    Copié
                  </>
                ) : (
                  <>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    Copier
                  </>
                )}
              </button>
              <button
                onClick={() => setToken(null)}
                className="text-xs font-medium px-2 py-1.5 rounded-lg transition-all"
                style={{ color: "#9ca3af" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#374151")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#9ca3af")}
              >
                Nouveau
              </button>
            </div>
          ) : (
            <button
              onClick={generateToken}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{ background: ACCENT, color: "#fff", boxShadow: "0 2px 8px rgba(79,70,229,0.25)" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#4338ca")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = ACCENT)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              Générer un lien d&apos;invitation
            </button>
          )}

          <p className="text-[11px]" style={{ color: "#d1d5db" }}>
            Ce lien expire dans 48h · Valable pour 1 inscription · Rôle : {role === "recruiter" ? "Recruteur" : "Admin"}
          </p>
        </div>
      </div>
    </div>
  );
}

function MemberRow({ member }: { member: Member }) {
  const initials = member.name === "Vous" ? "V" : member.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const statusColors: Record<MemberStatus, { dot: string; label: string; text: string }> = {
    active:  { dot: "#10b981", label: "Actif",     text: "#10b981" },
    offline: { dot: "#d1d5db", label: "Hors ligne", text: "#9ca3af" },
    you:     { dot: "#4f46e5", label: "Vous",       text: "#4f46e5" },
  };
  const st = statusColors[member.status];
  const avatarBg = member.status === "you" ? "linear-gradient(135deg, #4f46e5, #7c3aed)" : member.status === "active" ? "#374151" : "#d1d5db";

  return (
    <div className="flex items-center gap-3 px-5 py-3.5">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
        style={{ background: avatarBg }}
      >
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: "#111827" }}>{member.name}</p>
        <p className="text-xs truncate" style={{ color: "#9ca3af" }}>{member.role}</p>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: st.dot }} />
        <span className="text-[11px] font-medium" style={{ color: st.text }}>{st.label}</span>
      </div>
    </div>
  );
}

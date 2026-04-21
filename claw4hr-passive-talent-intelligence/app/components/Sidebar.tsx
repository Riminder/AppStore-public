"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

type NavSection = "search" | "shortlist" | "outreach" | "history" | "analyse" | "pipeline" | "team";

interface SidebarProps {
  activeSection: NavSection;
  shortlistCount: number;
  outreachCount: number;
  sessionId: string;
  userProfile: { name: string; company: string; email: string } | null;
  onNavigate: (section: NavSection) => void;
  onOpenAccount: () => void;
}

const ACCENT = "#4f46e5";
const ACCENT_BG = "rgba(79,70,229,0.08)";
const ACCENT_MUTED = "rgba(79,70,229,0.15)";

const SOURCING_ITEMS: { section: NavSection; label: string; icon: React.ReactNode }[] = [
  {
    section: "search",
    label: "Recherche",
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>,
  },
  {
    section: "shortlist",
    label: "Shortlist",
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  },
  {
    section: "outreach",
    label: "Outreach",
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  },
  {
    section: "history",
    label: "Historique",
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  },
];

const INSIGHTS_ITEMS: { section: NavSection; label: string; icon: React.ReactNode }[] = [
  {
    section: "analyse",
    label: "Analyse",
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  },
  {
    section: "pipeline",
    label: "Pipeline",
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="12" rx="1"/><rect x="17" y="3" width="5" height="7" rx="1"/></svg>,
  },
];

const TEAM_ITEMS: { section: NavSection; label: string; icon: React.ReactNode }[] = [
  {
    section: "team",
    label: "Équipe",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
];

export type { NavSection };

export default function Sidebar({ activeSection, shortlistCount, outreachCount, sessionId, userProfile, onNavigate, onOpenAccount }: SidebarProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const badges: Partial<Record<NavSection, number>> = {
    shortlist: shortlistCount,
    outreach: outreachCount,
  };

  const displayName = userProfile?.name || "Mon compte";
  const displaySub = userProfile?.company || userProfile?.email?.split("@")[0] || (sessionId !== "ssr" ? `#${sessionId.slice(0, 8)}` : "—");
  const initials = userProfile?.name
    ? userProfile.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : null;

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <aside
      className="fixed left-0 top-0 h-screen flex flex-col z-40 select-none"
      style={{
        width: 240,
        background: "#f9fafb",
        borderRight: "1px solid #e5e7eb",
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-2.5 px-5 py-5 flex-shrink-0"
        style={{ borderBottom: "1px solid #e5e7eb" }}
      >
        <span style={{ fontSize: 21, lineHeight: 1 }}>🦞</span>
        <span className="text-[16px] font-bold tracking-tight" style={{ color: "#111827", fontFamily: "var(--font-sans)" }}>
          Claw<span style={{ color: ACCENT }}>4HR</span>
        </span>
        <span
          className="ml-auto text-[9px] font-semibold px-1.5 py-0.5 rounded-md tracking-wider"
          style={{ background: ACCENT_MUTED, color: ACCENT }}
        >
          BETA
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 pt-4 flex flex-col gap-5 overflow-y-auto">
        <div>
          <p className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#9ca3af" }}>
            Sourcing
          </p>
          <div className="flex flex-col gap-0.5">
            {SOURCING_ITEMS.map((item) => (
              <NavItem
                key={item.section}
                item={item}
                isActive={activeSection === item.section}
                badge={badges[item.section]}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#9ca3af" }}>
            Insights
          </p>
          <div className="flex flex-col gap-0.5">
            {INSIGHTS_ITEMS.map((item) => (
              <NavItem
                key={item.section}
                item={item}
                isActive={activeSection === item.section}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#9ca3af" }}>
            Équipe
          </p>
          <div className="flex flex-col gap-0.5">
            {TEAM_ITEMS.map((item) => (
              <NavItem
                key={item.section}
                item={item}
                isActive={activeSection === item.section}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>
      </nav>

      {/* Divider */}
      <div className="mx-3 mb-3" style={{ borderTop: "1px solid #e5e7eb" }} />

      {/* Account */}
      <div className="px-3 pb-4 flex-shrink-0 relative">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-150 text-left"
          style={{
            background: menuOpen ? "#f3f4f6" : "#ffffff",
            border: "1px solid #e5e7eb",
            boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
          }}
          onMouseEnter={(e) => { if (!menuOpen) (e.currentTarget as HTMLButtonElement).style.background = "#f9fafb"; }}
          onMouseLeave={(e) => { if (!menuOpen) (e.currentTarget as HTMLButtonElement).style.background = "#ffffff"; }}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${ACCENT}, #7c3aed)` }}
            suppressHydrationWarning
          >
            {initials ?? (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold truncate leading-tight" style={{ color: "#111827" }} suppressHydrationWarning>
              {displayName}
            </p>
            <p className="text-[10px] truncate leading-tight mt-0.5" style={{ color: "#9ca3af" }} suppressHydrationWarning>
              {displaySub}
            </p>
          </div>
          <svg
            width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
            className="flex-shrink-0 transition-transform duration-200"
            style={{ color: "#d1d5db", transform: menuOpen ? "rotate(180deg)" : "rotate(0deg)" }}
          >
            <path d="m18 15-6-6-6 6"/>
          </svg>
        </button>

        {/* Dropdown */}
        {menuOpen && (
          <div
            className="absolute left-3 right-3 rounded-xl overflow-hidden z-50"
            style={{
              bottom: "calc(100% - 6px)",
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              boxShadow: "0 -8px 32px rgba(0,0,0,0.1)",
            }}
          >
            {userProfile?.email && (
              <div className="px-4 py-2.5" style={{ borderBottom: "1px solid #f3f4f6" }}>
                <p className="text-[10px] truncate" style={{ color: "#9ca3af" }}>{userProfile.email}</p>
              </div>
            )}
            <button
              onClick={() => { setMenuOpen(false); onOpenAccount(); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium transition-all"
              style={{ color: "#374151", borderBottom: "1px solid #f3f4f6" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#f9fafb"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
              Mon compte
            </button>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium transition-all"
              style={{ color: "#ef4444" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#fef2f2"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Se déconnecter
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

function NavItem({
  item,
  isActive,
  badge,
  onNavigate,
}: {
  item: { section: NavSection; label: string; icon: React.ReactNode };
  isActive: boolean;
  badge?: number;
  onNavigate: (s: NavSection) => void;
}) {
  return (
    <button
      onClick={() => onNavigate(item.section)}
      className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 w-full text-left relative"
      style={{
        background: isActive ? ACCENT_BG : "transparent",
        color: isActive ? ACCENT : "#6b7280",
      }}
      onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "#f3f4f6"; }}
      onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
    >
      {isActive && (
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full"
          style={{ background: ACCENT }}
        />
      )}
      <span className="flex-shrink-0" style={{ color: isActive ? ACCENT : "#9ca3af" }}>
        {item.icon}
      </span>
      <span className="flex-1">{item.label}</span>
      {badge != null && badge > 0 && (
        <span
          className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none"
          style={{
            background: isActive ? ACCENT : ACCENT_MUTED,
            color: isActive ? "#fff" : ACCENT,
          }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

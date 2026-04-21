"use client";

import { useState } from "react";
import type { SourcedProfile } from "@/app/lib/types";
import AccountDropdown from "./AccountDropdown";

function ClawIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M8 3C6 3 4.5 4.5 4.5 7v6c0 1.5.8 2.5 2 2.5" stroke="var(--coral)" strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M6.5 15.5C7.5 18.5 9.5 20.5 12 20.5s4.5-2 5.5-5" stroke="var(--coral)" strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M16 3C18 3 19.5 4.5 19.5 7v6c0 1.5-.8 2.5-2 2.5" stroke="var(--coral)" strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M12 6v5" stroke="var(--coral)" strokeWidth="2.2" strokeLinecap="round"/>
    </svg>
  );
}

interface HeaderProps {
  sessionId: string;
  shortlistKeys: Set<string>;
  onRelaunchSearch: (query: string) => void;
  onOpenProfile: (profile: SourcedProfile) => void;
  shortlistCount: number;
  outreachCount: number;
}

export default function Header({
  sessionId,
  shortlistKeys,
  onRelaunchSearch,
  onOpenProfile,
  shortlistCount,
  outreachCount,
}: HeaderProps) {
  const [open, setOpen] = useState(false);
  const badgeCount = shortlistCount + outreachCount;

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6"
      style={{ height: 56, background: "var(--cream)", borderBottom: "2px solid var(--ink)" }}
    >
      <div className="flex items-center gap-2">
        <ClawIcon size={22} />
        <span
          className="text-lg font-bold tracking-tight"
          style={{ fontFamily: "var(--font-display, Georgia, serif)", color: "var(--ink)" }}
        >
          Claw<span style={{ color: "var(--coral)" }}>4HR</span>
        </span>
      </div>

      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-sm font-bold transition-all hover:bg-[var(--cream-mid)]"
          style={{ border: "1.5px solid var(--ink)", color: "var(--ink)" }}
        >
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
            style={{ background: "var(--ink)" }}
            suppressHydrationWarning
          >
            {sessionId.slice(0, 2).toUpperCase()}
          </div>
          <span>Mon compte</span>
          {badgeCount > 0 && (
            <span
              className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
              style={{ background: "var(--coral)", color: "#fff" }}
            >
              {badgeCount}
            </span>
          )}
        </button>

        {open && (
          <AccountDropdown
            sessionId={sessionId}
            shortlistKeys={shortlistKeys}
            onRelaunchSearch={onRelaunchSearch}
            onOpenProfile={onOpenProfile}
            onClose={() => setOpen(false)}
          />
        )}
      </div>
    </header>
  );
}

"use client";

interface TopBarProps {
  totalProfiles: number;
  cvCount: number;
  pipelineDone: boolean;
  mode: "demo" | "live";
  onSwitchMode: (mode: "demo" | "live") => void;
  onReset?: () => void;
}

export default function TopBar({ totalProfiles, cvCount, pipelineDone, mode, onSwitchMode, onReset }: TopBarProps) {
  return (
    <header className="relative flex items-center justify-between px-6 py-3 border-b border-white/[0.06] bg-[var(--bg-base)]">
      <div className="scan-line absolute inset-0 overflow-hidden pointer-events-none" />

      <div className="flex items-center gap-4">
        <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-[var(--accent-cyan)] to-[#0088aa] shadow-[0_0_20px_rgba(0,212,255,0.2)]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
            <path d="M11 8v6" />
            <path d="M8 11h6" />
          </svg>
        </div>
        <div>
          <h1 className="text-[15px] font-semibold tracking-tight text-[var(--text-primary)]">
            Passive Talent Intelligence
          </h1>
          <p className="text-[11px] text-[var(--text-muted)] tracking-wide uppercase">
            Agent IA de Recrutement
          </p>
        </div>
      </div>

      <div className="flex items-center gap-5">
        <StatusPill label="OpenClaw" status={cvCount > 0 ? "connected" : "pending"} />
        <StatusPill label="Indeed" status={cvCount > 0 ? "connected" : "pending"} />
        <StatusPill label="HrFlow" status="connected" />

        <div className="ml-2 h-8 w-px bg-white/[0.06]" />

        {/* Mode toggle */}
        <div className="flex items-center rounded-full border border-white/[0.08] bg-[var(--bg-card)] p-0.5">
          {(["demo", "live"] as const).map((m) => (
            <button
              key={m}
              onClick={() => onSwitchMode(m)}
              className={`text-[10px] font-medium px-3 py-1 rounded-full transition-all cursor-pointer ${
                mode === m
                  ? m === "live"
                    ? "bg-[var(--accent-emerald)] text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                    : "bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              }`}
            >
              {m === "demo" ? "Demo" : "Live"}
            </button>
          ))}
        </div>

        {/* Reset button */}
        <button
          onClick={onReset}
          className="text-[10px] font-medium px-3 py-1.5 rounded-full border border-white/[0.08] bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--accent-rose)] hover:border-[var(--accent-rose)]/30 transition-all cursor-pointer"
        >
          Reset
        </button>

        <div className="h-8 w-px bg-white/[0.06]" />

        {/* Live CV counter */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-500 ${
          pipelineDone
            ? "bg-[var(--accent-emerald-dim)] border-[var(--accent-emerald)]/20"
            : cvCount > 0
              ? "bg-[var(--accent-cyan-dim)] border-[var(--accent-cyan)]/20 animate-pulse-glow"
              : "bg-[var(--bg-card)] border-white/[0.06]"
        }`}>
          {!pipelineDone && cvCount > 0 && (
            <div className="w-2 h-2 rounded-full bg-[var(--accent-cyan)] animate-pulse-dot" />
          )}
          <span className={`text-[11px] font-mono font-medium transition-colors ${
            pipelineDone ? "text-[var(--accent-emerald)]" : cvCount > 0 ? "text-[var(--accent-cyan)]" : "text-[var(--text-muted)]"
          }`}>
            {cvCount > 0 ? `${cvCount} CVs traites` : "En attente..."}
          </span>
        </div>

        {totalProfiles > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06]">
            <span className="text-[11px] font-mono text-[var(--text-muted)]">
              {totalProfiles.toLocaleString("fr-FR")} profils
            </span>
          </div>
        )}
      </div>
    </header>
  );
}

function StatusPill({ label, status }: { label: string; status: "connected" | "active" | "pending" | "error" }) {
  const dotColor =
    status === "connected" ? "bg-[var(--accent-emerald)]"
    : status === "active" ? "bg-[var(--accent-cyan)]"
    : status === "pending" ? "bg-[var(--accent-amber)]"
    : "bg-[var(--accent-rose)]";

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div className={`w-2 h-2 rounded-full ${dotColor}`} />
        {status === "connected" && (
          <div className={`absolute inset-0 w-2 h-2 rounded-full ${dotColor} animate-pulse-dot`} />
        )}
      </div>
      <span className="text-[11px] font-medium text-[var(--text-secondary)]">{label}</span>
    </div>
  );
}

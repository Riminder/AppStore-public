"use client";

import { useEffect, useState } from "react";

export type AgentSource = "github" | "linkedin" | "reddit" | "internet";
export type AgentState = "idle" | "running" | "done" | "error";

interface PixelAgentProps {
  source: AgentSource;
  state: AgentState;
}

const SOURCE_CONFIG: Record<AgentSource, { label: string; color: string; messages: string[] }> = {
  github: {
    label: "GitHub",
    color: "#1a1a2e",
    messages: [
      "> Connexion...",
      "> Scan des repos...",
      "> Lecture des commits...",
      "> Analyse des contributions...",
      "> Extraction des skills...",
    ],
  },
  linkedin: {
    label: "LinkedIn",
    color: "#0077b5",
    messages: [
      "> Connexion...",
      "> Scan des profils...",
      "> Extraction expériences...",
      "> Analyse des skills...",
      "> Vérification formations...",
    ],
  },
  reddit: {
    label: "Reddit",
    color: "#ff4500",
    messages: [
      "> Connexion subreddit...",
      "> Parsing des posts...",
      "> Identification auteurs...",
      "> Analyse technique...",
      "> Score calculé...",
    ],
  },
  internet: {
    label: "Internet",
    color: "#6b7280",
    messages: [
      "> Crawling web...",
      "> Indexation résultats...",
      "> Détection profils...",
      "> Analyse contenu...",
      "> Consolidation...",
    ],
  },
};

/** Pixel art character rendered as a grid of colored divs (4×7 grid, 4px pixels) */
export function PixelSprite({ color, frame }: { color: string; frame: number }) {
  // 0 = transparent, 1 = ink (#1a1a2e), 2 = accent (source color)
  const FRAME_A = [
    [0, 1, 1, 0],
    [1, 1, 1, 1],
    [0, 2, 2, 0],
    [1, 2, 2, 1],
    [0, 1, 1, 0],
    [1, 0, 0, 1],
    [1, 0, 0, 1],
  ];
  const FRAME_B = [
    [0, 1, 1, 0],
    [1, 1, 1, 1],
    [0, 2, 2, 0],
    [1, 2, 2, 1],
    [0, 1, 1, 0],
    [0, 1, 0, 0],
    [1, 0, 1, 0],
  ];
  const FRAME_C = [
    [0, 1, 1, 0],
    [1, 1, 1, 1],
    [0, 2, 2, 0],
    [1, 2, 2, 1],
    [0, 1, 1, 0],
    [0, 0, 1, 1],
    [0, 0, 1, 1],
  ];
  const frames = [FRAME_A, FRAME_B, FRAME_C];
  const currentFrame = frames[frame % frames.length];
  const PS = 4; // pixel size in px

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(4, ${PS}px)`,
        gap: 0,
        imageRendering: "pixelated",
      }}
    >
      {currentFrame.flatMap((row, r) =>
        row.map((cell, c) => (
          <div
            key={`${r}-${c}`}
            style={{
              width: PS,
              height: PS,
              backgroundColor:
                cell === 0 ? "transparent"
                : cell === 1 ? "#1a1a2e"
                : color,
            }}
          />
        )),
      )}
    </div>
  );
}

export { SOURCE_CONFIG };

export default function PixelAgent({ source, state }: PixelAgentProps) {
  const config = SOURCE_CONFIG[source];
  const [msgIndex, setMsgIndex] = useState(0);
  const [walkFrame, setWalkFrame] = useState(0);

  // Cycle terminal messages every 1.5s when running
  useEffect(() => {
    if (state !== "running") return;
    const t = setInterval(() => {
      setMsgIndex((i) => (i + 1) % config.messages.length);
    }, 1500);
    return () => clearInterval(t);
  }, [state, source, config.messages.length]);

  // Walk animation: cycle through 3 frames every 150ms (smooth movement)
  useEffect(() => {
    if (state !== "running") return;
    const t = setInterval(() => setWalkFrame((f) => (f + 1) % 3), 150);
    return () => clearInterval(t);
  }, [state, source]);

  const terminalText =
    state === "done" ? "> Terminé ✓"
    : state === "error" ? "> Erreur ✗"
    : state === "idle" ? "> En attente..."
    : config.messages[msgIndex];

  const terminalColor =
    state === "done" ? "var(--coral)"
    : state === "error" ? "#f43f5e"
    : "rgba(26,26,46,0.6)";

  return (
    <div className="flex flex-col items-center gap-2" style={{ width: 96 }}>
      {/* Agent sprite */}
      <div
        className={state === "running" ? "animate-pixel-bounce" : ""}
        style={{ opacity: state === "error" ? 0.4 : 1 }}
      >
        <PixelSprite color={config.color} frame={state === "running" ? walkFrame : 0} />
      </div>

      {/* Source label */}
      <span
        className="font-mono font-bold text-[10px] uppercase tracking-widest"
        style={{ color: config.color }}
      >
        {config.label}
      </span>

      {/* Terminal text */}
      <span
        className="font-mono text-[9px] text-center leading-tight"
        style={{ color: terminalColor, minHeight: 24 }}
      >
        {terminalText}
      </span>

      {/* Done checkmark */}
      {state === "done" && (
        <div
          className="w-4 h-4 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "var(--coral)" }}
        >
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      )}
    </div>
  );
}

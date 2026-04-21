"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage, SourcedProfile } from "@/app/lib/types";

interface QAPanelProps {
  profile: SourcedProfile;
  messages: ChatMessage[];
  asking: boolean;
  onSend: (question: string) => void;
}

export default function QAPanel({ profile, messages, asking, onSend }: QAPanelProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, asking]);

  function handleSend() {
    const text = input.trim();
    if (!text || asking) return;
    setInput("");
    onSend(text);
  }

  return (
    <div
      className="flex flex-col h-full rounded-2xl overflow-hidden"
      style={{ border: "1.5px solid rgba(26,26,46,0.1)", background: "#fff" }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{ borderBottom: "1px solid rgba(26,26,46,0.06)", background: "var(--cream-mid)" }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs"
          style={{ background: "var(--coral)" }}
        >
          IA
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: "var(--ink)" }}>Assistant IA</p>
          <p className="text-[10px] font-mono" style={{ color: "var(--coral)" }}>
            {profile.name}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3" style={{ background: "var(--cream)" }}>
        {messages.length === 0 && (
          <p className="text-xs text-center py-8 font-mono" style={{ color: "var(--muted-text)" }}>
            Posez une question sur le profil de {profile.name.split(" ")[0]}.
          </p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className="max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
              style={{
                background: msg.type === "user" ? "var(--ink)" : "#fff",
                color: msg.type === "user" ? "var(--cream)" : "var(--ink)",
                border: msg.type === "agent" ? "1px solid rgba(26,26,46,0.08)" : "none",
                borderRadius: msg.type === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
              }}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {asking && (
          <div className="flex justify-start">
            <div
              className="px-4 py-2.5 rounded-2xl text-sm"
              style={{ background: "#fff", border: "1px solid rgba(26,26,46,0.08)" }}
            >
              <div className="flex gap-1">
                <span className="typing-dot w-1.5 h-1.5 rounded-full" style={{ background: "var(--coral)" }} />
                <span className="typing-dot w-1.5 h-1.5 rounded-full" style={{ background: "var(--coral)" }} />
                <span className="typing-dot w-1.5 h-1.5 rounded-full" style={{ background: "var(--coral)" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div
        className="flex items-center gap-2 px-3 py-3"
        style={{ borderTop: "1px solid rgba(26,26,46,0.06)", background: "#fff" }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ex: Parle-moi de son expérience en NLP..."
          className="flex-1 text-sm px-3 py-2 rounded-xl outline-none"
          style={{
            background: "var(--cream)",
            border: "1px solid rgba(26,26,46,0.1)",
            color: "var(--ink)",
          }}
          disabled={asking}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || asking}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-40"
          style={{ background: "var(--coral)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <path d="m22 2-7 20-4-9-9-4z" /><path d="M22 2 11 13" />
          </svg>
        </button>
      </div>
    </div>
  );
}

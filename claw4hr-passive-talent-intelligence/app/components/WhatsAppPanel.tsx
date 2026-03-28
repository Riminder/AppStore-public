"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/app/lib/types";

interface WhatsAppPanelProps {
  messages: ChatMessage[];
  onSend: (question: string) => void;
  asking: boolean;
  selectedProfileName: string | null;
}

export default function WhatsAppPanel({ messages, onSend, asking, selectedProfileName }: WhatsAppPanelProps) {
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, asking]);

  function handleSend() {
    const text = inputValue.trim();
    if (!text || asking) return;
    setInputValue("");
    onSend(text);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06] bg-[var(--bg-surface)]">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--whatsapp-green)]/20">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--whatsapp-green)">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
            <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a8 8 0 01-4.243-1.214l-.252-.149-2.868.852.852-2.868-.149-.252A8 8 0 1112 20z" />
          </svg>
        </div>
        <div>
          <p className="text-[13px] font-semibold text-[var(--text-primary)]">Assistant Recrutement</p>
          {selectedProfileName ? (
            <p className="text-[10px] text-[var(--accent-cyan)]">Profil : {selectedProfileName}</p>
          ) : (
            <p className="text-[10px] text-[var(--text-muted)]">Selectionnez un profil pour poser des questions</p>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-4 space-y-3 bg-[var(--bg-deep)]"
        style={{ backgroundImage: "radial-gradient(circle at 50% 50%, rgba(0,212,255,0.02) 0%, transparent 70%)" }}
      >
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-[12px] text-[var(--text-muted)] text-center px-6">
              Selectionnez un candidat dans le panneau de droite, puis posez une question ici.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {asking && (
          <div className="flex gap-1 px-4 py-3 rounded-xl rounded-bl-sm bg-[var(--bg-card)] w-fit max-w-[85%]">
            <span className="typing-dot w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]" />
            <span className="typing-dot w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]" />
            <span className="typing-dot w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]" />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="flex items-center gap-2 px-3 py-3 border-t border-white/[0.06] bg-[var(--bg-surface)]">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder={
            selectedProfileName
              ? `Question sur ${selectedProfileName}...`
              : "Selectionnez d'abord un profil..."
          }
          disabled={!selectedProfileName || asking}
          className="flex-1 px-4 py-2.5 rounded-full bg-[var(--bg-card)] border border-white/[0.06] text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-cyan)]/30 transition-colors disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={!selectedProfileName || asking || !inputValue.trim()}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--accent-cyan)] hover:bg-[var(--accent-cyan)]/80 transition-colors shadow-[0_0_15px_rgba(0,212,255,0.3)] disabled:opacity-40 disabled:shadow-none"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m22 2-7 20-4-9-9-4z" />
            <path d="M22 2 11 13" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.type === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} animate-fade-in-up`}>
      <div
        className={`max-w-[85%] px-3.5 py-2.5 rounded-xl ${
          isUser
            ? "rounded-br-sm bg-[var(--whatsapp-bubble)] text-[var(--text-primary)]"
            : "rounded-bl-sm bg-[var(--bg-card)] text-[var(--text-primary)]"
        }`}
      >
        <p className="text-[13px] leading-relaxed whitespace-pre-line">{message.text}</p>
        <p className={`text-[10px] mt-1 text-right ${isUser ? "text-white/40" : "text-[var(--text-muted)]"}`}>
          {message.time}
        </p>
      </div>
    </div>
  );
}

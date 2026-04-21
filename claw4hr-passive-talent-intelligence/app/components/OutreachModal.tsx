"use client";

import { useEffect, useRef, useState } from "react";
import type { SourcedProfile } from "@/app/lib/types";

interface OutreachModalProps {
  profile: SourcedProfile;
  sessionId: string;
  onClose: () => void;
}

export default function OutreachModal({ profile, sessionId, onClose }: OutreachModalProps) {
  const [message, setMessage] = useState("");
  const [streaming, setStreaming] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function generate() {
      try {
        const res = await fetch("/api/outreach/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile, session_id: sessionId }),
        });

        if (!res.ok || !res.body) {
          setMessage("Erreur lors de la génération. Veuillez réessayer.");
          setStreaming(false);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          accumulated += chunk;
          setMessage(accumulated);
        }
      } catch {
        setMessage("Erreur de connexion. Veuillez réessayer.");
      } finally {
        setStreaming(false);
      }
    }
    generate();
  }, [profile, sessionId]);

  function handleCopy() {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(10,14,26,0.6)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: "#fff", border: "2px solid var(--ink)", boxShadow: "8px 8px 0 0 var(--ink)" }}
      >
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ borderBottom: "2px solid var(--ink)", background: "var(--cream)" }}
        >
          <div>
            <h2 className="font-bold text-base" style={{ color: "var(--ink)" }}>
              ✉ Message d&apos;approche
            </h2>
            <p className="text-xs font-mono mt-0.5" style={{ color: "var(--muted-text)" }}>
              Pour {profile.name} · {profile.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors font-bold text-lg"
            style={{ color: "var(--ink)" }}
          >
            ×
          </button>
        </div>

        <div className="p-6">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={8}
            className="w-full text-sm leading-relaxed outline-none resize-none p-3 rounded-lg"
            style={{
              background: "var(--cream)",
              border: "1.5px solid #e5e7eb",
              color: "var(--ink)",
              fontFamily: "Georgia, serif",
            }}
            placeholder={streaming ? "Génération en cours..." : ""}
          />
          {streaming && (
            <p className="text-xs font-mono mt-1" style={{ color: "var(--coral)" }}>
              ● Génération en cours...
            </p>
          )}
        </div>

        <div className="px-6 pb-5 flex gap-3">
          <button
            onClick={handleCopy}
            disabled={streaming || !message}
            className="flex-1 py-2.5 font-mono font-bold text-sm uppercase tracking-wider rounded-lg transition-all disabled:opacity-40"
            style={{
              background: copied ? "var(--success)" : "var(--coral)",
              color: "#fff",
              boxShadow: copied ? "3px 3px 0 0 #059669" : "3px 3px 0 0 var(--coral-deep)",
            }}
          >
            {copied ? "✓ Copié !" : "Copier"}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 font-mono font-bold text-sm rounded-lg transition-all"
            style={{ border: "1.5px solid var(--ink)", color: "var(--ink)", background: "transparent" }}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

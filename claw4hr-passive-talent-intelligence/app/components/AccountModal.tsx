"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

interface AccountModalProps {
  userProfile: { name: string; company: string; email: string } | null;
  onClose: () => void;
  onProfileUpdated: (profile: { name: string; company: string; email: string }) => void;
}

export default function AccountModal({ userProfile, onClose, onProfileUpdated }: AccountModalProps) {
  const router = useRouter();
  const [name, setName] = useState(userProfile?.name ?? "");
  const [company, setCompany] = useState(userProfile?.company ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initials = name.trim()
    ? name.trim().split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : null;

  async function handleSave() {
    setSaving(true);
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Session expirée"); setSaving(false); return; }

    const { error: upsertError } = await supabase
      .from("user_profiles")
      .upsert({ id: user.id, name: name.trim(), company: company.trim() });

    if (upsertError) {
      setError("Erreur lors de la sauvegarde");
    } else {
      setSaved(true);
      onProfileUpdated({ name: name.trim(), company: company.trim(), email: userProfile?.email ?? "" });
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-sm mx-4 rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          boxShadow: "0 24px 60px rgba(0,0,0,0.15)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5 flex-shrink-0"
          style={{ borderBottom: "1px solid #f3f4f6" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}
            >
              {initials ?? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                </svg>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "#111827" }}>{name || "Mon compte"}</p>
              <p className="text-[11px]" style={{ color: "#9ca3af" }}>{userProfile?.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg transition-all"
            style={{ color: "#9ca3af" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#f3f4f6"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-5 flex flex-col gap-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: "#9ca3af" }}>
              Nom complet
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jean Dupont"
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all"
              style={{
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                color: "#111827",
              }}
              onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "#4f46e5"; (e.target as HTMLInputElement).style.background = "#fff"; }}
              onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "#e5e7eb"; (e.target as HTMLInputElement).style.background = "#f9fafb"; }}
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: "#9ca3af" }}>
              Entreprise
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Acme Corp"
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all"
              style={{
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                color: "#111827",
              }}
              onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "#4f46e5"; (e.target as HTMLInputElement).style.background = "#fff"; }}
              onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "#e5e7eb"; (e.target as HTMLInputElement).style.background = "#f9fafb"; }}
            />
          </div>

          {error && (
            <p className="text-xs" style={{ color: "#ef4444" }}>{error}</p>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: saved ? "#10b981" : "#4f46e5",
              color: "#ffffff",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "Sauvegarde…" : saved ? "✓ Sauvegardé" : "Sauvegarder"}
          </button>
        </div>

        {/* Sign out */}
        <div
          className="px-6 py-4 flex-shrink-0"
          style={{ borderTop: "1px solid #f3f4f6" }}
        >
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all"
            style={{ color: "#9ca3af" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "#fef2f2";
              (e.currentTarget as HTMLButtonElement).style.color = "#ef4444";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              (e.currentTarget as HTMLButtonElement).style.color = "#9ca3af";
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import GlobeEarth from "@/components/ui/globe-earth";

type Mode = "login" | "signup";

function ClawMark() {
  return <span style={{ fontSize: 24, lineHeight: 1 }}>🦞</span>;
}

function GlassInput({
  label, type = "text", value, onChange, placeholder, hint,
}: {
  label: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string; hint?: string;
}) {
  const [showPwd, setShowPwd] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPwd ? "text" : "password") : type;

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.5)" }}>
        {label}
      </label>
      <div className="relative">
        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 rounded-2xl text-sm outline-none transition-all"
          style={{
            background: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "#fff",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            paddingRight: isPassword ? "2.75rem" : undefined,
          }}
          onFocus={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.18)";
            e.currentTarget.style.borderColor = "rgba(255,107,107,0.7)";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(255,107,107,0.12)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.12)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPwd((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity"
            style={{ color: "rgba(255,255,255,0.35)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
          >
            {showPwd ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>
        )}
      </div>
      {hint && <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>{hint}</p>}
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [success, setSuccess] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.toLowerCase().includes("email not confirmed")) {
        setError("Confirmez votre email avant de vous connecter.");
      } else {
        setError("Email ou mot de passe incorrect.");
      }
    } else {
      router.replace("/dashboard");
    }
    setLoading(false);
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    // 1. Validate invite token
    let valid = false;
    try {
      const res = await fetch("/api/auth/validate-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      ({ valid } = await res.json());
    } catch {
      setError("Erreur réseau lors de la validation du token.");
      setLoading(false);
      return;
    }
    if (!valid) { setError("Token d'accès invalide ou déjà utilisé."); setLoading(false); return; }

    // 2. Create Supabase account
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) { setError(signUpError.message); setLoading(false); return; }

    // 3. Insert profile (best-effort)
    if (data.user) {
      await supabase.from("user_profiles").upsert({ id: data.user.id, name, company });
    }

    // 4. If session exists → go straight to dashboard (email confirmation disabled)
    //    Otherwise → show "check your email" message
    if (data.session) {
      router.replace("/dashboard");
    } else {
      setSuccess("Compte créé ! Vérifiez votre boîte email pour confirmer votre adresse.");
    }
    setLoading(false);
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">

      {/* ── Fond spatial ─────────────────────────────────── */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 50%, #0d1a35 0%, #060d1f 60%, #020610 100%)" }} />

      {/* Étoiles */}
      {[
        { top: "8%",  left: "12%", s: 2,   d: "0s"   },
        { top: "15%", left: "75%", s: 1.5, d: "1.2s" },
        { top: "25%", left: "30%", s: 1,   d: "0.5s" },
        { top: "60%", left: "88%", s: 2,   d: "2s"   },
        { top: "72%", left: "5%",  s: 1.5, d: "0.8s" },
        { top: "85%", left: "55%", s: 1,   d: "1.7s" },
        { top: "40%", left: "92%", s: 2,   d: "0.3s" },
        { top: "5%",  left: "48%", s: 1,   d: "2.4s" },
        { top: "90%", left: "22%", s: 1.5, d: "1s"   },
        { top: "50%", left: "18%", s: 1,   d: "3s"   },
        { top: "33%", left: "62%", s: 2,   d: "1.5s" },
        { top: "78%", left: "40%", s: 1,   d: "0.7s" },
      ].map((st, i) => (
        <div key={i} className="absolute rounded-full" style={{
          top: st.top, left: st.left, width: st.s, height: st.s,
          background: "#fff", animation: `twinkling ${2 + i * 0.3}s infinite`, animationDelay: st.d,
        }} />
      ))}

      {/* Globe */}
      <div className="absolute" style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
        <GlobeEarth size={680} />
      </div>

      {/* Overlay bords */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(6,13,31,0.55) 100%)" }} />

      {/* Retour */}
      <button
        onClick={() => router.push("/")}
        className="absolute top-6 left-6 flex items-center gap-1.5 text-xs font-medium transition-all z-20"
        style={{ color: "rgba(255,255,255,0.4)" }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#fff")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.4)")}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
        Retour
      </button>

      {/* Logo top right */}
      <div className="absolute top-6 right-6 flex items-center gap-2 z-20">
        <ClawMark />
        <span className="text-sm font-bold tracking-tight text-white">
          Claw<span style={{ color: "#FF6B6B" }}>4HR</span>
        </span>
      </div>

      {/* ── Liquid glass card ────────────────────────────── */}
      <div
        className="relative z-10 w-full mx-4 flex flex-col gap-6"
        style={{
          maxWidth: 420,
          background: "linear-gradient(135deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.06) 100%)",
          backdropFilter: "blur(48px) saturate(160%)",
          WebkitBackdropFilter: "blur(48px) saturate(160%)",
          border: "1px solid rgba(255,255,255,0.18)",
          borderRadius: 28,
          padding: "40px 40px",
          boxShadow: [
            "0 0 0 1px rgba(255,255,255,0.06) inset",
            "0 1px 0 rgba(255,255,255,0.3) inset",
            "0 32px 80px rgba(0,0,0,0.45)",
            "0 2px 4px rgba(0,0,0,0.3)",
          ].join(", "),
        }}
      >
        {/* Reflet haut */}
        <div className="absolute top-0 left-6 right-6 h-px rounded-full" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)" }} />

        {/* Header */}
        <div>
          <h1 className="text-xl font-bold mb-1 text-white">
            {mode === "login" ? "Welcome back!" : "Créer un compte"}
          </h1>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
            {mode === "login"
              ? "Connectez-vous pour accéder à votre espace."
              : "Accès restreint — un token est requis."}
          </p>
        </div>

        {/* Toggle */}
        <div className="flex rounded-2xl p-1" style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {(["login", "signup"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(""); }}
              className="flex-1 py-2 text-xs font-semibold rounded-xl transition-all"
              style={{
                background: mode === m ? "rgba(255,255,255,0.15)" : "transparent",
                color: mode === m ? "#fff" : "rgba(255,255,255,0.35)",
                backdropFilter: mode === m ? "blur(8px)" : "none",
                boxShadow: mode === m ? "0 1px 0 rgba(255,255,255,0.2) inset, 0 2px 8px rgba(0,0,0,0.2)" : "none",
              }}
            >
              {m === "login" ? "Se connecter" : "Créer un compte"}
            </button>
          ))}
        </div>

        {/* Forms */}
        {mode === "login" ? (
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <GlassInput label="Email" type="email" value={email} onChange={setEmail} placeholder="vous@entreprise.com" />
            <GlassInput label="Mot de passe" type="password" value={password} onChange={setPassword} placeholder="••••••••" />
            {error && (
              <p className="text-xs px-4 py-3 rounded-2xl" style={{ background: "rgba(239,68,68,0.15)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.25)" }}>
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full py-3.5 rounded-2xl font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, #FF6B6B, #e85555)",
                color: "#fff",
                boxShadow: "0 4px 20px rgba(255,107,107,0.35), 0 1px 0 rgba(255,255,255,0.2) inset",
              }}
            >
              {loading ? "Connexion…" : "Se connecter →"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            <GlassInput label="Token d'accès" value={token} onChange={setToken} placeholder="akaten-xxxx" hint="Demandez votre token à l'équipe Claw4HR" />
            <div className="grid grid-cols-2 gap-3">
              <GlassInput label="Nom complet" value={name} onChange={setName} placeholder="Jean Dupont" />
              <GlassInput label="Entreprise" value={company} onChange={setCompany} placeholder="Acme Corp" />
            </div>
            <GlassInput label="Email professionnel" type="email" value={email} onChange={setEmail} placeholder="vous@entreprise.com" />
            <GlassInput label="Mot de passe" type="password" value={password} onChange={setPassword} placeholder="8 caractères minimum" />
            {error && (
              <p className="text-xs px-4 py-3 rounded-2xl" style={{ background: "rgba(239,68,68,0.15)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.25)" }}>
                {error}
              </p>
            )}
            {success && (
              <p className="text-xs px-4 py-3 rounded-2xl" style={{ background: "rgba(34,197,94,0.15)", color: "#86efac", border: "1px solid rgba(34,197,94,0.25)" }}>
                {success}
              </p>
            )}
            <button
              type="submit"
              disabled={loading || !token || !name || !company || !email || !password || !!success}
              className="w-full py-3.5 rounded-2xl font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, #FF6B6B, #e85555)",
                color: "#fff",
                boxShadow: "0 4px 20px rgba(255,107,107,0.35), 0 1px 0 rgba(255,255,255,0.2) inset",
              }}
            >
              {loading ? "Création…" : "Créer mon compte →"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

"use client"

import { useEffect, useRef, useState, useCallback, type ReactNode } from "react"
import { DitheringShader } from "@/components/ui/dithering-shader"
import dynamic from "next/dynamic"
const GlobeCanvas = dynamic(() => import("@/components/ui/globe"), { ssr: false })

/* ═══════════════════════════════════════════════════
   DESIGN SYSTEM — Elevated Pixel Editorial v2

   - Coral as accent, not flood
   - Deep navy (#0B1226) as strong contrast sections
   - Generous whitespace, rounded cards, pixel CTAs
   - Animated counters, avatars, rich visuals
   - Full-width feature visuals
   ═══════════════════════════════════════════════════ */

const CORAL = "#FF6B6B"
const CORAL_DARK = "#E85555"
const CORAL_DEEP = "#CC4444"
const CORAL_GLOW = "#FF6B6B25"
const CREAM = "#FFF5F0"
const CREAM_MID = "#F5EDE6"
const INK = "#1a1a2e"
const NAVY = "#0B1226"
const MUTED = "#6b7280"
const WHITE = "#FFFFFF"
const SUCCESS = "#10b981"

const serif = "var(--font-display), 'Georgia', serif"

/* ═══════════════════════════════════════════
   Animated Counter
   ═══════════════════════════════════════════ */

function AnimatedNumber({ value, suffix = "", prefix = "" }: { value: number; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [display, setDisplay] = useState(0)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !started) {
          setStarted(true)
          obs.unobserve(el)
        }
      },
      { threshold: 0.3 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [started])

  useEffect(() => {
    if (!started) return
    const duration = 1200
    const steps = 40
    const increment = value / steps
    let current = 0
    let step = 0
    const interval = setInterval(() => {
      step++
      const progress = step / steps
      const eased = 1 - Math.pow(1 - progress, 3)
      current = Math.round(value * eased)
      setDisplay(current)
      if (step >= steps) {
        setDisplay(value)
        clearInterval(interval)
      }
    }, duration / steps)
    return () => clearInterval(interval)
  }, [started, value])

  return (
    <span ref={ref}>
      {prefix}{display}{suffix}
    </span>
  )
}

/* ═══════════════════════════════════════════
   Pixel Button — sharp identity on CTAs only
   ═══════════════════════════════════════════ */

function PixelBtn({
  href,
  children,
  variant = "coral",
  className = "",
  size = "md",
}: {
  href: string
  children: ReactNode
  variant?: "coral" | "dark" | "white" | "outline"
  className?: string
  size?: "sm" | "md" | "lg"
}) {
  const sizes = {
    sm: "px-5 py-2.5 text-xs",
    md: "px-8 py-4 text-sm",
    lg: "px-10 py-5 text-base",
  }

  const bg =
    variant === "coral" ? CORAL
    : variant === "dark" ? INK
    : variant === "outline" ? "transparent"
    : WHITE

  const fg =
    variant === "white" ? INK
    : variant === "outline" ? INK
    : CREAM

  const shadow =
    variant === "coral" ? CORAL_DEEP
    : variant === "outline" ? `${INK}20`
    : variant === "dark" ? "#000"
    : `${INK}15`

  return (
    <a
      href={href}
      className={`inline-block font-mono font-bold uppercase tracking-wider transition-all duration-100 select-none cursor-pointer active:shadow-none active:translate-x-[4px] active:translate-y-[4px] ${sizes[size]} ${className}`}
      style={{
        backgroundColor: bg,
        color: fg,
        boxShadow: `4px 4px 0 0 ${shadow}`,
        border: variant === "outline" ? `2px solid ${INK}` : "none",
      }}
    >
      {children}
    </a>
  )
}

/* ═══════════════════════════════════════════
   Scroll Reveal
   ═══════════════════════════════════════════ */

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [vis, setVis] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let t: ReturnType<typeof setTimeout>
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          if (delay) t = setTimeout(() => setVis(true), delay)
          else setVis(true)
          obs.unobserve(el)
        }
      },
      { threshold: 0.08 }
    )
    obs.observe(el)
    return () => {
      obs.disconnect()
      clearTimeout(t)
    }
  }, [delay])

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        vis ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${className}`}
    >
      {children}
    </div>
  )
}

/* ═══════════════════════════════════════════
   Grain Overlay
   ═══════════════════════════════════════════ */

function Grain() {
  return (
    <div
      className="fixed inset-0 z-[100] pointer-events-none"
      style={{
        opacity: 0.03,
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
      }}
    />
  )
}

/* ═══════════════════════════════════════════
   Avatar placeholder
   ═══════════════════════════════════════════ */

function Avatar({ name, size = 40, bg = CORAL }: { name: string; size?: number; bg?: string }) {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2)
  return (
    <div
      className="flex items-center justify-center font-mono font-bold text-white flex-shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: bg,
        borderRadius: "50%",
        fontSize: size * 0.35,
      }}
    >
      {initials}
    </div>
  )
}

const GH_PATH = "M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"
const LI_PATH = "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"

function SourceLogo({ svgPath, svgViewBox, text, bg }: { svgPath?: string; svgViewBox?: string; text?: string; bg: string }) {
  return (
    <div className="w-10 h-10 flex items-center justify-center flex-shrink-0" style={{ backgroundColor: bg, borderRadius: "10px" }}>
      {svgPath ? (
        <svg width="20" height="20" viewBox={svgViewBox} fill="white">
          <path d={svgPath} />
        </svg>
      ) : (
        <span className="font-mono font-bold text-sm" style={{ color: WHITE }}>{text}</span>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════
   Navigation
   ═══════════════════════════════════════════ */

function Nav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 50)
    window.addEventListener("scroll", h, { passive: true })
    return () => window.removeEventListener("scroll", h)
  }, [])

  return (
    <nav className="fixed top-0 inset-x-0 z-50">
      <div
        className="mx-auto max-w-7xl flex items-center justify-between px-8 py-5 transition-all duration-300"
        style={{
          backgroundColor: scrolled ? `${WHITE}ee` : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? `1px solid ${INK}08` : "1px solid transparent",
        }}
      >
        <a href="/landing" className="font-mono font-bold text-2xl tracking-tight" style={{ color: CORAL }}>
          Claw4HR
        </a>
        <div
          className="hidden md:flex items-center gap-10 text-sm font-mono uppercase tracking-widest"
          style={{ color: MUTED, fontSize: "11px" }}
        >
          <a href="#features" className="hover:text-[#1a1a2e] transition-colors">Fonctionnalités</a>
          <a href="#demo" className="hover:text-[#1a1a2e] transition-colors">Démo</a>
          <a href="/pricing" className="hover:text-[#1a1a2e] transition-colors">Tarifs</a>
        </div>
        <div className="flex items-center gap-3">
          <PixelBtn href="/login" variant="coral" size="sm">Se connecter &rarr;</PixelBtn>
        </div>
      </div>
    </nav>
  )
}

/* ═══════════════════════════════════════════
   Hero
   ═══════════════════════════════════════════ */

function SearchResultsVisual() {
  const results = [
    { initials: "SM", name: "Sophie Martin", title: "ML Engineer · Paris · GitHub 847★", score: 94, bg: CORAL },
    { initials: "AL", name: "Alex Leroy", title: "Data Scientist · Lyon · LinkedIn ✓", score: 87, bg: "#7C3AED" },
    { initials: "MK", name: "Marie K.", title: "Backend Dev · Paris · Indeed", score: 81, bg: "#0A66C2" },
  ]

  return (
    <div
      className="w-full overflow-hidden"
      style={{ borderRadius: "16px", backgroundColor: NAVY, border: `1px solid ${WHITE}10`, boxShadow: `0 40px 80px -20px ${INK}40` }}
    >
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-5 py-3.5" style={{ borderBottom: `1px solid ${WHITE}08` }}>
        <div className="flex gap-2">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#ff5f57" }} />
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#febc2e" }} />
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#28c840" }} />
        </div>
        <div className="ml-4 flex-1 h-7 flex items-center px-4 font-mono text-xs" style={{ backgroundColor: `${WHITE}06`, color: `${WHITE}35`, borderRadius: "6px" }}>
          app.claw4hr.ai/dashboard
        </div>
      </div>
      {/* Search bar */}
      <div className="px-6 pt-5 pb-3 flex items-center gap-3" style={{ borderBottom: `1px solid ${WHITE}06` }}>
        <div
          className="flex-1 flex items-center gap-3 px-4 py-3 font-mono text-sm"
          style={{ backgroundColor: `${WHITE}06`, borderRadius: "10px", border: `1px solid ${WHITE}10`, color: `${WHITE}50` }}
        >
          <span style={{ color: CORAL, fontSize: "16px" }}>→</span>
          « Développeur Python senior à Paris, exp. ML »
        </div>
      </div>
      {/* Results */}
      <div className="px-6 py-4 flex flex-col gap-3">
        {results.map((r, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-4 py-3 transition-all"
            style={{
              backgroundColor: i === 0 ? `${WHITE}08` : `${WHITE}04`,
              borderRadius: "10px",
              border: `1px solid ${i === 0 ? `${SUCCESS}25` : `${WHITE}06`}`,
              opacity: i === 2 ? 0.6 : 1,
            }}
          >
            <div
              className="flex items-center justify-center font-mono font-bold text-xs text-white flex-shrink-0"
              style={{ width: 36, height: 36, backgroundColor: r.bg, borderRadius: "50%" }}
            >
              {r.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm" style={{ color: WHITE }}>{r.name}</div>
              <div className="text-xs mt-0.5" style={{ color: `${WHITE}45` }}>{r.title}</div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="font-mono font-bold text-lg" style={{ color: CORAL }}>{r.score}%</div>
              <div className="font-mono text-[9px] uppercase tracking-wider" style={{ color: i === 0 ? SUCCESS : `${WHITE}30` }}>
                {i === 0 ? "MATCH" : "match"}
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Footer */}
      <div
        className="px-6 py-3 flex items-center justify-between font-mono text-xs"
        style={{ borderTop: `1px solid ${WHITE}06`, color: `${WHITE}30` }}
      >
        <span>12 profils trouvés</span>
        <span style={{ color: SUCCESS }}>⚡ 3.2s</span>
      </div>
    </div>
  )
}

function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden" style={{ backgroundColor: WHITE }}>
      <div className="absolute inset-0 opacity-20">
        <DitheringShader
          shape="wave"
          type="8x8"
          colorBack="#FFFFFF"
          colorFront="#FF6B6B"
          width={1920}
          height={1080}
          pxSize={3}
          speed={0.3}
          style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }}
        />
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-48" style={{ background: `linear-gradient(to top, ${WHITE}, transparent)` }} />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-8 pt-32 pb-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2.5 px-5 py-2.5 mb-10 font-mono text-xs uppercase tracking-[0.15em] animate-fade-in-up"
            style={{
              animationDelay: "0.15s", animationFillMode: "both",
              backgroundColor: `${CORAL}10`, border: `1.5px solid ${CORAL}30`, color: CORAL,
              borderRadius: "100px",
            }}
          >
            <span className="w-2 h-2 animate-pulse-dot" style={{ backgroundColor: CORAL, borderRadius: "50%" }} />
            Hackathon HrFlow.ai 2026
          </div>

          {/* Headline */}
          <h1 className="animate-fade-in-up" style={{ animationDelay: "0.3s", animationFillMode: "both" }}>
            <span className="block leading-[0.92] tracking-[-0.03em]" style={{ fontFamily: serif, fontSize: "clamp(3rem, 6.5vw, 6rem)", color: INK }}>
              Arrêtez de chercher.
            </span>
            <span className="block leading-[0.92] tracking-[-0.03em] mt-2" style={{ fontFamily: serif, fontSize: "clamp(3rem, 6.5vw, 6rem)", color: INK }}>
              Commencez à <span style={{ color: CORAL, fontStyle: "italic" }}>trouver.</span>
            </span>
          </h1>

          <p className="mt-8 text-xl leading-relaxed max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: "0.5s", animationFillMode: "both", color: MUTED }}>
            Claw4HR trouve les meilleurs profils passifs sur GitHub, LinkedIn et Indeed — scorés, enrichis, prêts à contacter. En moins de 5 secondes.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex items-center justify-center animate-fade-in-up" style={{ animationDelay: "0.7s", animationFillMode: "both" }}>
            <PixelBtn href="#demo" variant="coral" size="lg">Voir en action ↓</PixelBtn>
          </div>

        </div>

        {/* Product visual — search results */}
        <div className="mt-20 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: "1s", animationFillMode: "both" }}>
          <SearchResultsVisual />
          <div className="mx-auto w-3/4 h-12 -mt-3" style={{ background: `radial-gradient(ellipse at center, ${CORAL}15, transparent 70%)` }} />
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════
   Metrics — Animated counters
   ═══════════════════════════════════════════ */

function MetricsBar() {
  const metrics = [
    { value: 10000, suffix: "+", label: "Profils indexés" },
    { value: 3, suffix: "+", label: "Sources de données" },
    { value: 5, prefix: "<", suffix: "s", label: "Temps de réponse" },
    { value: 94, suffix: "%", label: "Précision du matching" },
  ]

  return (
    <section className="py-20 relative" style={{ backgroundColor: CREAM }}>
      <div className="mx-auto max-w-6xl px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {metrics.map((m, i) => (
            <Reveal key={m.label} delay={i * 100}>
              <div className="text-center">
                <div className="font-mono font-bold tracking-tight" style={{ fontSize: "clamp(2.5rem, 4vw, 3.5rem)", color: CORAL }}>
                  <AnimatedNumber value={m.value} suffix={m.suffix} prefix={m.prefix} />
                </div>
                <div className="mt-2 font-mono text-xs uppercase tracking-[0.15em]" style={{ color: MUTED }}>
                  {m.label}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════
   Feature Visuals — BIGGER, richer
   ═══════════════════════════════════════════ */

function SourcesVisual() {
  const sources = [
    {
      name: "GitHub",
      sub: "Activité · Repos · Contributions",
      bg: "#24292e",
      count: "2.4k",
      svgPath: GH_PATH,
      svgViewBox: "0 0 98 96",
    },
    {
      name: "LinkedIn",
      sub: "Profils · Expériences · Réseau",
      bg: "#0A66C2",
      count: "5.1k",
      svgPath: LI_PATH,
      svgViewBox: "0 0 24 24",
    },
    {
      name: "Indeed",
      sub: "CVs indexés · Candidatures",
      bg: "#2557A7",
      count: "1.8k",
      svgPath: undefined,
      text: "in",
    },
  ]

  return (
    <div className="w-full overflow-hidden" style={{ backgroundColor: CREAM, borderRadius: "16px", border: `1px solid ${INK}06` }}>
      <div className="px-8 py-5 flex items-center justify-between" style={{ borderBottom: `1px solid ${INK}06` }}>
        <span className="font-mono text-xs uppercase tracking-wider" style={{ color: MUTED }}>Agrégation multi-sources</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: SUCCESS }} />
          <span className="text-xs font-mono" style={{ color: SUCCESS }}>Live</span>
        </div>
      </div>

      <div className="p-6 grid grid-cols-3 gap-4">
        {sources.map((s) => (
          <div key={s.name} className="p-5 flex flex-col gap-4 transition-all duration-200 hover:-translate-y-0.5" style={{ backgroundColor: WHITE, borderRadius: "12px", border: `1px solid ${INK}06` }}>
            <SourceLogo svgPath={s.svgPath} svgViewBox={s.svgViewBox} text={s.text} bg={s.bg} />
            <div>
              <div className="font-mono font-bold text-sm" style={{ color: INK }}>{s.name}</div>
              <div className="text-xs mt-0.5 leading-relaxed" style={{ color: MUTED }}>{s.sub}</div>
            </div>
            <div className="font-mono font-bold text-xl" style={{ color: INK }}>
              {s.count}
              <span className="text-[11px] font-normal ml-1" style={{ color: MUTED }}>profils</span>
            </div>
          </div>
        ))}
      </div>

      <div className="px-8 py-4 flex items-center justify-between" style={{ backgroundColor: `${INK}03`, borderTop: `1px solid ${INK}06` }}>
        <span className="text-xs font-mono" style={{ color: MUTED }}>3 sources · 9.3k profils agrégés</span>
        <span className="text-xs font-mono" style={{ color: CORAL }}>→ Pipeline unifié</span>
      </div>
    </div>
  )
}

function ScoreVisual() {
  return (
    <div className="w-full" style={{ backgroundColor: CREAM, borderRadius: "16px", border: `1px solid ${INK}06`, overflow: "hidden" }}>
      {/* Profile header */}
      <div className="px-8 py-6 flex items-center gap-4" style={{ borderBottom: `1px solid ${INK}06` }}>
        <Avatar name="Sophie Martin" size={52} bg={CORAL} />
        <div className="flex-1">
          <div className="font-semibold text-base" style={{ color: INK }}>Sophie Martin</div>
          <div className="text-sm" style={{ color: MUTED }}>Ingénieure ML Senior &middot; Paris &middot; 7 ans d'exp.</div>
        </div>
        <div className="text-right">
          <div className="font-mono font-bold text-2xl" style={{ color: CORAL }}>87%</div>
          <div className="text-[10px] font-mono uppercase tracking-wider" style={{ color: MUTED }}>Match</div>
        </div>
      </div>
      {/* Score ring + SWOT */}
      <div className="p-8 flex items-start gap-8">
        <div className="relative w-32 h-32 flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" stroke={`${INK}08`} strokeWidth="6" fill="none" />
            <circle cx="50" cy="50" r="40" stroke={CORAL} strokeWidth="6" fill="none" strokeDasharray="251.33" strokeDashoffset="33" strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-mono font-bold" style={{ color: INK }}>87%</span>
          </div>
        </div>
        <div className="flex-1 grid grid-cols-2 gap-3">
          {[
            { label: "Forces", color: SUCCESS, items: ["Expert Python — 8 ans", "ML / Deep Learning"] },
            { label: "Faiblesses", color: CORAL, items: ["Pas d'exp. frontend"] },
            { label: "Opportunités", color: "#3b82f6", items: ["Ouvert au CDI", "Paris"] },
            { label: "Menaces", color: "#f59e0b", items: ["Forte demande marché"] },
          ].map(s => (
            <div key={s.label} className="p-3" style={{ backgroundColor: WHITE, borderRadius: "10px", border: `1px solid ${INK}06` }}>
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-2 h-2" style={{ backgroundColor: s.color, borderRadius: "50%" }} />
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold" style={{ color: s.color }}>{s.label}</span>
              </div>
              {s.items.map(item => (
                <div key={item} className="text-xs leading-relaxed" style={{ color: INK }}>{item}</div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function PipelineFlowVisual() {
  const steps = [
    { letter: "X", name: "X-Ray", desc: "Découvrir les profils", status: "Fait", color: SUCCESS },
    { letter: "E", name: "Enrich", desc: "Ajouter le contexte", status: "Fait", color: SUCCESS },
    { letter: "I", name: "Index", desc: "Structurer les données", status: "En cours", color: "#3b82f6" },
    { letter: "S", name: "Score", desc: "Classer les candidats", status: "En attente", color: MUTED },
  ]
  return (
    <div className="w-full" style={{ backgroundColor: CREAM, borderRadius: "16px", border: `1px solid ${INK}06`, overflow: "hidden" }}>
      {/* Status bar */}
      <div className="px-8 py-5 flex items-center justify-between" style={{ borderBottom: `1px solid ${INK}06` }}>
        <span className="font-mono text-xs uppercase tracking-wider" style={{ color: MUTED }}>Statut du Pipeline</span>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 animate-pulse" style={{ backgroundColor: "#3b82f6", borderRadius: "50%" }} />
          <span className="font-mono text-xs" style={{ color: "#3b82f6" }}>Traitement de 12 profils...</span>
        </div>
      </div>
      {/* Progress bar */}
      <div className="px-8 pt-5">
        <div className="h-2 w-full overflow-hidden" style={{ backgroundColor: `${INK}06`, borderRadius: "4px" }}>
          <div className="h-full transition-all duration-1000" style={{ width: "62%", background: `linear-gradient(90deg, ${SUCCESS}, #3b82f6)`, borderRadius: "4px" }} />
        </div>
      </div>
      {/* Steps */}
      <div className="p-6 grid grid-cols-4 gap-3">
        {steps.map((s, i) => (
          <div key={s.name} className="relative">
            <div className="p-4 text-center" style={{ backgroundColor: WHITE, borderRadius: "12px", border: `1px solid ${s.color}20` }}>
              <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center font-mono font-bold text-sm text-white" style={{ backgroundColor: s.color === MUTED ? `${INK}15` : s.color, borderRadius: "12px" }}>
                {s.letter}
              </div>
              <p className="font-mono font-bold text-xs" style={{ color: INK }}>{s.name}</p>
              <p className="text-[10px] mt-0.5" style={{ color: MUTED }}>{s.desc}</p>
              <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5" style={{ backgroundColor: `${s.color}10`, borderRadius: "100px" }}>
                {s.status === "En cours" && <div className="w-1.5 h-1.5 animate-pulse" style={{ backgroundColor: s.color, borderRadius: "50%" }} />}
                <span className="text-[9px] font-mono font-bold uppercase" style={{ color: s.color }}>{s.status}</span>
              </div>
            </div>
            {i < steps.length - 1 && (
              <div className="absolute top-1/2 -right-2 w-4 text-center font-mono" style={{ color: `${INK}20`, transform: "translateY(-50%)" }}>&rarr;</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   Features — Full-width visuals, stacked
   ═══════════════════════════════════════════ */

const features = [
  {
    num: "01",
    tag: "Multi-Source",
    title: "Cherchez là où les talents\npassifs vivent vraiment.",
    desc: "GitHub, LinkedIn, Indeed — Claw4HR interroge simultanément toutes les plateformes où les meilleurs profils sont actifs sans chercher d'emploi.",
    visual: <SourcesVisual />,
    bg: CREAM,
  },
  {
    num: "02",
    tag: "AI Scoring",
    title: "Chaque candidat expliqué.\nPas juste noté.",
    desc: "L'analyse SWOT rend chaque match transparent — forces, lacunes et raisonnement. Pas un chiffre opaque : une décision argumentée.",
    visual: <ScoreVisual />,
    bg: WHITE,
  },
]

/* ═══════════════════════════════════════════
   Pain Block — Avant / Après
   ═══════════════════════════════════════════ */

function PainBlock() {
  return (
    <section className="py-28 md:py-36 relative overflow-hidden" style={{ backgroundColor: NAVY }}>
      <div className="absolute inset-0 opacity-10">
        <DitheringShader
          shape="wave"
          type="8x8"
          colorBack="#0B1226"
          colorFront="#FF6B6B"
          width={1920}
          height={1080}
          pxSize={4}
          speed={0.15}
          style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }}
        />
      </div>
      <div className="relative z-10 mx-auto max-w-5xl px-8">
        <Reveal>
          <div className="text-center mb-14">
            <p className="font-mono text-xs uppercase tracking-[0.2em] mb-5" style={{ color: CORAL }}>Le Problème</p>
            <h2 className="leading-[1.05] tracking-[-0.02em] text-white" style={{ fontFamily: serif, fontSize: "clamp(2.2rem, 4.5vw, 3.5rem)" }}>
              Le problème de tous les recruteurs.{" "}
              <span style={{ fontStyle: "italic", color: CORAL }}>Enfin résolu.</span>
            </h2>
          </div>
        </Reveal>

        <Reveal delay={150}>
          <div className="grid md:grid-cols-2 gap-0 overflow-hidden" style={{ borderRadius: "16px", border: `1px solid ${WHITE}10` }}>
            {/* Colonne gauche — Sans Claw4HR */}
            <div className="p-8" style={{ backgroundColor: "#f5f5f5" }}>
              <div className="flex items-center gap-2 mb-6">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#ef4444" }} />
                <span className="font-mono text-xs uppercase tracking-wider font-bold" style={{ color: "#ef4444" }}>
                  Sans Claw4HR
                </span>
              </div>
              <div className="space-y-3">
                {[
                  "300 CVs reçus",
                  "Tri manuel — 2 jours",
                  "10 entretiens téléphoniques",
                  "3 profils pertinents",
                  "Poste ouvert depuis 6 semaines",
                ].map((text) => (
                  <div key={text} className="flex items-center gap-3 text-sm" style={{ color: "#374151" }}>
                    <span className="font-mono font-bold flex-shrink-0" style={{ color: "#ef4444", fontSize: "16px", lineHeight: 1 }}>×</span>
                    <span>{text}</span>
                  </div>
                ))}
              </div>
              <div
                className="mt-6 inline-flex items-center gap-2 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider"
                style={{ backgroundColor: "#ef444415", color: "#ef4444", borderRadius: "8px", border: "1px solid #ef444430" }}
              >
                Les meilleurs ? Jamais vus.
              </div>
            </div>

            {/* Colonne droite — Avec Claw4HR */}
            <div className="p-8" style={{ backgroundColor: "#0d1730", borderLeft: `1px solid ${WHITE}10` }}>
              <div className="flex items-center gap-2 mb-6">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: SUCCESS }} />
                <span className="font-mono text-xs uppercase tracking-wider font-bold" style={{ color: SUCCESS }}>
                  Avec Claw4HR
                </span>
              </div>
              <div className="space-y-3">
                {[
                  "GitHub + LinkedIn + Indeed simultanément",
                  "Résultats en moins de 5 secondes",
                  "Score + analyse SWOT par candidat",
                  "12 profils pertinents classés",
                  "Contact sous 24h",
                ].map((text) => (
                  <div key={text} className="flex items-center gap-3 text-sm" style={{ color: `${WHITE}70` }}>
                    <span className="font-mono font-bold flex-shrink-0" style={{ color: SUCCESS, fontSize: "16px", lineHeight: 1 }}>→</span>
                    <span>{text}</span>
                  </div>
                ))}
              </div>
              <div
                className="mt-6 inline-flex items-center gap-2 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider"
                style={{ backgroundColor: `${SUCCESS}15`, color: SUCCESS, borderRadius: "8px", border: `1px solid ${SUCCESS}30` }}
              >
                Talents passifs inclus.
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function FeaturesSection() {
  return (
    <section id="features">
      {features.map((f, i) => (
        <div key={f.num} className="py-24 md:py-32" style={{ backgroundColor: f.bg }}>
          <div className="mx-auto max-w-6xl px-8">
            <Reveal>
              <div className="flex items-center gap-3 mb-6">
                <span className="font-mono font-bold text-xs px-3 py-1" style={{ backgroundColor: `${CORAL}10`, color: CORAL, borderRadius: "100px" }}>{f.num}</span>
                <span className="font-mono text-xs uppercase tracking-wider" style={{ color: MUTED }}>{f.tag}</span>
              </div>
              <div className="grid lg:grid-cols-[1fr_1.1fr] gap-12 lg:gap-16 items-start">
                <div className="lg:sticky lg:top-32">
                  <h3 className="text-3xl md:text-4xl font-bold tracking-tight leading-[1.1] whitespace-pre-line" style={{ color: INK }}>{f.title}</h3>
                  <p className="mt-5 text-base md:text-lg leading-relaxed max-w-lg" style={{ color: MUTED }}>{f.desc}</p>
                  <div className="mt-6 w-12 h-1" style={{ backgroundColor: CORAL }} />
                </div>
                <div>{f.visual}</div>
              </div>
            </Reveal>
          </div>
        </div>
      ))}
    </section>
  )
}

/* ═══════════════════════════════════════════
   Demo / Video — Dark, immersive
   ═══════════════════════════════════════════ */

function DemoSection() {
  return (
    <section id="demo" className="py-28 md:py-36 relative overflow-hidden" style={{ backgroundColor: NAVY }}>
      <div className="absolute inset-0 opacity-20">
        <DitheringShader
          shape="warp"
          type="8x8"
          colorBack="#0B1226"
          colorFront="#FF6B6B"
          width={1920}
          height={1080}
          pxSize={4}
          speed={0.2}
          style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-8">
        <Reveal>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="font-mono text-xs uppercase tracking-[0.2em] mb-5" style={{ color: CORAL }}>Voyez-le en Action</p>
            <h2 className="leading-[1.05] tracking-[-0.02em] text-white" style={{ fontFamily: serif, fontSize: "clamp(2.2rem, 4.5vw, 3.5rem)" }}>
              De la description de poste aux <span style={{ fontStyle: "italic", color: CORAL }}>candidats classés</span> en quelques secondes.
            </h2>
            <p className="mt-5 text-lg leading-relaxed" style={{ color: `${WHITE}60` }}>
              Regardez comment Claw4HR transforme une simple description de poste en un pipeline de candidats scorés, enrichis et prêts à contacter.
            </p>
          </div>
        </Reveal>

        <Reveal delay={200}>
          <div className="relative max-w-4xl mx-auto overflow-hidden" style={{ borderRadius: "16px", border: `1px solid ${WHITE}10` }}>
            <video
              src="/demo.mov"
              controls
              playsInline
              className="w-full block"
              style={{ display: "block" }}
            />
          </div>
        </Reveal>


      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════
   CTA — Dark, aspirational
   ═══════════════════════════════════════════ */

function CTASection() {
  return (
    <section className="relative py-32 md:py-44 overflow-hidden" style={{ backgroundColor: NAVY }}>
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <GlobeCanvas />
      </div>

      <div className="relative z-10 text-center px-8 max-w-3xl mx-auto">
        <Reveal>
          <h2 className="leading-[0.95] tracking-[-0.03em] text-white" style={{ fontFamily: serif, fontSize: "clamp(2.8rem, 5.5vw, 5rem)" }}>
            Vos prochains recrutements.<br />
            <span style={{ fontStyle: "italic", color: CORAL }}>Sans job board.</span>
          </h2>
        </Reveal>
        <Reveal delay={150}>
          <p className="mt-6 text-lg max-w-lg mx-auto leading-relaxed" style={{ color: `${WHITE}60` }}>
            Rejoignez les recruteurs qui sourcent, scorent et engagent les meilleurs talents passifs — en temps réel, propulsé par l'IA.
          </p>
        </Reveal>
        <Reveal delay={300}>
          <div className="mt-10 flex flex-col items-center gap-4">
            <PixelBtn href="#demo" variant="coral" size="lg">Demander une démo &rarr;</PixelBtn>
            <a href="mailto:contact@claw4hr.ai" className="font-mono text-xs uppercase tracking-wider transition-colors" style={{ color: `${WHITE}35` }}>
              ou contactez-nous par email
            </a>
          </div>
        </Reveal>
        <Reveal delay={400}>
          <p className="mt-8 font-mono text-xs uppercase tracking-wider" style={{ color: `${WHITE}25` }}>
            Sur invitation &middot; Démo personnalisée disponible
          </p>
        </Reveal>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════
   FAQ — Accordion
   ═══════════════════════════════════════════ */

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className="cursor-pointer transition-all duration-200"
      style={{ borderBottom: `1px solid ${INK}08` }}
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-center justify-between py-6 px-2">
        <h3 className="font-semibold text-base pr-8" style={{ color: INK }}>{q}</h3>
        <div
          className="w-8 h-8 flex-shrink-0 flex items-center justify-center transition-transform duration-300"
          style={{ backgroundColor: open ? `${CORAL}10` : `${INK}05`, borderRadius: "8px", transform: open ? "rotate(45deg)" : "rotate(0deg)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={open ? CORAL : MUTED} strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14" /><path d="M5 12h14" />
          </svg>
        </div>
      </div>
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: open ? "200px" : "0px", opacity: open ? 1 : 0 }}
      >
        <p className="px-2 pb-6 text-sm leading-relaxed" style={{ color: MUTED }}>{a}</p>
      </div>
    </div>
  )
}

function FAQSection() {
  const faqs = [
    { q: "Comment Claw4HR trouve-t-il les talents passifs ?", a: "Claw4HR utilise des agents IA pour rechercher simultanément sur GitHub, LinkedIn, Indeed et notre base de plus de 10 000 CVs indexés. Il découvre les talents qui ne postulent jamais sur les job boards." },
    { q: "Qu'est-ce que l'analyse SWOT par candidat ?", a: "Chaque candidat reçoit une analyse Forces, Faiblesses, Opportunités et Menaces générée par l'IA. Cela donne aux recruteurs un raisonnement transparent derrière chaque score de matching — pas juste un chiffre." },
    { q: "Quelle est la rapidité des résultats ?", a: "La plupart des recherches retournent des candidats classés en moins de 5 secondes. Le pipeline JIT traite chaque candidat en temps réel — aucune base de données obsolète, aucun traitement différé." },
    { q: "Puis-je rechercher en langage naturel ?", a: "Oui. Décrivez simplement le profil dont vous avez besoin — 'Développeur Python senior à Paris avec de l'expérience en ML' — et l'agent IA analyse votre intention et recherche intelligemment sur toutes les sources." },
  ]

  return (
    <section className="py-28 md:py-36" style={{ backgroundColor: WHITE }}>
      <div className="mx-auto max-w-3xl px-8">
        <Reveal>
          <div className="text-center mb-14">
            <p className="font-mono text-xs uppercase tracking-[0.2em] mb-5" style={{ color: CORAL }}>FAQ</p>
            <h2 className="leading-[1.05] tracking-[-0.02em]" style={{ fontFamily: serif, fontSize: "clamp(2.2rem, 4.5vw, 3.5rem)", color: INK }}>
              Vos questions, <span style={{ color: CORAL, fontStyle: "italic" }}>nos réponses.</span>
            </h2>
          </div>
        </Reveal>
        <div>
          {faqs.map((faq, i) => (
            <Reveal key={faq.q} delay={i * 50}>
              <FAQItem q={faq.q} a={faq.a} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════
   Footer
   ═══════════════════════════════════════════ */

function Footer() {
  return (
    <footer className="py-16" style={{ backgroundColor: CREAM, borderTop: `1px solid ${INK}06` }}>
      <div className="mx-auto max-w-7xl px-8">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8">
          <div>
            <span className="font-mono font-bold text-xl tracking-tight" style={{ color: CORAL }}>
              Claw4HR
            </span>
            <p className="mt-2 text-sm max-w-xs" style={{ color: MUTED }}>
              Intelligence de Talents Passifs — Sourcing IA qui trouve les candidats qui ne postulent jamais.
            </p>
          </div>
          <div className="flex gap-12">
            <div>
              <p className="font-mono text-xs uppercase tracking-wider mb-3" style={{ color: INK }}>Produit</p>
              <div className="space-y-2">
                {[{label: "Fonctionnalités", href: "features"}, {label: "Démo", href: "demo"}, {label: "Stack", href: "stack"}].map(link => (
                  <a key={link.href} href={`#${link.href}`} className="block text-sm transition-colors hover:text-[#1a1a2e]" style={{ color: MUTED }}>{link.label}</a>
                ))}
              </div>
            </div>
            <div>
              <p className="font-mono text-xs uppercase tracking-wider mb-3" style={{ color: INK }}>Construit avec</p>
              <div className="space-y-2">
                {["HrFlow.ai", "OpenClaw", "Ollama", "Next.js"].map(link => (
                  <span key={link} className="block text-sm" style={{ color: MUTED }}>{link}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderTop: `1px solid ${INK}06` }}>
          <p className="text-sm" style={{ color: `${MUTED}80` }}>Conçu pour le Hackathon HrFlow.ai 2026</p>
          <p className="text-sm" style={{ color: `${MUTED}80` }}>Propulsé par HrFlow.ai & OpenClaw</p>
        </div>
      </div>
    </footer>
  )
}

/* ═══════════════════════════════════════════
   Page
   ═══════════════════════════════════════════ */

export default function LandingPage() {
  return (
    <div style={{ backgroundColor: WHITE, color: INK }}>
      <Grain />
      <Nav />
      <Hero />
      <PainBlock />
      <FeaturesSection />
      <DemoSection />
      <MetricsBar />
      <CTASection />
      <FAQSection />
      <Footer />
    </div>
  )
}

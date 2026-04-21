"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"

const CORAL = "#FF6B6B"
const CORAL_DEEP = "#CC4444"
const CREAM = "#FFF5F0"
const INK = "#1a1a2e"
const NAVY = "#0B1226"
const MUTED = "#6b7280"
const WHITE = "#FFFFFF"
const SUCCESS = "#10b981"
const serif = "var(--font-display), 'Georgia', serif"

function PixelBtn({ href, children, variant = "coral", size = "md" }: { href: string; children: ReactNode; variant?: "coral" | "dark" | "white" | "outline"; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "px-5 py-2.5 text-xs", md: "px-8 py-4 text-sm", lg: "px-10 py-5 text-base" }
  const bg = variant === "coral" ? CORAL : variant === "dark" ? INK : variant === "outline" ? "transparent" : WHITE
  const fg = variant === "white" ? INK : variant === "outline" ? INK : CREAM
  const shadow = variant === "coral" ? CORAL_DEEP : variant === "outline" ? `${INK}20` : variant === "dark" ? "#000" : `${INK}15`
  return (
    <a href={href} className={`inline-block font-mono font-bold uppercase tracking-wider transition-all duration-100 select-none cursor-pointer active:shadow-none active:translate-x-[4px] active:translate-y-[4px] ${sizes[size]}`}
      style={{ backgroundColor: bg, color: fg, boxShadow: `4px 4px 0 0 ${shadow}`, border: variant === "outline" ? `2px solid ${INK}` : "none" }}>
      {children}
    </a>
  )
}

function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [vis, setVis] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    let t: ReturnType<typeof setTimeout>
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { if (delay) t = setTimeout(() => setVis(true), delay); else setVis(true); obs.unobserve(el) } }, { threshold: 0.08 })
    obs.observe(el)
    return () => { obs.disconnect(); clearTimeout(t) }
  }, [delay])
  return (
    <div ref={ref} className={`transition-all duration-700 ease-out ${vis ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}>
      {children}
    </div>
  )
}

function Nav() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 50)
    window.addEventListener("scroll", h, { passive: true })
    return () => window.removeEventListener("scroll", h)
  }, [])
  return (
    <nav className="fixed top-0 inset-x-0 z-50">
      <div className="mx-auto max-w-7xl flex items-center justify-between px-8 py-5 transition-all duration-300"
        style={{ backgroundColor: scrolled ? `${WHITE}ee` : "transparent", backdropFilter: scrolled ? "blur(20px)" : "none", borderBottom: scrolled ? `1px solid ${INK}08` : "1px solid transparent" }}>
        <a href="/landing" className="font-mono font-bold text-2xl tracking-tight" style={{ color: CORAL }}>Claw4HR</a>
        <div className="hidden md:flex items-center gap-10 text-sm font-mono uppercase tracking-widest" style={{ color: MUTED, fontSize: "11px" }}>
          <a href="/landing#features" className="hover:text-[#1a1a2e] transition-colors">Fonctionnalités</a>
          <a href="/landing#demo" className="hover:text-[#1a1a2e] transition-colors">Démo</a>
          <a href="/pricing" className="transition-colors" style={{ color: CORAL }}>Tarifs</a>
        </div>
        <div className="flex items-center gap-3">
          <PixelBtn href="/landing#demo" variant="outline" size="sm">Voir la Démo</PixelBtn>
          <PixelBtn href="/landing#demo" variant="coral" size="sm">Demander une démo &rarr;</PixelBtn>
        </div>
      </div>
    </nav>
  )
}

function PricingHero() {
  return (
    <section className="pt-40 pb-20 text-center" style={{ backgroundColor: WHITE }}>
      <Reveal>
        <p className="font-mono text-xs uppercase tracking-[0.2em] mb-5" style={{ color: CORAL }}>Tarifs</p>
        <h1 className="leading-[1.05] tracking-[-0.02em]" style={{ fontFamily: serif, fontSize: "clamp(2.5rem, 5vw, 4rem)", color: INK }}>
          Simple. Transparent. <span style={{ fontStyle: "italic", color: CORAL }}>Sur mesure.</span>
        </h1>
        <p className="mt-5 text-lg leading-relaxed max-w-xl mx-auto" style={{ color: MUTED }}>
          Contactez-nous pour un devis personnalisé adapté à la taille et aux besoins de votre équipe.
        </p>
      </Reveal>
    </section>
  )
}

const tiers = [
  {
    name: "Starter",
    subtitle: "Pour les équipes qui démarrent",
    features: [
      "Jusqu'à 3 utilisateurs",
      "500 profils indexés / mois",
      "Sourcing GitHub + LinkedIn + Indeed",
      "Scoring IA 0–100%",
      "Support email",
    ],
    cta: "Contacter l'équipe",
    highlighted: false,
    variant: "outline" as const,
  },
  {
    name: "Pro",
    subtitle: "Pour les équipes en croissance",
    badge: "Recommandé",
    features: [
      "Jusqu'à 10 utilisateurs",
      "5 000 profils indexés / mois",
      "Toutes les sources",
      "Scoring IA + analyse SWOT",
      "Pipeline JIT temps réel",
      "Support prioritaire",
    ],
    cta: "Contacter l'équipe",
    highlighted: true,
    variant: "coral" as const,
  },
  {
    name: "Enterprise",
    subtitle: "Pour les grandes organisations",
    features: [
      "Utilisateurs illimités",
      "Profils illimités",
      "Sources personnalisées",
      "Accès API",
      "SLA garanti",
      "Account manager dédié",
    ],
    cta: "Contacter l'équipe",
    highlighted: false,
    variant: "dark" as const,
  },
]

function TiersSection() {
  return (
    <section className="py-20" style={{ backgroundColor: CREAM }}>
      <div className="mx-auto max-w-6xl px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier, i) => (
            <Reveal key={tier.name} delay={i * 100}>
              <div className="p-8 h-full flex flex-col relative" style={{
                backgroundColor: WHITE,
                borderRadius: "16px",
                border: tier.highlighted ? `2px solid ${CORAL}` : `1px solid ${INK}06`,
                boxShadow: tier.highlighted ? `8px 8px 0 0 ${CORAL}20` : `4px 4px 0 0 ${INK}06`,
              }}>
                {tier.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 font-mono text-xs font-bold uppercase tracking-wider text-white"
                    style={{ backgroundColor: CORAL, borderRadius: "100px" }}>
                    {tier.badge}
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="font-mono font-bold text-xl" style={{ color: INK }}>{tier.name}</h3>
                  <p className="text-sm mt-1" style={{ color: MUTED }}>{tier.subtitle}</p>
                  <div className="mt-5 font-mono font-bold text-3xl" style={{ color: tier.highlighted ? CORAL : INK }}>
                    Sur devis
                  </div>
                </div>
                <ul className="flex-1 space-y-3 mb-8">
                  {tier.features.map(f => (
                    <li key={f} className="flex items-start gap-2.5 text-sm" style={{ color: INK }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mt-0.5 flex-shrink-0">
                        <path d="M5 13l4 4L19 7" stroke={tier.highlighted ? CORAL : SUCCESS} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <PixelBtn href="mailto:contact@claw4hr.ai" variant={tier.variant} size="md">
                  {tier.cta} &rarr;
                </PixelBtn>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function PricingCTA() {
  return (
    <section className="py-28 text-center" style={{ backgroundColor: NAVY }}>
      <div className="max-w-2xl mx-auto px-8">
        <Reveal>
          <h2 className="leading-[1.05] tracking-[-0.02em] text-white" style={{ fontFamily: serif, fontSize: "clamp(2rem, 4vw, 3rem)" }}>
            Une question sur nos <span style={{ fontStyle: "italic", color: CORAL }}>offres ?</span>
          </h2>
          <p className="mt-5 text-lg" style={{ color: `${WHITE}60` }}>Notre équipe vous répond sous 24h.</p>
          <div className="mt-8 flex items-center justify-center gap-4 flex-wrap">
            <PixelBtn href="mailto:contact@claw4hr.ai" variant="coral" size="lg">Nous contacter &rarr;</PixelBtn>
            <PixelBtn href="/landing#demo" variant="white" size="lg">Voir la démo</PixelBtn>
          </div>
          <p className="mt-6 font-mono text-xs uppercase tracking-wider" style={{ color: `${WHITE}25` }}>
            Sur invitation &middot; Démo personnalisée disponible
          </p>
        </Reveal>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="py-10" style={{ backgroundColor: CREAM, borderTop: `1px solid ${INK}06` }}>
      <div className="mx-auto max-w-7xl px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <span className="font-mono font-bold text-xl tracking-tight" style={{ color: CORAL }}>Claw4HR</span>
        <p className="text-sm" style={{ color: `${MUTED}80` }}>Conçu pour le Hackathon HrFlow.ai 2026</p>
      </div>
    </footer>
  )
}

export default function PricingPage() {
  return (
    <div style={{ backgroundColor: WHITE, color: INK }}>
      <Nav />
      <PricingHero />
      <TiersSection />
      <PricingCTA />
      <Footer />
    </div>
  )
}

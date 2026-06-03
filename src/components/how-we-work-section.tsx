"use client"

import { useState } from "react"
import { Brain, Wrench, ShieldCheck, ArrowRight, Zap, Users, Scale, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

// ── Pilares del sistema Legassi ─────────────────────────────────────────────

const PILLARS = [
  {
    id: "criterio",
    icon: Scale,
    tag: "01 · Criterio jurídico",
    title: "Abogados colegiados y asesores expertos en extranjería",
    body: "Cada expediente lo analiza un profesional especializado en extranjería española. La IA nos asiste en la revisión documental, pero el criterio estratégico y la decisión final son siempre humanos.",
    detail: "Normativa al día. Jurisprudencia real. Más de 2.000 casos gestionados desde 2021.",
    vs: "Especialización real en extranjería — no es un servicio más dentro de un despacho generalista.",
    bg: "bg-[oklch(0.13_0.028_65)]",
    accent: "text-amber-400",
    badgeBg: "bg-amber-400/15 text-amber-300 border-amber-400/25",
    dots: true,
  },
  {
    id: "tecnologia",
    icon: Wrench,
    tag: "02 · LegalTech propio",
    title: "Herramientas que construimos con tus casos",
    body: "No compramos soluciones genéricas. Cada herramienta que usamos — el clasificador de permanencia, el evaluador de regularización — nació de un problema real que encontramos gestionando expedientes.",
    detail: "Verificador de documentos · Clasificador de permanencia · Evaluador de elegibilidad · Más en desarrollo.",
    vs: "El software legal del mercado no entiende extranjería española. El nuestro sí.",
    bg: "bg-primary/8 border-primary/20",
    accent: "text-primary",
    badgeBg: "bg-primary/10 text-primary border-primary/20",
    dots: false,
  },
  {
    id: "proceso",
    icon: ShieldCheck,
    tag: "03 · Revisión antes de presentar",
    title: "Tu expediente pasa por filtros propios antes de llegar a la Administración",
    body: "Antes de presentar cualquier solicitud, nuestro sistema de revisión detecta errores, documentos faltantes o incoherencias que la Administración usaría para denegar. Subsanamos nosotros, no ellos.",
    detail: "Lista de verificación personalizada · Revisión cruzada · Simulación de criterios de evaluación.",
    vs: "La mayoría de denegaciones son por errores que se podían prevenir. Nosotros los prevenimos.",
    bg: "bg-card border-border",
    accent: "text-secondary",
    badgeBg: "bg-secondary/10 text-secondary border-secondary/20",
    dots: false,
  },
]

// ── Stat cards ────────────────────────────────────────────────────────────────

const STATS = [
  { value: "+2.000", label: "Casos gestionados" },
  { value: "Desde 2021", label: "Construyendo LegalTech" },
  { value: "100%", label: "Revisión humana + IA" },
]

export function HowWeWorkSection() {
  const [active, setActive] = useState<string | null>(null)

  return (
    <section className="py-20 bg-background overflow-hidden">
      <div className="container mx-auto px-6 sm:px-10 lg:px-16">

        {/* Header */}
        <div className="max-w-3xl mb-14">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Cómo trabajamos</p>
          <h2 className="font-heading font-black text-4xl sm:text-5xl leading-[1.08] tracking-tight text-balance mb-4">
            Un sistema diseñado para que{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              tu expediente no falle
            </span>
          </h2>
          <p className="text-muted-foreground text-base leading-relaxed max-w-xl text-pretty">
            No somos un despacho tradicional con tecnología encima. Somos un sistema donde el criterio jurídico y las herramientas propias trabajan juntos desde el primer día.
          </p>
        </div>

        {/* ── Bento grid ── */}
        <div className="grid lg:grid-cols-3 gap-4 mb-6">
          {PILLARS.map(p => (
            <div
              key={p.id}
              className={cn(
                "group relative rounded-2xl border p-6 sm:p-7 flex flex-col gap-5 cursor-default transition-all duration-300",
                p.bg,
                active === p.id ? "shadow-float -translate-y-1" : "hover:shadow-card",
              )}
              onMouseEnter={() => setActive(p.id)}
              onMouseLeave={() => setActive(null)}
            >
              {/* Dot pattern for card 1 */}
              {p.dots && (
                <div className="absolute inset-0 rounded-2xl opacity-[0.04] pointer-events-none"
                  style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
              )}

              {/* Tag badge */}
              <span className={cn("self-start inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest", p.badgeBg)}>
                {p.tag}
              </span>

              {/* Icon */}
              <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl",
                p.id === "criterio" ? "bg-white/10" : "bg-primary/10 dark:bg-primary/10"
              )}>
                <p.icon className={cn("h-6 w-6", p.accent)} />
              </div>

              {/* Title */}
              <h3 className={cn("font-heading font-bold text-xl leading-snug",
                p.id === "criterio" ? "text-white" : "text-foreground"
              )}>
                {p.title}
              </h3>

              {/* Body */}
              <p className={cn("text-sm leading-relaxed text-pretty",
                p.id === "criterio" ? "text-white/60" : "text-muted-foreground"
              )}>
                {p.body}
              </p>

              {/* Detail pills */}
              <div className={cn("text-xs leading-relaxed border-t pt-4",
                p.id === "criterio" ? "text-white/35 border-white/10" : "text-muted-foreground/60 border-border/60"
              )}>
                {p.detail}
              </div>

              {/* "Vs traditional" note — visible on hover */}
              <div className={cn(
                "overflow-hidden transition-all duration-300",
                active === p.id ? "max-h-16 opacity-100" : "max-h-0 opacity-0"
              )}>
                <div className={cn("flex items-start gap-2 text-xs rounded-xl p-3",
                  p.id === "criterio" ? "bg-white/8 text-white/50" : "bg-muted text-muted-foreground"
                )}>
                  <Zap className={cn("h-3.5 w-3.5 shrink-0 mt-0.5", p.accent)} />
                  <span className="italic">{p.vs}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Stats + CTA row ── */}
        <div className="grid sm:grid-cols-4 gap-4">
          {STATS.map(s => (
            <div key={s.label} className="rounded-2xl border border-border bg-card px-5 py-4 text-center">
              <p className="font-heading font-black text-2xl text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}

          {/* CTA card */}
          <a
            href="#contacto"
            className="group rounded-2xl brand-gradient px-5 py-4 flex items-center justify-between gap-3 hover:opacity-90 transition-all"
          >
            <div>
              <p className="font-heading font-bold text-white text-sm leading-tight">Cuéntanos tu caso</p>
              <p className="text-white/60 text-xs mt-0.5">Sin compromiso</p>
            </div>
            <ArrowRight className="h-5 w-5 text-white shrink-0 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

      </div>
    </section>
  )
}

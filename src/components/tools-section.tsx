"use client"

import { useRef } from "react"
import Link from "next/link"
import { FileSearch, CalendarClock, FileSpreadsheet, Building2, ScrollText, MapPin, ShieldCheck, ArrowRight, Lock, Cpu, ChevronLeft, ChevronRight } from "lucide-react"

const availableTools = [
  {
    icon: FileSearch,
    tag: "Regularización Extraordinaria 2026",
    title: "PermanencIA",
    description:
      "Sube tus documentos y analizamos si cubren los 5 meses de permanencia ininterrumpida exigidos por el Real Decreto 316/2026. Clasificación por meses, detección de huecos y expediente en PDF listo para presentar.",
    href: "/herramientas/permanencia",
  },
]

const comingSoonTools = [
  {
    icon: ShieldCheck,
    title: "Antecedentes Penales de Perú con Apostilla",
    description:
      "Sistema RPA que tramita automáticamente tu certificado y su apostilla en los portales oficiales del gobierno peruano.",
  },
  {
    icon: CalendarClock,
    title: "Citas en el Consulado del Perú",
    description:
      "Agiliza tu cita para renovar pasaporte, obtener certificados, autorización de viaje y más trámites consulares.",
  },
  {
    icon: FileSpreadsheet,
    title: "Cumplimentación de Modelo EX17 y Tasa 790 012 Automático",
    description:
      "Rellena automáticamente el Modelo EX17 y la Tasa 790 012 a partir de tus datos personales. Sin errores, en segundos.",
  },
  {
    icon: Building2,
    title: "Citas en entidades de España",
    description:
      "Extranjería, Policía, Registro Civil, Ayuntamiento, Registros, SEPE y Seguridad Social. Gestiona tus citas desde un solo lugar.",
  },
  {
    icon: ScrollText,
    title: "Relato de asilo optimizado",
    description:
      "Evaluación de tu condición y construcción de un relato coherente y sólido para tu solicitud de protección internacional.",
  },
  {
    icon: MapPin,
    title: "Mejor vía de regularización",
    description:
      "Analiza tus datos y te indica cuál es la vía más rápida y viable para regularizar tu situación en España.",
  },
]

export function ToolsSection() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -280 : 280, behavior: "smooth" })
  }

  return (
    <section id="herramientas" className="relative py-16 sm:py-20 overflow-hidden">
      {/* Dark gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-foreground/[0.03] via-primary/5 to-secondary/5" aria-hidden="true" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-20 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 -left-20 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[120px]" />
      </div>

      <div className="container relative z-10 mx-auto px-6 sm:px-10 lg:px-16">

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-14">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1">
                <Cpu className="h-3 w-3 text-primary" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-primary">Herramientas propias</span>
              </div>
            </div>
            <h2 className="text-section font-heading font-bold tracking-tight">
              El primer despacho de extranjería en España con{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                herramientas propias
              </span>
            </h2>
            <p className="mt-3 text-muted-foreground max-w-xl text-pretty">
              Construidas con los expedientes reales que gestionamos cada día. Las más útiles las liberamos para que las uses tú.{" "}
              <span className="font-semibold text-foreground">Todas tienen capa gratuita.</span>
            </p>
          </div>
          <div className="shrink-0 text-right hidden lg:block">
            <p className="text-4xl font-black text-primary">1</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">herramienta activa</p>
            <p className="text-4xl font-black text-muted-foreground/30 mt-2">7+</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">en desarrollo</p>
          </div>
        </div>

        {/* Featured available tool */}
        <div className="mb-10">
          {availableTools.map((tool) => (
            <Link
              key={tool.title}
              href={tool.href}
              className="group relative block rounded-2xl border border-primary/25 bg-gradient-to-r from-primary/10 via-card to-secondary/5 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-slow overflow-hidden"
            >
              {/* Shine effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-white/3 to-transparent" />

              <div className="relative p-4 sm:p-6 md:p-7 flex items-start gap-4 sm:gap-6">
                <div className="shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-brand">
                  <tool.icon className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-primary/15 text-primary border border-primary/20 rounded px-2 py-0.5">
                      {tool.tag}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded px-2 py-0.5">
                      Disponible · Capa gratuita
                    </span>
                  </div>
                  <h3 className="font-bold text-lg leading-snug mb-2">{tool.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed max-w-lg">{tool.description}</p>
                </div>
                <div className="shrink-0 self-center">
                  <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-colors duration-normal">
                    <ArrowRight className="h-4 w-4 text-primary group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Coming soon — carousel */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">En desarrollo</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll("left")}
              className="w-8 h-8 rounded-full border border-border/70 bg-background flex items-center justify-center text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
              aria-label="Anterior"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="w-8 h-8 rounded-full border border-border/70 bg-background flex items-center justify-center text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
              aria-label="Siguiente"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {comingSoonTools.map((tool) => (
            <div
              key={tool.title}
              className="snap-start shrink-0 w-[78%] sm:w-64 relative rounded-xl border border-border/40 bg-muted/20 p-4 sm:p-5 overflow-hidden select-none"
            >
              <div className="absolute inset-0 z-10 backdrop-blur-[2px] bg-background/40 flex items-end justify-start p-4 rounded-xl">
                <div className="flex items-center gap-1.5 rounded-full bg-muted/80 border border-border/60 px-2.5 py-1 shadow-sm">
                  <Lock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[10px] font-semibold text-muted-foreground">Próximamente</span>
                </div>
              </div>
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center mb-3">
                <tool.icon className="h-4 w-4 text-muted-foreground/60" />
              </div>
              <p className="font-semibold text-sm leading-snug mb-1.5 text-foreground/70">{tool.title}</p>
              <p className="text-muted-foreground/60 text-xs leading-relaxed">{tool.description}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}

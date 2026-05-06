"use client"

import { useEffect } from "react"
import { CheckCircle2, MapPin, Monitor, CalendarClock, MessageCircle, ArrowRight, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function launchConfetti() {
  if (typeof window === "undefined") return

  const canvas = document.createElement("canvas")
  canvas.style.cssText =
    "position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:9999"
  document.body.appendChild(canvas)
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  const ctx = canvas.getContext("2d")!
  const COLORS = ["#1a50c8", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"]

  interface Particle {
    x: number; y: number; vx: number; vy: number
    r: number; color: string; angle: number; omega: number
  }

  const particles: Particle[] = Array.from({ length: 130 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * -150 - 20,
    vx: (Math.random() - 0.5) * 5,
    vy: Math.random() * 4 + 2,
    r: Math.random() * 6 + 3,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    angle: Math.random() * Math.PI * 2,
    omega: (Math.random() - 0.5) * 0.25,
  }))

  let frame = 0
  let animId: number

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const alpha = frame < 140 ? 1 : Math.max(0, 1 - (frame - 140) / 40)
    ctx.globalAlpha = alpha

    for (const p of particles) {
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.06
      p.angle += p.omega

      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.angle)
      ctx.fillStyle = p.color
      ctx.fillRect(-p.r / 2, -p.r * 0.3, p.r, p.r * 0.6)
      ctx.restore()
    }

    frame++
    if (frame < 180) {
      animId = requestAnimationFrame(draw)
    } else {
      cancelAnimationFrame(animId)
      canvas.remove()
    }
  }

  animId = requestAnimationFrame(draw)
}

interface CompletionPanelProps {
  pathway: "DA20" | "DA21"
}

export function CompletionPanel({ pathway }: CompletionPanelProps) {
  useEffect(() => {
    launchConfetti()
  }, [])

  const channels = [
    {
      icon: MapPin,
      title: "Correos (presencial, sin cert. digital)",
      desc: "Oficinas habilitadas con cita previa. Solo necesitas tu expediente en papel o USB.",
      href: "https://citaprevia.correos.es/",
      label: "Pedir cita en Correos",
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800",
    },
    {
      icon: MapPin,
      title: "Oficina de Extranjería / Comisaría",
      desc: "Presentación presencial con cita previa a través del sistema de la Administración.",
      href: "https://sede.administracionespublicas.gob.es/icpplus/",
      label: "Pedir cita OEX / Policía",
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
    },
    ...(pathway === "DA20"
      ? [
          {
            icon: Monitor,
            title: "MERCURIO — presentación telemática (solo DA20)",
            desc: "Sede electrónica del Ministerio. Requiere certificado digital o Cl@ve.",
            href: "https://sede.inclusion.gob.es/",
            label: "Ir a MERCURIO",
            color: "text-blue-600 dark:text-blue-400",
            bg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",
          },
        ]
      : []),
  ]

  return (
    <div className="flex flex-col gap-5">

      {/* Success header */}
      <div className="rounded-2xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-5 py-5">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center"
            style={{ animation: "popIn 0.5s cubic-bezier(.175,.885,.32,1.275) both" }}
          >
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
              ¡Expediente completo y listo para presentar!
            </p>
            <p className="text-xs text-emerald-700 dark:text-emerald-400">
              Todos los documentos han pasado la verificación. Elige cómo presentarlo.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 px-3 py-2">
          <CalendarClock className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
          <p className="text-xs text-emerald-800 dark:text-emerald-300">
            Plazo límite: <strong>30 de junio de 2026</strong> — pide cita cuanto antes, las agendas se llenan rápido.
          </p>
        </div>
      </div>

      {/* Presentation channels */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
          ¿Dónde presentar tu solicitud?
        </p>
        <div className="flex flex-col gap-3">
          {channels.map((ch, i) => (
            <div key={i} className={cn("rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center gap-3", ch.bg)}>
              <div className="flex-1 min-w-0">
                <p className={cn("text-xs font-bold mb-0.5 flex items-center gap-1.5", ch.color)}>
                  <ch.icon className="h-3.5 w-3.5 shrink-0" />
                  {ch.title}
                </p>
                <p className="text-xs text-foreground/70 leading-relaxed">{ch.desc}</p>
              </div>
              <a
                href={ch.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold border transition-opacity hover:opacity-80",
                  ch.bg,
                  ch.color,
                )}
              >
                {ch.label}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Asesor CTA */}
      <div className="rounded-xl border border-border/50 bg-card px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold mb-1 flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-primary shrink-0" />
            ¿Quieres que un asesor acompañe la presentación?
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Nuestros asesores pueden revisar el expediente final y acompañarte el día de la cita.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild className="shrink-0 whitespace-nowrap border-primary/30 text-primary hover:bg-primary/10">
          <a
            href="https://wa.me/34672297468?text=Hola,%20mi%20expediente%20está%20completo%20y%20quiero%20ayuda%20con%20la%20presentación"
            target="_blank"
            rel="noopener noreferrer"
          >
            Hablar con asesor
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </Button>
      </div>

      <style>{`
        @keyframes popIn {
          0%   { transform: scale(0); opacity: 0; }
          70%  { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  )
}

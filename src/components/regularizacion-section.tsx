"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowRight, CheckCircle, AlertTriangle, Flame, CalendarClock } from "lucide-react"

const DEADLINE = new Date("2026-06-30T23:59:59")

function useCountdown() {
  const [t, setT] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  useEffect(() => {
    function tick() {
      const diff = DEADLINE.getTime() - Date.now()
      if (diff <= 0) { setT({ days: 0, hours: 0, minutes: 0, seconds: 0 }); return }
      setT({
        days:    Math.floor(diff / 86400000),
        hours:   Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return t
}

const BENEFICIOS = [
  "Regulariza tu situación sin necesidad de salir de España",
  "Necesitas acreditar 5 meses de permanencia ininterrumpida",
  "Accede a permiso de trabajo y residencia simultáneo",
  "Proceso gestionado íntegramente por nuestro equipo",
]

function CountUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="rounded-xl w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center
        bg-amber-100 border border-amber-300/60
        dark:bg-white/10 dark:border-white/20">
        <span className="font-heading font-black text-2xl sm:text-3xl tabular-nums
          text-amber-900 dark:text-white">
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="text-[9px] font-bold uppercase tracking-widest mt-1
        text-amber-600 dark:text-white/50">{label}</span>
    </div>
  )
}

export function RegularizacionSection() {
  const t = useCountdown()

  return (
    <section className="relative overflow-hidden py-16 sm:py-20
      bg-amber-50 dark:bg-[oklch(0.13_0.028_65)]">

      {/* Fondo decorativo */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full
          bg-amber-300/30 dark:bg-amber-500/20 blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full
          bg-amber-200/40 dark:bg-amber-700/15 blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.035] dark:opacity-[0.04]"
          style={{ backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)", backgroundSize: "28px 28px" }}
        />
      </div>

      <div className="container relative mx-auto max-w-7xl px-6 sm:px-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* ── Texto ── */}
          <div>
            {/* Badge urgencia */}
            <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 mb-6
              border border-rose-300 bg-rose-50 dark:border-rose-400/40 dark:bg-rose-500/10">
              <Flame className="h-3.5 w-3.5 text-rose-500 dark:text-rose-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest
                text-rose-600 dark:text-rose-300">Plazo limitado · 30 jun 2026</span>
            </div>

            <h2 className="font-heading font-black text-4xl sm:text-5xl leading-[1.08] tracking-tight text-balance mb-4
              text-amber-950 dark:text-white">
              Regularización{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Extraordinaria
              </span>{" "}
              2026
            </h2>

            <p className="text-base sm:text-lg leading-relaxed mb-8 text-pretty max-w-lg
              text-amber-800 dark:text-white/65">
              El Gobierno español abre una ventana única para regularizar tu situación.
              Si llevas tiempo en España sin papeles,{" "}
              <strong className="font-semibold text-amber-900 dark:text-white">
                esta puede ser la única oportunidad en años
              </strong>.
            </p>

            {/* Beneficios */}
            <ul className="space-y-3 mb-10">
              {BENEFICIOS.map(b => (
                <li key={b} className="flex items-start gap-3">
                  <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm leading-snug text-amber-800 dark:text-white/80">{b}</span>
                </li>
              ))}
            </ul>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/regularizacion-extraordinaria"
                className="inline-flex items-center justify-center gap-2 rounded-xl brand-gradient px-6 py-3.5 text-sm font-bold text-white shadow-brand hover:opacity-90 hover:scale-[1.02] active:scale-[0.99] transition-all"
              >
                Ver guía completa <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="https://wa.me/34672297468?text=Hola,%20quiero%20saber%20si%20puedo%20regularizarme%20con%20la%20Regularizaci%C3%B3n%20Extraordinaria%202026"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold transition-colors
                  border border-amber-300 bg-white text-amber-900 hover:bg-amber-50
                  dark:border-white/20 dark:bg-white/8 dark:text-white dark:hover:bg-white/15"
              >
                Consultar si aplico
              </a>
            </div>
          </div>

          {/* ── Contador + stats ── */}
          <div className="flex flex-col items-center lg:items-end gap-8">

            {/* Countdown card */}
            <div className="w-full max-w-sm rounded-2xl p-6
              border border-amber-200 bg-white
              dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <CalendarClock className="h-4 w-4 text-primary" />
                <p className="text-xs font-bold uppercase tracking-widest
                  text-amber-700 dark:text-white/60">Tiempo restante para solicitar</p>
              </div>
              <div className="flex justify-between gap-2">
                <CountUnit value={t.days}    label="días" />
                <div className="font-bold text-2xl self-center mb-4
                  text-amber-300 dark:text-white/30">:</div>
                <CountUnit value={t.hours}   label="horas" />
                <div className="font-bold text-2xl self-center mb-4
                  text-amber-300 dark:text-white/30">:</div>
                <CountUnit value={t.minutes} label="min" />
                <div className="font-bold text-2xl self-center mb-4
                  text-amber-300 dark:text-white/30">:</div>
                <CountUnit value={t.seconds} label="seg" />
              </div>
              <div className="mt-5 rounded-xl p-3 flex items-start gap-2
                bg-amber-50 border border-amber-200
                dark:bg-amber-500/10 dark:border-amber-400/20">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500 dark:text-amber-400" />
                <p className="text-xs leading-snug text-amber-700 dark:text-amber-200/80">
                  El plazo oficial vence el{" "}
                  <strong className="text-amber-900 dark:text-amber-300">30 de junio de 2026</strong>.
                  Inicia tu consulta cuanto antes para garantizar tiempo de preparación.
                </p>
              </div>
            </div>

            {/* Stats rápidos */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
              {[
                { value: "5 meses", label: "Permanencia ininterrumpida" },
                { value: "R.D.", label: "316/2026" },
                { value: "1 trámite", label: "Trabajo + Residencia" },
              ].map(s => (
                <div key={s.label} className="rounded-xl p-3 text-center
                  border border-amber-200 bg-white
                  dark:border-white/10 dark:bg-white/5">
                  <p className="font-heading font-black text-lg leading-none mb-1
                    text-amber-900 dark:text-white">{s.value}</p>
                  <p className="text-[10px] leading-tight
                    text-amber-600 dark:text-white/40">{s.label}</p>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}

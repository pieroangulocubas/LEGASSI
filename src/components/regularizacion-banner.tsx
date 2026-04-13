import Link from "next/link"
import { ArrowRight, CalendarClock, Flame } from "lucide-react"

export function RegularizacionBanner() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-primary via-primary/90 to-secondary">
      {/* Diagonal stripe pattern */}
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, transparent, transparent 12px, rgba(255,255,255,1) 12px, rgba(255,255,255,1) 13px)",
        }}
        aria-hidden="true"
      />

      <div className="container relative mx-auto px-6 sm:px-10 lg:px-16 py-5 sm:py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

          {/* Left */}
          <div className="flex items-start sm:items-center gap-3">
            <div className="shrink-0 mt-0.5 sm:mt-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Flame className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <span className="text-[10px] font-black uppercase tracking-widest bg-white/25 text-white rounded px-2 py-0.5">
                  Activo hasta el 30 de junio
                </span>
              </div>
              <p className="text-white font-bold text-sm md:text-base leading-tight">
                Regularización Extraordinaria 2026 — Si llevas tiempo en España sin papeles,{" "}
                <span className="underline underline-offset-2 decoration-white/60">esta es tu oportunidad</span>
              </p>
              <p className="text-white/75 text-xs mt-1 flex items-center gap-1.5">
                <CalendarClock className="h-3 w-3 shrink-0" />
                Plazo legal hasta el <strong className="text-white">30 de junio de 2026</strong> · Solo 3 meses
              </p>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <Link
              href="/herramientas/clasificador-documentos"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-bold text-primary shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              Verificar documentos
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="https://wa.me/34672297468?text=Hola,%20quiero%20información%20sobre%20la%20Regularización%20Extraordinaria%202026"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-white/15 border border-white/30 px-4 py-2 text-xs font-bold text-white hover:bg-white/25 active:scale-[0.98] transition-all duration-200"
            >
              Hablar con un asesor
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}

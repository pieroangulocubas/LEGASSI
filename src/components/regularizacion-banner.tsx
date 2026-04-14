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

      <div className="container relative mx-auto px-5 sm:px-10 lg:px-16 py-4 sm:py-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">

          {/* Left: icon + text */}
          <div className="flex items-start gap-3 min-w-0">
            <div className="shrink-0 mt-0.5 sm:mt-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Flame className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
            </div>
            <div className="min-w-0">
              {/* Badge + date — una sola línea */}
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-[10px] font-black uppercase tracking-widest bg-white/25 text-white rounded px-2 py-0.5 whitespace-nowrap">
                  Oferta vigente
                </span>
                <span className="text-white/70 text-[10px] flex items-center gap-1 whitespace-nowrap">
                  <CalendarClock className="h-3 w-3 shrink-0" />
                  Hasta el 30 de junio de 2026
                </span>
              </div>

              {/* Título principal */}
              <p className="text-white font-bold text-sm sm:text-base leading-snug">
                Regularización Extraordinaria 2026
                <span className="hidden sm:inline text-white/80 font-normal">
                  {" "}— Si llevas tiempo en España sin papeles,{" "}
                  <span className="text-white underline underline-offset-2 decoration-white/50">esta es tu oportunidad</span>
                </span>
              </p>

              {/* Subtítulo — solo mobile */}
              <p className="sm:hidden text-white/80 text-xs mt-0.5 leading-snug">
                Si llevas tiempo sin papeles, <span className="text-white font-semibold">esta es tu oportunidad</span>
              </p>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-2 shrink-0 pl-10 sm:pl-0">
            <Link
              href="/herramientas/clasificador-documentos"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 sm:px-4 py-2 text-xs font-bold text-primary shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 whitespace-nowrap"
            >
              Verificar documentos
              <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </Link>
            <Link
              href="https://wa.me/34672297468?text=Hola,%20quiero%20información%20sobre%20la%20Regularización%20Extraordinaria%202026"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-white/15 border border-white/30 px-4 py-2 text-xs font-bold text-white hover:bg-white/25 active:scale-[0.98] transition-all duration-200 whitespace-nowrap"
            >
              Hablar con asesor
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}

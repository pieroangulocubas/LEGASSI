"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus, Minus, ArrowRight, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"

const FAQS = [
  {
    cat: "Servicios",
    q: "¿Qué tipos de trámites de extranjería gestionan?",
    a: "Residencias temporales y permanentes, reagrupación familiar, nacionalidad española, estancias por estudios, protección internacional, autorizaciones de trabajo y renovaciones. Cada caso lo tratamos de forma individual — no aplicamos plantillas genéricas.",
  },
  {
    cat: "Proceso",
    q: "¿Cómo revisan la documentación antes de presentar el expediente?",
    a: "Usamos herramientas propias construidas con expedientes reales para revisar cada caso antes de presentarlo. Detectamos lo que falta o no cumple los requisitos antes de que lo detecte la Administración, reduciendo errores y retrasos innecesarios.",
  },
  {
    cat: "Proceso",
    q: "¿Gestionan citas en consulados y oficinas públicas?",
    a: "Sí. Nos encargamos de citas en consulados, comisarías de policía, ayuntamientos, SEPE y cualquier institución relacionada con tu trámite. No necesitas recurrir a tramitadores externos.",
  },
  {
    cat: "Proceso",
    q: "¿Cuánto tiempo tarda en resolverse un caso?",
    a: "Depende del tipo de trámite y la complejidad del caso. Te mantenemos informado en cada etapa y gestionamos los plazos activamente. Lo que sí controlamos es que el expediente salga correcto la primera vez.",
  },
  {
    cat: "Regularización",
    q: "¿Qué es la Regularización Extraordinaria 2026 y quién puede solicitarla?",
    a: "Es una medida excepcional del Gobierno español (Real Decreto 316/2026) que permite regularizar la situación de personas que llevan en España un tiempo determinado sin documentación. Nuestro evaluador gratuito te dice en minutos si cumples los requisitos.",
  },
  {
    cat: "Regularización",
    q: "¿Para qué sirve la herramienta PermanencIA?",
    a: "PermanencIA analiza tus documentos y verifica si cubren los 5 meses de permanencia ininterrumpida exigidos por el Real Decreto 316/2026. Te dice qué meses tienes cubiertos, cuáles te faltan y genera un expediente en PDF listo para presentar.",
  },
  {
    cat: "LEGASSI",
    q: "¿Qué pasa si mi solicitud es denegada?",
    a: "Analizamos las causas, preparamos los recursos necesarios y te acompañamos hasta obtener una resolución favorable. Nuestro compromiso no termina con la presentación del expediente.",
  },
  {
    cat: "LEGASSI",
    q: "¿En qué se diferencia LEGASSI de otros despachos?",
    a: "Legassi fue fundado por personas que pasaron por el proceso migratorio en España. Lo conocemos por dentro, no en teoría. A eso le sumamos herramientas propias construidas con casos reales, asesores especializados en extranjería y atención directa sin intermediarios.",
  },
]

const CATS = ["Todos", "Servicios", "Proceso", "Regularización", "LEGASSI"]

export function FAQSection() {
  const [cat, setCat]     = useState("Todos")
  const [open, setOpen]   = useState<number | null>(0)

  const filtered = cat === "Todos" ? FAQS : FAQS.filter(f => f.cat === cat)

  return (
    <section id="faq" className="py-20 bg-muted/20 border-t border-border/40">
      <div className="container mx-auto px-6 sm:px-10 lg:px-16">

        <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-16 items-start">

          {/* ── Columna izquierda ── */}
          <div className="lg:sticky lg:top-28">
            <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-3">FAQ</p>
            <h2 className="font-heading font-bold text-2xl sm:text-3xl tracking-tight text-balance mb-4">
              Preguntas frecuentes
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-8 text-pretty">
              Si no encuentras lo que buscas, escríbenos directamente. Respondemos en menos de 24 h.
            </p>

            {/* Category tabs */}
            <div className="flex flex-row lg:flex-col gap-2 flex-wrap">
              {CATS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => { setCat(c); setOpen(null) }}
                  className={cn(
                    "rounded-xl px-3.5 py-2 text-sm font-semibold text-left transition-all",
                    cat === c
                      ? "bg-primary text-primary-foreground shadow-brand"
                      : "bg-card border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* CTA */}
            <div className="hidden lg:block mt-10">
              <Link
                href="#contacto"
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:gap-3 transition-all"
              >
                <MessageSquare className="h-4 w-4" />
                Hacer una pregunta distinta
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* ── Columna derecha: acordeón ── */}
          <div className="divide-y divide-border/60">
            {filtered.map((faq, i) => {
              const isOpen = open === i
              return (
                <div key={i} className="group">
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex items-start justify-between gap-4 w-full py-5 text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <span className={cn(
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide mb-2",
                        "bg-muted text-muted-foreground border-border"
                      )}>
                        {faq.cat}
                      </span>
                      <p className={cn(
                        "font-heading font-bold text-base leading-snug transition-colors",
                        isOpen ? "text-primary" : "text-foreground group-hover:text-primary"
                      )}>
                        {faq.q}
                      </p>
                    </div>
                    <div className={cn(
                      "shrink-0 flex h-7 w-7 items-center justify-center rounded-full border transition-all mt-1",
                      isOpen
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground group-hover:border-primary/40"
                    )}>
                      {isOpen
                        ? <Minus className="h-3.5 w-3.5" />
                        : <Plus className="h-3.5 w-3.5" />
                      }
                    </div>
                  </button>

                  <div className={cn(
                    "overflow-hidden transition-all duration-300",
                    isOpen ? "max-h-96 pb-5" : "max-h-0"
                  )}>
                    <p className="text-sm text-muted-foreground leading-relaxed text-pretty pr-12">
                      {faq.a}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

        </div>
      </div>
    </section>
  )
}

"use client"

import { useState } from "react"
import { ChevronDown, CheckCircle2, XCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

const TIPOS_FUERZA = [
  {
    fuerza: "fuerte",
    dot: "bg-emerald-500",
    label: "Prueba fuerte",
    text: "text-emerald-700 dark:text-emerald-400",
    docs: ["Padrón municipal / empadronamiento histórico", "Nómina o recibo de salario", "Contrato de trabajo (con fechas de inicio y fin, o indefinido)", "Certificado de empresa con periodo trabajado", "Certificado médico con listado de visitas"],
  },
  {
    fuerza: "media",
    dot: "bg-amber-500",
    label: "Prueba media",
    text: "text-amber-700 dark:text-amber-400",
    docs: ["Extracto bancario con movimientos en España", "Factura de suministros (luz, agua, gas, internet)", "Recibo de alquiler firmado con fecha"],
  },
  {
    fuerza: "débil",
    dot: "bg-red-400",
    label: "Prueba débil",
    text: "text-red-600 dark:text-red-400",
    docs: ["Ticket de compra o transporte", "Captura de pantalla de aplicación", "Documento sin fecha visible o sin identificación del titular"],
  },
]

const FECHAS_VALIDAS = [
  "Un mes de servicio consumido (factura, extracto, recibo)",
  "Un mes en que recibiste una nómina o pago laboral",
  "La fecha de alta en el padrón o en la vivienda",
  "Una cita médica o visita registrada en ese mes",
  "La fecha de inicio de un contrato vigente o indefinido",
]

const FECHAS_INVALIDAS = [
  "Fecha de vencimiento o caducidad de un contrato o documento",
  "Fecha de nacimiento o expiración del DNI/NIE",
  "Fecha de inicio de contrato cuando no hay fecha de fin ni indicación de vigencia indefinida",
  "Meses futuros respecto a la fecha de emisión del documento",
  "Fechas en condiciones generales, publicidad o datos técnicos no referidos a ti",
]

export function CriteriosEvaluacion() {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-xl border border-border bg-muted/20 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm font-semibold text-foreground">¿Qué documentos y fechas se aceptan como prueba?</span>
        </div>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200", open && "rotate-180")} />
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-5 border-t border-border pt-4">

          {/* Tipos de documentos por fuerza */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Tipos de documentos</p>
            {TIPOS_FUERZA.map(({ dot, label, text, docs }) => (
              <div key={label} className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className={cn("h-2 w-2 rounded-full shrink-0", dot)} />
                  <span className={cn("text-xs font-semibold", text)}>{label}</span>
                </div>
                <ul className="ml-4 space-y-0.5">
                  {docs.map((d) => (
                    <li key={d} className="text-xs text-muted-foreground">· {d}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Fechas válidas vs inválidas */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Fechas que SÍ cuentan</p>
              </div>
              <ul className="space-y-1">
                {FECHAS_VALIDAS.map((f) => (
                  <li key={f} className="text-xs text-muted-foreground">· {f}</li>
                ))}
              </ul>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                <p className="text-xs font-semibold text-red-600 dark:text-red-400">Fechas que NO cuentan</p>
              </div>
              <ul className="space-y-1">
                {FECHAS_INVALIDAS.map((f) => (
                  <li key={f} className="text-xs text-muted-foreground">· {f}</li>
                ))}
              </ul>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground border-t border-border pt-3">
            La IA aplica estos mismos criterios a cada documento. Si un documento tiene fechas válidas y fechas que no cuentan, verás ambas en los resultados.
          </p>
        </div>
      )}
    </div>
  )
}

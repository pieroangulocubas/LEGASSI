"use client"

import { useState } from "react"
import { ChevronDown, CheckCircle2, XCircle, Info, CalendarRange, Clock, Users } from "lucide-react"
import { cn } from "@/lib/utils"

const TIPOS_FUERZA = [
  {
    fuerza: "fuerte",
    dot: "bg-emerald-500",
    label: "Prueba fuerte",
    text: "text-emerald-700 dark:text-emerald-400",
    docs: [
      "Padrón municipal / empadronamiento histórico",
      "Nómina o recibo de salario",
      "Contrato de trabajo (con fechas de inicio y fin, o indefinido)",
      "Certificado de empresa con periodo trabajado",
      "Certificado médico con listado de visitas",
    ],
  },
  {
    fuerza: "media",
    dot: "bg-amber-500",
    label: "Prueba media",
    text: "text-amber-700 dark:text-amber-400",
    docs: [
      "Extracto bancario con movimientos en España",
      "Factura de suministros (luz, agua, gas, internet)",
      "Recibo de alquiler firmado con fecha",
    ],
  },
  {
    fuerza: "débil",
    dot: "bg-red-400",
    label: "Prueba débil",
    text: "text-red-600 dark:text-red-400",
    docs: [
      "Ticket de compra o transporte",
      "Captura de pantalla de aplicación",
      "Documento sin fecha visible o sin identificación del titular",
    ],
  },
]

const DOCS_CON_PERIODO = [
  "Contrato de trabajo con fecha de inicio y fecha de fin",
  "Certificado de empresa con periodo trabajado",
  "Contrato de alquiler con fecha de inicio y fecha de fin",
  "Matrícula escolar o universitaria (inicio y fin del curso)",
  "Informe médico que acredita seguimiento durante un periodo",
]

const FECHAS_VALIDAS = [
  "Un mes de servicio consumido (factura, extracto, recibo)",
  "Un mes en que recibiste una nómina o pago laboral",
  "La fecha de alta en el padrón o en la vivienda",
  "Una cita médica o visita registrada en ese mes",
  "La fecha de emisión del documento (cuando implica vinculación activa al servicio ese mes)",
  "Cada mes dentro del periodo inicio–fin de un contrato o alquiler",
]

const FECHAS_INVALIDAS = [
  "Fecha de vencimiento o caducidad de un contrato o documento",
  "Fecha de nacimiento o expiración del DNI/NIE/pasaporte",
  "Fecha de inicio de contrato cuando no hay fecha de fin ni indicación de vigencia indefinida",
  "Meses futuros respecto a la fecha de emisión del documento",
  "Fechas en condiciones generales, publicidad o datos técnicos no referidos a ti",
  "Fechas en metadatos del documento (firma electrónica, sellos administrativos sin relación directa con tu presencia)",
]

const FORMATOS_FECHA = [
  { formato: "DD/MM/AAAA", ejemplo: "15/03/2024" },
  { formato: "AAAA-MM-DD", ejemplo: "2024-03-15" },
  { formato: "Texto completo", ejemplo: "15 de marzo de 2024" },
  { formato: "Mes y año", ejemplo: "marzo 2024 · marzo de 2024" },
  { formato: "MM/AAAA", ejemplo: "03/2024" },
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

          {/* Documentos con periodo */}
          <div className="space-y-2 rounded-lg bg-muted/30 px-3 py-3">
            <div className="flex items-center gap-1.5">
              <CalendarRange className="h-3.5 w-3.5 text-primary shrink-0" />
              <p className="text-xs font-semibold text-foreground">Documentos con periodo (inicio → fin)</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Si el documento tiene fecha de inicio <strong>y</strong> fecha de fin, se cuentan <strong>todos los meses entre ambas fechas</strong>. Si solo tiene inicio y el contrato es indefinido, se cuenta únicamente el mes de inicio.
            </p>
            <ul className="space-y-0.5">
              {DOCS_CON_PERIODO.map((d) => (
                <li key={d} className="text-xs text-muted-foreground">· {d}</li>
              ))}
            </ul>
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

          {/* Formatos de fecha aceptados */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <p className="text-xs font-semibold text-foreground">Formatos de fecha reconocidos</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {FORMATOS_FECHA.map(({ formato, ejemplo }) => (
                <div key={formato} className="rounded-md border border-border bg-background px-2 py-1">
                  <span className="text-[10px] font-medium text-foreground">{formato} </span>
                  <span className="text-[10px] text-muted-foreground">— {ejemplo}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Múltiples nombres */}
          <div className="flex gap-2 rounded-lg bg-muted/30 px-3 py-2.5">
            <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Varios nombres en el documento</span> — si aparecen varias personas (empleador y empleado, arrendador y arrendatario…), la IA solo verifica si <em>tu</em> nombre está entre ellos. Los demás nombres no afectan al resultado.
            </p>
          </div>

          <p className="text-[11px] text-muted-foreground border-t border-border pt-3">
            La IA aplica estos mismos criterios a cada documento. Si un documento tiene fechas válidas y fechas que no cuentan, verás ambas en los resultados.
          </p>
        </div>
      )}
    </div>
  )
}

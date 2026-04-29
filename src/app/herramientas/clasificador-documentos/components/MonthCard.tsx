"use client"

import { useState } from "react"
import { FileText, Eye, ChevronDown, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatFechasRange, getCriterioPorTipo } from "../logic"
import type { MonthCoverage, DocumentResult } from "../types"

const STATUS_CFG = {
  CUBIERTO: {
    dot:    "bg-emerald-500",
    label:  "Cubierto",
    header: "bg-emerald-50 dark:bg-emerald-950/20",
    border: "border-emerald-200 dark:border-emerald-800",
    badge:  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
  DÉBIL: {
    dot:    "bg-amber-500",
    label:  "Cobertura débil",
    header: "bg-amber-50 dark:bg-amber-950/20",
    border: "border-amber-200 dark:border-amber-800",
    badge:  "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  },
  VACÍO: {
    dot:    "bg-red-500",
    label:  "Sin documentos",
    header: "bg-red-50 dark:bg-red-950/20",
    border: "border-red-200 dark:border-red-800",
    badge:  "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  },
} as const

const FUERZA_CFG = {
  fuerte: { dot: "bg-emerald-500", label: "Fuerte",  text: "text-emerald-700 dark:text-emerald-400" },
  media:  { dot: "bg-amber-400",   label: "Media",   text: "text-amber-700 dark:text-amber-400" },
  débil:  { dot: "bg-red-400",     label: "Débil",   text: "text-red-600 dark:text-red-400" },
} as const

function DocRow({
  doc,
  onPreview,
  onDelete,
}: {
  doc: DocumentResult
  onPreview: (doc: DocumentResult) => void
  onDelete?: (doc: DocumentResult) => void
}) {
  const [showExcluded, setShowExcluded] = useState(false)
  const f = FUERZA_CFG[doc.fuerza as keyof typeof FUERZA_CFG]
  const excluded = doc.fechas_descartadas ?? []
  const criterio = getCriterioPorTipo(doc.tipo)

  return (
    <div className="divide-y divide-border/60">
      <div className="group w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors">
        <button
          type="button"
          onClick={() => onPreview(doc)}
          className="flex items-start gap-3 flex-1 min-w-0"
        >
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />

          <div className="flex-1 min-w-0 space-y-0.5">
            <p className="text-xs font-semibold text-foreground leading-snug truncate">
              {doc.descripcion_breve}
            </p>
            {doc.fechas.length > 0 && (
              <p className="text-[11px] text-muted-foreground">
                {formatFechasRange(doc.fechas)}
              </p>
            )}
            {criterio && (
              <p className="text-[10px] text-muted-foreground/60 italic leading-snug">
                {criterio}
              </p>
            )}
          </div>
        </button>

        <div className="shrink-0 flex items-center gap-1.5 mt-0.5">
          {f && (
            <>
              <span className={cn("h-1.5 w-1.5 rounded-full", f.dot)} />
              <span className={cn("text-[11px] font-medium", f.text)}>{f.label}</span>
            </>
          )}
          <button
            type="button"
            onClick={() => onPreview(doc)}
            className="ml-1"
            aria-label="Ver documento"
          >
            <Eye className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
          </button>
          {onDelete && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete(doc) }}
              className="rounded p-0.5 text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 transition-colors"
              aria-label="Eliminar documento"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {excluded.length > 0 && (
        <div className="bg-muted/20">
          <button
            type="button"
            onClick={() => setShowExcluded((v) => !v)}
            className="w-full flex items-center gap-1.5 px-4 py-1.5 text-left hover:bg-muted/40 transition-colors"
          >
            <ChevronDown className={cn("h-3 w-3 text-muted-foreground/60 shrink-0 transition-transform duration-150", showExcluded && "rotate-180")} />
            <span className="text-[10px] text-muted-foreground/70">
              {excluded.length} fecha{excluded.length > 1 ? "s" : ""} excluida{excluded.length > 1 ? "s" : ""}
            </span>
          </button>
          {showExcluded && (
            <ul className="px-4 pb-2.5 space-y-1">
              {excluded.map(({ fecha, motivo }, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[10px] text-muted-foreground/70">
                  <span className="font-mono shrink-0">{fecha}</span>
                  <span>— {motivo}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export function MonthCard({
  month,
  onPreview,
  onDelete,
}: {
  month: MonthCoverage
  onPreview: (doc: DocumentResult) => void
  onDelete?: (doc: DocumentResult) => void
}) {
  const s = STATUS_CFG[month.status]

  return (
    <div className={cn("rounded-xl border overflow-hidden", s.border)}>

      {/* Header */}
      <div className={cn("flex items-center justify-between gap-2 px-4 py-3", s.header)}>
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn("h-2 w-2 rounded-full shrink-0", s.dot)} />
          <span className="font-bold text-sm text-foreground truncate">{month.label}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {month.isOptional && month.status === "VACÍO" && (
            <span className="rounded-full px-2 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground">
              Recomendable
            </span>
          )}
          {!(month.isOptional && month.status === "VACÍO") && (
            <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold", s.badge)}>
              {s.label}
            </span>
          )}
          {month.isOptional && month.status !== "VACÍO" && (
            <span className="rounded-full px-2 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground">
              Recomendable
            </span>
          )}
        </div>
      </div>

      {/* Document list */}
      {month.docs.length > 0 ? (
        <div className="divide-y divide-border">
          {month.docs.map((doc, i) => (
            <DocRow key={i} doc={doc} onPreview={onPreview} onDelete={onDelete} />
          ))}
        </div>
      ) : (
        <p className="px-4 py-3 text-xs text-muted-foreground/70">
          No hay documentos válidos para este mes.
        </p>
      )}
    </div>
  )
}

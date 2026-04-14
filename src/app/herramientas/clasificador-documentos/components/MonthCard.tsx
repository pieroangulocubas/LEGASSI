"use client"

import { FileText, Eye } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatFechasRange } from "../logic"
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

export function MonthCard({
  month,
  onPreview,
}: {
  month: MonthCoverage
  onPreview: (doc: DocumentResult) => void
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
              Opcional
            </span>
          )}
          {!(month.isOptional && month.status === "VACÍO") && (
            <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold", s.badge)}>
              {s.label}
            </span>
          )}
          {month.isOptional && month.status !== "VACÍO" && (
            <span className="rounded-full px-2 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground">
              Opcional
            </span>
          )}
        </div>
      </div>

      {/* Document list */}
      {month.docs.length > 0 ? (
        <div className="divide-y divide-border">
          {month.docs.map((doc, i) => {
            const f = FUERZA_CFG[doc.fuerza as keyof typeof FUERZA_CFG]
            return (
              <button
                key={i}
                type="button"
                onClick={() => onPreview(doc)}
                className="group w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors"
              >
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />

                <div className="flex-1 min-w-0 space-y-0.5">
                  {/* Description */}
                  <p className="text-xs font-semibold text-foreground leading-snug truncate">
                    {doc.descripcion_breve}
                  </p>
                  {/* Dates */}
                  {doc.fechas.length > 0 && (
                    <p className="text-[11px] text-muted-foreground">
                      {formatFechasRange(doc.fechas)}
                    </p>
                  )}
                </div>

                {/* Fuerza indicator */}
                {f && (
                  <div className="shrink-0 flex items-center gap-1.5 mt-0.5">
                    <span className={cn("h-1.5 w-1.5 rounded-full", f.dot)} />
                    <span className={cn("text-[11px] font-medium", f.text)}>{f.label}</span>
                  </div>
                )}

                {/* Preview hint */}
                <Eye className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 group-hover:text-primary mt-0.5 transition-colors" />
              </button>
            )
          })}
        </div>
      ) : (
        <p className="px-4 py-3 text-xs text-muted-foreground/70">
          No hay documentos válidos para este mes.
        </p>
      )}
    </div>
  )
}

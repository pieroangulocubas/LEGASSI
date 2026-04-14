"use client"

import { FileText, Eye, BookOpen } from "lucide-react"
import type { DocumentResult, MonthCoverage } from "../types"

const FUERZA_CFG = {
  fuerte: { label: "Fuerte",  bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300" },
  media:  { label: "Media",   bg: "bg-amber-100 dark:bg-amber-900/30",    text: "text-amber-700 dark:text-amber-300" },
  débil:  { label: "Débil",   bg: "bg-red-100 dark:bg-red-900/30",        text: "text-red-700 dark:text-red-400" },
} as const

export function ValidDocsList({
  months,
  onPreview,
}: {
  months: MonthCoverage[]
  onPreview: (doc: DocumentResult) => void
}) {
  // Only months that have docs
  const activeMonths = months.filter((m) => m.docs.length > 0)
  if (activeMonths.length === 0) return null

  // Global order counter across all months
  let globalIndex = 0

  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <BookOpen className="h-3.5 w-3.5 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground leading-none">
            Orden del expediente
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Los documentos válidos aparecerán en el PDF en este orden exacto
          </p>
        </div>
      </div>

      {/* Month groups */}
      <div className="rounded-xl border border-border overflow-hidden">
        {activeMonths.map((month, monthIdx) => (
          <div key={month.yearMonth}>
            {/* Month header row */}
            <div className={`flex items-center gap-3 px-4 py-2.5 ${
              monthIdx === 0 ? "" : "border-t border-border"
            } bg-muted/40`}>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold leading-none ${
                month.status === "CUBIERTO"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                  : month.status === "DÉBIL"
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                  : "bg-muted text-muted-foreground"
              }`}>
                {month.label}
              </span>
              {month.isOptional && (
                <span className="text-[10px] text-muted-foreground/70 font-medium">opcional</span>
              )}
              <span className="ml-auto text-[10px] text-muted-foreground">
                {month.docs.length} doc{month.docs.length !== 1 ? "s." : "."}
              </span>
            </div>

            {/* Docs in this month */}
            {month.docs.map((doc) => {
              globalIndex++
              const idx = globalIndex
              const fuerza = FUERZA_CFG[doc.fuerza as keyof typeof FUERZA_CFG]

              return (
                <button
                  key={`${doc.fileIndex}-${month.yearMonth}`}
                  type="button"
                  onClick={() => onPreview(doc)}
                  className="w-full flex items-center gap-3 px-4 py-3 border-t border-border/60 hover:bg-muted/30 transition-colors text-left group"
                >
                  {/* Index number */}
                  <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    {idx}
                  </span>

                  {/* File icon */}
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground/60" />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate leading-snug">
                      {doc.descripcion_breve}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5 font-mono">
                      {doc.originalName ?? doc.nombre_sugerido}
                    </p>
                  </div>

                  {/* Fuerza badge */}
                  {fuerza && (
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none ${fuerza.bg} ${fuerza.text}`}>
                      {fuerza.label}
                    </span>
                  )}

                  {/* Preview cta */}
                  <span className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Eye className="h-3.5 w-3.5 text-primary" />
                  </span>
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

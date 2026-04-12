"use client"

import { FileText, AlertTriangle, Copy } from "lucide-react"
import { MONTH_LABELS } from "../logic"
import type { DocumentResult, MonthCoverage } from "../types"

// One row per (document × month) — a multi-month doc appears once per covered month
interface DocEntry {
  doc: DocumentResult
  yearMonth: string       // the specific month this entry represents
  occurrenceIndex: number // 0 = first time this doc appears, 1 = second, etc.
  totalOccurrences: number
}

function buildEntries(months: MonthCoverage[]): DocEntry[] {
  // Count how many times each doc (by fileIndex) will appear
  const occurrenceCount = new Map<number, number>()
  for (const month of months) {
    for (const doc of month.docs) {
      occurrenceCount.set(doc.fileIndex, (occurrenceCount.get(doc.fileIndex) ?? 0) + 1)
    }
  }

  const seenCount = new Map<number, number>()
  const entries: DocEntry[] = []

  for (const month of months) {
    for (const doc of month.docs) {
      const seen = seenCount.get(doc.fileIndex) ?? 0
      entries.push({
        doc,
        yearMonth: month.yearMonth,
        occurrenceIndex: seen,
        totalOccurrences: occurrenceCount.get(doc.fileIndex) ?? 1,
      })
      seenCount.set(doc.fileIndex, seen + 1)
    }
  }

  return entries
}

export function ValidDocsList({
  months,
  onPreview,
}: {
  months: MonthCoverage[]
  onPreview: (doc: DocumentResult) => void
}) {
  const entries = buildEntries(months)
  if (entries.length === 0) return null

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground">
        Previsualización del orden del expediente
      </h3>
      <p className="text-xs text-muted-foreground">
        Los documentos válidos aparecerán en el PDF en este orden. Pulsa cualquiera para previsualizarlo.
      </p>
      <ol className="space-y-1.5">
        {entries.map((entry, i) => {
          const { doc, yearMonth, occurrenceIndex, totalOccurrences } = entry
          const isRepeat = occurrenceIndex > 0
          const monthLabel = MONTH_LABELS[yearMonth] ?? yearMonth

          return (
            <li key={`${doc.fileIndex}-${yearMonth}-${occurrenceIndex}`}>
              <button
                type="button"
                onClick={() => onPreview(doc)}
                className={`w-full flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm hover:border-primary/50 hover:shadow-sm transition-all text-left min-w-0 ${
                  isRepeat
                    ? "border-amber-200 bg-amber-50/50 dark:border-amber-800/50 dark:bg-amber-950/10"
                    : "border-border bg-card"
                }`}
                title="Previsualizar documento"
              >
                <span className="shrink-0 w-5 text-center text-xs font-medium text-muted-foreground mt-0.5">
                  {i + 1}
                </span>
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <p className="font-mono text-xs text-foreground truncate min-w-0 flex-1">
                      {doc.nombre_sugerido}
                    </p>
                    {totalOccurrences > 1 && (
                      <span
                        className="inline-flex items-center gap-0.5 rounded-full border border-amber-400/50 bg-amber-100 dark:bg-amber-900/30 dark:border-amber-700 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400 shrink-0"
                        title={`Este documento cubre ${totalOccurrences} meses — aparece una vez por cada mes válido`}
                      >
                        <Copy className="h-2.5 w-2.5" />
                        {occurrenceIndex + 1}/{totalOccurrences}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{doc.descripcion_breve}</p>
                  <p className={`text-[10px] font-medium mt-0.5 ${isRepeat ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}>
                    {monthLabel}
                  </p>
                  {doc.observacion && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5 flex items-start gap-1">
                      <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                      {doc.observacion}
                    </p>
                  )}
                </div>
                <span className="shrink-0 rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary mt-0.5">
                  Ver
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

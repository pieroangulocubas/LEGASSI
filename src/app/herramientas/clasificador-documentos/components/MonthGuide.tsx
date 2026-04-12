"use client"

import { CheckCircle, AlertCircle } from "lucide-react"
import { TEMPORAL_WINDOWS, MONTH_LABELS, PRESENTATION_MONTH_LABELS } from "../logic"
import type { PresentationMonth } from "../types"

export function MonthGuide({ month }: { month: PresentationMonth }) {
  const window = TEMPORAL_WINDOWS[month]

  return (
    <div className="rounded-xl border bg-muted/40 p-5 space-y-3">
      <p className="text-sm font-semibold text-foreground">
        Meses que necesitas cubrir para{" "}
        <span className="text-primary">{PRESENTATION_MONTH_LABELS[month]}</span>
      </p>
      <div className="flex flex-wrap gap-2">
        {window.required.map((ym) => (
          <span
            key={ym}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary-foreground border border-primary/20"
          >
            <CheckCircle className="h-3 w-3 text-primary" />
            <span className="text-foreground">{MONTH_LABELS[ym]}</span>
            <span className="text-muted-foreground">(obligatorio)</span>
          </span>
        ))}
        {window.optional.map((ym) => (
          <span
            key={ym}
            className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium border border-border"
          >
            <AlertCircle className="h-3 w-3 text-muted-foreground" />
            <span className="text-foreground">{MONTH_LABELS[ym]}</span>
            <span className="text-muted-foreground">(opcional)</span>
          </span>
        ))}
      </div>
      {window.optional.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Los meses opcionales son recomendables si presentas a principios de junio. Inclúyelos si ya tienes documentos disponibles.
        </p>
      )}
    </div>
  )
}

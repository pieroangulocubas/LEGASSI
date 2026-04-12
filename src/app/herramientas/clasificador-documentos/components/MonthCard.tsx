"use client"

import { FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import type { MonthCoverage, DocumentResult } from "../types"

export function MonthCard({
  month,
  onPreview,
}: {
  month: MonthCoverage
  onPreview: (doc: DocumentResult) => void
}) {
  const statusConfig = {
    CUBIERTO: {
      dot: "bg-green-500",
      text: "text-green-700 dark:text-green-400",
      label: "Cubierto",
      bg: "bg-green-50 dark:bg-green-950/20",
      border: "border-green-200 dark:border-green-800",
    },
    DÉBIL: {
      dot: "bg-amber-500",
      text: "text-amber-700 dark:text-amber-400",
      label: "Cobertura débil",
      bg: "bg-amber-50 dark:bg-amber-950/20",
      border: "border-amber-200 dark:border-amber-800",
    },
    VACÍO: {
      dot: "bg-red-500",
      text: "text-red-700 dark:text-red-400",
      label: "Sin documentos válidos",
      bg: "bg-red-50 dark:bg-red-950/20",
      border: "border-red-200 dark:border-red-800",
    },
  }

  const fuerzaBadge = {
    fuerte: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
    media: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    débil: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  }

  const baseStyle =
    month.status === "VACÍO" && month.isOptional
      ? { ...statusConfig["DÉBIL"], label: "Sin documentos (opcional)" }
      : statusConfig[month.status]
  const s = baseStyle

  return (
    <div
      className={cn(
        "rounded-xl border p-4 space-y-3",
        s.bg,
        s.border
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", s.dot)} />
          <span className="font-semibold text-sm text-foreground truncate">{month.label}</span>
          {month.isOptional && month.status !== "VACÍO" && (
            <span className="text-xs text-muted-foreground shrink-0">(opcional)</span>
          )}
        </div>
        <span className={cn("text-xs font-medium shrink-0", s.text)}>{s.label}</span>
      </div>

      {month.docs.length > 0 ? (
        <ul className="space-y-1.5">
          {month.docs.map((doc, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => onPreview(doc)}
                className="w-full flex items-center gap-2 text-xs rounded-lg border border-transparent px-2 py-1.5 -mx-2 hover:border-border hover:bg-background/80 transition-all text-left min-w-0"
                title="Ver documento"
              >
                <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="flex-1 text-foreground truncate min-w-0">{doc.descripcion_breve}</span>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                    fuerzaBadge[doc.fuerza]
                  )}
                >
                  {doc.fuerza}
                </span>
                <span className="shrink-0 text-[10px] font-medium text-primary/80 underline underline-offset-2">
                  Ver
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className={cn("text-xs", s.text, "opacity-70")}>
          No se encontraron documentos válidos para este mes.
        </p>
      )}
    </div>
  )
}

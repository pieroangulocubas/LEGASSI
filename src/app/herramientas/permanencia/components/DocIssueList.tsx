"use client"

import { FileText, XCircle, UserX, PlusCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatFechasRange } from "../logic"
import type { DocumentResult } from "../types"

export function DocIssueList({
  docs,
  files,
  onPreview,
  onInclude,
}: {
  docs: DocumentResult[]
  files?: File[]
  onPreview?: (doc: DocumentResult) => void
  onInclude?: (doc: DocumentResult) => void
}) {
  if (docs.length === 0) {
    return (
      <p className="px-4 py-6 text-xs text-center text-muted-foreground/60">
        No hay documentos inválidos.
      </p>
    )
  }

  const isNameMismatch = (motivo: string | null) =>
    /nombre|coincide|identificaci|personal|solicitante/i.test(motivo ?? "")

  function getReason(doc: DocumentResult): {
    text: string
    style: string
    Icon: React.ElementType
  } {
    const motivo =
      doc.motivo_rechazo?.trim() || "Documento no válido como prueba de permanencia"

    if (isNameMismatch(motivo)) {
      return {
        text: motivo,
        style:
          "bg-orange-50 text-orange-800 border border-orange-200 dark:bg-orange-950/30 dark:text-orange-300 dark:border-orange-800",
        Icon: UserX,
      }
    }

    return {
      text: motivo,
      style:
        "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800",
      Icon: XCircle,
    }
  }

  return (
    <div className="divide-y divide-border">
      {docs.map((doc, i) => {
        const { text, style, Icon } = getReason(doc)
        const canPreview = !!onPreview && !!files?.[doc.fileIndex]
        return (
          <div
            key={i}
            className="w-full px-5 py-4 space-y-2 hover:bg-muted/10 transition-colors"
          >
            <div className="flex items-start gap-2.5 min-w-0">
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
              <button
                type="button"
                disabled={!canPreview}
                onClick={() => canPreview && onPreview!(doc)}
                className={cn(
                  "min-w-0 flex-1 text-left",
                  canPreview && "cursor-pointer hover:opacity-80 transition-opacity"
                )}
              >
                <p className="text-sm font-semibold text-foreground truncate">
                  {doc.descripcion_breve || doc.originalName}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {doc.tipo}
                  {doc.fechas.length > 0 && <> · {formatFechasRange(doc.fechas)}</>}
                </p>
                <p className="text-[11px] text-muted-foreground/60 font-mono mt-0.5 truncate">
                  {doc.originalName}
                </p>
              </button>
              <div className="shrink-0 flex items-center gap-1.5">
                {canPreview && (
                  <button
                    type="button"
                    onClick={() => onPreview!(doc)}
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted hover:border-primary/40 transition-all"
                  >
                    Ver
                  </button>
                )}
                {onInclude && (
                  <button
                    type="button"
                    onClick={() => onInclude(doc)}
                    className="inline-flex items-center gap-1 rounded-lg bg-orange-600 hover:bg-orange-700 active:bg-orange-800 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-all"
                  >
                    <PlusCircle className="h-3 w-3" />
                    Incluir
                  </button>
                )}
              </div>
            </div>
            <div className={cn("flex items-start gap-2 rounded-lg px-3 py-2 text-xs font-medium", style)}>
              <Icon className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span className="break-words min-w-0">{text}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

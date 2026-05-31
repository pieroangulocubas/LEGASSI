"use client"

import { FileText, AlertTriangle, CheckCircle2, RotateCcw, Eye, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatFechasRange } from "../logic"
import type { DocumentResult } from "../types"

export function ObservadoList({
  allObservadoDocs,
  approvedIndices,
  rawResults,
  files,
  onPreview,
  onAprobar,
  onDesaprobar,
  onDelete,
}: {
  allObservadoDocs: DocumentResult[]
  approvedIndices: Set<number>
  rawResults: DocumentResult[]
  files?: File[]
  onPreview?: (doc: DocumentResult) => void
  onAprobar?: (doc: DocumentResult) => void
  onDesaprobar?: (doc: DocumentResult) => void
  onDelete?: (doc: DocumentResult) => void
}) {
  if (allObservadoDocs.length === 0) {
    return (
      <p className="px-4 py-6 text-xs text-center text-muted-foreground/60">
        No hay documentos por confirmar.
      </p>
    )
  }

  return (
    <div className="divide-y divide-border">
      {allObservadoDocs.map((doc, i) => {
        const rawIdx = rawResults.indexOf(doc)
        const isApproved = approvedIndices.has(rawIdx)
        const canPreview = !!onPreview && !!files?.[doc.fileIndex]

        return (
          <div
            key={i}
            className={cn(
              "px-4 py-3 space-y-2 transition-colors",
              isApproved && "bg-green-50/40 dark:bg-green-950/10"
            )}
          >
            <div className="flex items-center gap-2 min-w-0">
              <FileText className={cn(
                "h-3.5 w-3.5 shrink-0",
                isApproved ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
              )} />
              <div className="min-w-0 flex-1">
                <span className="text-sm font-semibold text-foreground leading-snug truncate block">
                  {doc.descripcion_breve}
                </span>
                <span className="text-[11px] text-muted-foreground truncate block">
                  {doc.tipo}{doc.fechas.length > 0 && <> · {formatFechasRange(doc.fechas)}</>}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {isApproved && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900/40 px-2 py-0.5 text-[10px] font-semibold text-green-700 dark:text-green-300">
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    Integrado
                  </span>
                )}
                {canPreview && (
                  <button
                    type="button"
                    onClick={() => onPreview!(doc)}
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1 text-[11px] font-medium text-foreground hover:bg-muted hover:border-primary/40 transition-all"
                  >
                    <Eye className="h-3 w-3" />
                    Ver
                  </button>
                )}
                {!isApproved && onAprobar && (
                  <button
                    type="button"
                    onClick={() => onAprobar(doc)}
                    className="inline-flex items-center gap-1 rounded-lg bg-green-600 hover:bg-green-700 active:bg-green-800 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm transition-all"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    Integrar
                  </button>
                )}
                {isApproved && onDesaprobar && (
                  <button
                    type="button"
                    onClick={() => onDesaprobar(doc)}
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-background hover:bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground transition-all"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Revertir
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(doc)}
                    className="rounded p-1 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
                    aria-label="Eliminar documento"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {doc.observacion && (
              <div className="flex items-start gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/60">
                <AlertTriangle className="h-3 w-3 shrink-0 mt-px text-amber-500" />
                <span className="text-amber-800 dark:text-amber-300 leading-snug">
                  {doc.observacion}
                  {doc.nombre_en_doc && (
                    <> · En doc: <em>«{doc.nombre_en_doc}»</em></>
                  )}
                </span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

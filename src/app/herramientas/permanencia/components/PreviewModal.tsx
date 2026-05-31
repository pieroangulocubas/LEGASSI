"use client"

import { useState, useEffect, useCallback } from "react"
import { X, Download, Info, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { getCriterioPorTipo, groupConsecutiveMonths, formatGroupLabel } from "../logic"
import type { DocumentResult } from "../types"

export function PreviewModal({
  doc,
  file,
  onClose,
}: {
  doc: DocumentResult
  file: File | undefined
  onClose: () => void
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [showExcluded, setShowExcluded] = useState(false)
  const isImage = file ? /\.(jpe?g|png)$/i.test(file.name) : false
  const excluded = doc.fechas_descartadas ?? []

  // Create object URL once and clean up on unmount / file change
  useEffect(() => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => {
      URL.revokeObjectURL(url)
      setPreviewUrl(null)
    }
  }, [file])

  // Close on Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    },
    [onClose]
  )

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  const fuerzaBadge = {
    fuerte: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
    media: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    débil: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel — bottom sheet on mobile, centered modal on sm+ */}
      <div className="relative z-10 flex flex-col w-full max-w-3xl max-h-[92vh] sm:max-h-[90vh] rounded-t-2xl sm:rounded-2xl bg-background shadow-2xl border border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-4 sm:px-5 py-3 sm:py-4 border-b border-border shrink-0">
          <div className="min-w-0">
            <p className="font-mono text-xs text-muted-foreground truncate">
              {doc.nombre_sugerido}
            </p>
            <p className="font-semibold text-sm text-foreground mt-0.5 truncate">
              {doc.descripcion_breve}
            </p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="text-xs text-muted-foreground">{doc.tipo}</span>
              <span className="text-muted-foreground/40">·</span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-medium",
                  fuerzaBadge[doc.fuerza]
                )}
              >
                {doc.fuerza}
              </span>
            </div>
            {doc.fechas.length > 0 && (() => {
              const groups = groupConsecutiveMonths(doc.fechas)
              return (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {groups.map((g, i) => (
                    <span key={i} className="rounded-full px-2 py-0.5 text-[10px] font-mono bg-muted text-muted-foreground">
                      {formatGroupLabel(g)}
                    </span>
                  ))}
                </div>
              )
            })()}
            {getCriterioPorTipo(doc.tipo) && (
              <div className="flex items-start gap-1.5 mt-2 rounded-md bg-primary/5 border border-primary/15 px-2.5 py-2">
                <Info className="h-3 w-3 shrink-0 mt-px text-primary/60" />
                <p className="text-[11px] text-foreground/70 leading-snug">
                  <span className="font-semibold text-primary/80">Criterio aplicado: </span>
                  {getCriterioPorTipo(doc.tipo)}
                </p>
              </div>
            )}
            {excluded.length > 0 && (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => setShowExcluded((v) => !v)}
                  className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70 hover:text-foreground transition-colors"
                >
                  <ChevronDown className={cn("h-3 w-3 transition-transform duration-fast", showExcluded && "rotate-180")} />
                  {excluded.length} fecha{excluded.length > 1 ? "s" : ""} excluida{excluded.length > 1 ? "s" : ""}
                </button>
                {showExcluded && (
                  <ul className="mt-1.5 space-y-1 pl-1">
                    {excluded.map(({ fecha, motivo }, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-[10px] text-muted-foreground/60">
                        <span className="font-mono shrink-0">{fecha}</span>
                        <span>— {motivo}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Cerrar previsualización"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-muted/30 min-h-0">
          {!file || !previewUrl ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
              Archivo no disponible para previsualización.
            </div>
          ) : isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt={doc.descripcion_breve}
              className="block mx-auto max-w-full h-auto object-contain p-4"
            />
          ) : (
            <iframe
              src={previewUrl}
              title={doc.descripcion_breve}
              className="w-full h-full min-h-[50vh] sm:min-h-[60vh]"
              style={{ border: "none" }}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-5 py-3 border-t border-border shrink-0 flex items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground truncate">{doc.originalName}</p>
          {previewUrl && (
            <a
              href={previewUrl}
              download={doc.originalName}
              className="shrink-0 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            >
              <Download className="h-3.5 w-3.5" />
              Descargar
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

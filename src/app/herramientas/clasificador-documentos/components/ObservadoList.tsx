"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, FileText, AlertTriangle, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatFechasRange } from "../logic"
import type { DocumentResult } from "../types"

export function ObservadoList({
  docs,
  files,
  onPreview,
  onAprobar,
}: {
  docs: DocumentResult[]
  files?: File[]
  onPreview?: (doc: DocumentResult) => void
  onAprobar?: (doc: DocumentResult) => void
}) {
  const [open, setOpen] = useState(true)
  if (docs.length === 0) return null

  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-800 overflow-hidden">
      <button
        type="button"
        className="flex w-full items-center justify-between px-5 py-4 hover:brightness-95 transition-all text-left bg-amber-50/60 dark:bg-amber-950/20"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-semibold text-foreground">
              Documentos pendientes de revisión
            </span>
            <span className="rounded-full px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
              {docs.length}
            </span>
          </div>
          <p className="text-xs text-muted-foreground pl-6">
            El nombre no coincide exactamente — ausencia de algún componente o posible error tipográfico.
            No se han contabilizado en la cobertura hasta ser aprobados.
          </p>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="divide-y divide-amber-100 dark:divide-amber-900/40 border-t border-amber-200 dark:border-amber-800">
          {docs.map((doc, i) => {
            const canPreview = !!onPreview && !!files?.[doc.fileIndex]
            return (
              <div key={i} className="px-5 py-4 space-y-3">
                {/* File info row */}
                <div className="flex items-start gap-2 min-w-0">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {doc.originalName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {doc.tipo}
                      {doc.fechas.length > 0 && <> · {formatFechasRange(doc.fechas)}</>}
                      {doc.nombre_en_doc && (
                        <> · <span className="italic">En doc: «{doc.nombre_en_doc}»</span></>
                      )}
                    </p>
                  </div>
                  {canPreview && (
                    <button
                      type="button"
                      onClick={() => onPreview!(doc)}
                      className="shrink-0 rounded-md bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/60 transition-colors"
                    >
                      Ver
                    </button>
                  )}
                </div>

                {/* Observacion note */}
                {doc.observacion && (
                  <div className="flex items-start gap-2 rounded-lg px-3 py-2 text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span className="break-words min-w-0">{doc.observacion}</span>
                  </div>
                )}

                {/* Approve action */}
                {onAprobar && (
                  <button
                    type="button"
                    onClick={() => onAprobar(doc)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
                      "bg-green-50 text-green-700 border border-green-200",
                      "hover:bg-green-100 hover:border-green-300",
                      "dark:bg-green-950/30 dark:text-green-300 dark:border-green-800",
                      "dark:hover:bg-green-950/50"
                    )}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    Integrar como prueba de permanencia
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

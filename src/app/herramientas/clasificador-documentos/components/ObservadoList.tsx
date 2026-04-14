"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, FileText, AlertTriangle, CheckCircle2, RotateCcw, Eye } from "lucide-react"
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
}: {
  allObservadoDocs: DocumentResult[]
  approvedIndices: Set<number>
  rawResults: DocumentResult[]
  files?: File[]
  onPreview?: (doc: DocumentResult) => void
  onAprobar?: (doc: DocumentResult) => void
  onDesaprobar?: (doc: DocumentResult) => void
}) {
  const [open, setOpen] = useState(true)
  if (allObservadoDocs.length === 0) return null

  const approvedCount = allObservadoDocs.filter((d) => approvedIndices.has(rawResults.indexOf(d))).length
  const pendingCount = allObservadoDocs.length - approvedCount

  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-800 overflow-hidden">
      {/* Header */}
      <button
        type="button"
        className="flex w-full items-center justify-between px-5 py-4 hover:brightness-95 transition-all text-left bg-amber-50/60 dark:bg-amber-950/20"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="text-sm font-semibold text-foreground">
              Documentos pendientes de revisión
            </span>
            {pendingCount > 0 && (
              <span className="rounded-full px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                {pendingCount} pendiente{pendingCount !== 1 ? "s" : ""}
              </span>
            )}
            {approvedCount > 0 && (
              <span className="rounded-full px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                {approvedCount} aprobado{approvedCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground pl-6">
            El nombre no coincide exactamente. Revisa y decide si integrarlos como prueba.
          </p>
        </div>
        {open
          ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
          : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        }
      </button>

      {open && (
        <div className="divide-y divide-amber-100 dark:divide-amber-900/40 border-t border-amber-200 dark:border-amber-800">
          {allObservadoDocs.map((doc, i) => {
            const rawIdx = rawResults.indexOf(doc)
            const isApproved = approvedIndices.has(rawIdx)
            const canPreview = !!onPreview && !!files?.[doc.fileIndex]

            return (
              <div
                key={i}
                className={cn(
                  "px-5 py-4 space-y-3 transition-colors",
                  isApproved && "bg-green-50/40 dark:bg-green-950/10"
                )}
              >
                {/* Document identity */}
                <div className="flex items-start gap-2.5 min-w-0">
                  <FileText className={cn(
                    "h-4 w-4 shrink-0 mt-0.5",
                    isApproved ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
                  )} />
                  <div className="min-w-0 flex-1">
                    {/* Primary: descriptive name */}
                    <p className="text-sm font-semibold text-foreground leading-snug">
                      {doc.descripcion_breve}
                    </p>
                    {/* Secondary: file + dates */}
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {doc.tipo}
                      {doc.fechas.length > 0 && <> · {formatFechasRange(doc.fechas)}</>}
                    </p>
                    <p className="text-[11px] text-muted-foreground/60 mt-0.5 truncate font-mono">
                      {doc.originalName}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Approved badge */}
                    {isApproved && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900/40 px-2 py-0.5 text-[11px] font-semibold text-green-700 dark:text-green-300">
                        <CheckCircle2 className="h-3 w-3" />
                        Aprobado
                      </span>
                    )}
                    {/* Preview button */}
                    {canPreview && (
                      <button
                        type="button"
                        onClick={() => onPreview!(doc)}
                        className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted hover:border-primary/40 transition-all"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Ver
                      </button>
                    )}
                  </div>
                </div>

                {/* Name discrepancy note */}
                {doc.observacion && (
                  <div className="flex items-start gap-2 rounded-lg px-3 py-2 text-xs bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                    <span className="text-amber-800 dark:text-amber-300 break-words min-w-0">
                      {doc.observacion}
                    </span>
                  </div>
                )}

                {/* Action buttons */}
                {doc.nombre_en_doc && (
                  <p className="text-xs text-muted-foreground">
                    Nombre en el documento:{" "}
                    <span className="font-semibold text-foreground italic">«{doc.nombre_en_doc}»</span>
                  </p>
                )}

                <div className="flex gap-2 flex-wrap">
                  {!isApproved && onAprobar && (
                    <button
                      type="button"
                      onClick={() => onAprobar(doc)}
                      className="inline-flex items-center gap-2 rounded-lg bg-green-600 hover:bg-green-700 active:bg-green-800 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Integrar como prueba
                    </button>
                  )}
                  {isApproved && onDesaprobar && (
                    <button
                      type="button"
                      onClick={() => onDesaprobar(doc)}
                      className="inline-flex items-center gap-2 rounded-lg border border-border bg-background hover:bg-muted active:bg-muted/80 px-4 py-2 text-sm font-semibold text-foreground shadow-sm transition-all"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Revertir aprobación
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

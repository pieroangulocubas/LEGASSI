"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, FileText, XCircle, UserX } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatFechasRange } from "../logic"
import type { DocumentResult } from "../types"

export function DocIssueList({
  docs,
  files,
  onPreview,
}: {
  docs: DocumentResult[]
  files?: File[]
  onPreview?: (doc: DocumentResult) => void
}) {
  const [open, setOpen] = useState(false)
  if (docs.length === 0) return null

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
    <div className="rounded-xl border border-border overflow-hidden">
      <button
        type="button"
        className="flex w-full items-center justify-between px-5 py-4 hover:brightness-95 transition-all text-left bg-red-50/50 dark:bg-red-950/10"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">Documentos no incluidos</span>
            <span className="rounded-full px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
              {docs.length}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            No acreditan permanencia o están fuera del periodo a acreditar
          </p>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="divide-y divide-border border-t border-border">
          {docs.map((doc, i) => {
            const { text, style, Icon } = getReason(doc)
            const canPreview = !!onPreview && !!files?.[doc.fileIndex]
            const CardTag = canPreview ? "button" : "div"
            return (
              <CardTag
                key={i}
                {...(canPreview
                  ? { type: "button" as const, onClick: () => onPreview!(doc) }
                  : {})}
                className={cn(
                  "w-full px-5 py-4 space-y-2 transition-colors text-left",
                  canPreview ? "hover:bg-muted/30 cursor-pointer" : "hover:bg-muted/10"
                )}
              >
                <div className="flex items-start gap-2 min-w-0">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {doc.originalName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {doc.tipo}
                      {doc.fechas.length > 0 && <> · {formatFechasRange(doc.fechas)}</>}
                    </p>
                  </div>
                  {canPreview && (
                    <span className="shrink-0 rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      Ver
                    </span>
                  )}
                </div>
                <div className={cn("flex items-start gap-2 rounded-lg px-3 py-2 text-xs font-medium", style)}>
                  <Icon className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span className="break-words min-w-0">{text}</span>
                </div>
              </CardTag>
            )
          })}
        </div>
      )}
    </div>
  )
}

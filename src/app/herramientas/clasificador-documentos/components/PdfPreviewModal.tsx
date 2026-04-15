"use client"

import { useEffect, useRef, useState } from "react"
import { PDFDocument } from "pdf-lib"
import { X, Download, Trash2, FileText, RotateCcw, GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"

export function PdfPreviewModal({
  pdfBytes,
  onDownload,
  onClose,
}: {
  pdfBytes: Uint8Array
  onDownload: (bytes: Uint8Array) => void
  onClose: () => void
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [pageCount, setPageCount] = useState(0)
  const [pageOrder, setPageOrder] = useState<number[]>([]) // 1-based original page numbers in display order
  const [markedPages, setMarkedPages] = useState<Set<number>>(new Set()) // 1-based
  const [processing, setProcessing] = useState(false)
  const dragFromIdx = useRef<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

  useEffect(() => {
    const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" })
    const url = URL.createObjectURL(blob)
    setBlobUrl(url)

    PDFDocument.load(pdfBytes, { ignoreEncryption: true })
      .then((doc) => {
        const count = doc.getPageCount()
        setPageCount(count)
        setPageOrder(Array.from({ length: count }, (_, i) => i + 1))
      })
      .catch(() => setPageCount(0))

    return () => URL.revokeObjectURL(url)
  }, [pdfBytes])

  function togglePage(pageNum: number) {
    setMarkedPages((prev) => {
      const next = new Set(prev)
      if (next.has(pageNum)) next.delete(pageNum)
      else next.add(pageNum)
      return next
    })
  }

  function clearAll() {
    setMarkedPages(new Set())
    setPageOrder(Array.from({ length: pageCount }, (_, i) => i + 1))
  }

  // Drag-and-drop handlers (HTML5 API)
  function handleDragStart(idx: number) {
    dragFromIdx.current = idx
  }

  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault()
    setDragOverIdx(idx)
  }

  function handleDrop(e: React.DragEvent, targetIdx: number) {
    e.preventDefault()
    setDragOverIdx(null)
    const from = dragFromIdx.current
    if (from === null || from === targetIdx) return
    setPageOrder((prev) => {
      const next = [...prev]
      const [item] = next.splice(from, 1)
      next.splice(targetIdx, 0, item)
      return next
    })
    dragFromIdx.current = null
  }

  function handleDragEnd() {
    dragFromIdx.current = null
    setDragOverIdx(null)
  }

  async function handleDownload() {
    setProcessing(true)
    try {
      // Build ordered list of 0-based indices, excluding marked pages
      const indicesToKeep = pageOrder
        .filter((pageNum) => !markedPages.has(pageNum))
        .map((pageNum) => pageNum - 1)

      const isReordered = pageOrder.some((p, i) => p !== i + 1)
      const hasMarked = markedPages.size > 0

      if (!isReordered && !hasMarked) {
        onDownload(pdfBytes)
        onClose()
        return
      }

      const srcDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true })
      const newDoc = await PDFDocument.create()
      const copied = await newDoc.copyPages(srcDoc, indicesToKeep)
      for (const p of copied) newDoc.addPage(p)
      const newBytes = await newDoc.save()
      onDownload(new Uint8Array(newBytes))
      onClose()
    } finally {
      setProcessing(false)
    }
  }

  const remaining = pageOrder.filter((p) => !markedPages.has(p)).length
  const isReordered = pageOrder.some((p, i) => p !== i + 1)
  const hasChanges = markedPages.size > 0 || isReordered

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4">
      <div className="relative w-full sm:max-w-5xl h-[95dvh] sm:h-[90vh] bg-background sm:rounded-2xl overflow-hidden flex flex-col shadow-2xl border border-border">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-card shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
              <FileText className="h-3.5 w-3.5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground leading-none">Previsualizar expediente</p>
              {pageCount > 0 && (
                <p className="text-xs text-muted-foreground mt-0.5">{pageCount} páginas en total</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 hover:bg-muted transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body: PDF preview + sidebar */}
        <div className="flex flex-col lg:flex-row flex-1 min-h-0">

          {/* PDF preview */}
          <div className="flex-1 min-h-0 bg-zinc-100 dark:bg-zinc-900 relative">
            {blobUrl ? (
              <embed
                src={`${blobUrl}#toolbar=1&navpanes=1`}
                type="application/pdf"
                className="absolute inset-0 w-full h-full"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
            )}
          </div>

          {/* Sidebar: page controls */}
          <div className="w-full lg:w-64 shrink-0 border-t lg:border-t-0 lg:border-l border-border flex flex-col bg-card">
            <div className="px-4 py-3 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-foreground">Organizar páginas</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                    Arrastra para reordenar · Pulsa para eliminar
                  </p>
                </div>
                {hasChanges && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="shrink-0 ml-2 flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
                  >
                    <RotateCcw className="h-2.5 w-2.5" />
                    Resetear
                  </button>
                )}
              </div>
            </div>

            {pageCount > 0 ? (
              <div className="flex-1 overflow-y-auto p-3 min-h-0">
                <div className="grid grid-cols-4 lg:grid-cols-3 gap-1.5">
                  {pageOrder.map((pageNum, idx) => {
                    const marked = markedPages.has(pageNum)
                    const isDragOver = dragOverIdx === idx
                    return (
                      <div
                        key={pageNum}
                        draggable
                        onDragStart={() => handleDragStart(idx)}
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDrop={(e) => handleDrop(e, idx)}
                        onDragEnd={handleDragEnd}
                        className={cn(
                          "relative group flex flex-col items-center justify-center rounded-lg border-2 cursor-grab active:cursor-grabbing transition-all select-none",
                          "aspect-[3/4] text-xs font-semibold",
                          isDragOver && "scale-105 border-primary/70 bg-primary/10",
                          marked && !isDragOver
                            ? "bg-destructive/10 border-destructive text-destructive"
                            : !isDragOver
                              ? "bg-background border-border hover:border-primary/60 hover:bg-primary/5 text-foreground"
                              : ""
                        )}
                        title={marked ? `Restaurar pág. ${pageNum}` : `Pág. ${pageNum} — pulsa para eliminar, arrastra para mover`}
                      >
                        {/* Drag handle icon */}
                        <GripVertical className="absolute top-1 left-0.5 h-3 w-3 text-muted-foreground/40 group-hover:text-muted-foreground/70 transition-colors" />

                        <span className={cn("text-sm font-bold", marked && "line-through")}>
                          {pageNum}
                        </span>

                        {/* Click overlay for toggle (separate from drag) */}
                        <button
                          type="button"
                          onClick={() => togglePage(pageNum)}
                          className="absolute inset-0 w-full h-full rounded-lg"
                          aria-label={marked ? `Restaurar pág. ${pageNum}` : `Eliminar pág. ${pageNum}`}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
            )}

            {/* Footer */}
            <div className="px-4 py-3.5 border-t border-border space-y-2.5 shrink-0">
              {(markedPages.size > 0 || isReordered) && (
                <div className="flex flex-col gap-1.5">
                  {markedPages.size > 0 && (
                    <div className="flex items-center gap-1.5 rounded-lg bg-destructive/10 border border-destructive/20 px-2.5 py-2">
                      <Trash2 className="h-3 w-3 text-destructive shrink-0" />
                      <span className="text-[11px] text-destructive font-medium leading-snug">
                        {markedPages.size} pág. eliminada{markedPages.size !== 1 ? "s" : ""}
                        {" · "}{remaining} restante{remaining !== 1 ? "s" : ""}
                      </span>
                    </div>
                  )}
                  {isReordered && (
                    <div className="flex items-center gap-1.5 rounded-lg bg-primary/10 border border-primary/20 px-2.5 py-2">
                      <GripVertical className="h-3 w-3 text-primary shrink-0" />
                      <span className="text-[11px] text-primary font-medium leading-snug">
                        Orden personalizado
                      </span>
                    </div>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={handleDownload}
                disabled={processing || remaining === 0}
                className={cn(
                  "w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-all duration-200",
                  "bg-gradient-to-r from-primary to-secondary shadow-lg shadow-primary/25",
                  "hover:brightness-110 hover:scale-[1.01] active:scale-[0.99]",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:brightness-100"
                )}
              >
                {processing ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-white/80 border-t-transparent animate-spin" />
                    Procesando…
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    {markedPages.size > 0
                      ? `Descargar (${remaining} pág.)`
                      : "Descargar expediente"}
                  </>
                )}
              </button>

              {remaining === 0 && (
                <p className="text-[11px] text-center text-destructive">
                  No puedes eliminar todas las páginas
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

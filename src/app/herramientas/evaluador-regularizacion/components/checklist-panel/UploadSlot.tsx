"use client"

import { useEffect, useRef, useState } from "react"
import {
  AlertTriangle,
  CalendarX2,
  Eye,
  FileText,
  Loader2,
  RefreshCw,
  Sparkles,
  Upload,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { ChecklistItem, ExtractDocResult } from "../../types"
import { docStatusConfig, fileToBase64, formatDate, getMimeType } from "./utils"
import { DocViewerModal } from "./DocViewerModal"

interface UploadSlotProps {
  item: ChecklistItem
  pathway: "DA20" | "DA21"
  onResult: (result: ExtractDocResult) => void
  onDone: () => void
  onUndo?: () => void
}

export function UploadSlot({ item, pathway, onResult, onDone, onUndo }: UploadSlotProps) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ExtractDocResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentFile, setCurrentFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [showViewer, setShowViewer] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  async function analyzeFile(file: File) {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const data = await fileToBase64(file)
      const res = await fetch("/api/evaluador/extract-doc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pathway,
          docHint: item.uploadHint,
          file: { name: file.name, mimeType: getMimeType(file.name), data },
        }),
      })
      const json: ExtractDocResult & { error?: string } = await res.json()
      if (json.error) {
        setError(json.error)
        return
      }
      setResult(json)
      onResult(json)
      onDone()
    } catch {
      setError("Error al analizar el documento. Verifica tu conexion.")
    } finally {
      setLoading(false)
    }
  }

  function handleFile(file: File) {
    setCurrentFile(file)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(URL.createObjectURL(file))
    analyzeFile(file)
  }

  function handleReset() {
    setResult(null)
    setError(null)
    setCurrentFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    onUndo?.()
  }

  const obsTextColor = result
    ? {
        valido: "text-emerald-700 dark:text-emerald-400",
        valido_con_observaciones: "text-amber-700 dark:text-amber-400",
        invalido: "text-rose-600 dark:text-rose-400",
        no_identificado: "text-muted-foreground",
      }[result.estado]
    : ""

  const mimeType = currentFile ? getMimeType(currentFile.name) : ""

  if (result) {
    const dsCfg = docStatusConfig[result.estado] ?? docStatusConfig.no_identificado
    const DsIcon = dsCfg.icon
    const extractedFields = Object.entries(result.extractedData)
      .filter(([, v]) => v != null && v !== "")
      .map(([k]) => k)

    return (
      <>
        {showViewer && previewUrl && currentFile && (
          <DocViewerModal
            url={previewUrl}
            mimeType={mimeType}
            name={currentFile.name}
            onClose={() => setShowViewer(false)}
          />
        )}
        <div
          className="mt-2 rounded-lg border border-border/40 bg-card overflow-hidden"
          style={{ animation: "doccheck-pop 0.4s ease both" }}
        >
          <div className="px-3 py-2 flex items-center gap-2 border-b border-border/30">
            <FileText className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
            <span className="text-[11px] text-muted-foreground/70 truncate flex-1 min-w-0">
              {currentFile?.name}
            </span>
            {previewUrl && currentFile && (
              <button
                onClick={() => setShowViewer(true)}
                className="shrink-0 p-1 rounded hover:bg-muted/50 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                aria-label="Ver documento"
              >
                <Eye className="h-3 w-3" />
              </button>
            )}
            <button
              onClick={handleReset}
              className="text-[10px] text-muted-foreground hover:text-foreground underline shrink-0 ml-1"
            >
              cambiar
            </button>
          </div>

          <div className="px-3 py-2.5 flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <DsIcon className={cn("h-3.5 w-3.5 shrink-0", dsCfg.color)} />
              <span className={cn("text-xs font-semibold", dsCfg.color)}>{result.tipoDocumento}</span>
            </div>
            {result.fechaVencimiento && (
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <CalendarX2 className="h-3 w-3 shrink-0" />
                <span>Vence: {formatDate(result.fechaVencimiento)}</span>
              </div>
            )}
            {result.alertasValidez && result.alertasValidez.length > 0 && (
              <ul className="text-[11px] text-amber-700 dark:text-amber-400 flex flex-col gap-0.5">
                {result.alertasValidez.map((a, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            )}
            {result.observaciones.length > 0 && (
              <ul className={cn("text-[11px] flex flex-col gap-0.5", obsTextColor)}>
                {result.observaciones.map((o, i) => (
                  <li key={i}>• {o}</li>
                ))}
              </ul>
            )}
            {extractedFields.length > 0 && (
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400">
                <Sparkles className="h-3 w-3 shrink-0" />
                <span>Datos extraidos: {extractedFields.join(", ")}</span>
              </div>
            )}
          </div>
        </div>
      </>
    )
  }

  return (
    <div className="mt-2 flex flex-col gap-1.5">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      {loading && currentFile && (
        <div className="flex items-center gap-2 rounded-lg bg-muted/40 border border-border/40 px-3 py-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
          <span className="text-[11px] text-muted-foreground truncate flex-1">{currentFile.name}</span>
          <span className="text-[10px] text-muted-foreground/60 shrink-0">Analizando...</span>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 px-3 py-2 flex flex-col gap-1.5">
          <p className="text-[11px] text-rose-600 dark:text-rose-400">{error}</p>
          <div className="flex items-center gap-2">
            {currentFile && (
              <button
                onClick={() => analyzeFile(currentFile)}
                disabled={loading}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 dark:text-rose-400 hover:underline"
              >
                <RefreshCw className="h-3 w-3" />
                Reintentar analisis
              </button>
            )}
            {previewUrl && currentFile && (
              <button onClick={() => setShowViewer(true)} className="text-[10px] text-primary flex items-center gap-1">
                <Eye className="h-3 w-3" />
                ver documento
              </button>
            )}
          </div>
        </div>
      )}

      {!loading && (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary border border-primary/30 rounded-lg px-2.5 py-1.5 hover:bg-primary/5 transition-colors disabled:opacity-50 w-fit"
        >
          <Upload className="h-3 w-3" />
          {error ? "Subir otro archivo" : "Subir documento"}
        </button>
      )}

      {showViewer && previewUrl && currentFile && (
        <DocViewerModal
          url={previewUrl}
          mimeType={mimeType}
          name={currentFile.name}
          onClose={() => setShowViewer(false)}
        />
      )}
    </div>
  )
}

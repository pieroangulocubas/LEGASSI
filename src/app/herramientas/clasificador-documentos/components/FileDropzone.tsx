"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import { Upload, X, FileText, Camera, CheckCircle2, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { CameraScanner } from "@/components/camera-scanner"

export const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png"]
export const ACCEPTED_EXT = [".pdf", ".jpg", ".jpeg", ".png"]
export const MAX_FILES = 30
export const MAX_FILE_SIZE = 10 * 1024 * 1024   // 10 MB per file
export const MAX_TOTAL_SIZE = 50 * 1024 * 1024  // 50 MB total

export function FileDropzone({
  files,
  onAdd,
  onRemove,
  onClear,
}: {
  files: File[]
  onAdd: (newFiles: File[]) => void
  onRemove: (index: number) => void
  onClear: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [previews, setPreviews] = useState<Record<number, string>>({})
  const [sizeError, setSizeError] = useState("")
  const [showCamera, setShowCamera] = useState(false)
  // Cache object URLs keyed by File identity to avoid recreating on every render
  const urlCacheRef = useRef<Map<File, string>>(new Map())

  // Incremental preview updates: only create/revoke URLs for added or removed files
  useEffect(() => {
    const currentSet = new Set(files)
    // Revoke URLs for removed files
    for (const [file, url] of urlCacheRef.current) {
      if (!currentSet.has(file)) {
        URL.revokeObjectURL(url)
        urlCacheRef.current.delete(file)
      }
    }
    // Create URLs for newly added image and PDF files
    for (const file of files) {
      if ((file.type.startsWith("image/") || file.type === "application/pdf") && !urlCacheRef.current.has(file)) {
        urlCacheRef.current.set(file, URL.createObjectURL(file))
      }
    }
    // Rebuild index map
    const next: Record<number, string> = {}
    files.forEach((f, i) => {
      const url = urlCacheRef.current.get(f)
      if (url) next[i] = url
    })
    setPreviews(next)
  }, [files])

  // Revoke all remaining URLs on unmount
  useEffect(() => {
    const cache = urlCacheRef.current
    return () => {
      for (const url of cache.values()) URL.revokeObjectURL(url)
      cache.clear()
    }
  }, [])

  function validateAndAdd(incoming: FileList | null) {
    if (!incoming) return
    setSizeError("")
    const valid: File[] = []
    const oversized: string[] = []
    for (const f of Array.from(incoming)) {
      const lower = f.name.toLowerCase()
      if (!ACCEPTED_EXT.some((ext) => lower.endsWith(ext))) continue
      if (f.size > MAX_FILE_SIZE) {
        oversized.push(f.name)
        continue
      }
      valid.push(f)
    }
    if (oversized.length > 0) {
      setSizeError(
        `${oversized.length === 1 ? `"${oversized[0]}" supera` : `${oversized.length} archivos superan`} el límite de 10 MB por archivo y no se han añadido.`
      )
    }
    if (valid.length === 0) return
    // Check file count limit
    const slotsLeft = MAX_FILES - files.length
    if (slotsLeft <= 0) {
      setSizeError(`Ya tienes ${MAX_FILES} archivos — el máximo por análisis. Analiza estos y usa un segundo análisis para el resto.`)
      return
    }
    const clipped = valid.slice(0, slotsLeft)
    if (clipped.length < valid.length) {
      setSizeError(`Solo se han añadido ${clipped.length} de ${valid.length} archivos — límite de ${MAX_FILES} por análisis alcanzado. Analiza estos primero y sube el resto en un segundo análisis.`)
    }
    // Check total size after adding
    const currentTotal = files.reduce((a, f) => a + f.size, 0)
    const incomingTotal = clipped.reduce((a, f) => a + f.size, 0)
    if (currentTotal + incomingTotal > MAX_TOTAL_SIZE) {
      setSizeError("El total de archivos supera los 50 MB. Elimina alguno antes de añadir más.")
      return
    }
    onAdd(clipped)
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      validateAndAdd(e.dataTransfer.files)
    },
    [onAdd]
  )

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  const totalSize = files.reduce((a, f) => a + f.size, 0)

  return (
    <div className="space-y-3">
      {/* Camera scanner modal */}
      {showCamera && (
        <CameraScanner
          onCapture={(file) => {
            const dt = new DataTransfer()
            dt.items.add(file)
            validateAndAdd(dt.files)
          }}
          onClose={() => setShowCamera(false)}
        />
      )}

      {/* Dropzone */}
      <div
        role="button"
        tabIndex={0}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors cursor-pointer",
          dragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/30"
        )}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
      >
        <Upload className="mb-3 h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">
          Arrastra tus archivos aquí o{" "}
          <span className="text-primary underline underline-offset-2">selecciónalos</span>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          PDF, JPG o PNG · Máximo {MAX_FILES} archivos · 10 MB por archivo · 50 MB total
        </p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          Un archivo por documento · Si un doc ocupa varias páginas, súbelo como un solo PDF
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_EXT.join(",")}
          className="hidden"
          onChange={(e) => validateAndAdd(e.target.files)}
        />
      </div>

      {/* Camera scan button */}
      <button
        type="button"
        onClick={() => setShowCamera(true)}
        className="group relative w-full flex items-center gap-3 rounded-xl bg-[#1a1a2e] px-4 py-3 hover:bg-[#1a1a2e]/90 transition-all duration-200 overflow-hidden shadow-md shadow-[#1a1a2e]/20"
      >
        {/* Subtle sweep on hover */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/5 to-transparent"
        />
        <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 ring-2 ring-white/20 group-hover:bg-white/15 transition-all">
          <Camera className="h-5 w-5 text-white" />
        </span>
        <span className="relative text-left">
          <span className="block text-sm font-semibold text-white">
            Escanear con la cámara
          </span>
          <span className="block text-xs text-white/50 mt-0.5">
            Saca una foto al documento directamente
          </span>
        </span>
        <svg
          aria-hidden="true"
          className="relative ml-auto h-4 w-4 text-white/40 group-hover:text-white/70 group-hover:translate-x-0.5 transition-all shrink-0"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Upload guidance */}
      <div className="rounded-xl border border-border overflow-hidden text-xs">
        {/* DO rules */}
        <div className="px-3 py-2.5 bg-background space-y-2">
          <p className="font-semibold text-foreground">Cómo preparar los archivos</p>
          <div className="space-y-1.5 text-muted-foreground">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-px text-emerald-500" />
              <span>
                <strong className="text-foreground font-medium">Un documento por archivo</strong>
                {" "}— nómina, factura, extracto bancario, contrato de trabajo…
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-px text-emerald-500" />
              <span>
                <strong className="text-foreground font-medium">Si tiene varias páginas</strong>
                {" "}— súbelo como un único PDF con todas las páginas juntas.
              </span>
            </div>
          </div>
        </div>

        {/* Critical warning */}
        <div className="border-t border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/30 px-3 py-2.5">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-px text-amber-600 dark:text-amber-400" />
            <span className="text-amber-900 dark:text-amber-200">
              <strong className="font-semibold">No mezcles varios documentos en un mismo PDF.</strong>
              {" "}
              <span className="text-amber-800/75 dark:text-amber-300/70">
                Si los tienes así escaneados, sepáralos antes de subir — mejora mucho la precisión del análisis.
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Size / limit error */}
      {sizeError && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-300 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-950/30 px-3 py-2.5 text-xs text-amber-900 dark:text-amber-200">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-px text-amber-600 dark:text-amber-400" />
          <span>{sizeError}</span>
        </div>
      )}

      {/* Mosaic grid */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span className={totalSize > MAX_TOTAL_SIZE * 0.85 ? "text-amber-600 dark:text-amber-400 font-medium" : ""}>
              {files.length}/{MAX_FILES} archivo{files.length !== 1 ? "s" : ""} · {formatSize(totalSize)} / 50 MB
            </span>
            <button
              type="button"
              onClick={onClear}
              className="text-xs text-destructive/70 hover:text-destructive transition-colors underline underline-offset-2"
            >
              Limpiar todo
            </button>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {files.map((f, i) => (
              <div
                key={i}
                className="group relative flex flex-col rounded-lg border border-border overflow-hidden bg-muted"
              >
                {/* Thumbnail area */}
                <div className="aspect-square w-full overflow-hidden bg-muted relative">
                  {previews[i] && f.type.startsWith("image/") ? (
                    <img
                      src={previews[i]}
                      alt={f.name}
                      className="h-full w-full object-cover"
                    />
                  ) : previews[i] && f.type === "application/pdf" ? (
                    <div className="relative h-full w-full overflow-hidden bg-white">
                      <embed
                        src={`${previews[i]}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                        type="application/pdf"
                        className="absolute top-0 left-0"
                        style={{
                          width: "400%",
                          height: "400%",
                          transform: "scale(0.25)",
                          transformOrigin: "top left",
                          pointerEvents: "none",
                          userSelect: "none",
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-1 p-2">
                      <FileText className="h-7 w-7 text-muted-foreground/60" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                        PDF
                      </span>
                    </div>
                  )}

                  {/* File type badge */}
                  <span className="absolute bottom-1 left-1 rounded px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide leading-none
                    bg-black/40 text-white backdrop-blur-sm">
                    {f.type === "application/pdf" ? "PDF"
                      : f.type === "image/png" ? "PNG"
                      : "JPG"}
                  </span>
                </div>

                {/* File name */}
                <div className="px-1.5 py-1 bg-background border-t border-border">
                  <p className="truncate text-[10px] text-muted-foreground leading-tight">
                    {f.name}
                  </p>
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemove(i)
                  }}
                  className="absolute top-1 right-1 rounded-full bg-black/50 p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                  aria-label={`Eliminar ${f.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

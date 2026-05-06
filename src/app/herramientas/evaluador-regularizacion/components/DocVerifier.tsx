"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import {
  Upload, X, CheckCircle2, AlertTriangle, XCircle, HelpCircle,
  ChevronDown, ChevronUp, Loader2, FileImage, FileScan, Monitor, Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type { DocAnalysisItem, DocStatus, DA21Supuesto } from "../types"

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"]
const MAX_FILES = 15
const MAX_SIZE_MB = 5

function getMimeType(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase()
  if (ext === "pdf") return "application/pdf"
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg"
  if (ext === "png") return "image/png"
  if (ext === "webp") return "image/webp"
  return "application/octet-stream"
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader()
    reader.onload = () => res((reader.result as string).split(",")[1])
    reader.onerror = rej
    reader.readAsDataURL(file)
  })
}

const STATUS_CFG: Record<DocStatus, {
  icon: React.ElementType; label: string
  color: string; bg: string; border: string; iconAnim?: string
}> = {
  valido: {
    icon: CheckCircle2, label: "Válido",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-800",
    iconAnim: "doccheck-pop",
  },
  valido_con_observaciones: {
    icon: AlertTriangle, label: "Válido con observaciones",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-800",
    iconAnim: "doccheck-wobble",
  },
  invalido: {
    icon: XCircle, label: "Inválido",
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    border: "border-rose-200 dark:border-rose-800",
    iconAnim: "doccheck-shake",
  },
  no_identificado: {
    icon: HelpCircle, label: "No identificado",
    color: "text-slate-500 dark:text-slate-400",
    bg: "bg-slate-50 dark:bg-slate-900/40",
    border: "border-slate-200 dark:border-slate-700",
  },
}

// ─── Animated doc card ────────────────────────────────────────────────────────

function DocCard({ item, isDA20, index }: { item: DocAnalysisItem; isDA20: boolean; index: number }) {
  const [expanded, setExpanded] = useState(item.estado !== "valido")
  const [visible, setVisible] = useState(false)
  const cfg = STATUS_CFG[item.estado]
  const Icon = cfg.icon

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), index * 120)
    return () => clearTimeout(t)
  }, [index])

  const hasPresencial = item.sugerencias_presencial.length > 0
  const hasTelematica = isDA20 && item.sugerencias_telematica && item.sugerencias_telematica.length > 0

  return (
    <div
      className={cn("rounded-xl border overflow-hidden transition-all duration-300", cfg.border)}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(10px)",
      }}
    >
      <button
        onClick={() => setExpanded((e) => !e)}
        className={cn("w-full flex items-center gap-3 px-4 py-3 text-left", cfg.bg)}
      >
        <Icon
          className={cn("h-4 w-4 shrink-0", cfg.color)}
          style={cfg.iconAnim ? { animation: `${cfg.iconAnim} 0.5s ease ${index * 0.12 + 0.1}s both` } : undefined}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold truncate">{item.tipoDocumento || item.fileName}</p>
            <span className={cn("text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border", cfg.color, cfg.border)}>
              {cfg.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{item.descripcion}</p>
        </div>
        {expanded
          ? <ChevronUp className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          : <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
      </button>

      {expanded && (item.observaciones.length > 0 || hasPresencial || hasTelematica) && (
        <div className="bg-card border-t border-border/40 px-4 py-4 flex flex-col gap-4">
          {item.observaciones.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400 mb-2">Observaciones</p>
              <ul className="flex flex-col gap-1.5">
                {item.observaciones.map((obs, i) => (
                  <li key={i} className="flex gap-2 items-start text-xs text-foreground/80 leading-relaxed">
                    <span className="text-rose-500 shrink-0 mt-0.5">•</span>{obs}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {hasPresencial && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/50 mb-2 flex items-center gap-1.5">
                <Users className="h-3 w-3" /> Presentación presencial
              </p>
              <ul className="flex flex-col gap-1.5">
                {item.sugerencias_presencial.map((s, i) => (
                  <li key={i} className="flex gap-2 items-start text-xs text-foreground/80 leading-relaxed">
                    <span className="text-primary shrink-0 mt-0.5">→</span>{s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {hasTelematica && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-1.5">
                <Monitor className="h-3 w-3" /> Presentación telemática (MERCURIO · Cert. digital)
              </p>
              <ul className="flex flex-col gap-1.5">
                {item.sugerencias_telematica!.map((s, i) => (
                  <li key={i} className="flex gap-2 items-start text-xs text-foreground/80 leading-relaxed">
                    <span className="text-blue-500 shrink-0 mt-0.5">→</span>{s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Summary bar ──────────────────────────────────────────────────────────────

function SummaryBar({ results }: { results: DocAnalysisItem[] }) {
  const counts = {
    valido: results.filter((r) => r.estado === "valido").length,
    obs: results.filter((r) => r.estado === "valido_con_observaciones").length,
    invalido: results.filter((r) => r.estado === "invalido").length,
    unid: results.filter((r) => r.estado === "no_identificado").length,
  }

  return (
    <div className="grid grid-cols-4 gap-2">
      {[
        { label: "Válidos", count: counts.valido, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800" },
        { label: "Con obs.", count: counts.obs, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800" },
        { label: "Inválidos", count: counts.invalido, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800" },
        { label: "Sin ID", count: counts.unid, color: "text-slate-500 dark:text-slate-400", bg: "bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700" },
      ].map((item) => (
        <div key={item.label} className={cn("rounded-xl border px-3 py-3 text-center", item.bg)}>
          <p className={cn("text-2xl font-bold tabular-nums", item.color)}>{item.count}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{item.label}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface DocVerifierProps {
  pathway: "DA20" | "DA21"
  da21Supuestos: DA21Supuesto[]
  onAllPassed?: () => void
}

export function DocVerifier({ pathway, da21Supuestos, onAllPassed }: DocVerifierProps) {
  const [open, setOpen] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<DocAnalysisItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const valid = Array.from(incoming).filter((f) => {
      const mime = getMimeType(f.name)
      return ALLOWED_TYPES.includes(mime) && f.size <= MAX_SIZE_MB * 1024 * 1024
    })
    setFiles((prev) => [...prev, ...valid].slice(0, MAX_FILES))
    setResults(null)
  }, [])

  function removeFile(i: number) {
    setFiles((f) => f.filter((_, idx) => idx !== i))
    setResults(null)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    addFiles(e.dataTransfer.files)
  }

  async function analyze() {
    if (files.length === 0) return
    setError(null)
    setLoading(true)
    setResults(null)

    try {
      const encoded = await Promise.all(
        files.map(async (f) => ({
          name: f.name, mimeType: getMimeType(f.name), data: await fileToBase64(f),
        }))
      )

      const res = await fetch("/api/evaluador/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pathway, supuestos: da21Supuestos, files: encoded }),
      })

      const json = await res.json()
      if (!res.ok || json.error) { setError(json.error ?? "Error en el análisis."); return }

      const items: DocAnalysisItem[] = json.results
      setResults(items)

      // Trigger confetti + completion if all docs pass
      const allPassed = items.length > 0 && items.every(
        (r) => r.estado === "valido" || r.estado === "valido_con_observaciones"
      )
      if (allPassed) onAllPassed?.()

    } catch {
      setError("Error de conexión. Inténtalo de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  const isDA20 = pathway === "DA20"

  return (
    <>
      {/* Keyframe animations */}
      <style>{`
        @keyframes doccheck-pop {
          0%   { transform: scale(0); opacity: 0; }
          60%  { transform: scale(1.35); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes doccheck-wobble {
          0%, 100% { transform: rotate(0deg); }
          20%      { transform: rotate(-12deg); }
          40%      { transform: rotate(10deg); }
          60%      { transform: rotate(-8deg); }
          80%      { transform: rotate(6deg); }
        }
        @keyframes doccheck-shake {
          0%, 100% { transform: translateX(0); }
          20%      { transform: translateX(-4px); }
          40%      { transform: translateX(4px); }
          60%      { transform: translateX(-3px); }
          80%      { transform: translateX(3px); }
        }
      `}</style>

      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/40 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <FileScan className="h-4 w-4 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold">Verificar documentos del expediente</p>
              <p className="text-xs text-muted-foreground">IA analiza cada documento: válido / con obs. / inválido</p>
            </div>
          </div>
          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>

        {open && (
          <div className="border-t border-border/40 px-5 pb-5 pt-4 flex flex-col gap-4">

            {isDA20 && (
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 px-4 py-3 flex gap-2.5 items-start">
                <Monitor className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                  Como solicitante de PI (DA20), el análisis incluye sugerencias para la <strong>presentación telemática</strong> vía MERCURIO con certificado digital.
                </p>
              </div>
            )}

            {/* Drop zone — always visible */}
            {!results && (
              <>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  onClick={() => inputRef.current?.click()}
                  className={cn(
                    "relative rounded-xl border-2 border-dashed cursor-pointer transition-colors flex flex-col items-center justify-center gap-3 py-8 px-4",
                    dragging
                      ? "border-primary bg-primary/5"
                      : "border-border/60 bg-muted/30 hover:border-primary/40 hover:bg-muted/50",
                  )}
                >
                  <input
                    ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp"
                    multiple className="hidden"
                    onChange={(e) => e.target.files && addFiles(e.target.files)}
                  />
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Upload className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">Sube los documentos del expediente</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF, JPG, PNG · máx {MAX_SIZE_MB} MB · hasta {MAX_FILES} docs
                    </p>
                  </div>
                  <p className="text-[11px] text-muted-foreground text-center max-w-sm">
                    Pasaporte, antecedentes penales, justificante de pago 790-052, doc. PI, certificado vulnerabilidad, contratos…
                  </p>
                </div>

                {files.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {files.map((f, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/30 px-3 py-2">
                        <FileImage className="h-4 w-4 text-muted-foreground shrink-0" />
                        <p className="text-xs flex-1 truncate">{f.name}</p>
                        <p className="text-[10px] text-muted-foreground shrink-0">{(f.size / 1024).toFixed(0)} KB</p>
                        <button onClick={() => removeFile(i)} className="shrink-0 p-0.5 hover:text-rose-500 transition-colors">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}

                {files.length > 0 && (
                  <Button onClick={analyze} disabled={loading} className="gap-2">
                    {loading ? (
                      <><Loader2 className="h-4 w-4 animate-spin" />Analizando {files.length} documento{files.length !== 1 ? "s" : ""}…</>
                    ) : (
                      <><FileScan className="h-4 w-4" />Analizar expediente ({files.length} doc{files.length !== 1 ? "s" : ""})</>
                    )}
                  </Button>
                )}
              </>
            )}

            {/* Results with animations */}
            {results && (
              <div className="flex flex-col gap-4">
                <SummaryBar results={results} />
                <div className="flex flex-col gap-3">
                  {results.map((item, i) => (
                    <DocCard key={item.docIndex} item={item} isDA20={isDA20} index={i} />
                  ))}
                </div>
                <button
                  onClick={() => { setResults(null); setFiles([]) }}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors text-center"
                >
                  Analizar otros documentos
                </button>
              </div>
            )}

          </div>
        )}
      </div>
    </>
  )
}

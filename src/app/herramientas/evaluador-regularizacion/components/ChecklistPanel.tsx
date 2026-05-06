"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import {
  CheckCircle2, XCircle, AlertTriangle, Info, ExternalLink, Scan,
  Upload, Loader2, Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { ChecklistItem, ChecklistStatus, DocStatus, ExtractDocResult, PersonalData } from "../types"

const statusConfig: Record<ChecklistStatus, { icon: React.ElementType; color: string; bg: string; border: string }> = {
  available: { icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40", border: "border-emerald-200 dark:border-emerald-800" },
  missing:   { icon: XCircle,      color: "text-rose-600 dark:text-rose-400",    bg: "bg-rose-50 dark:bg-rose-950/40",    border: "border-rose-200 dark:border-rose-800" },
  warning:   { icon: AlertTriangle, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/40",  border: "border-amber-200 dark:border-amber-800" },
  info:      { icon: Info,          color: "text-blue-600 dark:text-blue-400",   bg: "bg-blue-50 dark:bg-blue-950/40",    border: "border-blue-200 dark:border-blue-800" },
}

const docStatusConfig: Record<DocStatus, { icon: React.ElementType; color: string }> = {
  valido:                   { icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400" },
  valido_con_observaciones: { icon: AlertTriangle, color: "text-amber-600 dark:text-amber-400" },
  invalido:                 { icon: XCircle, color: "text-rose-600 dark:text-rose-400" },
  no_identificado:          { icon: Info, color: "text-slate-500 dark:text-slate-400" },
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader()
    reader.onload = () => res((reader.result as string).split(",")[1])
    reader.onerror = rej
    reader.readAsDataURL(file)
  })
}

function getMimeType(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase()
  if (ext === "pdf") return "application/pdf"
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg"
  if (ext === "png") return "image/png"
  if (ext === "webp") return "image/webp"
  return "application/octet-stream"
}

// ─── Upload slot per item ─────────────────────────────────────────────────────

interface UploadSlotProps {
  item: ChecklistItem
  pathway: "DA20" | "DA21"
  onResult: (result: ExtractDocResult) => void
}

function UploadSlot({ item, pathway, onResult }: UploadSlotProps) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ExtractDocResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
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
      if (json.error) { setError(json.error); return }
      setResult(json)
      onResult(json)
    } catch {
      setError("Error al analizar el documento.")
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    const dsCfg = docStatusConfig[result.estado]
    const DsIcon = dsCfg.icon
    const extractedFields = Object.entries(result.extractedData)
      .filter(([, v]) => v != null && v !== "")
      .map(([k]) => k)

    return (
      <div
        className="mt-2 rounded-lg border border-border/40 bg-card px-3 py-2 flex flex-col gap-1.5"
        style={{ animation: "doccheck-pop 0.4s ease both" }}
      >
        <div className="flex items-center gap-2">
          <DsIcon className={cn("h-3.5 w-3.5 shrink-0", dsCfg.color)} />
          <span className={cn("text-xs font-semibold", dsCfg.color)}>{result.tipoDocumento}</span>
          <button
            onClick={() => { setResult(null); setError(null) }}
            className="ml-auto text-[10px] text-muted-foreground hover:text-foreground underline"
          >
            cambiar
          </button>
        </div>
        {result.observaciones.length > 0 && (
          <ul className="text-[11px] text-rose-600 dark:text-rose-400 flex flex-col gap-0.5">
            {result.observaciones.map((o, i) => <li key={i}>• {o}</li>)}
          </ul>
        )}
        {extractedFields.length > 0 && (
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400">
            <Sparkles className="h-3 w-3 shrink-0" />
            <span>Datos extraídos: {extractedFields.join(", ")}</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="mt-2">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      {error && <p className="text-[11px] text-rose-500 mb-1">{error}</p>}
      <button
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary border border-primary/30 rounded-lg px-2.5 py-1.5 hover:bg-primary/5 transition-colors disabled:opacity-50"
      >
        {loading
          ? <><Loader2 className="h-3 w-3 animate-spin" />Verificando…</>
          : <><Upload className="h-3 w-3" />Subir documento</>}
      </button>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface ChecklistPanelProps {
  items: ChecklistItem[]
  pathway: "DA20" | "DA21"
  onDataExtracted?: (data: Partial<PersonalData>) => void
}

export function ChecklistPanel({ items, pathway, onDataExtracted }: ChecklistPanelProps) {
  return (
    <>
      <style>{`
        @keyframes doccheck-pop {
          0%   { transform: scale(0.8); opacity: 0; }
          60%  { transform: scale(1.03); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
      <div className="flex flex-col gap-3">
        {items.map((item) => {
          const cfg = statusConfig[item.status]
          const Icon = cfg.icon

          return (
            <div
              key={item.id}
              className={cn("rounded-xl border p-4", cfg.bg, cfg.border)}
            >
              <div className="flex gap-3">
                <Icon className={cn("h-4 w-4 shrink-0 mt-0.5", cfg.color)} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-snug">{item.label}</p>
                  {item.detail && (
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.detail}</p>
                  )}
                  {item.linkHref && item.linkLabel && (
                    item.isClassificadorLink ? (
                      <Link
                        href={item.linkHref}
                        className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                      >
                        <Scan className="h-3 w-3" />
                        {item.linkLabel}
                      </Link>
                    ) : (
                      <a
                        href={item.linkHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {item.linkLabel}
                      </a>
                    )
                  )}
                  {item.uploadable && (
                    <UploadSlot
                      item={item}
                      pathway={pathway}
                      onResult={(result) => {
                        if (!onDataExtracted) return
                        // Convert null values to undefined and merge only non-null fields
                        const cleaned: Partial<PersonalData> = {}
                        const d = result.extractedData
                        if (d.nombre)           cleaned.nombre = d.nombre
                        if (d.primerApellido)   cleaned.primerApellido = d.primerApellido
                        if (d.segundoApellido)  cleaned.segundoApellido = d.segundoApellido
                        if (d.sexo)             cleaned.sexo = d.sexo
                        if (d.fechaNacimiento)  cleaned.fechaNacimiento = d.fechaNacimiento
                        if (d.lugarNacimiento)  cleaned.lugarNacimiento = d.lugarNacimiento
                        if (d.paisNacimiento)   cleaned.paisNacimiento = d.paisNacimiento
                        if (d.nacionalidad)     cleaned.nacionalidad = d.nacionalidad
                        if (d.pasaporte)        cleaned.pasaporte = d.pasaporte
                        if (d.nie)              cleaned.nie = d.nie
                        if (d.domicilio)        cleaned.domicilio = d.domicilio
                        if (d.piso)             cleaned.piso = d.piso
                        if (d.localidad)        cleaned.localidad = d.localidad
                        if (d.provincia)        cleaned.provincia = d.provincia
                        if (d.cp)               cleaned.cp = d.cp
                        if (d.telefono)         cleaned.telefono = d.telefono
                        if (d.email)            cleaned.email = d.email
                        if (d.numExpedientePi)  cleaned.numExpedientePi = d.numExpedientePi
                        if (d.estadoPi)         cleaned.estadoPi = d.estadoPi as PersonalData["estadoPi"]
                        if (Object.keys(cleaned).length > 0) onDataExtracted(cleaned)
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

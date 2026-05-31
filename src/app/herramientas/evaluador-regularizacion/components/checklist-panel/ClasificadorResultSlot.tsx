"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, FileText, Scan, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface ClsBridgeDoc {
  tipo: string
  originalName: string
  fechas: string[]
  fuerza: string
  descripcion_breve: string
}

interface ClsBridgeMonth {
  yearMonth: string
  label: string
  status: "CUBIERTO" | "DÉBIL" | "VACÍO"
  isOptional: boolean
}

interface ClsBridgeResult {
  veredicto: "CUMPLE" | "CUMPLE_PARCIALMENTE" | "NO_CUMPLE"
  validDocs: ClsBridgeDoc[]
  months: ClsBridgeMonth[]
  mesPresentation: string
  savedAt: string
}

export function ClasificadorResultSlot({ onDone }: { onDone: () => void }) {
  const [bridge, setBridge] = useState<ClsBridgeResult | null>(null)
  const [expanded, setExpanded] = useState(false)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  useEffect(() => {
    function readBridgeFromStorage() {
      try {
        const raw = localStorage.getItem("cls_evaluador_result")
        if (raw) {
          const parsed: ClsBridgeResult = JSON.parse(raw)
          setBridge(parsed)
          if (parsed.veredicto !== "NO_CUMPLE") onDoneRef.current()
        }
      } catch {
        // ignore corrupted data
      }
    }

    try {
      const sessionRaw = sessionStorage.getItem("cls_evaluador_result")
      if (sessionRaw) {
        const parsed: ClsBridgeResult = JSON.parse(sessionRaw)
        setBridge(parsed)
        if (parsed.veredicto !== "NO_CUMPLE") onDoneRef.current()
      }
    } catch {
      // ignore
    }

    window.addEventListener("storage", readBridgeFromStorage)
    return () => window.removeEventListener("storage", readBridgeFromStorage)
  }, [])

  if (!bridge) {
    return (
      <div className="mt-2 flex flex-col gap-1.5">
        <Link
          href="/herramientas/permanencia?from=evaluador"
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary border border-primary/30 rounded-lg px-2.5 py-1.5 hover:bg-primary/5 transition-colors w-fit"
        >
          <Scan className="h-3 w-3" />
          Verificar permanencia con el Clasificador
        </Link>
        <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
          Usa el Clasificador para analizar tus documentos. El veredicto de cobertura aparecera aqui automaticamente.
        </p>
      </div>
    )
  }

  const isOk = bridge.veredicto !== "NO_CUMPLE"
  const verdLabel =
    bridge.veredicto === "CUMPLE"
      ? "Permanencia verificada"
      : bridge.veredicto === "CUMPLE_PARCIALMENTE"
        ? "Permanencia parcial"
        : "Permanencia insuficiente"
  const VerdIcon =
    bridge.veredicto === "CUMPLE"
      ? CheckCircle2
      : bridge.veredicto === "CUMPLE_PARCIALMENTE"
        ? AlertTriangle
        : XCircle
  const verdColors =
    bridge.veredicto === "CUMPLE"
      ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
      : bridge.veredicto === "CUMPLE_PARCIALMENTE"
        ? "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800"
        : "text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800"

  return (
    <div className="mt-2 flex flex-col gap-2">
      <div className={cn("rounded-lg border px-3 py-2 flex items-center gap-2", verdColors)}>
        <VerdIcon className="h-3.5 w-3.5 shrink-0" />
        <span className="text-xs font-semibold flex-1">{verdLabel}</span>
        {!isOk && (
          <span className="text-[10px] font-medium opacity-70 shrink-0">
            Completa los meses vacios y vuelve a analizar
          </span>
        )}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="shrink-0 p-0.5 rounded hover:opacity-70 transition-opacity"
          aria-label={expanded ? "Ocultar detalles" : "Ver detalles"}
        >
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {expanded && (
        <div className="rounded-lg border border-border/40 bg-card overflow-hidden text-[11px]">
          <div className="px-3 py-1.5 border-b border-border/30">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Cobertura mensual</p>
          </div>
          <div className="divide-y divide-border/20">
            {bridge.months.map((m) => (
              <div key={m.yearMonth} className="px-3 py-1.5 flex items-center gap-2">
                <span
                  className={cn(
                    "h-2 w-2 rounded-full shrink-0",
                    m.status === "CUBIERTO" ? "bg-emerald-500" : m.status === "DÉBIL" ? "bg-amber-400" : "bg-rose-500"
                  )}
                />
                <span className="flex-1 text-foreground">{m.label}</span>
                <span
                  className={cn(
                    "font-semibold text-[10px] shrink-0",
                    m.status === "CUBIERTO"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : m.status === "DÉBIL"
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-rose-600 dark:text-rose-400"
                  )}
                >
                  {m.status === "CUBIERTO" ? "Cubierto" : m.status === "DÉBIL" ? "Debil" : "Vacio"}
                  {m.isOptional ? " (opt.)" : ""}
                </span>
              </div>
            ))}
          </div>
          {bridge.validDocs.length > 0 && (
            <>
              <div className="px-3 py-1.5 border-t border-border/30">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Documentos validos ({bridge.validDocs.length})
                </p>
              </div>
              <div className="divide-y divide-border/20">
                {bridge.validDocs.map((doc, i) => (
                  <div key={i} className="px-3 py-1.5 flex items-start gap-2">
                    <FileText className="h-3 w-3 shrink-0 text-muted-foreground/50 mt-0.5" />
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{doc.descripcion_breve || doc.originalName}</p>
                      <p className="text-[10px] text-muted-foreground">{doc.fechas.join(", ")}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <Link
        href="/herramientas/permanencia?from=evaluador"
        className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-primary hover:underline"
      >
        <Scan className="h-3 w-3" />
        {isOk ? "Actualizar analisis en el Clasificador" : "Abrir el Clasificador para completar los meses"}
      </Link>
    </div>
  )
}

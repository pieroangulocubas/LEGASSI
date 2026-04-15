"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  AlertCircle,
  XCircle,
  Loader2,
  ArrowLeft,
  ShieldCheck,
  Download,
  MessageCircle,
} from "lucide-react"
import { generatePDF, addQRToFirstPage, addPageNumbers } from "../pdf-utils"
import type { AnalysisResult, ClasificadorFormData, DocumentResult, PresentationMonth } from "../types"
import { runRulesEngine, PRESENTATION_MONTH_LABELS } from "../logic"
import { PreviewModal } from "./PreviewModal"
import { PdfPreviewModal } from "./PdfPreviewModal"
import { VeredictoBanner } from "./VeredictoBanner"
import { MonthCard } from "./MonthCard"
import { DocIssueList } from "./DocIssueList"
import { ObservadoList } from "./ObservadoList"
import { ValidDocsList } from "./ValidDocsList"
import { FuerzaLegend } from "./FuerzaLegend"

export function ResultsView({
  result: _initialResult,
  rawResults,
  formData,
  files,
  creditsRemaining,
  onReset,
}: {
  result: AnalysisResult
  rawResults: DocumentResult[]
  formData: ClasificadorFormData
  files: File[]
  creditsRemaining: number | null
  onReset: () => void
}) {
  const [activeMonth, setActiveMonth] = useState<PresentationMonth>(formData.mesPresentation)
  // Indices into rawResults that the user has manually approved from the observados queue
  const [approvedIndices, setApprovedIndices] = useState<Set<number>>(new Set())
  const [pdfGenerating, setPdfGenerating] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const [previewDoc, setPreviewDoc] = useState<DocumentResult | null>(null)
  const [pdfPreviewBytes, setPdfPreviewBytes] = useState<Uint8Array | null>(null)

  // Derive result on every render — no stale state
  const effectiveResults = rawResults.map((doc, i) =>
    doc.observado && approvedIndices.has(i)
      ? { ...doc, valido: true, observado: false }
      : doc
  )
  const result = runRulesEngine(effectiveResults, activeMonth)

  // All docs that Gemini flagged as observado (constant — derived from rawResults)
  const allObservadoDocs = rawResults.filter((d) => d.observado)

  function handleAprobarObservado(doc: DocumentResult) {
    const idx = rawResults.indexOf(doc)
    if (idx === -1) return
    setApprovedIndices((prev) => new Set([...prev, idx]))
  }

  function handleDesaprobarObservado(doc: DocumentResult) {
    const idx = rawResults.indexOf(doc)
    if (idx === -1) return
    setApprovedIndices((prev) => {
      const next = new Set(prev)
      next.delete(idx)
      return next
    })
  }

  function handlePreview(doc: DocumentResult) {
    setPreviewDoc(doc)
  }
  function handleClosePreview() {
    setPreviewDoc(null)
  }

  // Prepare signed upload URL for background Supabase upload (non-blocking, non-fatal)
  async function prepareUpload(token: string): Promise<{ publicUrl?: string; signedUrl?: string }> {
    try {
      const prep = await fetch("/api/clasificador/prepare-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })
      if (prep.ok) return await prep.json()
    } catch { /* non-fatal */ }
    return {}
  }

  // Background upload to Supabase + optional email notification
  function uploadAndNotify(blob: Blob, signedUrl: string, publicUrl: string) {
    ;(async () => {
      try {
        await fetch(signedUrl, {
          method: "PUT",
          headers: { "Content-Type": "application/pdf" },
          body: blob,
        })
        if (result.veredicto === "CUMPLE" && formData.email) {
          await fetch("/api/clasificador/notify-upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: formData.email,
              nombre: formData.nombre,
              publicUrl,
              months: result.months.map((m) => ({
                label: m.label,
                status: m.status,
                isOptional: m.isOptional,
              })),
            }),
          })
        }
      } catch { /* background failure — user already has the file */ }
    })()
  }

  // Triggered when user clicks "Descargar" in the preview modal (after optional page removal).
  // QR and page numbers are applied here — on the final bytes — so:
  //   1. The QR URL matches the file that actually gets uploaded (single prepareUpload call)
  //   2. Page numbers are correct after any pages were removed in the preview
  async function handleFinalDownload(finalBytes: Uint8Array) {
    const token = typeof window !== "undefined" ? localStorage.getItem("clasificador_token") : null
    const { signedUrl, publicUrl } = token ? await prepareUpload(token) : {}

    // Post-process: number pages first (so count is accurate), then inject QR
    let processedBytes = await addPageNumbers(finalBytes)
    if (publicUrl) {
      processedBytes = await addQRToFirstPage(processedBytes, publicUrl)
    }

    const blob = new Blob([processedBytes], { type: "application/pdf" })
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = blobUrl
    a.download = `expediente_${formData.nombre.replace(/\s+/g, "_").toLowerCase()}.pdf`
    a.click()
    URL.revokeObjectURL(blobUrl)

    if (signedUrl && publicUrl) uploadAndNotify(blob, signedUrl, publicUrl)
  }

  // Opens the preview modal — generates PDF bytes (without QR/page numbers, applied at download).
  async function handleOpenPreview() {
    setPdfGenerating(true)
    setPdfError(null)
    try {
      const pdfBytes = await generatePDF(
        result,
        files,
        { nombre: formData.nombre, mesPresentation: formData.mesPresentation },
      )
      setPdfPreviewBytes(new Uint8Array(pdfBytes))
    } catch (err) {
      console.error("PDF generation error:", err)
      setPdfError("No se pudo generar el PDF. Inténtalo de nuevo.")
    } finally {
      setPdfGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Preview modal */}
      {previewDoc && (
        <PreviewModal
          key={previewDoc.fileIndex}
          doc={previewDoc}
          file={files[previewDoc.fileIndex]}
          onClose={handleClosePreview}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Analizar de nuevo
        </button>
        {creditsRemaining !== null && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            {creditsRemaining} análisis disponible{creditsRemaining !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">Resultado del análisis</h2>
          <p className="text-sm text-muted-foreground mt-1">{formData.nombre}</p>
        </div>

        {/* Month switcher — re-runs rules engine locally, no credit consumed */}
        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2">
          <span className="text-xs text-muted-foreground shrink-0">Mes de presentación:</span>
          <div className="flex gap-1.5 flex-wrap">
            {(Object.entries(PRESENTATION_MONTH_LABELS) as [PresentationMonth, string][]).map(
              ([month, label]) => (
                <button
                  key={month}
                  type="button"
                  onClick={() => setActiveMonth(month)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
                    activeMonth === month
                      ? "bg-gradient-to-r from-primary to-secondary text-white shadow-sm shadow-primary/20"
                      : "border border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-muted/40"
                  }`}
                >
                  {label}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Veredicto */}
      <VeredictoBanner veredicto={result.veredicto} />

      {/* Fuerza legend */}
      <FuerzaLegend />

      {/* Cobertura mensual */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Cobertura mensual</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {result.months.map((month) => (
            <MonthCard key={month.yearMonth} month={month} onPreview={handlePreview} />
          ))}
        </div>
      </div>

      {/* Documentos pendientes de revisión (nombre con discrepancia) */}
      <ObservadoList
        allObservadoDocs={allObservadoDocs}
        approvedIndices={approvedIndices}
        rawResults={rawResults}
        files={files}
        onPreview={handlePreview}
        onAprobar={handleAprobarObservado}
        onDesaprobar={handleDesaprobarObservado}
      />

      {/* Documentos inválidos */}
      <DocIssueList
        docs={result.invalidDocs}
        files={files}
        onPreview={handlePreview}
      />


      {/* Valid docs order */}
      <ValidDocsList months={result.months} onPreview={handlePreview} />

      {/* PDF preview modal */}
      {pdfPreviewBytes && (
        <PdfPreviewModal
          pdfBytes={pdfPreviewBytes}
          onDownload={async (finalBytes) => {
            await handleFinalDownload(finalBytes)
          }}
          onClose={() => setPdfPreviewBytes(null)}
        />
      )}

      {/* PDF download / action card */}
      {result.veredicto === "CUMPLE" ? (
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Descargar expediente en PDF</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Todos los meses obligatorios están cubiertos. Previsualiza el expediente, depura páginas si lo necesitas y descárgalo listo para presentar.
            </p>
          </div>
          {pdfError && <p className="text-xs text-destructive">{pdfError}</p>}
          <button
            type="button"
            onClick={handleOpenPreview}
            disabled={pdfGenerating}
            className="group inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:brightness-110 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:brightness-100"
          >
            {pdfGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generando PDF…
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Previsualizar y descargar expediente
              </>
            )}
          </button>
        </div>
      ) : result.veredicto === "CUMPLE_PARCIALMENTE" ? (
        <div className="space-y-3">
          <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-5 space-y-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                  Expediente incompleto — descarga no disponible
                </h3>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                  Algunos meses obligatorios solo están cubiertos con documentos de valor débil.
                  Consigue documentos más sólidos (nómina, padrón, extracto bancario) para esos meses
                  y vuelve a analizar.
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={onReset} className="w-full sm:w-auto">
              <ArrowLeft className="h-4 w-4" />
              Volver a evaluar con nuevos documentos
            </Button>
          </div>
          {/* CTA asesoría */}
          <div className="rounded-xl border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800 p-5 space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-green-800 dark:text-green-300">
                ¿Necesitas ayuda para completar tu expediente?
              </h3>
              <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                Nuestro equipo puede orientarte sobre qué documentos alternativos consigues para
                cubrir los meses débiles y presentar un expediente sólido.
              </p>
            </div>
            <a
              href="https://wa.me/34640049993?text=Hola%2C%20he%20analizado%20mis%20documentos%20con%20la%20herramienta%20y%20me%20faltan%20documentos%20para%20algunos%20meses.%20%C2%BFPod%C3%A9is%20ayudarme%3F"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2.5 transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              Hablar con un asesor por WhatsApp
            </a>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 p-5 space-y-3">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-red-800 dark:text-red-300">
                  Faltan documentos obligatorios — descarga no disponible
                </h3>
                <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                  Uno o más meses obligatorios no tienen ningún documento válido. Revisa los meses
                  marcados en rojo, consigue la documentación necesaria y vuelve a analizar.
                </p>
              </div>
            </div>
            <Button onClick={onReset} className="w-full sm:w-auto">
              <ArrowLeft className="h-4 w-4" />
              Volver a evaluar con nuevos documentos
            </Button>
          </div>
          {/* CTA asesoría */}
          <div className="rounded-xl border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800 p-5 space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-green-800 dark:text-green-300">
                ¿No tienes todos los documentos? Podemos ayudarte
              </h3>
              <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                Un asesor de LEGASSI revisará tu situación y te explicará qué documentos puedes
                obtener para cubrir los meses que te faltan, antes de que cierre el plazo.
              </p>
            </div>
            <a
              href="https://wa.me/34640049993?text=Hola%2C%20he%20analizado%20mis%20documentos%20con%20la%20herramienta%20y%20me%20faltan%20meses%20obligatorios.%20%C2%BFPod%C3%A9is%20orientarme%3F"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2.5 transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              Hablar con un asesor por WhatsApp
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

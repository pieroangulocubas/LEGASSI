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
import { generatePDF } from "../pdf-utils"
import type { AnalysisResult, ClasificadorFormData, DocumentResult, PresentationMonth } from "../types"
import { runRulesEngine, PRESENTATION_MONTH_LABELS } from "../logic"
import { PreviewModal } from "./PreviewModal"
import { VeredictoBanner } from "./VeredictoBanner"
import { MonthCard } from "./MonthCard"
import { DocIssueList } from "./DocIssueList"
import { ObservadoList } from "./ObservadoList"
import { ValidDocsList } from "./ValidDocsList"
import { FuerzaLegend } from "./FuerzaLegend"

export function ResultsView({
  result: initialResult,
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
  const [result, setResult] = useState<AnalysisResult>(initialResult)
  const [pdfGenerating, setPdfGenerating] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const [previewDoc, setPreviewDoc] = useState<DocumentResult | null>(null)

  function handleMonthChange(month: PresentationMonth) {
    setActiveMonth(month)
    setResult(runRulesEngine(rawResults, month))
  }

  function handlePreview(doc: DocumentResult) {
    setPreviewDoc(doc)
  }
  function handleClosePreview() {
    setPreviewDoc(null)
  }

  async function handleDownloadPDF() {
    setPdfGenerating(true)
    setPdfError(null)
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("clasificador_token") : null

      // 1. Get a signed upload URL + public URL from server (only if token exists)
      let publicUrl: string | undefined
      let signedUrl: string | undefined
      if (token) {
        try {
          const prep = await fetch("/api/clasificador/prepare-upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          })
          if (prep.ok) {
            const prepData = await prep.json()
            publicUrl = prepData.publicUrl
            signedUrl = prepData.signedUrl
          }
        } catch { /* non-fatal — generate PDF without QR */ }
      }

      // 2. Generate PDF (with QR if publicUrl is available)
      const pdfBytes = await generatePDF(
        result,
        files,
        { nombre: formData.nombre, mesPresentation: formData.mesPresentation },
        publicUrl
      )

      // 3. Trigger immediate download
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" })
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = blobUrl
      a.download = `expediente_${formData.nombre.replace(/\s+/g, "_").toLowerCase()}.pdf`
      a.click()
      URL.revokeObjectURL(blobUrl)

      // 4. Upload to Supabase + send email in background (non-blocking)
      if (signedUrl && publicUrl) {
        ;(async () => {
          try {
            // Upload PDF directly to Supabase Storage via signed URL
            await fetch(signedUrl, {
              method: "PUT",
              headers: { "Content-Type": "application/pdf" },
              body: blob,
            })

            // Notify server to send email if veredicto === CUMPLE
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
          } catch { /* background upload failure — user already has the file */ }
        })()
      }
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
                  onClick={() => handleMonthChange(month)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    activeMonth === month
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
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
        docs={result.observadoDocs}
        files={files}
        onPreview={handlePreview}
      />

      {/* Documentos inválidos */}
      <DocIssueList
        docs={result.invalidDocs}
        files={files}
        onPreview={handlePreview}
      />


      {/* Valid docs order */}
      <ValidDocsList months={result.months} onPreview={handlePreview} />

      {/* PDF download / action card */}
      {result.veredicto === "CUMPLE" ? (
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Descargar expediente en PDF</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Todos los meses obligatorios están cubiertos. Genera el PDF ordenado y listo para presentar.
            </p>
          </div>
          {pdfError && <p className="text-xs text-destructive">{pdfError}</p>}
          <Button
            onClick={handleDownloadPDF}
            disabled={pdfGenerating}
            className="w-full sm:w-auto"
          >
            {pdfGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generando PDF…
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Descargar expediente PDF
              </>
            )}
          </Button>
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

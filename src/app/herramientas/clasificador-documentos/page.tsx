"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import {
  CheckCircle,
  AlertCircle,
  XCircle,
  Loader2,
  FileText,
  ArrowLeft,
  ShieldCheck,
  CreditCard,
  MessageCircle,
  Gift,
} from "lucide-react"
import { runRulesEngine } from "./logic"
import type { PresentationMonth, DocumentResult, AnalysisResult, ClasificadorFormData } from "./types"
import { loadFilesFromIDB, clearFilesFromIDB } from "./idb"
import { InputField } from "./components/InputField"
import { MonthGuide } from "./components/MonthGuide"
import { FileDropzone, MAX_FILES } from "./components/FileDropzone"
import { RecoverModal } from "./components/RecoverModal"
import { PaymentModal } from "./components/PaymentModal"
import { ResultsView } from "./components/ResultsView"
import { SocialProofToast } from "./components/SocialProofToast"
import { ToolFAQ } from "./components/ToolFAQ"
import { FreemiumUpgradeModal } from "./components/FreemiumUpgradeModal"

// ─── Main Page ────────────────────────────────────────────────────────────────
type PageState = "verifying_payment" | "form" | "loading" | "results" | "error"

export default function ClasificadorPage() {
  // Form state
  const [nombre, setNombre] = useState("")
  const [email, setEmail] = useState("")
  const [telefono, setTelefono] = useState("")
  const [mesPresentation, setMesPresentation] = useState<PresentationMonth | "">("")
  const [files, setFiles] = useState<File[]>([])

  // App state
  const [pageState, setPageState] = useState<PageState>("form")
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [rawResults, setRawResults] = useState<DocumentResult[]>([])
  const [errorMsg, setErrorMsg] = useState("")

  // Account info from DB (not reactive to form inputs)
  const [account, setAccount] = useState({ nombre: "", email: "", telefono: "" })

  // Payment / credits
  const [isFreemium, setIsFreemium] = useState(false)
  const [paymentModal, setPaymentModal] = useState<{ open: boolean; reason: "first_time" | "exhausted" }>({
    open: false,
    reason: "first_time",
  })
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [showRecoverModal, setShowRecoverModal] = useState(false)
  const [isRecovery, setIsRecovery] = useState(false)

  // Freemium upgrade modal (shown when freemium-exhausted user returns from results)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  // Loading animation — step updated from real job progress via polling
  const [loadingStep, setLoadingStep] = useState(0)
  const pollAbortRef = useRef<AbortController | null>(null)

  // Auto-submit after payment
  const [pendingAutoSubmit, setPendingAutoSubmit] = useState(false)

  // On mount: check for Stripe redirect (session_id) or existing localStorage token
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const sessionId = params.get("session_id")
    const cancelled = params.get("cancelled")

    function restorePendingForm() {
      try {
        const saved = sessionStorage.getItem("clasificador_pending_form")
        if (!saved) return
        const parsed = JSON.parse(saved) as Record<string, string>
        if (parsed.nombre) setNombre(parsed.nombre)
        if (parsed.email) setEmail(parsed.email)
        if (parsed.telefono) setTelefono(parsed.telefono)
        if (parsed.mesPresentation)
          setMesPresentation(parsed.mesPresentation as PresentationMonth)
        sessionStorage.removeItem("clasificador_pending_form")
      } catch {}
    }

    if (sessionId) {
      window.history.replaceState({}, "", window.location.pathname)
      setPageState("verifying_payment")

      fetch(`/api/clasificador/verify?session_id=${sessionId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.paid && data.token) {
            localStorage.setItem("clasificador_token", data.token)
            localStorage.setItem("clasificador_credits", String(data.credits ?? 7))
            localStorage.removeItem("clasificador_is_freemium")   // ya pagó
            if (data.nombre)   localStorage.setItem("clasificador_nombre",   data.nombre)
            if (data.email)    localStorage.setItem("clasificador_email",    data.email)
            if (data.telefono) localStorage.setItem("clasificador_telefono", data.telefono)
            setCreditsRemaining(data.credits ?? 7)
            setIsFreemium(false)
            if (data.nombre) setAccount((prev) => ({ ...prev, nombre: data.nombre }))
            restorePendingForm()
            setPaymentSuccess(true)
            // Restore files saved before Stripe redirect and trigger auto-submit
            loadFilesFromIDB().then((pendingFiles) => {
              if (pendingFiles.length > 0) {
                setFiles(pendingFiles)
                setPendingAutoSubmit(true)
              }
              clearFilesFromIDB()
            })
          } else {
            restorePendingForm()
            setErrorMsg("El pago no se completó correctamente. Inténtalo de nuevo.")
          }
          setPageState("form")
        })
        .catch(() => {
          restorePendingForm()
          setErrorMsg("No se pudo verificar el pago. Inténtalo de nuevo.")
          setPageState("form")
        })
      return
    }

    if (cancelled) {
      window.history.replaceState({}, "", window.location.pathname)
      restorePendingForm()
      setPageState("form")
      return
    }

    // Recovery link: ?recover_token=UUID
    const recoverToken = params.get("recover_token")
    if (recoverToken) {
      window.history.replaceState({}, "", window.location.pathname)
      localStorage.setItem("clasificador_token", recoverToken)

      // Fetch profile to pre-fill form and store data locally
      fetch(`/api/clasificador/profile?token=${recoverToken}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.nombre)   { localStorage.setItem("clasificador_nombre",   data.nombre);   setNombre(data.nombre); setAccount((prev) => ({ ...prev, nombre: data.nombre })) }
          if (data.email)    { localStorage.setItem("clasificador_email",    data.email);    setEmail(data.email) }
          if (data.telefono) { localStorage.setItem("clasificador_telefono", data.telefono); setTelefono(data.telefono) }
          if (data.credits != null) {
            localStorage.setItem("clasificador_credits", String(data.credits))
            setCreditsRemaining(data.credits)
          }
        })
        .catch(() => {/* non-fatal */})

      setIsRecovery(true)
      setPageState("form")
      return
    }

    // Always restore saved form data (even without a paid token)
    const storedNombre   = localStorage.getItem("clasificador_nombre")
    const storedEmail    = localStorage.getItem("clasificador_email")
    const storedTelefono = localStorage.getItem("clasificador_telefono")
    const storedMes      = localStorage.getItem("clasificador_mes")
    if (storedNombre)   setNombre(storedNombre)
    if (storedEmail)    setEmail(storedEmail)
    if (storedTelefono) setTelefono(storedTelefono)
    if (storedMes)      setMesPresentation(storedMes as PresentationMonth)

    // Load existing token/credits if present, then validate against DB
    const token = localStorage.getItem("clasificador_token")
    const credits = localStorage.getItem("clasificador_credits")
    if (token) {
      // Optimistically set from localStorage while we validate
      if (credits !== null) setCreditsRemaining(parseInt(credits, 10))
      setAccount({
        nombre: storedNombre ?? "",
        email: storedEmail ?? "",
        telefono: storedTelefono ?? "",
      })
      if (localStorage.getItem("clasificador_is_freemium") === "true") setIsFreemium(true)

      // Validate token against DB — source of truth for credits and freemium status
      fetch(`/api/clasificador/profile?token=${token}`)
        .then((r) => {
          if (r.status === 404) {
            // Token no longer valid (deleted or expired) — clear local state
            ;[
              "clasificador_token",
              "clasificador_credits",
              "clasificador_is_freemium",
            ].forEach((k) => localStorage.removeItem(k))
            setCreditsRemaining(null)
            setIsFreemium(false)
            setAccount({ nombre: "", email: "", telefono: "" })
            return null
          }
          return r.ok ? r.json() : null
        })
        .then((data) => {
          if (!data) return
          if (typeof data.credits === "number") {
            setCreditsRemaining(data.credits)
            localStorage.setItem("clasificador_credits", String(data.credits))
          }
          if (typeof data.is_freemium === "boolean") {
            setIsFreemium(data.is_freemium)
            localStorage.setItem("clasificador_is_freemium", data.is_freemium ? "true" : "false")
          }
          setAccount((prev) => ({
            nombre: data.nombre ?? prev.nombre,
            email: data.email ?? prev.email,
            telefono: data.telefono ?? prev.telefono,
          }))
          if (data.email)    localStorage.setItem("clasificador_email",    data.email)
          if (data.telefono) localStorage.setItem("clasificador_telefono", data.telefono)
        })
        .catch(() => {/* non-fatal — show stored state */})
    }
    setPageState("form")
  }, [])

  function handleAddFiles(newFiles: File[]) {
    setFiles((prev) => {
      const combined = [...prev, ...newFiles]
      return combined.slice(0, MAX_FILES)
    })
  }

  function handleRemoveFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  async function compressImageFile(file: File): Promise<File> {
    if (!file.type.startsWith("image/")) return file
    return new Promise((resolve) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        URL.revokeObjectURL(url)
        const MAX = 1600
        let { width, height } = img
        if (width > MAX || height > MAX) {
          const ratio = Math.min(MAX / width, MAX / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }
        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")!
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob(
          (blob) => {
            if (!blob) { resolve(file); return }
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }))
          },
          "image/jpeg",
          0.78
        )
      }
      img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
      img.src = url
    })
  }

  // Poll job status every 2s until done or error. Updates loadingStep in real time.
  async function pollForResult(
    jobId: string,
    signal: AbortSignal,
  ): Promise<{ results?: DocumentResult[]; error?: string }> {
    const MAX_POLLS = 90 // 3 minutes
    for (let i = 0; i < MAX_POLLS; i++) {
      await new Promise((r) => setTimeout(r, 2000))
      if (signal.aborted) return { error: "Cancelado" }

      try {
        const res = await fetch(`/api/clasificador/status?jobId=${jobId}`, { signal })
        if (!res.ok) continue
        const data = await res.json()

        // Mirror real job step into the UI (never go backwards)
        if (typeof data.step === "number" && data.step >= 2) {
          setLoadingStep((prev) => Math.max(prev, data.step))
        }

        if (data.status === "done") return { results: data.result }
        if (data.status === "error") {
          return { error: data.error ?? "Error al procesar el análisis. Inténtalo de nuevo." }
        }
      } catch {
        if (signal.aborted) return { error: "Cancelado" }
        // Transient network error — keep polling
      }
    }
    return { error: "El análisis tardó demasiado. Inténtalo de nuevo." }
  }

  async function handleSubmitCore() {
    setErrorMsg("")
    setPaymentSuccess(false)
    setLoadingStep(1)
    setPageState("loading")

    // Cancel any previous poll
    pollAbortRef.current?.abort()
    const abort = new AbortController()
    pollAbortRef.current = abort

    try {
      // Compress image files before upload — max 3 concurrent to avoid saturating the canvas API
      const CONCURRENCY = 3
      const processedFiles: File[] = new Array(files.length)
      for (let i = 0; i < files.length; i += CONCURRENCY) {
        const batch = files.slice(i, i + CONCURRENCY)
        const results = await Promise.all(batch.map(compressImageFile))
        results.forEach((f, j) => { processedFiles[i + j] = f })
      }

      const fd = new FormData()
      fd.append("nombre", nombre)
      fd.append("email", email)
      fd.append("telefono", telefono)
      fd.append("mesPresentation", mesPresentation)
      fd.append("token", localStorage.getItem("clasificador_token") ?? "")
      for (const f of processedFiles) {
        fd.append("files", f)
      }

      // POST uploads files to Supabase Storage + triggers Inngest, returns jobId immediately
      const res = await fetch("/api/clasificador", { method: "POST", body: fd })
      const data = await res.json()

      if (res.status === 402) {
        if (data.reason === "email_required") {
          setErrorMsg("Introduce tu correo electrónico para usar el análisis gratuito.")
          setPageState("error")
          return
        }

        if (data.reason === "email_invalid") {
          setErrorMsg("El correo electrónico no es válido. Usa un correo real para continuar.")
          setPageState("error")
          return
        }

        if (data.reason === "freemium_exhausted") {
          // This IS their account and they exhausted their free credit.
          localStorage.setItem("clasificador_credits", "0")
          localStorage.setItem("clasificador_is_freemium", "true")
          setCreditsRemaining(0)
          setIsFreemium(true)
          setPageState("form")
          return
        }

        // No token or token exhausted → show payment modal
        localStorage.setItem("clasificador_credits", "0")
        setCreditsRemaining(0)
        const hasToken = !!localStorage.getItem("clasificador_token")
        setPaymentModal({ open: true, reason: hasToken ? "exhausted" : "first_time" })
        setPageState("form")
        return
      }

      if (!res.ok) {
        setErrorMsg(data.error ?? "Error inesperado. Inténtalo de nuevo.")
        setPageState("error")
        return
      }

      // Files uploaded — step 1 done, now IA is reading
      setLoadingStep(2)

      // Persist auto-issued freemium token (first analysis, no prior token)
      if (data.autoIssuedToken) {
        localStorage.setItem("clasificador_token", data.autoIssuedToken)
        localStorage.setItem("clasificador_is_freemium", "true")
        setIsFreemium(true)
        if (!account.nombre && nombre) setAccount((prev) => ({ ...prev, nombre }))
      }

      // Update credits from response (deducted before Inngest runs)
      if (typeof data.creditsRemaining === "number") {
        setCreditsRemaining(data.creditsRemaining)
        localStorage.setItem("clasificador_credits", String(data.creditsRemaining))
      }

      // Poll until Inngest finishes
      const pollResult = await pollForResult(data.jobId, abort.signal)

      if (abort.signal.aborted) return
      if (pollResult.error) {
        setErrorMsg(pollResult.error)
        setPageState("error")
        return
      }

      const geminiResults: DocumentResult[] = pollResult.results!
      const analysisResult = runRulesEngine(geminiResults, mesPresentation as PresentationMonth)
      setRawResults(geminiResults)
      setResult(analysisResult)

      // Send analysis summary email in background (non-blocking)
      const notifyToken = data.autoIssuedToken ?? localStorage.getItem("clasificador_token") ?? ""
      if (notifyToken) {
        ;(async () => {
          try {
            await fetch("/api/clasificador/notify-analysis", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                token: notifyToken,
                veredicto: analysisResult.veredicto,
                creditsRemaining: data.creditsRemaining ?? 0,
                months: analysisResult.months.map((m) => ({
                  label: m.label,
                  status: m.status,
                  isOptional: m.isOptional,
                })),
                validDocs: analysisResult.validDocs.map((d) => ({
                  tipo: d.tipo,
                  descripcion_breve: d.descripcion_breve,
                  fechas: d.fechas,
                  fuerza: d.fuerza,
                  nombre_sugerido: d.nombre_sugerido,
                })),
                invalidDocs: analysisResult.invalidDocs.map((d) => ({
                  tipo: d.tipo,
                  descripcion_breve: d.descripcion_breve,
                  motivo_rechazo: d.motivo_rechazo,
                })),
              }),
            })
          } catch { /* non-fatal */ }
        })()
      }

      // Quick flash through remaining steps then show results
      setLoadingStep(5)
      await new Promise((r) => setTimeout(r, 400))
      setLoadingStep(0)
      setPageState("results")
    } catch (err) {
      if (abort.signal.aborted) return
      console.error(err)
      setErrorMsg("Error de conexión. Comprueba tu conexión a internet e inténtalo de nuevo.")
      setPageState("error")
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!mesPresentation) {
      setErrorMsg("Selecciona el mes de presentación previsto.")
      return
    }
    if (files.length === 0) {
      setErrorMsg("Debes subir al menos un archivo.")
      return
    }

    // Freemium users must provide a valid email so we can deduplicate across sessions
    const isFreemiumSubmit = !localStorage.getItem("clasificador_token")
    if (isFreemiumSubmit) {
      if (!email.trim()) {
        setErrorMsg("Introduce tu correo electrónico para usar el análisis gratuito.")
        return
      }
      const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!EMAIL_RE.test(email.trim())) {
        setErrorMsg("El correo electrónico no es válido. Usa un correo real para continuar.")
        return
      }
    }

    // Save form data immediately so it survives page reloads and Stripe redirects
    if (nombre)          localStorage.setItem("clasificador_nombre",   nombre)
    if (email)           localStorage.setItem("clasificador_email",    email)
    if (telefono)        localStorage.setItem("clasificador_telefono", telefono)
    if (mesPresentation) localStorage.setItem("clasificador_mes",      mesPresentation)

    await handleSubmitCore()
  }

  // Auto-submit after payment (files restored from IndexedDB)
  // Only fires if the required fields are actually present — otherwise just show the form
  useEffect(() => {
    if (!pendingAutoSubmit || pageState !== "form") return
    setPendingAutoSubmit(false)
    if (nombre.trim() && mesPresentation && files.length > 0) {
      handleSubmitCore()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAutoSubmit, pageState, nombre, mesPresentation, files])

  function handleReset(extraFiles: File[] = []) {
    setFiles((prev) => {
      const merged = [...prev, ...extraFiles]
      // Deduplicate by name+size to avoid double-adding subsanar files
      const seen = new Set<string>()
      return merged.filter((f) => {
        const key = `${f.name}-${f.size}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
    })
    setResult(null)
    setErrorMsg("")
    setPageState("form")
    // Show upgrade modal when freemium user returns after using their only credit
    if (isFreemium && creditsRemaining === 0) {
      setShowUpgradeModal(true)
    }
  }

  function handleFullReset() {
    localStorage.removeItem("clasificador_nombre")
    localStorage.removeItem("clasificador_mes")
    setNombre("")
    setEmail(localStorage.getItem("clasificador_email") ?? "")
    setTelefono(localStorage.getItem("clasificador_telefono") ?? "")
    setMesPresentation("")
    setFiles([])
    setResult(null)
    setErrorMsg("")
    setPageState("form")
  }

  function handleSignOut() {
    ;[
      "clasificador_token",
      "clasificador_credits",
      "clasificador_nombre",
      "clasificador_email",
      "clasificador_telefono",
      "clasificador_mes",
      "clasificador_is_freemium",
    ].forEach((k) => localStorage.removeItem(k))
    setIsFreemium(false)
    setCreditsRemaining(null)
    setAccount({ nombre: "", email: "", telefono: "" })
    setNombre("")
    setEmail("")
    setTelefono("")
    setMesPresentation("")
    setFiles([])
    setResult(null)
    setErrorMsg("")
    setPageState("form")
  }

  const formData: ClasificadorFormData = {
    nombre,
    email,
    telefono,
    mesPresentation: mesPresentation as PresentationMonth,
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      <SocialProofToast />

      {/* ── Payment modal overlay ── */}
      {paymentModal.open && (
        <PaymentModal
          reason={paymentModal.reason}
          formValues={{ nombre, email, telefono, mesPresentation }}
          files={files}
          existingToken={localStorage.getItem("clasificador_token") ?? undefined}
          onClose={() => setPaymentModal((prev) => ({ ...prev, open: false }))}
        />
      )}

      {/* ── Freemium upgrade modal (shown on return from results) ── */}
      {showUpgradeModal && (
        <FreemiumUpgradeModal
          nombre={account.nombre || nombre}
          onPay={() => {
            setShowUpgradeModal(false)
            setPaymentModal({ open: true, reason: "first_time" })
          }}
          onClose={() => setShowUpgradeModal(false)}
        />
      )}

      {/* ── Recover access modal ── */}
      {showRecoverModal && (
        <RecoverModal
          onClose={() => setShowRecoverModal(false)}
          onPayAgain={() => {
            setShowRecoverModal(false)
            setPaymentModal({ open: true, reason: "exhausted" })
          }}
        />
      )}

      <main className="container mx-auto max-w-3xl px-4 py-10 sm:py-16 overflow-x-hidden">
        {/* ── Verifying payment (full-page spinner after Stripe redirect) ── */}
        {pageState === "verifying_payment" && (
          <div className="flex flex-col items-center justify-center py-32 text-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-base font-medium text-foreground">Verificando el pago…</p>
            <p className="text-sm text-muted-foreground">Un momento, por favor.</p>
          </div>
        )}

        {/* ── Loading ── */}
        {pageState === "loading" && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            {/* Animated document stack */}
            <div className="relative h-24 w-24 mb-10">
              {/* Stacked pages effect */}
              <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-lg border-2 border-primary/20 bg-primary/5" />
              <div className="absolute inset-0 translate-x-1 translate-y-1 rounded-lg border-2 border-primary/30 bg-primary/8" />
              {/* Main page — pulses */}
              <div className="absolute inset-0 rounded-lg border-2 border-primary/60 bg-card shadow-lg flex flex-col items-center justify-center gap-1.5 overflow-hidden">
                {/* Scanning line */}
                <div
                  className="absolute left-0 right-0 h-0.5 bg-primary/50"
                  style={{ animation: "scan 2s ease-in-out infinite" }}
                />
                <FileText className="h-7 w-7 text-primary" />
              </div>
            </div>

            <style>{`
              @keyframes scan {
                0%   { top: 10%; opacity: 0; }
                10%  { opacity: 1; }
                90%  { opacity: 1; }
                100% { top: 90%; opacity: 0; }
              }
            `}</style>

            <div className="space-y-1.5 mb-10">
              <p className="text-lg font-semibold text-foreground">Analizando tu expediente…</p>
              <p className="text-sm text-muted-foreground">La IA está revisando cada documento.</p>
              <p className="text-xs text-muted-foreground/70">Puede tardar entre 20 y 60 segundos.</p>
            </div>

            {/* Steps */}
            <div className="w-full max-w-xs space-y-2.5 text-left">
              {([
                { label: "Comprimiendo y enviando archivos", icon: "📤" },
                { label: "Leyendo cada documento con IA", icon: "🔍" },
                { label: "Clasificando meses y valor probatorio", icon: "📅" },
                { label: "Generando resultado del expediente", icon: "✅" },
              ] as const).map(({ label, icon }, i) => {
                const stepNum = i + 1
                const done = loadingStep > stepNum
                const current = loadingStep === stepNum
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-300 ${
                      done
                        ? "bg-green-50 dark:bg-green-950/20"
                        : current
                        ? "bg-primary/8 ring-1 ring-primary/20"
                        : "opacity-40"
                    }`}
                  >
                    <span className="text-base shrink-0">{icon}</span>
                    <span
                      className={`text-sm font-medium flex-1 ${
                        done
                          ? "text-green-700 dark:text-green-300 line-through decoration-green-400"
                          : current
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {label}
                    </span>
                    {done && <CheckCircle className="h-4 w-4 shrink-0 text-green-500" />}
                    {current && <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Results ── */}
        {pageState === "results" && result && (
          <ResultsView
            result={result}
            rawResults={rawResults}
            formData={formData}
            files={files}
            creditsRemaining={creditsRemaining}
            onReset={() => handleReset()}
          />
        )}

        {/* ── Error ── */}
        {pageState === "error" && (
          <div className="space-y-6">
            <div className="flex items-start gap-4 rounded-xl border-2 border-destructive bg-destructive/5 p-5">
              <XCircle className="h-6 w-6 text-destructive mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-foreground">Ha ocurrido un error</p>
                <p className="mt-1 text-sm text-muted-foreground">{errorMsg}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={() => handleReset()} variant="outline">
                <ArrowLeft className="h-4 w-4" />
                Volver al formulario
              </Button>
              {/* Show pay option when the error is email conflict — let them pay directly */}
              {errorMsg.includes("ya fue usado") && (
                <button
                  type="button"
                  onClick={() => { handleReset(); setPaymentModal({ open: true, reason: "first_time" }) }}
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white
                             bg-gradient-to-r from-amber-500 to-yellow-500
                             hover:from-amber-600 hover:to-yellow-600
                             shadow-sm transition-all duration-200"
                >
                  <CreditCard className="h-4 w-4" />
                  Conseguir 7 análisis · 7,90 €
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Form ── */}
        {pageState === "form" && (
          <div className="space-y-8">
            {/* Page header */}
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-3xl font-bold text-foreground leading-tight">
                  Verifica tus pruebas de permanencia para la regularización extraordinaria
                </h1>
                {creditsRemaining !== null && (
                  <div className="flex items-center gap-2 shrink-0">
                    {creditsRemaining > 0 && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {creditsRemaining} análisis disponible{creditsRemaining !== 1 ? "s" : ""}
                      </span>
                    )}
                    {/* Direct pay button for freemium-exhausted users */}
                    {isFreemium && creditsRemaining === 0 && (
                      <button
                        type="button"
                        onClick={() => setPaymentModal({ open: true, reason: "first_time" })}
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-white
                                   bg-gradient-to-r from-amber-500 to-yellow-500
                                   hover:from-amber-600 hover:to-yellow-600
                                   shadow-sm hover:shadow-amber-300/40 transition-all duration-200"
                      >
                        <CreditCard className="h-3 w-3" />
                        Conseguir 7 análisis · 7,90 €
                      </button>
                    )}
                    {/* Only show sign-out for paid users — freemium exhausted users
                        should not be able to "reset" to get another free analysis */}
                    {!(isFreemium && creditsRemaining === 0) && (
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="text-xs text-muted-foreground/60 hover:text-destructive transition-colors underline underline-offset-2"
                        title="Cerrar sesión y borrar acceso de este dispositivo"
                      >
                        Cerrar sesión
                      </button>
                    )}
                  </div>
                )}
              </div>
              {creditsRemaining !== null && account.nombre.trim() ? (
                <div className="space-y-2">
                  {isFreemium && creditsRemaining === 0 ? (
                    <p className="text-muted-foreground">
                      Hola de nuevo, <span className="font-medium text-foreground">{account.nombre.split(" ")[0]}</span>.
                      {" "}Ya usaste tu análisis gratuito. Con <strong className="text-foreground">7 análisis por 7,90 €</strong> puedes
                      verificar documentos para ti, tu pareja, padres o cualquier familiar — solo cambia el nombre antes de cada análisis.
                    </p>
                  ) : creditsRemaining === 0 ? (
                    <p className="text-muted-foreground">
                      Hola de nuevo, <span className="font-medium text-foreground">{account.nombre.split(" ")[0]}</span>.
                      {" "}Has agotado tus análisis. Recarga para continuar verificando para ti o cualquier familiar.
                    </p>
                  ) : (
                    <p className="text-muted-foreground">
                      {isRecovery ? "Bienvenido de nuevo, " : "Hola, "}
                      <span className="font-medium text-foreground">{account.nombre.split(" ")[0]}</span>.
                      {" "}Puedes usar cada análisis para ti o para cualquier familiar o amigo —
                      solo cambia el nombre por el de la persona cuyos documentos vas a analizar.
                    </p>
                  )}
                  {/* Linked contact info */}
                  {(account.email || account.telefono) && (
                    <p className="text-xs text-muted-foreground/70 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                      <span>Cuenta vinculada:</span>
                      {account.email && <span className="font-medium text-muted-foreground">{account.email}</span>}
                      {account.telefono && <span className="font-medium text-muted-foreground">{account.telefono}</span>}
                    </p>
                  )}
                  {/* Hide "clear all" for freemium exhausted — no free resets */}
                  {(files.length > 0 || nombre) && !(isFreemium && creditsRemaining === 0) && (
                    <button
                      type="button"
                      onClick={handleFullReset}
                      className="text-xs text-muted-foreground/60 hover:text-muted-foreground underline underline-offset-2 transition-colors"
                    >
                      Limpiar todo para nueva evaluación
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  Sube tus documentos y nuestra IA los analiza, verifica su validez como prueba de
                  permanencia y te genera el expediente ordenado listo para presentar.
                </p>
              )}
            </div>

            {/* Payment success notice */}
            {paymentSuccess && (
              <div className="flex items-start gap-3 rounded-xl border border-green-300 bg-green-50 dark:bg-green-950/20 dark:border-green-800 px-5 py-4">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                    ¡Pago completado! Tienes {creditsRemaining} análisis disponibles.
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">
                    Vuelve a subir tus documentos y pulsa «Analizar» para continuar.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8" noValidate>
              {/* ── Personal data ── */}
              <section className="space-y-4">
                <h2 className="text-base font-semibold text-foreground border-b border-border pb-2">
                  Tus datos
                </h2>

                {creditsRemaining !== null && creditsRemaining > 0 ? (
                  /* ── Usuario activo: aviso sobre el nombre ── */
                  <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 px-4 py-3">
                    <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800 dark:text-amber-300">
                      <strong>Importante:</strong> escribe el nombre exactamente como aparece en
                      los documentos del solicitante. La IA lo usará para validar cada archivo.
                    </p>
                  </div>
                ) : isFreemium && creditsRemaining === 0 ? (
                  /* ── Freemium agotado: CTA a pago ── */
                  <div className="rounded-xl border-2 border-primary/30 bg-primary/5 px-5 py-4 space-y-3">
                    <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Gift className="h-4 w-4 text-primary shrink-0" />
                      Tu análisis gratuito ya fue usado
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Para seguir verificando documentos, recarga el servicio. Introduce tu correo
                      y teléfono para gestionar tu acceso.
                    </p>
                  </div>
                ) : (
                  /* ── Nuevo usuario: explicación del análisis gratuito ── */
                  <div className="rounded-xl border-2 border-primary/30 bg-primary/5 px-5 py-4 space-y-3">
                    <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Gift className="h-4 w-4 text-primary shrink-0" />
                      Tienes 1 análisis gratuito
                    </p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        <span>
                          <strong className="text-foreground">El análisis gratuito está vinculado a tu nombre completo.</strong>{" "}
                          Escríbelo exactamente como aparece en tus documentos — la IA lo usará
                          para validar cada archivo.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        <span>
                          <strong className="text-foreground">El correo es obligatorio</strong> — te enviamos el resultado completo del análisis para que puedas consultarlo siempre, y te permite recuperar tu acceso desde cualquier dispositivo.
                        </span>
                      </li>
                    </ul>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <InputField
                    label="Nombre completo"
                    id="nombre"
                    value={nombre}
                    onChange={setNombre}
                    required
                    placeholder="María García López"
                    autoComplete="name"
                    readOnly={isFreemium}
                    helperText={
                      isFreemium
                        ? "Vinculado a tu cuenta gratuita — un análisis por nombre"
                        : creditsRemaining !== null && creditsRemaining > 0
                        ? "Escribe el nombre de quien deseas analizar: puede ser un familiar o amigo."
                        : "Escríbelo exactamente como aparece en tus documentos — la IA lo usa para validar cada archivo."
                    }
                  />
                  {creditsRemaining === null && (
                    <>
                      <InputField
                        label="Correo electrónico"
                        id="email"
                        type="email"
                        value={email}
                        onChange={setEmail}
                        required
                        placeholder="maria@ejemplo.com"
                        autoComplete="email"
                        helperText="Te enviamos el resultado completo del análisis por correo — guárdalo para consultarlo cuando necesites. También sirve para recuperar tu acceso desde otro dispositivo."
                      />
                      <InputField
                        label="Teléfono"
                        id="telefono"
                        type="tel"
                        value={telefono}
                        onChange={setTelefono}
                        required
                        placeholder="+34 600 000 000"
                        autoComplete="tel"
                        helperText="Para contactarte si detectamos algún problema con tu expediente."
                      />
                    </>
                  )}

                  {/* Month selector */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="mes"
                      className="block text-sm font-medium text-foreground"
                    >
                      Fecha prevista de presentación
                      <span className="text-destructive ml-0.5">*</span>
                    </label>
                    <select
                      id="mes"
                      value={mesPresentation}
                      onChange={(e) =>
                        setMesPresentation(e.target.value as PresentationMonth | "")
                      }
                      required
                      className="block w-full rounded-lg border border-input bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring transition-colors"
                    >
                      <option value="">Selecciona un mes…</option>
                      <option value="2026-04">Abril 2026</option>
                      <option value="2026-05">Mayo 2026</option>
                      <option value="2026-06">Junio 2026</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* ── Month guide (conditional) ── */}
              {mesPresentation && (
                <MonthGuide month={mesPresentation as PresentationMonth} />
              )}

              {/* ── File upload ── */}
              <section className="space-y-4">
                <div>
                  <h2 className="text-base font-semibold text-foreground border-b border-border pb-2">
                    Sube tus documentos
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Añade todos los documentos que puedan acreditar tu permanencia en España. La IA
                    determinará cuáles son válidos y a qué mes corresponden.
                  </p>
                </div>
                <FileDropzone
                  files={files}
                  onAdd={handleAddFiles}
                  onRemove={handleRemoveFile}
                  onClear={() => setFiles([])}
                />
              </section>

              {/* ── Inline error ── */}
              {errorMsg && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {errorMsg}
                </div>
              )}

              {/* ── Submit ── */}
              <div className="space-y-2">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full font-semibold"
                  disabled={
                    !nombre.trim() ||
                    (creditsRemaining === null ? !email.trim() || !telefono.trim() : false) ||
                    !mesPresentation ||
                    files.length === 0
                  }
                >
                  Analizar documentos con IA
                </Button>
                {creditsRemaining === null ? (
                  /* ── Nuevo usuario: análisis gratuito ── */
                  <div className="flex flex-col items-center gap-1.5">
                    <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                      <Gift className="h-3 w-3 text-primary" />
                      <span>1 análisis <strong>gratuito</strong> — vinculado al nombre que escribas arriba</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowRecoverModal(true)}
                      className="text-xs text-primary underline underline-offset-2 hover:opacity-80 transition-opacity"
                    >
                      ¿Ya usaste el gratuito o pagaste antes? Recupera tu acceso
                    </button>
                  </div>
                ) : creditsRemaining === 0 && isFreemium ? (
                  /* ── Freemium agotado: upgrade ── */
                  <div className="flex flex-col items-center gap-1.5">
                    <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <CreditCard className="h-3 w-3" />
                      Has usado tu análisis gratuito
                    </p>
                    <button
                      type="button"
                      onClick={() => setPaymentModal({ open: true, reason: "first_time" })}
                      className="text-xs font-semibold text-primary underline underline-offset-2 hover:opacity-80 transition-opacity"
                    >
                      Continuar con 7 análisis por 7,90 €
                    </button>
                  </div>
                ) : creditsRemaining === 0 ? (
                  /* ── Pago agotado: recargar ── */
                  <div className="flex flex-col items-center gap-1.5">
                    <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <CreditCard className="h-3 w-3" />
                      Has agotado tus análisis disponibles
                    </p>
                    <button
                      type="button"
                      onClick={() => setPaymentModal({ open: true, reason: "exhausted" })}
                      className="text-xs font-semibold text-primary underline underline-offset-2 hover:opacity-80 transition-opacity"
                    >
                      Recargar 7 análisis por 7,90 €
                    </button>
                  </div>
                ) : null}
              </div>

              <p className="text-center text-xs text-muted-foreground">
                Tus archivos se procesan de forma segura y no se almacenan en nuestros servidores.
              </p>

              {/* ── FAQ ── */}
              <ToolFAQ />

              {/* ── Disclaimer legal ── */}
              <p className="text-center text-xs text-muted-foreground/60 leading-relaxed border-t border-border pt-4">
                El resultado de este análisis tiene carácter <strong className="font-medium text-muted-foreground/80">exclusivamente orientativo</strong> y
                no constituye asesoramiento jurídico. LEGASSI no garantiza que los documentos sean aceptados
                por la autoridad competente. Consulta con un profesional antes de presentar tu expediente.{" "}
                <a href="/terminos" className="underline underline-offset-2 hover:text-muted-foreground transition-colors">
                  Términos de servicio
                </a>
                .
              </p>

              <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <MessageCircle className="h-3.5 w-3.5 text-green-600 shrink-0" />
                <span>¿Algún problema?</span>
                <a
                  href="https://wa.me/346117599973"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-green-700 dark:text-green-500 underline underline-offset-2 hover:opacity-80 transition-opacity"
                >
                  Habla con un técnico de Legassi
                </a>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  )
}

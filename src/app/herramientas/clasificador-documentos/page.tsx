"use client"

import { useState, useRef, useEffect } from "react"
import NextImage from "next/image"
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
  KeyRound,
  MessageCircle,
  Gift,
} from "lucide-react"
import { runRulesEngine } from "./logic"
import type { PresentationMonth, DocumentResult, AnalysisResult, ClasificadorFormData } from "./types"
import { saveFilesToIDB, loadFilesFromIDB, clearFilesFromIDB } from "./idb"
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
  const [nombres, setNombres] = useState("")
  const [apellidos, setApellidos] = useState("")
  // Derived: full name sent to the API — always nombres + apellidos combined
  const nombre = [nombres.trim(), apellidos.trim()].filter(Boolean).join(" ")
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

  // Splits a full name (from storage/API) into nombres + apellidos state
  function setNombreFromFull(full: string) {
    const parts = (full ?? "").trim().split(/\s+/).filter(Boolean)
    setNombres(parts[0] ?? "")
    setApellidos(parts.slice(1).join(" "))
  }

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
        if (parsed.nombre) setNombreFromFull(parsed.nombre)
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
            if (data.nombre) { setAccount((prev) => ({ ...prev, nombre: data.nombre })); setNombreFromFull(data.nombre) }
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
          if (data.nombre)   { localStorage.setItem("clasificador_nombre",   data.nombre);   setNombreFromFull(data.nombre); setAccount((prev) => ({ ...prev, nombre: data.nombre })) }
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
    if (storedNombre)   setNombreFromFull(storedNombre)
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
      if (storedNombre) setNombreFromFull(storedNombre)
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
          if (data.nombre) setNombreFromFull(data.nombre)
          if (data.email)    localStorage.setItem("clasificador_email",    data.email)
          if (data.telefono) localStorage.setItem("clasificador_telefono", data.telefono)
        })
        .catch(() => {/* non-fatal — show stored state */})
    }

    // Resume polling if the user reloaded mid-analysis
    const pendingJobId = sessionStorage.getItem("clasificador_pending_job")
    if (pendingJobId) {
      setPageState("loading")
      setLoadingStep(2)
      const abort = new AbortController()
      pollAbortRef.current = abort
      // Restore files from IDB so PDF generation works after reload
      loadFilesFromIDB().then((savedFiles) => {
        if (savedFiles.length > 0) setFiles(savedFiles)
      })
      pollForResult(pendingJobId, abort.signal).then((pollResult) => {
        sessionStorage.removeItem("clasificador_pending_job")
        if (abort.signal.aborted) return
        if (pollResult.error) {
          setErrorMsg("El análisis no pudo completarse. Inténtalo de nuevo.")
          setLoadingStep(0)
          setPageState("error")
          return
        }
        const storedMes = localStorage.getItem("clasificador_mes") as PresentationMonth | null
        const geminiResults = pollResult.results!
        const analysisResult = runRulesEngine(geminiResults, (storedMes ?? "") as PresentationMonth)
        setRawResults(geminiResults)
        setResult(analysisResult)
        if (typeof pollResult.creditsRemaining === "number") {
          setCreditsRemaining(pollResult.creditsRemaining)
          localStorage.setItem("clasificador_credits", String(pollResult.creditsRemaining))
        }
        clearFilesFromIDB() // already restored to React state above
        setLoadingStep(5)
        setTimeout(() => { setLoadingStep(0); setPageState("results") }, 400)
      })
    } else {
      setPageState("form")
    }
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
  ): Promise<{ results?: DocumentResult[]; creditsRemaining?: number; error?: string }> {
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

        if (data.status === "done") return { results: data.result, creditsRemaining: data.creditsRemaining ?? undefined }
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

    // Tracks any auto-issued freemium token for this session — accessible in catch for cleanup
    let sessionAutoToken: string | null = null

    try {
      // Persist files to IDB so PDF generation still works if the user reloads mid-analysis
      await saveFilesToIDB(files)

      // Compress image files before upload — max 3 concurrent to avoid saturating the canvas API
      const CONCURRENCY = 3
      const processedFiles: File[] = new Array(files.length)
      for (let i = 0; i < files.length; i += CONCURRENCY) {
        const batch = files.slice(i, i + CONCURRENCY)
        const results = await Promise.all(batch.map(compressImageFile))
        results.forEach((f, j) => { processedFiles[i + j] = f })
      }

      // ── Step 1: prepare-job — validate + create job + get signed upload URLs ──
      // No file bytes sent to Vercel (avoids 4.5 MB hard limit)
      const prepRes = await fetch("/api/clasificador/prepare-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          email,
          telefono,
          mesPresentation,
          token: localStorage.getItem("clasificador_token") ?? "",
          files: processedFiles.map((f) => ({ name: f.name, size: f.size, mimeType: f.type })),
        }),
      })
      const prepData = await prepRes.json()

      if (prepRes.status === 402) {
        if (prepData.reason === "email_required") {
          setErrorMsg("Introduce tu correo electrónico para usar el análisis gratuito.")
          setPageState("form")
          setLoadingStep(0)
          return
        }

        if (prepData.reason === "email_invalid") {
          setErrorMsg("El correo electrónico no es válido. Usa un correo real para continuar.")
          setPageState("form")
          setLoadingStep(0)
          return
        }

        if (prepData.reason === "freemium_exhausted") {
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

      if (!prepRes.ok) {
        setErrorMsg(prepData.error ?? "Error inesperado. Inténtalo de nuevo.")
        setPageState("form")
        setLoadingStep(0)
        return
      }

      const { jobId, uploadSlots, autoIssuedToken } = prepData as {
        jobId: string
        uploadSlots: Array<{ index: number; storageKey: string; signedUrl: string }>
        autoIssuedToken?: string
      }

      // ── Step 2: upload files directly to Supabase using signed URLs ──
      setLoadingStep(2)
      for (const slot of uploadSlots) {
        const file = processedFiles[slot.index]
        const uploadRes = await fetch(slot.signedUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        })
        if (!uploadRes.ok) {
          setErrorMsg("Error al subir los archivos. Inténtalo de nuevo.")
          setPageState("form")
          setLoadingStep(0)
          return
        }
      }

      // ── Step 3: trigger Inngest analysis ──
      const triggerRes = await fetch("/api/clasificador", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      })
      if (!triggerRes.ok) {
        const triggerData = await triggerRes.json()
        setErrorMsg(triggerData.error ?? "Error al iniciar el análisis. Inténtalo de nuevo.")
        setPageState("form")
        setLoadingStep(0)
        return
      }

      // Persist auto-issued freemium token (first analysis, no prior token)
      if (autoIssuedToken) {
        sessionAutoToken = autoIssuedToken
        localStorage.setItem("clasificador_token", autoIssuedToken)
        localStorage.setItem("clasificador_is_freemium", "true")
        setIsFreemium(true)
        if (!account.nombre && nombre) setAccount((prev) => ({ ...prev, nombre }))
      }

      // Poll until Inngest finishes — persist jobId so a reload can resume
      sessionStorage.setItem("clasificador_pending_job", jobId)
      const pollResult = await pollForResult(jobId, abort.signal)
      sessionStorage.removeItem("clasificador_pending_job")

      if (abort.signal.aborted) return
      if (pollResult.error) {
        // Analysis failed — credit was never deducted, so nothing to refund.
        // For auto-issued freemium tokens, delete the token so user gets a clean retry.
        if (sessionAutoToken) {
          localStorage.removeItem("clasificador_token")
          localStorage.removeItem("clasificador_is_freemium")
          localStorage.removeItem("clasificador_credits")
          setIsFreemium(false)
          setCreditsRemaining(null)
        }
        setErrorMsg("El análisis no pudo completarse. Tus archivos siguen aquí — pulsa Reintentar para volver a intentarlo.")
        setLoadingStep(0)
        setPageState("error")
        return
      }

      const geminiResults: DocumentResult[] = pollResult.results!
      const analysisResult = runRulesEngine(geminiResults, mesPresentation as PresentationMonth)
      setRawResults(geminiResults)
      setResult(analysisResult)

      // Update credits now that results are confirmed (deducted server-side by Inngest)
      if (typeof pollResult.creditsRemaining === "number") {
        setCreditsRemaining(pollResult.creditsRemaining)
        localStorage.setItem("clasificador_credits", String(pollResult.creditsRemaining))
      }

      // Send analysis summary email in background (non-blocking)
      const notifyToken = autoIssuedToken ?? localStorage.getItem("clasificador_token") ?? ""
      if (notifyToken) {
        ;(async () => {
          try {
            await fetch("/api/clasificador/notify-analysis", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                token: notifyToken,
                veredicto: analysisResult.veredicto,
                creditsRemaining: pollResult.creditsRemaining ?? 0,
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
      clearFilesFromIDB() // files are now in React state — IDB no longer needed
      setLoadingStep(5)
      await new Promise((r) => setTimeout(r, 400))
      setLoadingStep(0)
      setPageState("results")
    } catch (err) {
      if (abort.signal.aborted) return
      console.error(err)
      // Undo auto-issued token on unexpected failure (credit never deducted)
      if (sessionAutoToken) {
        localStorage.removeItem("clasificador_token")
        localStorage.removeItem("clasificador_is_freemium")
        localStorage.removeItem("clasificador_credits")
        setIsFreemium(false)
        setCreditsRemaining(null)
      }
      setErrorMsg("Ocurrió un problema de conexión. Tus archivos siguen aquí — puedes reintentar el análisis.")
      setLoadingStep(0)
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

    // Validate full name — freemium users have a locked nombre so skip split check
    if (!isFreemium) {
      if (!nombres.trim()) {
        setErrorMsg("Introduce el nombre de la persona.")
        return
      }
      if (!apellidos.trim()) {
        setErrorMsg("Introduce los apellidos. El nombre completo debe incluir nombre y apellidos.")
        return
      }
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
    // Show upgrade modal when freemium user returns after exhausting credits.
    // Use <= 0 (not === 0) to handle edge case where DB returned -1.
    if (isFreemium && creditsRemaining !== null && creditsRemaining <= 0) {
      setShowUpgradeModal(true)
    }
  }

  function handleFullReset() {
    localStorage.removeItem("clasificador_nombre")
    localStorage.removeItem("clasificador_mes")
    setNombres("")
    setApellidos("")
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
    setNombres("")
    setApellidos("")
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
    <div className="min-h-screen bg-background overflow-x-hidden relative">
      {/* Ambient blobs — same treatment as landing */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] -left-40 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[100px]" />
      </div>
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
          <div className="max-w-xl mx-auto py-10 space-y-6">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
            </div>

            {/* Message card */}
            <div className="rounded-2xl border border-border bg-card p-6 space-y-3 text-center">
              <h2 className="text-lg font-semibold text-foreground">
                {errorMsg.includes("conexión")
                  ? "Problema de conexión"
                  : errorMsg.includes("email")
                  ? "Correo no válido"
                  : "El análisis no pudo completarse"}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{errorMsg}</p>

              {/* Credit restored notice */}
              {!errorMsg.includes("email") && (
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary mx-auto">
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                  Tu crédito no ha sido descontado
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => handleReset()}
                className="gap-2 bg-gradient-to-r from-primary to-secondary text-white hover:brightness-110 font-semibold"
              >
                <ArrowLeft className="h-4 w-4" />
                Reintentar análisis
              </Button>

              <a
                href="https://wa.me/34672297468?text=Hola%2C%20tuve%20un%20error%20en%20el%20clasificador%20de%20documentos%20y%20necesito%20ayuda."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground transition-all"
              >
                <MessageCircle className="h-4 w-4" />
                Contactar soporte
              </a>
            </div>

            {/* Pay option when email conflict */}
            {errorMsg.includes("ya fue usado") && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => { handleReset(); setPaymentModal({ open: true, reason: "first_time" }) }}
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white
                             bg-gradient-to-r from-primary to-secondary shadow-sm hover:brightness-110 transition-all"
                >
                  <CreditCard className="h-4 w-4" />
                  Conseguir 7 análisis · 7,90 €
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Form ── */}
        {pageState === "form" && (
          <div className="space-y-8">
            {/* Page header */}
            <div className="space-y-3">
              {/* Top row: tool badge + credits */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/8 px-4 py-1.5 text-xs font-semibold text-primary shadow-sm shadow-primary/10">
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                  Herramienta gratuita · IA
                </div>
                {creditsRemaining !== null && (
                  <div className="flex items-center gap-2 shrink-0">
                    {creditsRemaining > 0 && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {creditsRemaining} análisis disponible{creditsRemaining !== 1 ? "s" : ""}
                      </span>
                    )}
                    {creditsRemaining > 0 && (
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
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight">
                  Verifica tus{" "}
                  <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    pruebas de permanencia
                  </span>
                  {" "}para la regularización extraordinaria
                </h1>
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

            {/* ── CTAs de acción prominentes ── */}

            {/* Créditos agotados (freemium o pago) → pago como acción principal */}
            {creditsRemaining === 0 && (
              <div className="rounded-2xl bg-card border border-border p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-1 min-w-0 space-y-0.5">
                  <p className="font-semibold text-foreground">
                    {isFreemium ? "Ya usaste tu análisis gratuito" : "Has agotado tus análisis"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    7 análisis por 7,90 € — úsalos para ti o cualquier familiar, sin caducidad.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => setPaymentModal({ open: true, reason: isFreemium ? "first_time" : "exhausted" })}
                  className="shrink-0 w-full sm:w-auto"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Conseguir 7 análisis · 7,90 €
                </Button>
              </div>
            )}

            {/* Nuevo usuario → recuperar acceso como bloque clickable único */}
            {creditsRemaining === null && (
              <button
                type="button"
                onClick={() => setShowRecoverModal(true)}
                className="w-full flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm hover:bg-muted transition-colors group"
              >
                <span className="text-muted-foreground">¿Se te agotó tu prueba gratuita o ya pagaste?</span>
                <span className="font-medium text-green-600 dark:text-green-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform shrink-0">
                  Recuperar acceso
                  <KeyRound className="h-3.5 w-3.5" />
                </span>
              </button>
            )}

            {/* Trust banner — only for new users */}
            {creditsRemaining === null && (
              <div className="overflow-hidden rounded-2xl border border-border bg-card flex items-stretch">
                <div className="flex-1 p-5 sm:p-6 flex flex-col justify-center gap-3">
                  <p className="text-base font-semibold text-foreground leading-snug">
                    ¿Tienes todo lo que necesitas para la regularización?
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Sube tus documentos y nuestra herramienta te dice en segundos cuáles son válidos o
                    inválidos, que meses te falta cubrir, cómo ordenar tu expediente y te entrega un PDF listo para presentar. Sin registros, sin complicaciones, sin sorpresas.
                  </p>
                  <div className="flex flex-col sm:flex-row flex-wrap gap-y-1.5 gap-x-4">
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                      Resultado en menos de 1 minuto
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                      Sin crear cuenta
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                      1 análisis completamente gratuito
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                      PDF ordenado listo para presentar
                    </span>
                  </div>
                </div>
                <div className="hidden sm:block w-48 shrink-0 relative">
                  <NextImage
                    src="/person-young.png"
                    alt="Asesor revisando documentos de inmigración"
                    fill
                    className="object-cover object-center"
                    sizes="192px"
                  />
                </div>
              </div>
            )}

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

                {creditsRemaining === null && (
                  /* ── Nuevo usuario: badge sutil ── */
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Gift className="h-3.5 w-3.5 text-primary shrink-0" />
                    Tienes <strong className="text-foreground">1 análisis gratuito</strong> — vinculado a tu nombre y correo
                  </p>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  {isFreemium && creditsRemaining !== null && creditsRemaining > 0 ? (
                    /* Freemium activo: nombre bloqueado para evitar uso múltiple con nombre diferente */
                    <InputField
                      label="Nombre completo"
                      id="nombre"
                      value={nombre}
                      onChange={() => {}}
                      readOnly
                      helperText="Vinculado a tu cuenta gratuita — un análisis por nombre"
                    />
                  ) : (
                    <>
                      <InputField
                        label="Nombre(s)"
                        id="nombres"
                        value={nombres}
                        onChange={setNombres}
                        required
                        placeholder="María José"
                        autoComplete="given-name"
                        helperText="Tal como aparece en tus documentos."
                      />
                      <InputField
                        label="Apellido(s)"
                        id="apellidos"
                        value={apellidos}
                        onChange={setApellidos}
                        required
                        placeholder="García López"
                        autoComplete="family-name"
                      />
                    </>
                  )}
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
                        helperText="Para recibir los resultados y recuperar tu acceso."
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
                  className="w-full font-bold text-base py-6 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-700/25 hover:shadow-green-700/40 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
                  disabled={
                    !nombre.trim() ||
                    (creditsRemaining === null ? !email.trim() || !telefono.trim() : false) ||
                    !mesPresentation ||
                    files.length === 0
                  }
                >
                  Analizar mis pruebas de permanencia
                </Button>
                {creditsRemaining === null && (
                  <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                    <Gift className="h-3 w-3 text-primary" />
                    1 análisis <strong>gratuito</strong> — vinculado al nombre que escribas arriba
                  </p>
                )}
              </div>

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

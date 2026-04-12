"use client"

import { useState, useEffect } from "react"
import { CheckCircle, AlertCircle, XCircle, Loader2, X, CreditCard, Lock, ShieldCheck, Users, Mail, User } from "lucide-react"
import { saveFilesToIDB } from "../idb"

export function PaymentModal({
  reason,
  formValues,
  files,
  existingToken,
  onClose,
}: {
  reason: "first_time" | "exhausted"
  formValues: { nombre: string; email: string; telefono: string; mesPresentation: string }
  files: File[]
  existingToken?: string
  onClose: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState("")
  // Editable locally so the user can fill them in directly from the modal
  const [nombre, setNombre] = useState(formValues.nombre)
  const [email, setEmail]   = useState(formValues.email)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [onClose])

  async function handlePay() {
    if (!nombre.trim()) { setErr("Escribe tu nombre completo para continuar."); return }
    if (!email.trim())  { setErr("El correo es necesario para recuperar tu acceso después del pago."); return }

    setLoading(true)
    setErr("")

    // Persist nombre so it auto-fills after returning from Stripe
    if (nombre) localStorage.setItem("clasificador_nombre", nombre.trim())
    if (email)  localStorage.setItem("clasificador_email",  email.trim())

    const mergedFormValues = { ...formValues, nombre: nombre.trim(), email: email.trim() }
    sessionStorage.setItem("clasificador_pending_form", JSON.stringify(mergedFormValues))

    try {
      const [, res] = await Promise.all([
        saveFilesToIDB(files),
        fetch("/api/clasificador/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre:        nombre.trim(),
            telefono:      formValues.telefono,
            email:         email.trim(),
            existingToken: existingToken ?? "",
          }),
        }),
      ])
      const data = await res.json()
      if (!res.ok || !data.url) {
        setErr(data.error ?? "No se pudo iniciar el pago. Inténtalo de nuevo.")
        setLoading(false)
        return
      }
      window.location.href = data.url
    } catch {
      setErr("Error de conexión. Inténtalo de nuevo.")
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-background shadow-2xl border border-border overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-border">
          <div>
            <p className="font-semibold text-foreground text-lg">Analiza tu expediente con IA</p>
            {reason === "exhausted" ? (
              <p className="text-sm text-amber-600 dark:text-amber-400 mt-0.5">
                Has agotado tus análisis. Recarga para continuar.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground mt-0.5">
                Un pago único de 7,90 € incluye 7 análisis.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Lawyer vs AI comparison */}
          <div className="grid grid-cols-2 gap-3">
            {/* Lawyer */}
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-widest text-destructive">
                Abogado tradicional
              </p>
              <p className="text-2xl font-bold text-foreground">80–150 €</p>
              <ul className="text-xs text-muted-foreground space-y-1.5 mt-1">
                <li className="flex items-start gap-1.5">
                  <XCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-destructive/70" />
                  Solo revisión manual
                </li>
                <li className="flex items-start gap-1.5">
                  <XCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-destructive/70" />
                  Propenso a errores humanos
                </li>
                <li className="flex items-start gap-1.5">
                  <XCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-destructive/70" />
                  Puede tardar días
                </li>
                <li className="flex items-start gap-1.5">
                  <XCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-destructive/70" />
                  Sin expediente PDF
                </li>
              </ul>
            </div>

            {/* AI */}
            <div className="relative rounded-xl border-2 border-primary/50 bg-primary/5 p-4 space-y-2">
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-3 py-0.5 text-[10px] font-bold text-primary-foreground">
                RECOMENDADO
              </span>
              <p className="text-[11px] font-bold uppercase tracking-widest text-primary">
                IA · Legassi
              </p>
              <p className="text-2xl font-bold text-foreground">7,90 €</p>
              <ul className="text-xs text-muted-foreground space-y-1.5 mt-1">
                <li className="flex items-start gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary" />
                  7 análisis incluidos
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary" />
                  Resultados en segundos
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary" />
                  Detecta meses faltantes
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary" />
                  Expediente PDF incluido
                </li>
              </ul>
            </div>
          </div>

          {/* Family highlight */}
          <div className="flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
            <Users className="h-4 w-4 shrink-0 text-primary mt-0.5" />
            <p className="text-xs text-muted-foreground leading-snug">
              <strong className="text-foreground">Los 7 análisis son para quien quieras.</strong>{" "}
              Úsalos para ti, tu pareja, padres o amigos — solo cambia el nombre antes de cada análisis.
            </p>
          </div>

          {/* ── Nombre + Email fields ── */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                Nombre completo
                {existingToken && (
                  <span className="ml-auto text-xs font-normal text-muted-foreground">
                    No editable
                  </span>
                )}
              </label>
              <input
                type="text"
                value={nombre}
                onChange={existingToken ? undefined : (e) => setNombre(e.target.value)}
                readOnly={!!existingToken}
                placeholder="Tu nombre completo"
                className={`w-full rounded-lg border px-3 py-2.5 text-sm transition-colors
                           ${existingToken
                             ? "border-input bg-muted text-muted-foreground cursor-default select-none"
                             : "border-input bg-background placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                           }`}
              />
            </div>

            <div className="space-y-1.5" suppressHydrationWarning>
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                Correo electrónico
                <span className="ml-auto text-xs font-normal text-amber-600 dark:text-amber-400">
                  Importante
                </span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                suppressHydrationWarning
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm
                           placeholder:text-muted-foreground/50
                           focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                           transition-colors"
              />
              <p className="text-xs text-muted-foreground/80 flex items-start gap-1.5">
                <span className="shrink-0">⚠️</span>
                Tu correo vincula los créditos a tu cuenta. Si cambias de dispositivo o navegador,
                lo usaremos para recuperar tu acceso sin perder ningún análisis.
              </p>
            </div>
          </div>

          {err && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {err}
            </div>
          )}

          {/* CTA */}
          <button
            onClick={handlePay}
            disabled={loading}
            className="w-full h-12 rounded-xl text-base font-bold text-white shadow-lg transition-all duration-200
                       bg-gradient-to-r from-amber-500 to-yellow-500
                       hover:from-amber-600 hover:to-yellow-600
                       hover:shadow-amber-300/40 hover:scale-[1.02]
                       active:scale-[0.99]
                       disabled:opacity-60 disabled:pointer-events-none
                       dark:shadow-amber-900/30"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Redirigiendo al pago…
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <CreditCard className="h-4 w-4" />
                Pagar 7,90 € y conseguir 7 análisis
              </span>
            )}
          </button>

          <div className="flex items-center justify-center gap-5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Lock className="h-3 w-3" /> Pago seguro con Stripe
            </span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> Sin suscripción
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

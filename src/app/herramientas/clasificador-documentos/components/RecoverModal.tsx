"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle, AlertCircle, Loader2, X, Mail, CreditCard } from "lucide-react"

export function RecoverModal({
  onClose,
  onPayAgain,
}: {
  onClose: () => void
  onPayAgain: () => void
}) {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [exhausted, setExhausted] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [err, setErr] = useState("")

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [onClose])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErr("")
    try {
      const res = await fetch("/api/clasificador/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErr(data.error ?? "Error al enviar el correo.")
        return
      }
      if (data.notFound) {
        setNotFound(true)
      } else if (data.exhausted) {
        setExhausted(true)
      } else {
        setSent(true)
      }
    } catch {
      setErr("Error de conexión. Inténtalo de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-background shadow-2xl border border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-border">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary shrink-0" />
            <p className="font-semibold text-foreground">Recuperar acceso</p>
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
        <div className="px-6 py-5">
          {sent ? (
            <div className="space-y-3 text-center py-4">
              <CheckCircle className="h-10 w-10 text-green-500 mx-auto" />
              <p className="font-semibold text-foreground">Revisa tu correo</p>
              <p className="text-sm text-muted-foreground">
                Te hemos enviado un enlace de acceso. Úsalo para recuperar tus análisis
                disponibles.
              </p>
              <Button variant="outline" className="w-full mt-2" onClick={onClose}>
                Cerrar
              </Button>
            </div>
          ) : exhausted ? (
            <div className="space-y-4 py-2">
              <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 px-4 py-4">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                    Has agotado tus análisis
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                    El correo introducido ya no tiene análisis disponibles. Realiza un nuevo
                    pago para obtener 10 análisis adicionales por 6,99 €.
                  </p>
                </div>
              </div>
              <Button
                className="w-full font-semibold"
                disabled={checkoutLoading}
                onClick={async () => {
                  setCheckoutLoading(true)
                  try {
                    const res = await fetch("/api/clasificador/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) })
                    const data = await res.json()
                    if (data.url) window.location.href = data.url
                    else setErr(data.error ?? "No se pudo iniciar el pago.")
                  } catch {
                    setErr("Error de conexión. Inténtalo de nuevo.")
                  } finally {
                    setCheckoutLoading(false)
                  }
                }}
              >
                {checkoutLoading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Redirigiendo…</>
                ) : (
                  <><CreditCard className="h-4 w-4" /> Pagar 7,90 € — 7 análisis nuevos</>
                )}
              </Button>
            </div>
          ) : notFound ? (
            <div className="space-y-4 py-2">
              <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 px-4 py-4">
                <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Correo no encontrado
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    No encontramos ninguna cuenta con <span className="font-medium text-foreground">{email}</span>.
                    Realiza el pago para obtener acceso y empezar a analizar.
                  </p>
                </div>
              </div>
              {err && (
                <p className="text-xs text-destructive">{err}</p>
              )}
              <Button
                className="w-full font-semibold"
                disabled={checkoutLoading}
                onClick={async () => {
                  setCheckoutLoading(true)
                  try {
                    const res = await fetch("/api/clasificador/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) })
                    const data = await res.json()
                    if (data.url) window.location.href = data.url
                    else setErr(data.error ?? "No se pudo iniciar el pago.")
                  } catch {
                    setErr("Error de conexión. Inténtalo de nuevo.")
                  } finally {
                    setCheckoutLoading(false)
                  }
                }}
              >
                {checkoutLoading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Redirigiendo…</>
                ) : (
                  <><CreditCard className="h-4 w-4" /> Pagar 7,90 € — 7 análisis</>
                )}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Introduce el email con el que pagaste y te enviamos un enlace para recuperar tus
                análisis restantes.
              </p>
              <div className="space-y-1.5" suppressHydrationWarning>
                <label htmlFor="recover-email" className="block text-sm font-medium text-foreground">
                  Correo electrónico
                </label>
                <input
                  id="recover-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="maria@ejemplo.com"
                  suppressHydrationWarning
                  className="block w-full rounded-lg border border-input bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring transition-colors"
                />
              </div>
              {err && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {err}
                </div>
              )}
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enviando…
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4" />
                    Enviar enlace de acceso
                  </>
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

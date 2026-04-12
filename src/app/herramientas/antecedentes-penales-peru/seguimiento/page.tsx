"use client"

import { Suspense, useEffect, useState, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Loader2, Search, AlertCircle } from "lucide-react"
import { StatusTracker } from "../components/StatusTracker"
import type { StatusResponse } from "../types"

// ─── Inner component (uses useSearchParams, must be inside Suspense) ──────────

function SeguimientoContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const dniParam = searchParams.get("dni") ?? ""
  const [dniInput, setDniInput] = useState(dniParam)
  const [data, setData] = useState<StatusResponse | null>(null)
  const [loadingState, setLoadingState] = useState<"idle" | "loading" | "error_404" | "error_generic">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  const fetchStatus = useCallback(async (dni: string) => {
    if (!dni || !/^\d{8}$/.test(dni)) return

    setLoadingState("loading")
    setErrorMsg("")

    try {
      const res = await fetch(`/api/antecedentes/status?dni=${encodeURIComponent(dni)}`)

      if (res.status === 404) {
        setLoadingState("error_404")
        setData(null)
        return
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setErrorMsg(body?.error ?? "Error al consultar el estado. Inténtalo de nuevo.")
        setLoadingState("error_generic")
        setData(null)
        return
      }

      const json: StatusResponse = await res.json()
      setData(json)
      setLoadingState("idle")
    } catch {
      setErrorMsg("Error de conexión. Verifica tu internet e inténtalo de nuevo.")
      setLoadingState("error_generic")
    }
  }, [])

  // Auto-fetch when DNI comes from URL
  useEffect(() => {
    if (dniParam && /^\d{8}$/.test(dniParam)) {
      fetchStatus(dniParam)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dniParam])

  // Poll every 30 seconds if not completed
  useEffect(() => {
    if (!data || data.request.status === "completado") return

    const interval = setInterval(() => {
      fetchStatus(data.request.dni)
    }, 30_000)

    return () => clearInterval(interval)
  }, [data, fetchStatus])

  function handleLookup(e: React.FormEvent) {
    e.preventDefault()
    if (!/^\d{8}$/.test(dniInput)) {
      setErrorMsg("Por favor ingresa un DNI válido de 8 dígitos.")
      setLoadingState("error_generic")
      return
    }
    router.push(`/herramientas/antecedentes-penales-peru/seguimiento?dni=${dniInput}`)
    fetchStatus(dniInput)
  }

  const showLookupForm = !dniParam || loadingState === "error_404"

  return (
    <main className="min-h-screen bg-background pt-20 pb-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-1">
            Seguimiento de solicitud
          </h1>
          <p className="text-muted-foreground text-sm">
            Consulta el estado de tu Certificado de Antecedentes Penales con Apostilla.
          </p>
        </div>

        {/* DNI lookup form — shown when no DNI in URL or when 404 */}
        {showLookupForm && (
          <div className="bg-card border border-border rounded-2xl p-6 mb-6">
            <p className="text-sm font-medium text-foreground mb-4">
              Ingresa tu DNI para consultar tu solicitud
            </p>
            <form onSubmit={handleLookup} className="flex gap-3">
              <input
                type="text"
                value={dniInput}
                onChange={(e) => {
                  setDniInput(e.target.value)
                  setErrorMsg("")
                  setLoadingState("idle")
                }}
                placeholder="DNI (8 dígitos)"
                maxLength={8}
                pattern="[0-9]{8}"
                className="flex-1 rounded-lg border border-input bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
              />
              <Button type="submit" disabled={loadingState === "loading"}>
                {loadingState === "loading" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-1.5" />
                    Consultar
                  </>
                )}
              </Button>
            </form>

            {loadingState === "error_404" && (
              <div className="mt-4 rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 px-4 py-3 flex gap-2 items-start">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  No encontramos ninguna solicitud con ese DNI. Verifica que los 8 dígitos
                  sean correctos, o{" "}
                  <a
                    href="/herramientas/antecedentes-penales-peru"
                    className="underline underline-offset-2"
                  >
                    crea una nueva solicitud
                  </a>
                  .
                </p>
              </div>
            )}

            {loadingState === "error_generic" && errorMsg && (
              <div className="mt-4 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                {errorMsg}
              </div>
            )}
          </div>
        )}

        {/* Loading spinner */}
        {loadingState === "loading" && !data && (
          <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Consultando estado…</span>
          </div>
        )}

        {/* Generic error when already have data */}
        {loadingState === "error_generic" && errorMsg && data && (
          <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-400 mb-4">
            {errorMsg}
          </div>
        )}

        {/* Status tracker */}
        {data && (
          <>
            {/* Request summary */}
            <div className="bg-card border border-border rounded-2xl px-6 py-4 mb-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Nombre: </span>
                <span className="font-medium text-foreground">{data.request.nombre_completo}</span>
              </div>
              <div>
                <span className="text-muted-foreground">DNI: </span>
                <span className="font-mono font-medium text-foreground">{data.request.dni}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Solicitud: </span>
                <span className="text-foreground">
                  {new Date(data.request.created_at).toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>

            <StatusTracker request={data.request} logs={data.logs} />

            {/* Auto-refresh notice */}
            {data.request.status !== "completado" && (
              <p className="text-center text-xs text-muted-foreground mt-4">
                Esta página se actualiza automáticamente cada 30 segundos.
              </p>
            )}
          </>
        )}
      </div>
    </main>
  )
}

// ─── Page (with Suspense for useSearchParams) ─────────────────────────────────

export default function SeguimientoPage() {
  return (
    <>
      <Navbar />
      <Suspense
        fallback={
          <main className="min-h-screen bg-background pt-20 pb-16 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </main>
        }
      >
        <SeguimientoContent />
      </Suspense>
    </>
  )
}

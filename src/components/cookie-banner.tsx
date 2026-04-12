"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

const STORAGE_KEY = "legassi_cookie_consent"

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) setVisible(true)
    } catch {
      // localStorage may be unavailable in some contexts
    }
  }, [])

  function accept() {
    try { localStorage.setItem(STORAGE_KEY, "accepted") } catch { /* noop */ }
    setVisible(false)
  }

  function reject() {
    try { localStorage.setItem(STORAGE_KEY, "rejected") } catch { /* noop */ }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Aviso de cookies"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-sm shadow-xl"
    >
      <div className="container mx-auto max-w-5xl px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="flex-1 text-xs text-muted-foreground leading-relaxed">
          Usamos cookies técnicas estrictamente necesarias para el funcionamiento del sitio.
          No usamos cookies publicitarias ni de rastreo de terceros.{" "}
          <a href="/privacidad" className="text-primary underline underline-offset-2 hover:opacity-80">
            Más información
          </a>
          .
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" variant="outline" onClick={reject} className="text-xs h-8 px-3">
            Rechazar no esenciales
          </Button>
          <Button size="sm" onClick={accept} className="text-xs h-8 px-4">
            Aceptar
          </Button>
          <button
            type="button"
            onClick={accept}
            aria-label="Cerrar aviso de cookies"
            className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

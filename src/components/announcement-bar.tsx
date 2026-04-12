"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { X, Sparkles, ArrowRight } from "lucide-react"

const DISMISSED_KEY = "legassi_announcement_dismissed_v1"

export function AnnouncementBar() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(DISMISSED_KEY)) setVisible(true)
    } catch { /* noop */ }
  }, [])

  function dismiss() {
    try { localStorage.setItem(DISMISSED_KEY, "1") } catch { /* noop */ }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="relative z-50 bg-primary text-primary-foreground">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-center gap-3 py-2.5 text-sm font-medium">
          <Sparkles className="h-4 w-4 shrink-0 opacity-90" />
          <span className="text-center leading-snug">
            <span className="font-semibold">Regularización extraordinaria 2026:</span>{" "}
            verifica tus documentos de permanencia con IA —{" "}
            <Link
              href="/herramientas/clasificador-documentos"
              className="underline underline-offset-2 hover:opacity-80 transition-opacity inline-flex items-center gap-1"
            >
              prueba gratis <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </span>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Cerrar anuncio"
            className="absolute right-4 p-1 rounded opacity-70 hover:opacity-100 transition-opacity"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

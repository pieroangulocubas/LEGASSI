"use client"

import { useEffect, useState, useCallback } from "react"
import { CheckCircle } from "lucide-react"

interface ToastEvent {
  id: number
  text: string
}

const EVENTS = [
  "María G. (Madrid) acaba de verificar su expediente — 14 docs ✓",
  "Carlos R. (Barcelona) generó su PDF listo para presentar",
  "Ana L. (Valencia) detectó 2 documentos que le faltaban",
  "José M. (Sevilla) confirmó cobertura completa de 6 meses",
  "Lucía P. (Bilbao) acaba de analizar 9 documentos ✓",
  "Andrés T. (Zaragoza) pagó y verificó todo en 30 segundos",
  "Fatima B. (Málaga) acaba de completar su análisis",
  "Diego C. (Murcia) encontró un error antes de presentar",
  "Rosa M. (Alicante) confirmó sus 5 meses obligatorios ✓",
  "Ibrahim S. (Palma) generó su expediente ordenado en PDF",
  "Yolanda F. (Valladolid) verificó documentos de toda la familia",
  "Mohammed A. (Córdoba) acaba de analizar 11 documentos ✓",
]

let _counter = 0

export function SocialProofToast() {
  const [toasts, setToasts] = useState<ToastEvent[]>([])

  const showToast = useCallback(() => {
    const text = EVENTS[Math.floor(Math.random() * EVENTS.length)]
    const id = ++_counter
    setToasts((prev) => [...prev, { id, text }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }, [])

  useEffect(() => {
    // First toast after 10-18s, then every 22-40s
    let timeout: ReturnType<typeof setTimeout>

    function schedule() {
      const delay = toasts.length === 0
        ? 10000 + Math.random() * 8000
        : 22000 + Math.random() * 18000
      timeout = setTimeout(() => {
        showToast()
        schedule()
      }, delay)
    }

    schedule()
    return () => clearTimeout(timeout)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showToast])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-5 left-5 z-50 flex flex-col gap-2 max-w-xs pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex items-start gap-2.5 rounded-xl border border-border bg-background/95 backdrop-blur-sm shadow-lg px-4 py-3 animate-in slide-in-from-left-4 fade-in duration-300"
        >
          <CheckCircle className="h-4 w-4 shrink-0 text-green-500 mt-0.5" />
          <p className="text-xs text-foreground leading-snug">{t.text}</p>
        </div>
      ))}
    </div>
  )
}

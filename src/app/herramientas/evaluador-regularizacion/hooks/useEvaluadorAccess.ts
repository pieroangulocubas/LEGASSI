"use client"

import { useCallback, useEffect, useState } from "react"

const STORAGE_KEY = "evaluador_access_token"

export function useEvaluadorAccess() {
  const [token, setToken] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    // Dev / test bypass — no payment required
    if (process.env.NEXT_PUBLIC_EVALUADOR_TEST_MODE === "true") {
      setToken("test-mode")
      return
    }

    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (stored) { setToken(stored); return }

    const params = new URLSearchParams(window.location.search)
    const sessionId = params.get("evaluador_session_id")
    if (!sessionId) return

    setVerifying(true)
    fetch(`/api/evaluador/verify?session_id=${sessionId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.token) {
          sessionStorage.setItem(STORAGE_KEY, data.token)
          setToken(data.token)
          const url = new URL(window.location.href)
          url.searchParams.delete("evaluador_session_id")
          window.history.replaceState({}, "", url.toString())
        }
      })
      .catch(() => {})
      .finally(() => setVerifying(false))
  }, [])

  const checkout = useCallback(async (nombre?: string, email?: string) => {
    const res = await fetch("/api/evaluador/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: nombre || "", email: email || "" }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
  }, [])

  return { hasAccess: !!token, verifying, checkout }
}

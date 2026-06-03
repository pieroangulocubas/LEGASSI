"use client"

import { useState } from "react"
import { Send, CheckCircle } from "lucide-react"

export function NewsletterSection() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus("loading")
    const res = await fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    if (!res.ok) throw new Error("error")
    setStatus("success")
    setEmail("")
  }

  return (
    <section className="brand-gradient">
      <div className="container mx-auto max-w-7xl px-6 sm:px-10 py-16">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-white/60 mb-3">
            Newsletter LEGASSI
          </p>
          <h2 className="font-heading font-bold text-white text-2xl sm:text-3xl text-balance mb-3">
            Cambios legales que te afectan, antes que nadie
          </h2>
          <p className="text-white/70 text-sm leading-relaxed mb-8 text-pretty">
            Avisos de cambios en la ley, guías nuevas y casos reales directamente en tu correo.
            Sin spam.
          </p>

          {status === "success" ? (
            <div className="flex flex-col items-center gap-2">
              <CheckCircle className="h-8 w-8 text-white" />
              <p className="font-semibold text-white">¡Apuntado!</p>
              <p className="text-sm text-white/70">
                Te avisamos en cuanto haya algo relevante.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-3 max-w-sm mx-auto"
            >
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="flex-1 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-foreground hover:bg-white/90 transition-all disabled:opacity-60"
              >
                {status === "loading" ? (
                  <span className="h-4 w-4 rounded-full border-2 border-foreground/30 border-t-foreground animate-spin" />
                ) : (
                  <>
                    Suscribirme <Send className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          <p className="text-xs text-white/40 mt-4">
            Puedes darte de baja en cualquier momento.
          </p>
        </div>
      </div>
    </section>
  )
}

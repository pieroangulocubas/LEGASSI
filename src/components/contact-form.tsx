"use client"

import { useState } from "react"
import { Loader2, Send, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const TIPOS = [
  { value: "preevaluacion", label: "Quiero que evalúen mi caso" },
  { value: "precios",       label: "Consulta sobre precios" },
  { value: "proceso",       label: "Cómo trabaja LEGASSI" },
  { value: "otro",          label: "Otro" },
]

export function ContactForm({ dark = false }: { dark?: boolean }) {
  const [form, setForm] = useState({
    nombre: "", email: "", telefono: "",
    tipo: "preevaluacion", mensaje: "",
    website: "", // honeypot — hidden
  })
  const [status, setStatus]   = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus("loading"); setErrorMsg("")

    try {
      const res = await fetch("/api/contacto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Error al enviar")
      setStatus("success")
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error al enviar")
      setStatus("error")
    }
  }

  const input = dark
    ? "w-full rounded-xl border border-white/15 bg-white/8 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-white/25"
    : "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all placeholder:text-muted-foreground/40"

  const label = dark
    ? "block text-xs font-semibold uppercase tracking-wide text-white/50 mb-1.5"
    : "block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5"

  if (status === "success") {
    return (
      <div className={`flex flex-col items-center justify-center text-center py-12 px-6 rounded-2xl border ${dark ? "border-emerald-400/20 bg-emerald-400/10" : "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20"}`}>
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50 mb-4">
          <CheckCircle className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h3 className={`font-heading font-bold text-lg mb-2 ${dark ? "text-white" : ""}`}>Consulta recibida</h3>
        <p className={`text-sm text-pretty max-w-xs ${dark ? "text-white/60" : "text-muted-foreground"}`}>
          Uno de nuestros asesores revisará tu caso y se pondrá en contacto contigo en menos de 24 horas.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Honeypot — invisible para humanos */}
      <input
        type="text"
        name="website"
        value={form.website}
        onChange={e => set("website", e.target.value)}
        tabIndex={-1}
        aria-hidden="true"
        className="absolute opacity-0 pointer-events-none h-0 w-0"
        autoComplete="off"
      />

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={label}>Nombre *</label>
          <input required value={form.nombre} onChange={e => set("nombre", e.target.value)} placeholder="Tu nombre" className={input} />
        </div>
        <div>
          <label className={label}>Correo electrónico *</label>
          <input required type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="tu@email.com" className={input} />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={label}>Teléfono <span className="font-normal normal-case">(opcional)</span></label>
          <input value={form.telefono} onChange={e => set("telefono", e.target.value)} placeholder="+34 600 000 000" className={input} />
        </div>
        <div>
          <label className={label}>¿En qué podemos ayudarte? *</label>
          <select required value={form.tipo} onChange={e => set("tipo", e.target.value)}
            className={input + (dark ? " [&>option]:bg-[oklch(0.2_0.02_65)] [&>option]:text-white" : "")}>
            {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className={label}>Cuéntanos tu consulta *</label>
        <textarea required rows={4} value={form.mensaje} onChange={e => set("mensaje", e.target.value)}
          placeholder="Describe tu situación o pregunta. Cuanto más detallado, mejor podremos orientarte."
          className={input + " resize-none leading-relaxed"} />
      </div>

      {status === "error" && (
        <p className={`text-sm rounded-xl px-4 py-2.5 ${dark ? "text-rose-300 bg-rose-500/15 border border-rose-400/20" : "text-rose-600 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800"}`}>
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl brand-gradient px-6 py-3.5 text-sm font-bold text-white shadow-brand hover:opacity-90 disabled:opacity-60 transition-all"
      >
        {status === "loading"
          ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando…</>
          : <><Send className="h-4 w-4" /> Enviar consulta</>
        }
      </button>

      <p className={`text-center text-xs ${dark ? "text-white/30" : "text-muted-foreground/60"}`}>
        Al enviar aceptas nuestra{" "}
        <a href="/privacidad" className={`underline ${dark ? "hover:text-white/60" : "hover:text-foreground"} transition-colors`}>política de privacidad</a>.
      </p>
    </form>
  )
}

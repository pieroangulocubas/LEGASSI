"use client"

import { useState } from "react"
import Image from "next/image"
import { Loader2, Eye, EyeOff, ShieldCheck } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail]             = useState("")
  const [password, setPassword]       = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error ?? "Credenciales incorrectas")
      }
      window.location.href = "/admin"
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Panel izquierdo — brand ── */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative flex-col justify-between p-12 overflow-hidden brand-gradient">

        {/* Decoración de fondo */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-white/5 blur-3xl" />

        {/* Logo */}
        <div className="relative z-10">
          <Image
            src="/imagotipo_ligth.svg"
            alt="LEGASSI"
            width={140}
            height={40}
            className="h-9 w-auto brightness-0 invert"
          />
        </div>

        {/* Contenido central */}
        <div className="relative z-10">
          <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-4">
            Panel de administración
          </p>
          <h1 className="font-heading font-bold text-white text-4xl xl:text-5xl leading-tight text-balance mb-6">
            Gestiona tu despacho desde un solo lugar
          </h1>
          <p className="text-white/70 text-base leading-relaxed max-w-md">
            Artículos del blog, herramientas y contenido — todo bajo control.
          </p>
        </div>

        {/* Footer del panel */}
        <div className="relative z-10 flex items-center gap-2 text-white/40 text-xs">
          <ShieldCheck className="h-3.5 w-3.5" />
          Acceso exclusivo para personal autorizado
        </div>
      </div>

      {/* ── Panel derecho — formulario ── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 bg-background">

        {/* Logo (solo en móvil) */}
        <div className="flex justify-center mb-8 lg:hidden">
          <Image src="/imagotipo_ligth.svg" alt="LEGASSI" width={140} height={40} className="h-9 w-auto block dark:hidden" />
          <Image src="/imagotipo_dark.svg"  alt="LEGASSI" width={140} height={40} className="h-9 w-auto hidden dark:block" />
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="font-heading font-bold text-2xl text-foreground mb-1">Bienvenido</h2>
            <p className="text-sm text-muted-foreground">Introduce tus credenciales para continuar.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="admin@legassi.es"
                className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all placeholder:text-muted-foreground/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-rose-600 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl px-4 py-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full rounded-xl brand-gradient text-white font-bold py-3 text-sm hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2 shadow-brand"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Iniciar sesión
            </button>

          </form>

          <div className="mt-8 flex items-center gap-2 text-xs text-muted-foreground/50">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
            Conexión segura · Solo para administradores de LEGASSI
          </div>
        </div>
      </div>

    </div>
  )
}

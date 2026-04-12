"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Loader2, ShieldCheck, FileText, Stamp, Info } from "lucide-react"
import { CelebrationModal } from "./components/CelebrationModal"
import type { AntecedentesFormData, SubmitResponse } from "./types"

// ─── InputField helper ────────────────────────────────────────────────────────

interface InputFieldProps {
  label: string
  id: string
  type?: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  pattern?: string
  maxLength?: number
  placeholder?: string
  hint?: string
}

function InputField({
  label,
  id,
  type = "text",
  value,
  onChange,
  required,
  pattern,
  maxLength,
  placeholder,
  hint,
}: InputFieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        pattern={pattern}
        maxLength={maxLength}
        placeholder={placeholder}
        className="block w-full rounded-lg border border-input bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const EMPTY_FORM: AntecedentesFormData = {
  nombre_completo: "",
  dni: "",
  fecha_emision_dni: "",
  fecha_nacimiento: "",
  nombre_madre: "",
  nombre_padre: "",
  departamento_nacimiento: "",
  provincia_nacimiento: "",
  distrito_nacimiento: "",
  email: "",
  telefono: "",
}

export default function AntecedentesPenalesPage() {
  const router = useRouter()
  const [form, setForm] = useState<AntecedentesFormData>(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [submittedDni, setSubmittedDni] = useState("")

  function field(key: keyof AntecedentesFormData) {
    return (value: string) => setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch("/api/antecedentes/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      const data: SubmitResponse = await res.json()

      if (!res.ok || !data.success) {
        setError(data.error ?? "Error al enviar la solicitud. Por favor inténtalo de nuevo.")
        return
      }

      if (data.already_exists && data.dni) {
        router.push(
          `/herramientas/antecedentes-penales-peru/seguimiento?dni=${data.dni}`
        )
        return
      }

      setSubmittedDni(data.dni ?? form.dni)
      setShowModal(true)
    } catch {
      setError("Error de conexión. Por favor verifica tu internet e inténtalo de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-background pt-20 pb-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">

          {/* Header */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
              <ShieldCheck className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Antecedentes Penales Perú con Apostilla
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Gestionamos tu Certificado de Antecedentes Penales apostillado de forma 100%
              automática. Solo rellena el formulario y nuestro sistema hace el resto.
            </p>
          </div>

          {/* Process steps info */}
          <div className="bg-card border border-border rounded-2xl p-5 mb-8">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">
              Cómo funciona
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-primary">1</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Pago de tasas</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    El bot obtiene los códigos de pago en el portal del Banco de la Nación.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Emisión del certificado</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Se genera el certificado oficial en el sistema del Poder Judicial del Perú.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Stamp className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Apostilla</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Se tramita la apostilla de La Haya para validez internacional (1–7 días).
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-foreground mb-6">Datos del solicitante</h2>

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <InputField
                label="Nombre completo"
                id="nombre_completo"
                value={form.nombre_completo}
                onChange={field("nombre_completo")}
                required
                placeholder="Tal como aparece en el DNI"
              />

              <InputField
                label="DNI"
                id="dni"
                value={form.dni}
                onChange={field("dni")}
                required
                pattern="[0-9]{8}"
                maxLength={8}
                placeholder="8 dígitos"
                hint="Ingresa exactamente 8 dígitos sin puntos ni espacios."
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InputField
                  label="Fecha de emisión del DNI"
                  id="fecha_emision_dni"
                  type="date"
                  value={form.fecha_emision_dni}
                  onChange={field("fecha_emision_dni")}
                  required
                />
                <InputField
                  label="Fecha de nacimiento"
                  id="fecha_nacimiento"
                  type="date"
                  value={form.fecha_nacimiento}
                  onChange={field("fecha_nacimiento")}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InputField
                  label="Nombre de la madre"
                  id="nombre_madre"
                  value={form.nombre_madre}
                  onChange={field("nombre_madre")}
                  required
                  placeholder="Nombre completo"
                />
                <InputField
                  label="Nombre del padre"
                  id="nombre_padre"
                  value={form.nombre_padre}
                  onChange={field("nombre_padre")}
                  required
                  placeholder="Nombre completo"
                />
              </div>

              {/* Lugar de nacimiento — tal como figura en el DNI */}
              <div className="pt-1">
                <p className="text-sm font-medium text-foreground mb-3">
                  Lugar de nacimiento <span className="text-red-500">*</span>
                  <span className="text-xs font-normal text-muted-foreground ml-2">(tal como figura en el DNI)</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <InputField
                    label="Departamento"
                    id="departamento_nacimiento"
                    value={form.departamento_nacimiento}
                    onChange={field("departamento_nacimiento")}
                    required
                    placeholder="Ej: LAMBAYEQUE"
                  />
                  <InputField
                    label="Provincia"
                    id="provincia_nacimiento"
                    value={form.provincia_nacimiento}
                    onChange={field("provincia_nacimiento")}
                    required
                    placeholder="Ej: CHICLAYO"
                  />
                  <InputField
                    label="Distrito"
                    id="distrito_nacimiento"
                    value={form.distrito_nacimiento}
                    onChange={field("distrito_nacimiento")}
                    required
                    placeholder="Ej: CHICLAYO"
                  />
                </div>
              </div>

              <InputField
                label="Correo electrónico"
                id="email"
                type="email"
                value={form.email}
                onChange={field("email")}
                required
                placeholder="para@notificaciones.com"
                hint="Te enviaremos un aviso cuando el certificado esté listo."
              />

              <InputField
                label="Teléfono / WhatsApp"
                id="telefono"
                type="tel"
                value={form.telefono}
                onChange={field("telefono")}
                required
                placeholder="+51 999 999 999"
              />

              {error && (
                <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando solicitud…
                  </>
                ) : (
                  "Enviar solicitud"
                )}
              </Button>
            </form>
          </div>

          {/* Privacy note */}
          <div className="mt-6 flex gap-2.5 items-start text-xs text-muted-foreground bg-muted/50 rounded-xl p-4">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              Tus datos se usan exclusivamente para tramitar el certificado a través de los
              portales oficiales del Gobierno del Perú. No los compartimos con terceros y los
              eliminamos una vez completado el proceso. Consulta nuestra política de privacidad
              para más información.
            </p>
          </div>
        </div>
      </main>

      {showModal && (
        <CelebrationModal
          dni={submittedDni}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}

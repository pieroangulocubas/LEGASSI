"use client"

import { useState } from "react"
import { Lock, Sparkles, FileText, FileScan, CheckCircle2, Loader2, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PaywallGateProps {
  formName: "EX31" | "EX32"
  onCheckout: (nombre: string, email: string) => Promise<void>
}

export function PaywallGate({ formName, onCheckout }: PaywallGateProps) {
  const [nombre, setNombre] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)

  const features = [
    { icon: Shield, text: "Evaluación completa de elegibilidad + vía (DA20/DA21) + puntuación" },
    { icon: CheckCircle2, text: "Checklist personalizado de documentos por persona incluida" },
    { icon: FileScan, text: "PermanencIA: verifica y organiza tus pruebas de permanencia con IA" },
    { icon: FileText, text: `Formulario oficial ${formName} autorrellenado con tus datos` },
  ]

  return (
    <div className="rounded-2xl border border-primary/30 bg-gradient-to-b from-primary/5 to-card overflow-hidden">
      <div className="px-6 py-6 flex flex-col gap-5">

        {/* Header */}
        <div className="flex items-start gap-3 flex-wrap">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0">
            <Lock className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">HERRAMIENTA COMPLETA · RD 316/2026</p>
            <p className="text-lg font-heading font-black leading-tight">
              Expediente<span className="text-primary italic">IA</span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Pago único · acceso inmediato · incluye PermanencIA</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-3xl font-black text-primary">59,90 €</p>
            <p className="text-[10px] text-muted-foreground">IVA incluido</p>
          </div>
        </div>

        {/* Feature grid */}
        <div className="grid sm:grid-cols-2 gap-2.5">
          {features.map((f, i) => (
            <div key={i} className="flex items-start gap-2.5 rounded-xl bg-muted/40 border border-border/40 px-3 py-2.5">
              <f.icon className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed">{f.text}</p>
            </div>
          ))}
        </div>

        {/* Contact fields */}
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-foreground/70">Nombre (para el recibo)</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre"
              className="h-9 rounded-lg border border-input bg-input px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-foreground/70">Email (para el recibo)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="h-9 rounded-lg border border-input bg-input px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        {/* CTA */}
        <Button
          variant="cta"
          className="w-full gap-2"
          disabled={loading}
          onClick={async () => {
            setLoading(true)
            await onCheckout(nombre, email)
          }}
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" />Redirigiendo al pago…</>
          ) : (
            <><Sparkles className="h-4 w-4" />Desbloquear ExpedienteIA — 59,90 €</>
          )}
        </Button>

        <p className="text-[10px] text-center text-muted-foreground">
          Pago seguro con Stripe · Acceso inmediato tras confirmar · Sin renovaciones
        </p>
      </div>
    </div>
  )
}

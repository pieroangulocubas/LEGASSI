"use client"

import { X, CheckCircle2, Sparkles, Users, FileText, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FreemiumUpgradeModalProps {
  nombre: string
  onPay: () => void
  onClose: () => void
}

export function FreemiumUpgradeModal({ nombre, onPay, onClose }: FreemiumUpgradeModalProps) {
  const firstName = nombre.split(" ")[0] || "tú"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl bg-background border border-border shadow-2xl overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header gradient */}
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-6 pt-8 pb-6 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/15 border border-primary/20 mb-4">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground leading-snug">
            {firstName}, sigue verificando<br />a toda tu familia
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Ya viste lo fácil que es. Ahora hazlo sin límites.
          </p>
        </div>

        {/* Benefits */}
        <div className="px-6 py-5 space-y-3">
          {[
            { icon: Users,    text: "Analiza documentos para ti, tu pareja, padres, hijos — cambia solo el nombre" },
            { icon: FileText, text: "Expediente en PDF generado automáticamente, listo para presentar" },
            { icon: Zap,      text: "Clasificación IA en segundos, sin esperar a ningún abogado" },
            { icon: CheckCircle2, text: "7 análisis completos — suficiente para toda la familia" },
          ].map(({ icon: Icon, text }, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="shrink-0 w-7 h-7 rounded-lg bg-green-50 dark:bg-green-950/30 flex items-center justify-center mt-0.5">
                <Icon className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-sm text-foreground leading-snug">{text}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="px-6 pb-6 space-y-3">
          <div className="rounded-xl bg-primary/8 border border-primary/15 px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">7 análisis completos</p>
              <p className="text-xs text-muted-foreground">Pago único · sin suscripción</p>
            </div>
            <p className="text-2xl font-bold text-primary">7,90 €</p>
          </div>

          <button
            onClick={onPay}
            className="w-full h-12 rounded-xl text-base font-bold text-white shadow-lg transition-all duration-200
                       bg-gradient-to-r from-amber-500 to-yellow-500
                       hover:from-amber-600 hover:to-yellow-600
                       hover:shadow-amber-300/40 hover:scale-[1.02]
                       active:scale-[0.99]
                       dark:shadow-amber-900/30"
          >
            Conseguir 7 análisis · 7,90 € →
          </button>

          <p className="text-center text-xs text-muted-foreground">
            Sin cuotas mensuales. Sin sorpresas. Pago único.
          </p>
        </div>
      </div>
    </div>
  )
}

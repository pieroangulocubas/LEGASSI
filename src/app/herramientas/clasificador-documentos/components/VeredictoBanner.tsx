"use client"

import { CheckCircle, AlertCircle, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AnalysisResult } from "../types"

export function VeredictoBanner({ veredicto }: { veredicto: AnalysisResult["veredicto"] }) {
  const config = {
    CUMPLE: {
      icon: CheckCircle,
      bg: "bg-green-50 dark:bg-green-950/30",
      border: "border-green-400",
      text: "text-green-800 dark:text-green-300",
      badge: "CUMPLE",
      subtitle: "Tu expediente cubre todos los meses obligatorios con pruebas sólidas.",
    },
    CUMPLE_PARCIALMENTE: {
      icon: AlertCircle,
      bg: "bg-amber-50 dark:bg-amber-950/30",
      border: "border-amber-400",
      text: "text-amber-800 dark:text-amber-300",
      badge: "CUMPLE PARCIALMENTE",
      subtitle:
        "Algunos meses solo están cubiertos con documentos de valor probatorio débil. Busca documentos más sólidos si es posible.",
    },
    NO_CUMPLE: {
      icon: XCircle,
      bg: "bg-red-50 dark:bg-red-950/30",
      border: "border-red-400",
      text: "text-red-800 dark:text-red-300",
      badge: "NO CUMPLE",
      subtitle:
        "Faltan documentos válidos para uno o más meses obligatorios. Necesitas subsanar estas carencias antes de presentar.",
    },
  }

  const c = config[veredicto]
  const Icon = c.icon

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border-2 p-4 sm:p-5 shadow-sm",
        c.bg,
        c.border
      )}
    >
      <Icon className={cn("h-6 w-6 sm:h-7 sm:w-7 mt-0.5 shrink-0", c.text)} />
      <div>
        <p className={cn("text-lg sm:text-xl font-bold tracking-tight", c.text)}>{c.badge}</p>
        <p className={cn("mt-1 text-xs sm:text-sm", c.text, "opacity-80")}>{c.subtitle}</p>
      </div>
    </div>
  )
}

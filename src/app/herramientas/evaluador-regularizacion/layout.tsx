import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Evaluador de Regularización Extraordinaria 2026 – LEGASSI",
  description:
    "Descubre en minutos si cumples los requisitos del RD 316/2026. Cuestionario guiado, puntuación de elegibilidad, checklist de documentos personalizados y recomendaciones de nuestros asesores.",
  keywords: [
    "regularización extraordinaria 2026",
    "RD 316/2026",
    "evaluar elegibilidad regularización",
    "DA20 DA21 España",
    "formulario EX31 EX32",
    "requisitos regularización masiva 2026",
    "extranjería España 2026",
    "arraigo especial 2026",
  ],
  openGraph: {
    title: "¿Puedes regularizarte en 2026? Descúbrelo en 2 minutos",
    description:
      "Cuestionario gratuito basado en el RD 316/2026. Obtén tu puntuación de elegibilidad, vía aplicable (DA20/DA21) y un checklist de documentos personalizado.",
    url: "https://legassi.es/herramientas/evaluador-regularizacion",
    siteName: "LEGASSI",
    locale: "es_ES",
    type: "website",
  },
  alternates: {
    canonical: "https://legassi.es/herramientas/evaluador-regularizacion",
  },
}

export default function EvaluadorLayout({ children }: { children: React.ReactNode }) {
  return children
}

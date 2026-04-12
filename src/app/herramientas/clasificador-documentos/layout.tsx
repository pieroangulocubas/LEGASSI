import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Verificador de permanencia para regularización extraordinaria 2025-2026 – LEGASSI",
  description:
    "Sube tus documentos y nuestra IA verifica si acreditas los 5 meses de permanencia ininterrumpida exigidos por la regularización extraordinaria. Resultado en segundos, expediente en PDF.",
  keywords: [
    "regularización extraordinaria 2025",
    "regularización extraordinaria 2026",
    "pruebas de permanencia España",
    "documentos regularización extraordinaria",
    "verificar expediente extranjería",
    "5 meses permanencia ininterrumpida",
    "regularización extranjería España",
    "arraigo especial documentos",
  ],
  openGraph: {
    title: "¿Tienes los documentos para la regularización extraordinaria? Veríficalo en segundos",
    description:
      "Herramienta gratuita con IA: sube tus documentos y descubre si acreditas los 5 meses de permanencia. Detecta meses faltantes y genera tu expediente en PDF.",
    url: "https://legassi.es/herramientas/clasificador-documentos",
    siteName: "LEGASSI",
    locale: "es_ES",
    type: "website",
  },
  alternates: {
    canonical: "https://legassi.es/herramientas/clasificador-documentos",
  },
}

export default function ClasificadorLayout({ children }: { children: React.ReactNode }) {
  return children
}

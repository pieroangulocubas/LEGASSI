import { ThemeProvider } from "@/components/theme-provider"
import { CookieBanner } from "@/components/cookie-banner"
import { AnnouncementBar } from "@/components/announcement-bar"
import type { Metadata } from "next"
import { Manrope, Montserrat } from "next/font/google"
import type React from "react"
import { Suspense } from "react"
import "./globals.css"

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
})

const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-montserrat",
  weight: ["600", "700", "800"],
})

export const metadata: Metadata = {
  title: "LEGASSI – Trámites de Extranjería, Asilo y Nacionalidad Española",
  description:
    "Tu trámite de Extranjería, Nacionalidad o Asilo, bien hecho desde el principio. Combinamos normativa vigente, criterio jurídico y herramientas de IA para preparar expedientes sólidos.",
  generator: "v0.app",
  openGraph: {
    title: "LEGASSI – Extranjería, Nacionalidad y Asilo",
    description: "Tu trámite de Extranjería, Nacionalidad o Asilo, bien hecho desde el principio. Combinamos normativa vigente, criterio jurídico y herramientas de IA para preparar expedientes sólidos.",
    url: "https://legassi.es",
    siteName: "LEGASSI – Trámites de Extranjería, Asilo y Nacionalidad Española",
    images: [
      {
        url: "https://legassi.es/legassi_despacho_online.png",
        width: 1200,
        height: 630,
        alt: "Tu imagen de previsualización",
      },
    ],
    locale: "es_ES",
    type: "website",
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {


  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`font-sans ${manrope.variable} ${montserrat.variable}`}>
        <Suspense fallback={<div>Loading...</div>}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <AnnouncementBar />
            {children}
            <CookieBanner />
          </ThemeProvider>
        </Suspense>
      </body>
    </html>
  )
}

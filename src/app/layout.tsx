import type React from "react"
import type { Metadata } from "next"
import { Manrope } from "next/font/google"
import Script from "next/script"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"
import { Suspense } from "react"

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
})

export const metadata: Metadata = {
  title: "LEGASSI – Trámites de Extranjería, Asilo y Nacionalidad Española",
  description:
    "Tu trámite de Extranjería, Nacionalidad o Asilo, bien hecho desde el principio. Combinamos normativa vigente, criterio jurídico y herramientas de IA para preparar expedientes sólidos.",
  generator: "v0.app",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "LEGASSI – Extranjería, Nacionalidad y Asilo",
    description: "Tu trámite de Extranjería, Nacionalidad o Asilo, bien hecho desde el principio. Combinamos normativa vigente, criterio jurídico y herramientas de IA para preparar expedientes sólidos.",
    url: "https://legassi.es",
    siteName: "LEGASSI – Trámites de Extranjería, Asilo y Nacionalidad Española",
    images: [
      {
        url: "https://legassi.es/og-image.jpg",
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

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "LEGASSI",
    url: "https://legassi.es",
    logo: "https://legassi.es/logo-legassi.png",
    sameAs: ["https://www.instagram.com/legassioficial"],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+34 672 297 468",
      contactType: "customer service",
      areaServed: "ES",
    },
  };
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`font-sans ${manrope.variable}`}>
        <Suspense fallback={<div>Loading...</div>}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {children}
          </ThemeProvider>
        </Suspense>
        <Script
          id="org-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
      </body>
    </html>
  )
}

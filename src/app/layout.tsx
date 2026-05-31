import { ThemeProvider } from "@/components/theme-provider"
import { CookieBanner } from "@/components/cookie-banner"
import { AnnouncementBar } from "@/components/announcement-bar"
import type { Metadata } from "next"
import { Manrope, Montserrat } from "next/font/google"
import Script from "next/script"
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
    "El primer despacho de extranjería en España con enfoque LegalTech propio. Fundado por quienes vivieron el proceso. Calidad profesional, atención humana y herramientas construidas internamente. Desde 2021.",
  generator: "v0.app",
  openGraph: {
    title: "LEGASSI – Extranjería, Nacionalidad y Asilo",
    description: "El primer despacho de extranjería en España con enfoque LegalTech propio. Fundado por quienes vivieron el proceso. Calidad profesional, atención humana y herramientas construidas internamente. Desde 2021.",
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
      <head>
        <Script
          id="gtm-script"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-5MSNW7BV');`,
          }}
        />
      </head>
      <body className={`font-sans ${manrope.variable} ${montserrat.variable}`}>
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-5MSNW7BV"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
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

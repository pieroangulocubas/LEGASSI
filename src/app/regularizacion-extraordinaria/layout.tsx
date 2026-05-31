import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Regularización Extraordinaria 2026 – El plazo se cierra | LEGASSI",
  description:
    "Tienes una oportunidad histórica para regularizar tu situación en España. El RD 316/2026 abre sus puertas hasta junio. Descubre si calificas hoy con nuestras herramientas gratuitas.",
  openGraph: {
    title: "Regularización Extraordinaria 2026 – El plazo se cierra",
    description:
      "Tienes una oportunidad histórica para regularizar tu situación en España. Descubre si calificas hoy.",
    images: [{ url: "/oferta-reg2026.png", width: 1200, height: 630 }],
    locale: "es_ES",
    type: "website",
  },
};

export default function RegularizacionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

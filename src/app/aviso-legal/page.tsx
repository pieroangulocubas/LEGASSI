import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

export const metadata: Metadata = {
  title: "Aviso Legal – LEGASSI",
  description: "Aviso legal e información sobre LEGASSI conforme a la LSSI-CE.",
}

export default function AvisoLegalPage() {
  return (
    <>
      <Navbar />
      <main className="container mx-auto max-w-3xl px-4 py-16 space-y-10 text-sm text-muted-foreground leading-relaxed">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Aviso Legal</h1>
          <p className="text-xs text-muted-foreground/70">Última actualización: abril de 2026</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">1. Datos identificativos</h2>
          <p>
            En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la
            Información y Comercio Electrónico (LSSI-CE), se informa:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong className="text-foreground">Denominación:</strong> LEGASSI</li>
            <li><strong className="text-foreground">Domicilio:</strong> Alicante, España</li>
            <li><strong className="text-foreground">Correo electrónico:</strong> info@legassi.es</li>
            <li><strong className="text-foreground">Teléfono:</strong> +34 672 29 74 68</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">2. Objeto y ámbito</h2>
          <p>
            El presente aviso legal regula el acceso, navegación y uso del sitio web{" "}
            <strong className="text-foreground">legassi.es</strong> y sus herramientas digitales.
            El acceso al sitio implica la aceptación de este aviso legal.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">3. Propiedad intelectual</h2>
          <p>
            Todos los contenidos del sitio web —incluyendo textos, imágenes, diseño, código fuente y marca— son
            propiedad de LEGASSI o de sus licenciantes y están protegidos por la legislación española e internacional
            sobre propiedad intelectual e industrial. Queda prohibida su reproducción, distribución, comunicación
            pública o transformación sin autorización expresa por escrito.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">4. Exención de responsabilidad</h2>
          <p>
            LEGASSI no garantiza la disponibilidad continua del sitio y se reserva el derecho a modificar, suspender
            o interrumpir el servicio en cualquier momento. LEGASSI no será responsable de los daños derivados del uso
            incorrecto del sitio o de la imposibilidad de acceder al mismo.
          </p>
          <p>
            Los contenidos del sitio tienen carácter meramente informativo. LEGASSI no responderá por la información
            de terceros a los que se pueda acceder mediante enlaces externos.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">5. Legislación aplicable</h2>
          <p>
            Este aviso legal se rige por la legislación española. Para cualquier controversia derivada del uso del
            sitio, las partes se someten a los Juzgados y Tribunales de Alicante, salvo que la normativa aplicable
            establezca otro fuero imperativo.
          </p>
        </section>
      </main>
      <Footer />
    </>
  )
}

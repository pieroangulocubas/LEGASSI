import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

export const metadata: Metadata = {
  title: "Términos de Servicio – LEGASSI",
  description: "Condiciones generales de uso y contratación de los servicios de LEGASSI.",
}

export default function TerminosPage() {
  return (
    <>
      <Navbar />
      <main className="container mx-auto max-w-3xl px-4 py-16 space-y-10 text-sm text-muted-foreground leading-relaxed">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Términos de Servicio</h1>
          <p className="text-xs text-muted-foreground/70">Última actualización: abril de 2026</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">1. Aceptación de los términos</h2>
          <p>
            El uso de los servicios de LEGASSI implica la aceptación plena y sin reservas de estas condiciones generales.
            Si no está de acuerdo con alguna de ellas, debe abstenerse de utilizar el servicio.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">2. Descripción del servicio</h2>
          <p>
            LEGASSI ofrece herramientas digitales de apoyo para trámites de extranjería, entre las que se incluye
            el <strong className="text-foreground">Clasificador de documentos de permanencia</strong>. Esta herramienta
            utiliza inteligencia artificial para analizar documentos y orientar al usuario sobre su valor probatorio
            en el contexto de la regularización extraordinaria.
          </p>
          <p className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 px-4 py-3 text-amber-800 dark:text-amber-300">
            <strong>Advertencia importante:</strong> El resultado del análisis tiene carácter exclusivamente orientativo
            y no constituye asesoramiento jurídico. LEGASSI no garantiza que los documentos analizados sean
            aceptados por la autoridad competente. Para obtener asesoramiento jurídico personalizado, contacte
            con nuestro equipo.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">3. Acceso y cuentas</h2>
          <p>
            El acceso a las herramientas digitales de pago requiere la adquisición de créditos mediante Stripe.
            El usuario es responsable de mantener la confidencialidad de su token de acceso.
            LEGASSI se reserva el derecho de suspender el acceso ante un uso fraudulento o contrario a estos términos.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">4. Precios y pagos</h2>
          <p>
            Los precios indicados incluyen el IVA aplicable. El pago se realiza de forma única (no suscripción)
            a través de Stripe. Los créditos adquiridos no son reembolsables una vez usados.
            Los créditos no utilizados tienen una validez de 12 meses desde la fecha de compra.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">5. Limitación de responsabilidad</h2>
          <p>
            LEGASSI no será responsable de las decisiones que el usuario adopte basándose en el resultado del
            análisis automatizado. La herramienta es un apoyo orientativo y la responsabilidad de verificar
            la documentación antes de presentarla corresponde al usuario o a su representante legal.
          </p>
          <p>
            LEGASSI no garantiza que el servicio esté disponible de forma ininterrumpida ni que esté libre de errores.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">6. Uso aceptable</h2>
          <p>
            El usuario se compromete a utilizar el servicio únicamente para fines legítimos relacionados con
            la gestión de trámites de extranjería. Queda expresamente prohibido:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Subir documentos que no sean propios o de personas que hayan dado su consentimiento expreso.</li>
            <li>Intentar vulnerar la seguridad del sistema o hacer un uso masivo automatizado del servicio.</li>
            <li>Revender o ceder los créditos adquiridos a terceros con fines comerciales.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">7. Modificaciones</h2>
          <p>
            LEGASSI se reserva el derecho a modificar estos términos en cualquier momento. Los cambios serán
            publicados en esta página con la fecha de actualización. El uso continuado del servicio tras la
            publicación de los cambios implica su aceptación.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">8. Legislación y jurisdicción</h2>
          <p>
            Estos términos se rigen por la legislación española. Cualquier disputa se someterá a los Juzgados
            y Tribunales de Alicante, salvo que la normativa de protección de consumidores establezca otro fuero.
          </p>
        </section>
      </main>
      <Footer />
    </>
  )
}

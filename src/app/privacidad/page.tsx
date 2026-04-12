import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

export const metadata: Metadata = {
  title: "Política de Privacidad – LEGASSI",
  description: "Política de privacidad y protección de datos de LEGASSI conforme al RGPD.",
}

export default function PrivacidadPage() {
  return (
    <>
      <Navbar />
      <main className="container mx-auto max-w-3xl px-4 py-16 space-y-10 text-sm text-muted-foreground leading-relaxed">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Política de Privacidad</h1>
          <p className="text-xs text-muted-foreground/70">Última actualización: abril de 2026</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">1. Responsable del tratamiento</h2>
          <p>
            El responsable del tratamiento de sus datos personales es <strong className="text-foreground">LEGASSI</strong>,
            con domicilio en Alicante, España, correo electrónico{" "}
            <a href="mailto:info@legassi.es" className="text-primary underline underline-offset-2">info@legassi.es</a>{" "}
            y teléfono +34 672 29 74 68.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">2. Datos que recogemos y finalidad</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong className="text-foreground">Datos de contacto</strong> (nombre, correo electrónico, teléfono):
              para gestionar consultas, prestar el servicio contratado y enviar comunicaciones relacionadas con el estado de su trámite.
            </li>
            <li>
              <strong className="text-foreground">Documentos de permanencia</strong> subidos a la herramienta de análisis:
              se procesan exclusivamente para generar el análisis solicitado por el usuario.
              No se almacenan de forma permanente en nuestros servidores una vez finalizado el análisis.
            </li>
            <li>
              <strong className="text-foreground">Datos de pago</strong>: gestionados íntegramente por Stripe.
              LEGASSI no almacena ningún dato de tarjeta bancaria.
            </li>
            <li>
              <strong className="text-foreground">Datos de navegación</strong> (cookies técnicas):
              necesarios para el correcto funcionamiento del sitio web.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">3. Base jurídica del tratamiento</h2>
          <p>
            El tratamiento se basa en: (a) la ejecución de un contrato o prestación de un servicio solicitado por el usuario
            (art. 6.1.b RGPD); (b) el interés legítimo para el mantenimiento y mejora del servicio; y (c) el consentimiento
            del usuario cuando sea necesario.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">4. Transferencias internacionales</h2>
          <p>
            El servicio de análisis de documentos utiliza la API de Google Gemini (Google LLC). Google actúa como
            encargado del tratamiento bajo los mecanismos de transferencia internacional aprobados por la Comisión Europea
            (Cláusulas Contractuales Tipo). Los datos no son utilizados por Google para entrenar sus modelos.
          </p>
          <p>
            Los pagos se procesan a través de Stripe Inc., que opera bajo el marco de adecuación UE–EE.UU.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">5. Conservación de los datos</h2>
          <p>
            Los datos de contacto y tokens de acceso se conservan durante el plazo necesario para prestar el servicio
            y un máximo de 2 años desde el último acceso. Los documentos subidos para análisis no se almacenan de
            forma permanente. Los datos de facturación se conservan durante el plazo legalmente exigido (mínimo 5 años).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">6. Derechos del interesado</h2>
          <p>
            Puede ejercer sus derechos de acceso, rectificación, supresión, oposición, limitación del tratamiento
            y portabilidad enviando un correo a{" "}
            <a href="mailto:info@legassi.es" className="text-primary underline underline-offset-2">info@legassi.es</a>.
            También tiene derecho a presentar una reclamación ante la Agencia Española de Protección de Datos (aepd.es).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">7. Cookies</h2>
          <p>
            Este sitio utiliza únicamente cookies técnicas estrictamente necesarias para el funcionamiento del servicio.
            No se utilizan cookies de rastreo publicitario de terceros. Puede configurar su navegador para bloquear
            o eliminar cookies, aunque esto podría afectar a la funcionalidad del sitio.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">8. Seguridad</h2>
          <p>
            Aplicamos medidas técnicas y organizativas apropiadas para proteger sus datos: comunicaciones cifradas
            mediante HTTPS/TLS, acceso restringido a los datos y almacenamiento seguro en servidores dentro de la
            infraestructura de Supabase con cifrado en reposo.
          </p>
        </section>
      </main>
      <Footer />
    </>
  )
}

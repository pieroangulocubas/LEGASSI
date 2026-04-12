"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const faqs = [
  {
    q: "¿Qué documentos prueban que estuve en España un mes concreto?",
    a: "Los de mayor valor son nóminas, contratos laborales vigentes, extractos bancarios y certificados de empadronamiento. También son válidos facturas de servicios (luz, gas, teléfono), recibos de alquiler, historiales médicos con citas presenciales y matrículas. Cuantos más documentos distintos cubran el mismo mes, más sólido es el expediente.",
  },
  {
    q: "¿El empadronamiento es suficiente por sí solo?",
    a: "El certificado de empadronamiento simple acredita dos momentos: la fecha en que te empadronaste y la fecha en que se emitió el certificado. No prueba presencia ininterrumpida entre esas dos fechas. Para acreditar más meses, necesitas el empadronamiento histórico o documentos que cubran específicamente cada mes que te falta.",
  },
  {
    q: "¿Qué pasa si me falta un mes?",
    a: "La ley exige acreditar los 5 meses anteriores de forma ininterrumpida. Si hay un mes sin cobertura, la solicitud puede ser denegada. La herramienta detecta exactamente qué meses están descubiertos para que puedas buscar documentos alternativos (facturas, recibos, citas médicas) o contactar a un asesor para explorar opciones.",
  },
  {
    q: "¿Cuántos documentos debo subir?",
    a: "No hay un número mínimo, pero se recomienda al menos un documento sólido (nómina, extracto, padrón) por cada mes obligatorio. Puedes subir hasta 20 archivos en PDF, JPG o PNG. Si tienes documentos que cubren varios meses (como un contrato), uno puede ser suficiente para ese período.",
  },
  {
    q: "¿La herramienta garantiza que mi expediente será aceptado?",
    a: "En cuanto a las pruebas de permanencia, el análisis es exhaustivo: revisa cada documento con más detalle del que haría un gestor o abogado en una revisión rápida, detecta meses sin cobertura y señala documentos débiles que podrían ser cuestionados. Sin embargo, la regularización extraordinaria exige presentar muchos más documentos además de las pruebas de permanencia: pasaporte en vigor, antecedentes penales apostillados, certificado histórico e individual de empadronamiento, partida de nacimiento apostillada, entre otros según el perfil de cada caso. Esta herramienta cubre únicamente la parte de permanencia. Se recomienda revisar el expediente completo con un asesor antes de presentarlo.",
  },
  {
    q: "¿Mis documentos quedan guardados en vuestros servidores?",
    a: "No. Los archivos se envían al servicio de análisis y se procesan en el momento. No se almacenan en nuestros servidores una vez generado el resultado. El expediente en PDF que descargas queda solo en tu dispositivo.",
  },
  {
    q: "¿Puedo usar mis créditos para analizar documentos de un familiar?",
    a: "Sí. Los 10 análisis que obtienes con el pago son transferibles: puedes cambiar el nombre antes de cada análisis y usarlo para ti, tu pareja, padres, hijos o cualquier persona de confianza.",
  },
]

export function ToolFAQ() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section className="border-t border-border pt-8 space-y-4">
      <h2 className="text-base font-semibold text-foreground">Preguntas frecuentes</h2>
      <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
        {faqs.map((faq, i) => (
          <div key={i}>
            <button
              type="button"
              onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
              aria-expanded={open === i}
            >
              <span>{faq.q}</span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                  open === i && "rotate-180"
                )}
              />
            </button>
            {open === i && (
              <div className="px-4 pb-4 text-xs text-muted-foreground leading-relaxed">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

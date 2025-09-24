import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"

export function FAQSection() {
  const faqs = [
    {
      question: "¿Qué tipos de trámites de extranjería manejan?",
      answer:
        "Nos especializamos en todos los trámites de extranjería: residencias temporales y permanentes, reagrupación familiar, nacionalidad española, estancia por estudios, protección internacional (asilo), autorizaciones de trabajo, y renovaciones. Cada caso es único y lo tratamos con la atención personalizada que merece.",
    },
    {
      question: "¿Cómo utilizan la inteligencia artificial en los procesos?",
      answer:
        "Empleamos IA para analizar la normativa más actualizada, revisar jurisprudencia relevante, y optimizar la preparación de expedientes. Esto nos permite reducir errores, acelerar procesos y asegurar que cada documento cumpla exactamente con los requisitos legales vigentes.",
    },
    {
      question: "¿Realmente gestionan las citas en consulados y oficinas públicas?",
      answer:
        "Sí, absolutamente. Nos encargamos de gestionar y conseguir citas en consulados, comisarías de policía, ayuntamientos, SEPE y cualquier otra institución relacionada con tu trámite. No tendrás que buscar terceros o tramitadores externos.",
    },
    {
      question: "¿Cuánto tiempo toma resolver un caso típico?",
      answer:
        "Los tiempos varían según el tipo de trámite y la complejidad del caso. Sin embargo, gracias a nuestra metodología tecnológica y gestión eficiente, reducimos los tiempos tradicionales hasta en un 60%. Te mantenemos informado en cada etapa del proceso.",
    },
    {
      question: "¿Qué pasa si mi caso es rechazado?",
      answer:
        "Nuestro índice de éxito supera el 98%, pero si surge algún inconveniente, analizamos las causas, preparamos los recursos necesarios y te acompañamos hasta lograr una resolución favorable. Nuestro compromiso es contigo hasta el final.",
    },
    {
      question: "¿Cómo se diferencia LEGASSI de otros despachos?",
      answer:
        "Somos el único centro que combina experiencia legal tradicional con tecnología avanzada e IA. No solo te damos una lista de requisitos como otros abogados, sino que te acompañamos personalmente, gestionamos todas tus citas y somos tu único punto de contacto confiable.",
    },
  ]

  return (
    <section id="faq" className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">
            Preguntas Frecuentes
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Resolvemos tus dudas</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Las respuestas a las preguntas más comunes sobre nuestros servicios
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}

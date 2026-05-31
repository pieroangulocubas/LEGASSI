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
      question: "¿Cómo revisan la documentación antes de presentar el expediente?",
      answer:
        "Usamos herramientas propias que construimos internamente para revisar cada expediente antes de presentarlo. Detectamos lo que falta o no cumple los requisitos antes de que lo detecte la Administración. Eso reduce errores y evita retrasos innecesarios.",
    },
    {
      question: "¿Realmente gestionan las citas en consulados y oficinas públicas?",
      answer:
        "Sí, absolutamente. Nos encargamos de gestionar y conseguir citas en consulados, comisarías de policía, ayuntamientos, SEPE y cualquier otra institución relacionada con tu trámite. No tendrás que buscar terceros o tramitadores externos.",
    },
    {
      question: "¿Cuánto tiempo toma resolver un caso típico?",
      answer:
        "Los tiempos varían según el tipo de trámite y la complejidad del caso. Te mantenemos informado en cada etapa del proceso y gestionamos los plazos activamente para evitar demoras. Antes de presentar, revisamos que el expediente esté completo.",
    },
    {
      question: "¿Qué pasa si mi caso es rechazado?",
      answer:
        "Nuestro índice de éxito supera el 98%, pero si surge algún inconveniente, analizamos las causas, preparamos los recursos necesarios y te acompañamos hasta lograr una resolución favorable. Nuestro compromiso es contigo hasta el final.",
    },
    {
      question: "¿Cómo se diferencia LEGASSI de otros despachos?",
      answer:
        "Legassi fue fundado por personas que pasaron por el proceso migratorio en España. Lo conocemos por dentro — no lo aprendimos en un libro. A eso le sumamos años gestionando casos reales, herramientas propias construidas internamente, y atención directa: sin intermediarios, sin perder el hilo de tu caso.",
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

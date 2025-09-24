import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Bot, Calendar, CheckCircle } from "lucide-react"

export function HowWeWorkSection() {
  const steps = [
    {
      icon: FileText,
      step: "01",
      title: "Análisis Inicial",
      description: "Evaluamos tu caso específico y determinamos la mejor estrategia legal para tu situación.",
    },
    {
      icon: Bot,
      step: "02",
      title: "IA + Experiencia",
      description: "Combinamos inteligencia artificial con la experiencia de nuestros abogados expertos.",
    },
    {
      icon: Calendar,
      step: "03",
      title: "Gestión Integral",
      description: "Nos encargamos de todas las citas y trámites necesarios en consulados, policía y ayuntamientos.",
    },
    {
      icon: CheckCircle,
      step: "04",
      title: "Seguimiento Total",
      description: "Acompañamiento personalizado hasta la resolución exitosa de tu expediente.",
    },
  ]

  return (
    <section className="py-16 relative" >
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">
            Nuestro Proceso
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Cómo trabajamos para ti</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Un proceso transparente y eficiente que garantiza los mejores resultados
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <Card key={index} className="relative hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                    {step.step}
                  </div>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 mt-4">
                  <step.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-100 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-60 -left-10 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />
      </div>
    </section>
  )
}

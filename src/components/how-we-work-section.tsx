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
    <section className="relative py-20 overflow-hidden bg-gradient-to-b from-background via-muted/20 to-muted/10">
      {/* Ambient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute top-20 -right-32 w-96 h-96 bg-primary/7 rounded-full blur-[110px]" />
        <div className="absolute bottom-20 -left-20 w-80 h-80 bg-secondary/7 rounded-full blur-[100px]" />
      </div>

      <div className="container relative z-10 mx-auto px-4">
        <div className="text-center mb-14">
          <Badge variant="outline" className="mb-4 border-primary/30 text-primary bg-primary/5">
            Nuestro Proceso
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Cómo trabajamos para ti</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Un proceso transparente y eficiente que garantiza los mejores resultados
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <div key={index} className="group relative pt-6">
              {/* Connector line between steps */}
              {index < steps.length - 1 && (
                <span className="hidden lg:block absolute top-10 left-[calc(50%+2.5rem)] right-[-50%] h-px bg-gradient-to-r from-primary/30 to-primary/10 z-0" />
              )}

              <div className="relative rounded-2xl border border-border/60 bg-gradient-to-b from-card to-card/80 p-6 text-center group-hover:border-primary/30 group-hover:shadow-xl group-hover:shadow-primary/5 transition-all duration-300">
                {/* Step badge */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary text-white rounded-full flex items-center justify-center text-xs font-black shadow-md shadow-primary/20">
                    {step.step}
                  </div>
                </div>

                <div className="w-12 h-12 bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 rounded-xl flex items-center justify-center mx-auto mb-4 mt-4 group-hover:from-primary/25 transition-colors">
                  <step.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

import { FileText, Bot, Calendar, CheckCircle } from "lucide-react"

const steps = [
  {
    icon: FileText,
    title: "Análisis inicial",
    description: "Evaluamos tu caso y determinamos la mejor estrategia legal para tu situación.",
  },
  {
    icon: Bot,
    title: "IA + experiencia",
    description: "Combinamos inteligencia artificial con la experiencia de nuestros asesores expertos.",
  },
  {
    icon: Calendar,
    title: "Gestión integral",
    description: "Nos encargamos de citas y trámites en consulados, policía y ayuntamientos.",
  },
  {
    icon: CheckCircle,
    title: "Resolución exitosa",
    description: "Seguimiento personalizado hasta obtener la resolución favorable de tu expediente.",
  },
]

export function HowWeWorkSection() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-6 sm:px-10 lg:px-16">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">Nuestro proceso</p>
          <h2 className="text-3xl md:text-4xl font-playfair font-bold tracking-tight">
            Cómo trabajamos para ti
          </h2>
        </div>

        <div className="relative max-w-4xl mx-auto">
          {/* Vertical connector — desktop */}
          <div className="hidden md:block absolute left-[calc(50%-1px)] top-6 bottom-6 w-px bg-gradient-to-b from-primary/20 via-primary/30 to-primary/20" />

          <div className="flex flex-col gap-10 md:gap-8">
            {steps.map((step, i) => {
              const isLeft = i % 2 === 0
              const Icon = step.icon

              return (
                <div
                  key={i}
                  className={`relative flex items-center gap-6 md:gap-10 ${isLeft ? "md:flex-row" : "md:flex-row-reverse"}`}
                >
                  {/* Text */}
                  <div className={`flex-1 text-center md:text-left ${isLeft ? "md:text-right" : "md:text-left"}`}>
                    <h3 className="font-semibold text-lg mb-1">{step.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed md:max-w-xs md:ml-auto md:mr-0 md:mx-auto">
                      {step.description}
                    </p>
                  </div>

                  {/* Icon bubble — center */}
                  <div className="shrink-0 z-10 w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-md shadow-primary/20">
                    <Icon className="w-5 h-5 text-white" />
                  </div>

                  {/* Spacer for alternating layout */}
                  <div className="flex-1 hidden md:block" />
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

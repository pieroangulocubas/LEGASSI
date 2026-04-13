import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, Shield, Users } from "lucide-react"

export function BenefitsSection() {
  const benefits = [
    {
      icon: CheckCircle,
      number: "01",
      title: "Resultados Garantizados",
      description:
        "Más del 95% de éxito en nuestros casos gracias a nuestra metodología probada y experiencia especializada.",
    },
    {
      icon: Clock,
      number: "02",
      title: "Procesos Acelerados",
      description:
        "Reducimos los tiempos de tramitación hasta en un 60% mediante tecnología avanzada y gestión eficiente.",
    },
    {
      icon: Shield,
      number: "03",
      title: "Seguridad Jurídica",
      description: "Protección total de tus datos y documentos con sistemas de seguridad de nivel bancario.",
    },
    {
      icon: Users,
      number: "04",
      title: "Atención 24/7",
      description: "Soporte continuo y seguimiento personalizado durante todo el proceso de tu trámite.",
    },
  ]

  return (
    <section className="relative py-20 overflow-hidden bg-gradient-to-b from-muted/20 via-background to-background">
      {/* Ambient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute top-10 -right-40 w-80 h-80 bg-primary/8 rounded-full blur-[100px]" />
        <div className="absolute bottom-10 -left-40 w-80 h-80 bg-secondary/8 rounded-full blur-[90px]" />
      </div>

      <div className="container relative z-10 mx-auto px-4">
        <div className="text-center mb-14">
          <Badge variant="outline" className="mb-4 border-primary/30 text-primary bg-primary/5">
            Beneficios Únicos
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
            ¿Por qué miles de inmigrantes confían en nosotros?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Descubre las ventajas que nos convierten en la opción preferida para tus trámites de extranjería
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit) => (
            <div
              key={benefit.number}
              className="group relative rounded-2xl border border-border/60 bg-gradient-to-b from-card to-card/80 p-6 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
            >
              {/* Faint background number */}
              <span className="absolute top-4 right-5 text-5xl font-black text-border/40 select-none group-hover:text-primary/10 transition-colors">
                {benefit.number}
              </span>

              <div className="w-12 h-12 bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 rounded-xl flex items-center justify-center mb-5 group-hover:from-primary/25 transition-colors">
                <benefit.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-base mb-2">{benefit.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

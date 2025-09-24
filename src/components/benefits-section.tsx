import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, Shield, Users } from "lucide-react"

export function BenefitsSection() {
  const benefits = [
    {
      icon: CheckCircle,
      title: "Resultados Garantizados",
      description:
        "Más del 95% de éxito en nuestros casos gracias a nuestra metodología probada y experiencia especializada.",
    },
    {
      icon: Clock,
      title: "Procesos Acelerados",
      description:
        "Reducimos los tiempos de tramitación hasta en un 60% mediante tecnología avanzada y gestión eficiente.",
    },
    {
      icon: Shield,
      title: "Seguridad Jurídica",
      description: "Protección total de tus datos y documentos con sistemas de seguridad de nivel bancario.",
    },
    {
      icon: Users,
      title: "Atención 24/7",
      description: "Soporte continuo y seguimiento personalizado durante todo el proceso de tu trámite.",
    },
  ]

  return (
    <section className="py-16 bg-muted/30 relative">

      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">
            Beneficios Únicos
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">¿Por qué miles de inmigrantes confían en nosotros?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Descubre las ventajas que nos convierten en la opción preferida para tus trámites de extranjería
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-40 -left-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />
      </div>
    </section>
  )
}

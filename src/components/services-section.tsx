import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Shield, Globe, Clock, Zap, HeartHandshake } from "lucide-react"

const services = [
  {
    icon: FileText,
    title: "Extranjería",
    description:
      "Trámites de residencia, renovaciones, reagrupación familiar y más. Expedientes diseñados con IA según la normativa vigente.",
  },
  {
    icon: Shield,
    title: "Nacionalidad",
    description:
      "Proceso completo de nacionalización española. Te acompañamos desde la preparación hasta la obtención.",
  },
  {
    icon: Globe,
    title: "Protección Internacional (Asilo)",
    description:
      "Asesoramiento especializado en solicitudes de asilo y protección internacional con enfoque humanitario.",
  },
]

const differentiators = [
  {
    icon: Clock,
    title: "Siempre Actualizados",
    description:
      "Normativa y jurisprudencia al día. Nuestros sistemas se actualizan constantemente con los últimos cambios legales.",
  },
  {
    icon: Zap,
    title: "Tecnología + IA",
    description:
      "Expedientes diseñados con inteligencia artificial según instrucciones específicas y jurisprudencia actualizada.",
  },
  {
    icon: HeartHandshake,
    title: "Atención Integral",
    description:
      "No solo requisitos. Te ayudamos con citas en consulados, policía, ayuntamientos, SEPE y más. Somos tu centro de confianza.",
  },
]

export function ServicesSection() {
  return (
    <section id="servicios" className="py-20 border-2 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-playfair font-bold mb-4">
            Nuestros <span className="text-primary">Servicios</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Servicios especializados en extranjería con tecnología avanzada y atención personalizada
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {services.map((service, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <service.icon className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl font-playfair">{service.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">{service.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mb-16">
          <h3 className="text-2xl md:text-3xl font-playfair font-bold mb-4">
            ¿Por qué <span className="text-secondary">elegirnos</span>?
          </h3>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {differentiators.map((item, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow border-l-4 border-l-primary">
              <CardHeader>
                <div className="mx-auto mb-4 w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center">
                  <item.icon className="h-8 w-8 text-secondary" />
                </div>
                <CardTitle className="text-xl font-playfair">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">{item.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

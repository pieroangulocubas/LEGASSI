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
    <section
      id="servicios"
      className="relative py-24 overflow-hidden bg-gradient-to-b from-background via-muted/15 to-background"
    >
      {/* Ambient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute top-20 -left-32 w-[400px] h-[400px] bg-primary/6 rounded-full blur-[110px]" />
        <div className="absolute bottom-20 -right-32 w-[400px] h-[400px] bg-secondary/6 rounded-full blur-[110px]" />
      </div>

      <div className="container relative z-10 mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-playfair font-bold mb-4 tracking-tight">
            Nuestros <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Servicios</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Servicios especializados en extranjería con tecnología avanzada y atención personalizada
          </p>
        </div>

        {/* Main services */}
        <div className="grid md:grid-cols-3 gap-7 mb-24">
          {services.map((service, index) => (
            <Card
              key={index}
              className="group text-center border-border/60 bg-gradient-to-b from-card to-card/80 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/6 transition-all duration-300"
            >
              <CardHeader>
                <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 rounded-2xl flex items-center justify-center group-hover:from-primary/25 transition-colors">
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

        {/* Divider with label */}
        <div className="relative flex items-center gap-6 mb-16">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-border/50" />
          <h3 className="text-2xl md:text-3xl font-playfair font-bold text-center shrink-0">
            ¿Por qué{" "}
            <span className="text-secondary">elegirnos</span>?
          </h3>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-border/50" />
        </div>

        {/* Differentiators */}
        <div className="grid md:grid-cols-3 gap-7">
          {differentiators.map((item, index) => (
            <Card
              key={index}
              className="group text-center border-border/60 border-l-4 border-l-primary/60 bg-gradient-to-b from-card to-card/80 hover:border-l-primary hover:shadow-xl hover:shadow-secondary/6 transition-all duration-300"
            >
              <CardHeader>
                <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-secondary/15 to-secondary/5 border border-secondary/20 rounded-2xl flex items-center justify-center group-hover:from-secondary/25 transition-colors">
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

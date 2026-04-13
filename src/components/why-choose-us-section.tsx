import { Badge } from "@/components/ui/badge"
import { Zap, Shield, Users, Award, Clock, HeartHandshake, ArrowRight } from "lucide-react"
import Link from "next/link"

export function WhyChooseUsSection() {
  const reasons = [
    {
      icon: Zap,
      title: "Tecnología Avanzada",
      description:
        "Utilizamos IA y herramientas tecnológicas de última generación para optimizar cada expediente según la normativa vigente.",
    },
    {
      icon: Shield,
      title: "Siempre Actualizados",
      description:
        "Nuestro equipo se mantiene constantemente actualizado con los cambios normativos y jurisprudencia más reciente.",
    },
    {
      icon: Users,
      title: "Atención Personalizada",
      description:
        "No solo te damos una lista de requisitos. Te acompañamos paso a paso con atención completamente personalizada.",
    },
    {
      icon: Award,
      title: "Experiencia Comprobada",
      description:
        "Combinamos la experiencia de asesores expertos con las mejores herramientas tecnológicas del mercado.",
    },
    {
      icon: Clock,
      title: "Gestión Integral",
      description:
        "Gestionamos todas tus citas: consulados, policía, ayuntamientos, SEPE. Sin necesidad de terceros externos.",
    },
    {
      icon: HeartHandshake,
      title: "Tu Centro de Confianza",
      description:
        "Somos tu único punto de contacto. No necesitas buscar tramitadores externos, nosotros nos encargamos de todo.",
    },
  ]

  return (
    <section
      id="por-que-elegirnos"
      className="relative py-20 overflow-hidden bg-gradient-to-b from-muted/15 via-background to-muted/10"
    >
      {/* Ambient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-20 right-1/4 w-96 h-96 bg-primary/6 rounded-full blur-[120px]" />
        <div className="absolute -bottom-20 left-1/4 w-80 h-80 bg-secondary/6 rounded-full blur-[100px]" />
      </div>

      <div className="container relative z-10 mx-auto px-4">
        <div className="text-center mb-14">
          <Badge variant="outline" className="mb-4 border-primary/30 text-primary bg-primary/5">
            Nuestros Diferenciadores
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">¿Por qué elegir LEGASSI?</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Somos más que un despacho tradicional. Combinamos experiencia legal, tecnología avanzada y atención humana
            para brindarte el mejor servicio en trámites de extranjería.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-14">
          {reasons.map((reason, index) => (
            <div
              key={index}
              className="group relative rounded-2xl border border-border/60 bg-gradient-to-b from-card to-card/80 p-6 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 rounded-xl flex items-center justify-center mb-4 group-hover:from-primary/25 transition-colors">
                <reason.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{reason.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{reason.description}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link
            href="https://wa.me/34672297468?text=Hola%2C%20me%20gustar%C3%ADa%20saber%20m%C3%A1s%20sobre%20sus%20servicios."
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 px-8 py-4 text-base font-bold text-amber-950 shadow-lg shadow-amber-400/30 hover:shadow-amber-400/50 hover:scale-[1.02] hover:brightness-105 active:scale-[0.99] transition-all duration-200"
          >
            Habla con un Asesor Ahora
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  )
}

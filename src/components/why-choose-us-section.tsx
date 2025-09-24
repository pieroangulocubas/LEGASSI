import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Zap, Shield, Users, Award, Clock, HeartHandshake } from "lucide-react"
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
    <section id="por-que-elegirnos" className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">
            Nuestros Diferenciadores
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">¿Por qué elegir LEGASSI?</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Somos más que un despacho tradicional. Combinamos experiencia legal, tecnología avanzada y atención humana
            para brindarte el mejor servicio en trámites de extranjería.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {reasons.map((reason, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <reason.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{reason.title}</h3>
                <p className="text-sm text-muted-foreground">{reason.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button variant="outline" size="lg" className=" hover:bg-green-400 font-semibold">
            <Link href="https://wa.me/34672297468?text=Hola%2C%20me%20gustar%C3%ADa%20saber%20m%C3%A1s%20sobre%20sus%20servicios." target="_blank" rel="noopener noreferrer">
              Habla con un Asesor Ahora
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

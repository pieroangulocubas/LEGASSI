import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Phone, Mail, MessageCircle, ArrowRight } from "lucide-react"
import Link from "next/link"

export function CTASection() {

  return (
    <section id="contacto" className="py-20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-playfair font-bold mb-6">
            ¿Listo para comenzar tu <span className="text-primary">nueva vida</span>?
          </h2>
          <p className="text-lg text-muted-foreground mb-10 text-pretty">
            No esperes más. Nuestros asesores expertos están listos para ayudarte a hacer realidad tus sueños. La
            primera consulta es gratuita.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-10">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Phone className="h-8 w-8 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Llámanos</h3>
                <p className="text-sm text-muted-foreground">Atención inmediata</p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <MessageCircle className="h-8 w-8 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">WhatsApp</h3>
                <p className="text-sm text-muted-foreground">Respuesta rápida</p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Mail className="h-8 w-8 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Email</h3>
                <p className="text-sm text-muted-foreground">Consulta detallada</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button variant="outline" size="lg" className="text-lg px-8 py-6 bg-transparent hover:bg-green-400">
              <Link 
                href="https://wa.me/34672297468?text=Hola%2C%20me%20gustar%C3%ADa%20saber%20m%C3%A1s%20sobre%20sus%20servicios."
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="Consulta express (WhatsApp)"
              >
                Consulta express (WhatsApp)
              </Link>
            </Button> 
            <Button size="lg" className="text-lg px-8 py-6 group font-semibold " asChild>
              <Link 
                href="https://wa.me/34672297468?text=Hola,%20quisiera%20agendar%20una%20consulta%20completa%20para%20el%20tr%C3%A1mite%20de%20"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Habla con un asesor por WhatsApp">
                Solicitar asesoría completa
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link >
            </Button>
          </div>

    
          <p className="text-sm text-muted-foreground mt-6">
            ✓ Garantía de éxito • ✓ Descuento en tu 1er trámite • ✓ Respuesta inmediata
          </p>
        </div>
      </div>
    </section>
  )
}

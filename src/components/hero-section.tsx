import { Button } from "@/components/ui/button"
import { ArrowRight, Scale, Brain, Users } from "lucide-react"
import Link from "next/link"

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />
      </div>
      
      <div className="container relative z-10 px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-playfair font-bold text-balance mb-6">
            Tu <span className="text-primary">Centro de Confianza</span> en{" "}
            <span className="text-secondary">Extranjería</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-muted-foreground text-pretty max-w-3xl mx-auto mb-8">
            Democratizamos los trámites de extranjería con tecnología avanzada, inteligencia artificial y la experiencia
            de abogados expertos. Atención personalizada para tu futuro mejor.
          </p>

          {/* Key features */}
          <div className="flex flex-wrap justify-center gap-6 mb-10">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Scale className="h-5 w-5 text-primary" />
              <span>Extranjería & Nacionalidad</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium">
              <Brain className="h-5 w-5 text-primary" />
              <span>Tecnología & IA</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium">
              <Users className="h-5 w-5 text-primary" />
              <span>Atención Personalizada</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="text-lg px-8 py-6 group font-semibold">
              <Link
                  href="https://app.bookitit.com/es/hosteds/widgetdefault/26decc853aa1cd84555728af0588da93e#datetime"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Habla con un asesor por WhatsApp"
                >
                  Asesórate con un experto
                </Link>
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6 bg-transparent" asChild>
              <Link href="#servicios">
                Conoce nuestros servicios
              </Link>
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="mt-12 pt-8 border-t border-border/50">
            <p className="text-sm text-muted-foreground mb-4">Confiado por miles de inmigrantes</p>
            <div className="flex justify-center items-center gap-8 text-2xl font-bold text-primary">
              <div className="text-center">
                <div>2000+</div>
                <div className="text-xs text-muted-foreground font-normal">Casos exitosos</div>
              </div>
              <div className="text-center">
                <div>98%</div>
                <div className="text-xs text-muted-foreground font-normal">Tasa de éxito</div>
              </div>
              <div className="text-center">
                <div>24/7</div>
                <div className="text-xs text-muted-foreground font-normal">Soporte</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
    </section>
  )
}

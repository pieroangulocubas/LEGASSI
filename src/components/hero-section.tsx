import { Button } from "@/components/ui/button"
import { ArrowRight, Scale, Brain, Users, FileSearch, CheckCircle, Sparkles } from "lucide-react"
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
                  href="https://wa.me/34672297468?text=Hola,%20quisiera%20agendar%20una%20consulta%20completa%20para%20el%20tr%C3%A1mite%20de%20"
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

          {/* ── Featured tool card ── */}
          <div className="mt-10 max-w-2xl mx-auto">
            <Link
              href="/herramientas/clasificador-documentos"
              className="group block rounded-2xl border-2 border-primary/40 bg-primary/5 hover:bg-primary/10 hover:border-primary/70 transition-all duration-200 p-5 text-left shadow-sm hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
                  <FileSearch className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> Herramienta IA — disponible ahora
                    </span>
                  </div>
                  <p className="font-semibold text-foreground text-base leading-snug">
                    ¿Tienes los documentos para la regularización extraordinaria?
                  </p>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    Sube tus archivos y la IA verifica si acreditas los 5 meses de permanencia,
                    detecta meses sin cobertura y genera tu expediente en PDF.
                  </p>
                  <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <li className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-primary" /> 1 análisis gratis</li>
                    <li className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-primary" /> Resultado en segundos</li>
                    <li className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-primary" /> Expediente PDF incluido</li>
                  </ul>
                </div>
                <ArrowRight className="shrink-0 h-5 w-5 text-primary mt-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
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

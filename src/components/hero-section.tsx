import { ArrowRight, Scale, Brain, Users, FileSearch, CheckCircle, Sparkles, Shield } from "lucide-react"
import Link from "next/link"

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-background via-background to-muted/30">
      {/* Decorative ambient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-[700px] h-[700px] bg-primary/7 rounded-full blur-[130px]" />
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-secondary/7 rounded-full blur-[110px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[400px] bg-primary/4 rounded-full blur-[180px]" />
      </div>

      <div className="container relative z-10 px-4 py-24 md:py-32">
        <div className="max-w-4xl mx-auto text-center">

          {/* Trust badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/8 px-4 py-1.5 text-sm font-semibold text-primary mb-8 shadow-sm shadow-primary/10">
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            <span>Centro de Extranjería líder en España</span>
          </div>

          {/* Main heading */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-playfair font-bold text-balance mb-6 tracking-tight leading-[1.05]">
            Tu{" "}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
                Centro de Confianza
              </span>
              <span className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
            </span>
            {" "}en{" "}
            <span className="text-secondary">Extranjería</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-muted-foreground text-pretty max-w-2xl mx-auto mb-10 leading-relaxed">
            Democratizamos los trámites de extranjería con tecnología avanzada, inteligencia artificial
            y la experiencia de abogados expertos. Atención personalizada para tu futuro.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link
              href="https://wa.me/34672297468?text=Hola,%20quisiera%20agendar%20una%20consulta%20completa%20para%20el%20tr%C3%A1mite%20de%20"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Habla con un asesor por WhatsApp"
              className="group inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 px-8 py-4 text-base font-bold text-amber-950 shadow-lg shadow-amber-400/30 hover:shadow-amber-400/50 hover:scale-[1.02] hover:brightness-105 active:scale-[0.99] transition-all duration-200"
            >
              Asesórate con un experto
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="#servicios"
              className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-background/70 backdrop-blur-sm px-8 py-4 text-base font-semibold text-foreground hover:border-primary/50 hover:bg-muted/60 transition-all duration-200"
            >
              Conoce nuestros servicios
            </Link>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2.5 mb-12">
            {[
              { icon: Scale, text: "Extranjería & Nacionalidad" },
              { icon: Brain, text: "Tecnología & IA" },
              { icon: Users, text: "Atención Personalizada" },
              { icon: Shield, text: "Seguridad Jurídica" },
            ].map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-2 rounded-full border border-border/60 bg-muted/50 backdrop-blur-sm px-4 py-2 text-sm font-medium text-muted-foreground"
              >
                <Icon className="h-4 w-4 text-primary shrink-0" />
                <span>{text}</span>
              </div>
            ))}
          </div>

          {/* Featured tool card */}
          <div className="max-w-2xl mx-auto mb-14">
            <Link
              href="/herramientas/clasificador-documentos"
              className="group block rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/8 via-primary/4 to-transparent hover:border-primary/50 hover:from-primary/12 transition-all duration-300 p-5 text-left shadow-sm hover:shadow-xl hover:shadow-primary/10"
            >
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/25 to-amber-500/10 border border-primary/25 flex items-center justify-center shadow-inner">
                  <FileSearch className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-1 mb-1">
                    <Sparkles className="h-3 w-3" /> Herramienta IA — disponible ahora
                  </span>
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

          {/* Trust stats */}
          <div className="border-t border-border/40 pt-8">
            <p className="text-xs uppercase tracking-widest text-muted-foreground/50 font-semibold mb-7">
              Confiado por miles de inmigrantes
            </p>
            <div className="flex justify-center items-center gap-8 md:gap-14">
              {[
                { value: "2000+", label: "Casos exitosos" },
                { value: "98%", label: "Tasa de éxito" },
                { value: "24/7", label: "Soporte" },
              ].map(({ value, label }, i) => (
                <div key={label} className="text-center relative">
                  {i > 0 && (
                    <span className="absolute -left-4 md:-left-7 top-1/2 -translate-y-1/2 h-8 w-px bg-border/60" />
                  )}
                  <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent">
                    {value}
                  </div>
                  <div className="text-xs text-muted-foreground font-normal mt-1">{label}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

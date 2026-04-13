import { ArrowRight, Scale, Brain, Users, FileSearch, CheckCircle, Sparkles, Shield } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export function HeroSection() {
  return (
    <section className="relative min-h-[calc(100vh-4rem)] flex items-center overflow-hidden bg-gradient-to-b from-background via-background to-muted/30">
      {/* Ambient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-40 right-0 w-[700px] h-[700px] bg-primary/6 rounded-full blur-[130px]" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-secondary/6 rounded-full blur-[110px]" />
      </div>

      <div className="container mx-auto relative z-10 px-6 sm:px-10 lg:px-16 py-16 md:py-20 w-full">
        <div className="grid lg:grid-cols-2 gap-16 xl:gap-24 items-center">

          {/* ── Left: text ── */}
          <div className="flex flex-col items-start max-w-xl">

            {/* Trust badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/8 px-4 py-1.5 text-sm font-semibold text-primary mb-7 shadow-sm shadow-primary/10">
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              <span>Centro de Extranjería líder en España</span>
            </div>

            {/* Heading */}
            <h1 className="text-4xl md:text-5xl lg:text-[3.25rem] xl:text-6xl font-playfair font-bold text-balance mb-5 tracking-tight leading-[1.1]">
              Tu{" "}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Centro de Confianza
                </span>
                <span className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
              </span>
              {" "}en{" "}
              <span className="text-secondary">Extranjería</span>
            </h1>

            {/* Subheading */}
            <p className="text-base md:text-lg text-muted-foreground text-pretty mb-8 leading-relaxed">
              Democratizamos los trámites de extranjería con tecnología avanzada, inteligencia
              artificial y la experiencia de abogados expertos. Atención personalizada para tu futuro.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mb-9 w-full sm:w-auto">
              <Link
                href="https://wa.me/34672297468?text=Hola,%20quisiera%20agendar%20una%20consulta%20completa%20para%20el%20tr%C3%A1mite%20de%20"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Habla con un asesor por WhatsApp"
                className="group inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary px-7 py-3.5 text-base font-bold text-white shadow-lg shadow-primary/20 hover:shadow-primary/35 hover:scale-[1.02] hover:brightness-110 active:scale-[0.99] transition-all duration-200"
              >
                Asesórate con un experto
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="#servicios"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border/80 bg-background/70 backdrop-blur-sm px-7 py-3.5 text-base font-semibold text-foreground hover:border-primary/50 hover:bg-muted/60 transition-all duration-200"
              >
                Nuestros servicios
              </Link>
            </div>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2 mb-9">
              {[
                { icon: Scale, text: "Extranjería & Nacionalidad" },
                { icon: Brain, text: "Tecnología & IA" },
                { icon: Users, text: "Atención Personalizada" },
                { icon: Shield, text: "Seguridad Jurídica" },
              ].map(({ icon: Icon, text }) => (
                <div
                  key={text}
                  className="flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/50 px-3.5 py-1.5 text-xs font-medium text-muted-foreground"
                >
                  <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>{text}</span>
                </div>
              ))}
            </div>

            {/* Trust stats */}
            <div className="flex items-center gap-8 pt-2 border-t border-border/40 w-full">
              {[
                { value: "2000+", label: "Casos exitosos" },
                { value: "98%", label: "Tasa de éxito" },
                { value: "24/7", label: "Soporte" },
              ].map(({ value, label }, i) => (
                <div key={label} className="text-center relative">
                  {i > 0 && (
                    <span className="absolute -left-4 top-1/2 -translate-y-1/2 h-7 w-px bg-border/60" />
                  )}
                  <div className="text-2xl font-bold text-primary">{value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: image ── */}
          <div className="relative hidden lg:block">
            {/* Glow */}
            <div className="absolute inset-6 bg-primary/10 rounded-3xl blur-3xl" />

            {/* Image container with fixed aspect ratio */}
            <div className="relative rounded-3xl overflow-hidden border border-primary/15 shadow-2xl shadow-black/10" style={{ height: "580px" }}>
              <Image
                src="/espaldas.png"
                alt="Persona mirando su futuro en España"
                fill
                className="object-cover object-center"
                priority
              />
              {/* Bottom fade */}
              <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background/60 to-transparent" />
            </div>

            {/* Floating tool card */}
            <Link
              href="/herramientas/clasificador-documentos"
              className="group absolute -bottom-5 inset-x-6 rounded-2xl border border-primary/25 bg-background/95 backdrop-blur-md shadow-xl shadow-black/10 p-4 hover:border-primary/50 hover:shadow-primary/15 transition-all duration-300"
            >
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/25 flex items-center justify-center">
                  <FileSearch className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-1 mb-0.5">
                    <Sparkles className="h-2.5 w-2.5" /> Herramienta Tech disponible
                  </span>
                  <p className="font-semibold text-foreground text-sm leading-snug">
                    Verifica tus pruebas de permanencia
                  </p>
                  <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
                    <li className="flex items-center gap-1"><CheckCircle className="h-2.5 w-2.5 text-primary" /> 1 análisis gratis</li>
                    <li className="flex items-center gap-1"><CheckCircle className="h-2.5 w-2.5 text-primary" /> Expediente PDF</li>
                  </ul>
                </div>
                <ArrowRight className="shrink-0 h-4 w-4 text-primary mt-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>

          {/* ── Mobile: tool card ── */}
          <div className="lg:hidden">
            <Link
              href="/herramientas/clasificador-documentos"
              className="group block rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/8 via-primary/4 to-transparent hover:border-primary/50 transition-all duration-300 p-5 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/25 flex items-center justify-center">
                  <FileSearch className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-1 mb-1">
                    <Sparkles className="h-3 w-3" /> Herramienta IA disponible
                  </span>
                  <p className="font-semibold text-foreground text-sm leading-snug">
                    ¿Tienes los documentos para la regularización extraordinaria?
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <li className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-primary" /> 1 análisis gratis</li>
                    <li className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-primary" /> Expediente PDF</li>
                  </ul>
                </div>
                <ArrowRight className="shrink-0 h-4 w-4 text-primary mt-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>

        </div>
      </div>
    </section>
  )
}

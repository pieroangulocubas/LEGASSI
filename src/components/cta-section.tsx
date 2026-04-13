import { Card, CardContent } from "@/components/ui/card"
import { Phone, Mail, MessageCircle, ArrowRight, CheckCircle } from "lucide-react"
import Link from "next/link"

export function CTASection() {
  return (
    <section
      id="contacto"
      className="relative py-24 overflow-hidden bg-gradient-to-br from-primary/6 via-background to-secondary/6"
    >
      {/* Ambient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-32 right-0 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[120px]" />
        <div className="absolute -bottom-32 left-0 w-[400px] h-[400px] bg-secondary/8 rounded-full blur-[100px]" />
      </div>

      <div className="container relative z-10 mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">

          {/* Section label */}
          <p className="text-xs uppercase tracking-widest text-primary font-bold mb-4">Contáctanos</p>

          <h2 className="text-3xl md:text-5xl font-playfair font-bold mb-6 tracking-tight">
            ¿Listo para comenzar tu{" "}
            <span className="bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent">
              nueva vida
            </span>
            ?
          </h2>
          <p className="text-lg text-muted-foreground mb-12 text-pretty max-w-xl mx-auto leading-relaxed">
            Nuestros asesores expertos están listos para ayudarte. La primera consulta es gratuita.
          </p>

          {/* Contact cards */}
          <div className="grid md:grid-cols-3 gap-5 mb-12">
            {[
              {
                icon: Phone,
                title: "Llámanos",
                sub: "Solo en horario de atención",
                note: "L–V 9h–20h",
              },
              {
                icon: MessageCircle,
                title: "WhatsApp",
                sub: "Respuesta rápida",
                note: "Disponible ahora",
                highlight: true,
              },
              {
                icon: Mail,
                title: "Email",
                sub: "Hasta 24H en responder",
                note: "info@legassi.es",
              },
            ].map(({ icon: Icon, title, sub, note, highlight }) => (
              <Card
                key={title}
                className={`text-center transition-all duration-200 hover:scale-[1.02] hover:shadow-xl ${
                  highlight
                    ? "border-primary/40 bg-gradient-to-b from-primary/8 to-transparent shadow-lg shadow-primary/10"
                    : "hover:border-border/80"
                }`}
              >
                <CardContent className="p-7">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                    highlight
                      ? "bg-gradient-to-br from-amber-500/25 to-amber-500/10 border border-primary/30"
                      : "bg-muted border border-border"
                  }`}>
                    <Icon className={`h-7 w-7 ${highlight ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <h3 className="font-semibold text-base mb-1">{title}</h3>
                  <p className="text-sm text-muted-foreground">{sub}</p>
                  <p className={`text-xs font-medium mt-2 ${highlight ? "text-primary" : "text-muted-foreground/70"}`}>
                    {note}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {/* WhatsApp express — secondary */}
            <Link
              href="https://wa.me/34672297468?text=Hola%2C%20me%20gustar%C3%ADa%20saber%20m%C3%A1s%20sobre%20sus%20servicios."
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Consulta express (WhatsApp)"
              className="inline-flex items-center gap-2.5 rounded-xl border border-border/80 bg-background/80 backdrop-blur-sm px-8 py-4 text-base font-semibold text-foreground hover:border-primary/50 hover:bg-muted/60 transition-all duration-200"
            >
              <MessageCircle className="h-5 w-5 text-primary" />
              Consulta express (WhatsApp)
            </Link>

            {/* Main CTA — amber gradient */}
            <Link
              href="https://wa.me/34672297468?text=Hola,%20quisiera%20agendar%20una%20consulta%20completa%20para%20el%20tr%C3%A1mite%20de%20"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Habla con un asesor por WhatsApp"
              className="group inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 px-8 py-4 text-base font-bold text-amber-950 shadow-lg shadow-amber-400/30 hover:shadow-amber-400/50 hover:scale-[1.02] hover:brightness-105 active:scale-[0.99] transition-all duration-200"
            >
              Solicitar asesoría completa
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-5 mt-8 text-sm text-muted-foreground">
            {["Garantía de éxito", "Descuento en tu 1er trámite", "Respuesta inmediata"].map((text) => (
              <span key={text} className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                {text}
              </span>
            ))}
          </div>

        </div>
      </div>
    </section>
  )
}

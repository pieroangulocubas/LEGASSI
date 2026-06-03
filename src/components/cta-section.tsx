import Link from "next/link"
import { ArrowRight, MessageSquare, CalendarCheck, BadgeCheck, Mail, Sparkles } from "lucide-react"
import { ContactForm } from "@/components/contact-form"

const PROCESS = [
  {
    icon: MessageSquare,
    title: "Cuéntanos tu situación",
    desc: "Precios, proceso de trabajo, dudas generales o tu caso concreto — todo bienvenido. Sin llamadas, sin esperas.",
  },
  {
    icon: BadgeCheck,
    title: "Un asesor lo analiza",
    desc: "Una persona real lee tu mensaje, evalúa tu caso y te hace las preguntas necesarias para orientarte bien.",
  },
  {
    icon: CalendarCheck,
    title: "Consulta completa si aplica",
    desc: "Si tu situación lo requiere, te proponemos una reunión detallada para diseñar la mejor estrategia juntos.",
  },
]

export function CTASection() {
  return (
    <section
      id="contacto"
      className="relative overflow-hidden"
      style={{ background: "oklch(0.96 0.010 72)" }}
    >
      {/* Decoración */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-amber-500/10 blur-[140px]" />
        <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-amber-700/10 blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
      </div>

      <div className="container relative mx-auto max-w-6xl px-6 sm:px-10 py-20">

        {/* Header */}
        <div className="mb-14 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/8 px-3.5 py-1.5 mb-5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Contáctanos</span>
          </div>
          <h2 className="font-heading font-black text-foreground text-4xl sm:text-5xl leading-[1.08] tracking-tight text-balance mb-4">
            Tu consulta llega directo{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              a nuestro equipo
            </span>
          </h2>
          <p className="text-muted-foreground text-base leading-relaxed text-pretty">
            Preguntas frecuentes con respuesta inmediata. Para tu caso concreto, un asesor real te acompaña desde el primer mensaje.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-start">

          {/* ── Columna izquierda ── */}
          <div>
            {/* Proceso */}
            <div className="space-y-8 mb-10">
              {PROCESS.map(({ icon: Icon, title, desc }, i) => (
                <div key={title} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                      <Icon className="h-4.5 w-4.5 text-primary" />
                    </div>
                    {i < PROCESS.length - 1 && (
                      <div className="w-px flex-1 bg-border mt-2 min-h-[24px]" />
                    )}
                  </div>
                  <div className="pb-6 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black text-muted-foreground/40 tracking-widest">0{i + 1}</span>
                      <p className="font-heading font-bold text-foreground text-sm">{title}</p>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed text-pretty">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Trust */}
            <div className="flex flex-col gap-2.5 mb-8">
              {[
                "Sin compromiso — valoramos tu tiempo igual que el nuestro",
                "Respuesta en menos de 24 h en días laborables",
                "Atención en toda España y en el mundo · Alicante presencial",
              ].map(text => (
                <div key={text} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <BadgeCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>{text}</span>
                </div>
              ))}
            </div>

            {/* Email directo */}
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-primary shrink-0" />
              <span className="text-muted-foreground">O escríbenos a</span>
              <a
                href="mailto:consulta@legassi.es"
                className="font-semibold text-foreground hover:text-primary transition-colors"
              >
                consulta@legassi.es
              </a>
            </div>
          </div>

          {/* ── Columna derecha — formulario ── */}
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-card">
            <h3 className="font-heading font-bold text-foreground text-lg mb-1">Déjanos tu consulta</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Rellena el formulario y te respondemos personalmente.
            </p>
            <ContactForm />
          </div>

        </div>
      </div>
    </section>
  )
}

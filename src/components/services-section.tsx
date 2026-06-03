import { FileText, Shield, Globe, MoreHorizontal, Clock, Users, HeartHandshake, ArrowRight, Flame, CalendarClock, CheckCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const services = [
  {
    icon: FileText,
    label: "Residencia legal en España",
    title: "Extranjería",
    description:
      "Nuestros asesores expertos gestionan todos los trámites de residencia y trabajo según la normativa vigente y la jurisprudencia más reciente.",
    items: [
      "Arraigos (sociolaboral, socioformativo, social, familiar, segunda oportunidad)",
      "Residencia por Reagrupación Familiar",
      "Residencia por Familiar de Ciudadano Español",
      "Residencia de Larga Duración",
      "Modificación de Residencia",
      "Renovaciones de TIE",
      "Autorización Inicial de Trabajo",
      "Estancia por Estudios",
      "Visa de Nómada Digital",
      "Residencia No Lucrativa",
      "Regularización Extraordinaria",
    ],
  },
  {
    icon: Shield,
    label: "Pasaporte europeo",
    title: "Nacionalidad Española",
    description:
      "Te acompañamos en todo el proceso de nacionalización. Abogados colegiados y asesores experimentados desde la preparación del expediente hasta la jura.",
    items: [
      "Nacionalidad por Residencia",
      "Nacionalidad por Simple Presunción",
      "Nacionalidad por Carta de Naturaleza",
      "Nacionalidad por Opción",
      "Preparación CCSE y DELE A2",
      "Jura o Promesa ante el Registro Civil",
      "Seguimiento del expediente",
    ],
  },
  {
    icon: Globe,
    label: "Protección humanitaria",
    title: "Asilo y Protección Internacional",
    description:
      "Asesoramiento especializado y humano. Nuestro equipo te ayuda a preparar tu relato, entrevista y toda la documentación necesaria.",
    items: [
      "Solicitud de Asilo",
      "Protección Subsidiaria",
      "Razones Humanitarias",
      "Cita en Comisaría u OAR",
      "Preparación de entrevista",
      "Seguimiento del expediente",
    ],
  },
  {
    icon: MoreHorizontal,
    label: "Trámites adicionales",
    title: "Otros servicios",
    description:
      "Más allá de la residencia, te ayudamos con todos los procedimientos que necesitas para construir tu vida en España.",
    items: [
      "Homologación / Equivalencia de estudios",
      "Declaración de la Renta",
      "Canje y Homologación de Licencia de Conducir",
      "Cancelación de Antecedentes Penales y Policiales",
      "Solicitud de Pareja de Hecho",
      "Expediente de Matrimonio",
      "Carta de Invitación",
      "Autorización de Regreso",
    ],
  },
]

const differentiators = [
  {
    icon: HeartHandshake,
    title: "Lo construimos porque lo vivimos",
    description: "Legassi fue fundado por personas que pasaron por el proceso migratorio en España. El miedo al primer trámite, no entender el sistema, no saber en quién confiar. Esa experiencia define cómo tratamos a cada cliente.",
  },
  {
    icon: Users,
    title: "Calidad profesional sin atajos",
    description: "Abogados colegiados y asesores especializados. Normativa al día, criterio jurídico real. Más de 2.000 casos desde 2021.",
  },
  {
    icon: Clock,
    title: "El primer despacho con LegalTech propio en extranjería",
    description: "No compramos soluciones genéricas: las construimos con los casos reales que gestionamos cada día.",
  },
]

export function ServicesSection() {
  return (
    <section
      id="servicios"
      className="relative py-16 sm:py-20 overflow-hidden bg-gradient-to-b from-background via-muted/15 to-background"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute top-20 -left-32 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-20 -right-32 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[120px]" />
      </div>

      <div className="container relative z-10 mx-auto px-6 sm:px-10 lg:px-16">

        {/* Header */}
        <div className="mb-14">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Qué hacemos</p>
          <h2 className="text-section font-heading font-bold tracking-tight">
            Servicios especializados en{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              extranjería
            </span>
          </h2>
        </div>

        {/* Regularización Extraordinaria 2026 — featured offer */}
        <div className="relative rounded-2xl overflow-hidden border border-primary/30 bg-gradient-to-r from-primary/10 via-card to-secondary/10 mb-8">
          {/* Stripe accent left */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-secondary rounded-l-2xl" />

          <div className="px-5 sm:px-6 md:px-7 py-5 md:py-6 flex flex-col md:flex-row md:items-center gap-4 md:gap-5">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="shrink-0 w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-md shadow-primary/20">
                  <Flame className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest bg-primary/15 text-primary border border-primary/25 rounded px-2 py-0.5">
                      Oferta vigente
                    </span>
                    <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                      <CalendarClock className="h-3 w-3 shrink-0" /> Hasta el 30 de junio de 2026
                    </span>
                  </div>
                  <h3 className="font-heading font-bold text-base md:text-lg leading-tight mb-1">
                    Regularización Extraordinaria 2026
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
                    Si llevas tiempo en España sin documentación, esta normativa excepcional te permite regularizar tu situación. Nuestros asesores expertos preparan y presentan tu expediente completo.
                  </p>
                  <div className="flex flex-wrap gap-3 mt-3">
                    {["Evaluador de elegibilidad", "Verificador de pruebas de permanencia", "Checklist personalizado"].map((item) => (
                      <span key={item} className="inline-flex items-center gap-1.5 text-xs text-foreground/70">
                        <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0" />
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="shrink-0 flex flex-row md:flex-col md:items-end gap-2">
                <Button variant="cta" size="sm" asChild className="whitespace-nowrap">
                  <Link href="/herramientas/evaluador-regularizacion">
                    Evaluar mi caso
                    <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
                <Link
                  href="/herramientas/permanencia"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline whitespace-nowrap"
                >
                  Verificar documentos
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
          </div>
        </div>

        {/* Service panels — 2 cols on md, 4 on xl */}
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5 mb-20">
          {services.map((service, i) => (
            <div
              key={i}
              className="group relative rounded-2xl border border-border/50 bg-card p-6 flex flex-col gap-5 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-slow"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/15 flex items-center justify-center mb-4 group-hover:from-primary/25 transition-colors">
                  <service.icon className="h-4 w-4 text-primary" />
                </div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  {service.label}
                </p>
                <h3 className="text-lg font-heading font-bold mb-2">{service.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{service.description}</p>
              </div>

              <div className="h-px bg-gradient-to-r from-primary/20 to-transparent" />

              <ul className="flex flex-col gap-1.5 flex-1">
                {service.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-foreground/80">
                    <ArrowRight className="h-3 w-3 shrink-0 text-primary/60 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="pt-2">
                <Link
                  href="https://wa.me/34672297468?text=Hola,%20quisiera%20información%20sobre%20"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                >
                  Consultar
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Why choose us */}
        <div id="por-que-elegirnos">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1.5">Por qué elegirnos</p>
          <h3 className="font-heading font-bold text-2xl sm:text-3xl tracking-tight mb-8">Lo que nos diferencia</h3>

          <div className="grid sm:grid-cols-3 gap-5">
            {differentiators.map((d, i) => (
              <div
                key={i}
                className="group relative flex flex-col gap-5 rounded-2xl border border-border bg-card px-6 py-7 hover:border-primary/30 hover:shadow-float transition-all duration-300 overflow-hidden"
              >
                {/* Número decorativo de fondo */}
                <span className="absolute -top-3 -right-1 font-heading font-black text-[80px] leading-none text-primary/5 select-none pointer-events-none group-hover:text-primary/8 transition-colors">
                  {String(i + 1).padStart(2, "0")}
                </span>

                {/* Icono */}
                <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 flex items-center justify-center group-hover:from-primary/25 transition-colors">
                  <d.icon className="h-5 w-5 text-primary" />
                </div>

                {/* Texto */}
                <div className="relative flex flex-col gap-2 flex-1">
                  <h4 className="font-heading font-bold text-base leading-snug">{d.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed text-pretty">{d.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}

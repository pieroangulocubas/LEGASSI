"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { FileText, Shield, Globe, MoreHorizontal, Clock, Users, HeartHandshake, ArrowRight, Flame, CalendarClock, CheckCircle, Expand, X } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

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
    icon: Users,
    title: "Abogados y asesores expertos",
    description: "Equipo de abogados colegiados y asesores especializados en extranjería con años de experiencia resolviendo casos reales.",
  },
  {
    icon: Clock,
    title: "Siempre actualizados",
    description: "Normativa y jurisprudencia al día. Nuestro equipo se forma continuamente para ofrecerte la mejor estrategia.",
  },
  {
    icon: HeartHandshake,
    title: "Atención integral",
    description: "Citas en consulados, policía, ayuntamientos, SEPE y más. Somos tu centro de confianza para cualquier trámite.",
  },
]

export function ServicesSection() {
  const [imgOpen, setImgOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const modal = mounted && imgOpen ? createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6"
      onClick={() => setImgOpen(false)}
    >
      <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => setImgOpen(false)}
          className="absolute -top-9 right-0 text-white/70 hover:text-white flex items-center gap-1.5 text-sm"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" /> Cerrar
        </button>
        <Image
          src="/oferta-reg2026.png"
          alt="Oferta Regularización Extraordinaria 2026"
          width={1200}
          height={800}
          className="w-full max-h-[65vh] object-contain rounded-2xl shadow-2xl"
        />
      </div>
    </div>,
    document.body
  ) : null

  return (
    <section
      id="servicios"
      className="relative py-24 overflow-hidden bg-gradient-to-b from-background via-muted/15 to-background"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute top-20 -left-32 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-20 -right-32 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[120px]" />
      </div>

      <div className="container relative z-10 mx-auto px-6 sm:px-10 lg:px-16">

        {/* Header */}
        <div className="mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">Qué hacemos</p>
          <h2 className="text-3xl md:text-4xl font-playfair font-bold tracking-tight">
            Servicios especializados en{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              extranjería
            </span>
          </h2>
        </div>

        {/* Regularización Extraordinaria 2026 — featured offer */}
        <div className="relative rounded-2xl overflow-hidden border border-primary/30 bg-gradient-to-r from-primary/10 via-card to-secondary/8 mb-8">
          {/* Stripe accent left */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-secondary rounded-l-2xl" />

          <div className="flex flex-col min-[854px]:flex-row min-[854px]:items-stretch">

            {/* Image — fila 1 en ≤853px, columna izquierda en >853px */}
            <button
              onClick={() => setImgOpen(true)}
              className="group relative shrink-0 w-full min-[854px]:w-44 lg:w-48 h-52 min-[854px]:h-auto min-[854px]:self-stretch rounded-t-2xl min-[854px]:rounded-l-2xl min-[854px]:rounded-tr-none overflow-hidden border-b min-[854px]:border-b-0 min-[854px]:border-r border-primary/20 bg-muted/40"
              aria-label="Ver imagen completa"
            >
              <Image src="/oferta-reg2026.png" alt="Oferta Regularización 2026" fill className="object-cover" />
              <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Expand className="h-5 w-5 text-white" />
              </div>
            </button>

            {/* Content — fila 2 en ≤853px, columna derecha en >853px */}
            <div className="px-4 sm:px-6 min-[854px]:px-7 py-5 min-[854px]:py-6 flex flex-col min-[854px]:flex-row min-[854px]:items-center gap-4 min-[854px]:gap-5 flex-1 min-w-0">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="shrink-0 w-9 h-9 min-[854px]:w-10 min-[854px]:h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-md shadow-primary/20">
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
                  <h3 className="font-playfair font-bold text-base min-[854px]:text-lg leading-tight mb-1">
                    Regularización Extraordinaria 2026
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
                    Si llevas tiempo en España sin documentación, esta normativa excepcional te permite regularizar tu situación. Nuestros asesores expertos preparan y presentan tu expediente completo.
                  </p>
                  <div className="flex flex-wrap gap-3 mt-3">
                    {["Análisis de elegibilidad", "Preparación del expediente", "Clasificador incluido"].map((item) => (
                      <span key={item} className="inline-flex items-center gap-1.5 text-xs text-foreground/70">
                        <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0" />
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="shrink-0 flex flex-row min-[854px]:flex-col min-[854px]:items-end gap-2">
                <Link
                  href="/herramientas/clasificador-documentos"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-4 min-[854px]:px-5 py-2 min-[854px]:py-2.5 text-xs min-[854px]:text-sm font-bold text-white shadow-md shadow-primary/20 hover:scale-[1.02] hover:brightness-110 active:scale-[0.98] transition-all duration-200 whitespace-nowrap"
                >
                  Verificar documentos
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="https://wa.me/34672297468?text=Hola,%20quiero%20información%20sobre%20la%20Regularización%20Extraordinaria%202026"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline whitespace-nowrap"
                >
                  Hablar con asesor
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {modal}

        {/* Service panels — 2 cols on md, 4 on xl */}
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5 mb-20">
          {services.map((service, i) => (
            <div
              key={i}
              className="group relative rounded-2xl border border-border/50 bg-card p-6 flex flex-col gap-5 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/15 flex items-center justify-center mb-4 group-hover:from-primary/25 transition-colors">
                  <service.icon className="h-4 w-4 text-primary" />
                </div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  {service.label}
                </p>
                <h3 className="text-lg font-playfair font-bold mb-2">{service.title}</h3>
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
        <div id="por-que-elegirnos" className="rounded-2xl border border-border/40 bg-muted/30 px-5 sm:px-8 py-6 sm:py-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">Por qué elegirnos</p>
          <h3 className="text-xl font-playfair font-bold mb-8">Lo que nos diferencia</h3>

          <div className="grid sm:grid-cols-3 gap-8">
            {differentiators.map((d, i) => (
              <div key={i} className="flex gap-4">
                <div className="shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/15 flex items-center justify-center">
                  <d.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm mb-1">{d.title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{d.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}

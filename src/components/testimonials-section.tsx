"use client"

import { useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Star, Play, Quote } from "lucide-react"

type TestimonialItem =
  | {
      type: "text"
      name: string
      country: string
      service: string
      rating: number
      text: string
      photo?: string
    }
  | {
      type: "video"
      name: string
      country: string
      service: string
      rating: number
      videoSrc: string
      thumbnail?: string
      text?: string
    }

const testimonials: TestimonialItem[] = [
  {
    type: "text",
    name: "Carlos Martos (Pinky Show) y Fiorella Vitteri",
    country: "Perú",
    service: "Nacionalidad Por Simple Presunción",
    rating: 5,
    text: "Estamos súper agradecidos con LEGASSI porque gracias a ellos Antonella ya tiene su nacionalidad española por simple presunción. Nos explicaron todo clarito, nos acompañaron en cada paso y siempre estuvieron pendientes.",
  },
  {
    type: "text",
    name: "Jackeline Galvez",
    country: "Perú",
    service: "Arraigo Socio-Formativo",
    rating: 5,
    text: "LEGASSI me ayudó a encontrar la institución adecuada para mis estudios y me guió en todo el proceso. Revisaron mis documentos, presentaron todo correctamente y siempre estuvieron pendientes. Hoy tengo mi residencia y un futuro seguro en España.",
  },
  {
    type: "text",
    name: "Milagros Murillo",
    country: "Perú",
    service: "Nacionalidad Española Por Residencia",
    rating: 5,
    text: "Con LEGASSI pude sacar mi nacionalidad española más rápido de lo que imaginaba. Me acompañaron en todo y me hicieron sentir segura. Hoy ya tengo mi resolución y estoy súper agradecida.",
  },
  {
    type: "text",
    name: "Familia Gonzalez Chacón",
    country: "Venezuela",
    service: "Protección Internacional (Asilo)",
    rating: 5,
    text: "LEGASSI nos acompañó desde el inicio en nuestro proceso de protección internacional en Madrid. Nos ayudaron con la cita, la entrevista y las pruebas. Nos dieron la residencia por razones humanitarias y nunca nos sentimos solos.",
  },
]

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="h-4 w-4 fill-primary text-primary" />
      ))}
    </div>
  )
}

function VideoCard({ item }: { item: Extract<TestimonialItem, { type: "video" }> }) {
  const [playing, setPlaying] = useState(false)

  return (
    <div className="relative rounded-2xl overflow-hidden bg-black aspect-[9/16] w-full max-w-xs mx-auto">
      {playing ? (
        <video
          src={item.videoSrc}
          controls
          autoPlay
          className="w-full h-full object-cover"
          poster={item.thumbnail}
        />
      ) : (
        <>
          {item.thumbnail ? (
            <Image src={item.thumbnail} alt={item.name} fill className="object-cover opacity-80" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-secondary/30" />
          )}
          <button
            onClick={() => setPlaying(true)}
            className="absolute inset-0 flex items-center justify-center group"
            aria-label="Reproducir video"
          >
            <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-200">
              <Play className="h-6 w-6 fill-primary text-primary ml-1" />
            </div>
          </button>
        </>
      )}
    </div>
  )
}

export function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0)

  const prev = () => setCurrentIndex((i) => (i - 1 + testimonials.length) % testimonials.length)
  const next = () => setCurrentIndex((i) => (i + 1) % testimonials.length)

  const item = testimonials[currentIndex]

  return (
    <section
      id="testimonios"
      className="relative py-24 overflow-hidden bg-gradient-to-b from-background via-muted/10 to-background"
    >
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-10 left-1/3 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-10 right-1/3 w-80 h-80 bg-secondary/5 rounded-full blur-[100px]" />
      </div>

      <div className="container relative z-10 mx-auto px-6 sm:px-10 lg:px-16">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">Testimonios</p>
          <h2 className="text-3xl md:text-4xl font-playfair font-bold tracking-tight">
            Lo que dicen nuestros{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">clientes</span>
          </h2>
        </div>

        <div className="max-w-3xl mx-auto">
          {item.type === "video" ? (
            <div className="flex flex-col items-center gap-4">
              <VideoCard item={item} />
              <div className="text-center">
                <Stars count={item.rating} />
                {item.text && (
                  <p className="mt-2 text-sm text-foreground/80 leading-relaxed max-w-xs">&quot;{item.text}&quot;</p>
                )}
                <p className="mt-3 font-semibold">{item.name}</p>
                <p className="text-sm text-muted-foreground">{item.country} · {item.service}</p>
              </div>
            </div>
          ) : (
            <div className="relative rounded-2xl border border-primary/15 bg-gradient-to-br from-card via-card to-primary/3 shadow-xl shadow-primary/5 p-5 sm:p-8 md:p-12">
              <Quote className="absolute top-6 right-8 h-14 w-14 text-primary/8 rotate-180" aria-hidden="true" />

              <Stars count={item.rating} />

              <div className="mt-4 mb-5 sm:mb-8 flex items-start gap-4">
                {item.photo ? (
                  <div className="relative shrink-0 w-14 h-14 rounded-full overflow-hidden border-2 border-primary/20">
                    <Image src={item.photo} alt={item.name} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="shrink-0 w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-xl font-bold text-primary">
                    {item.name[0]}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-base leading-tight">{item.name}</p>
                  <p className="text-sm text-muted-foreground">{item.country}</p>
                  <p className="text-xs font-semibold text-primary mt-0.5">{item.service}</p>
                </div>
              </div>

              <blockquote className="text-base sm:text-lg leading-relaxed text-pretty text-foreground/85">
                &quot;{item.text}&quot;
              </blockquote>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-between mt-6">
            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  aria-label={`Testimonio ${i + 1}`}
                  className={`rounded-full transition-all duration-200 ${
                    i === currentIndex ? "w-6 h-2.5 bg-primary" : "w-2.5 h-2.5 bg-border hover:bg-primary/40"
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={prev}
                className="w-9 h-9 rounded-full border border-border/70 bg-background flex items-center justify-center text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                aria-label="Anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={next}
                className="w-9 h-9 rounded-full border border-border/70 bg-background flex items-center justify-center text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                aria-label="Siguiente"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

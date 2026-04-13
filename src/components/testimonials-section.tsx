"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Star, Quote } from "lucide-react"

const testimonials = [
  {
    name: "Carlos Martos (Pinky Show) y Fiorella Vitteri",
    country: "Perú",
    service: "Nacionalidad Por Simple Presunción",
    rating: 5,
    text: "Estamos súper agradecidos con LEGASSI porque gracias a ellos Antonella ya tiene su nacionalidad española por simple presunción. Nos explicaron todo clarito, nos acompañaron en cada paso y siempre estuvieron pendientes. Ahora estamos felices y tranquilos por el futuro de nuestra bebé.",
  },
  {
    name: "Jackeline Galvez",
    country: "Perú",
    service: "Arraigo Socio-Formativo",
    rating: 5,
    text: "LEGASSI me ayudó a encontrar la institución adecuada para mis estudios y me guió en todo el proceso del arraigo socio formativo. Revisaron mis documentos, presentaron todo correctamente y siempre estuvieron pendientes de mí. Gracias a su apoyo, hoy tengo mi residencia y un futuro seguro en España.",
  },
  {
    name: "Milagros Murillo",
    country: "Perú",
    service: "Nacionalidad Española Por Residencia",
    rating: 5,
    text: "Con LEGASSI pude sacar mi nacionalidad española más rápido de lo que imaginaba. Tienen abogados colegiados y asesores que saben lo que hacen, me acompañaron en todo y me hicieron sentir segura. Hoy ya tengo mi resolución y estoy súper agradecida con su ayuda.",
  },
  {
    name: "Familia Gonzalez Chacón",
    country: "Venezuela",
    service: "Protección Internacional (Asilo)",
    rating: 5,
    text: "LEGASSI nos acompañó desde el inicio en nuestro proceso de protección internacional en Madrid. Nos ayudaron a conseguir la cita, preparar la entrevista, las pruebas y el relato, siempre con paciencia y cercanía. Hace poco nos dieron la residencia por razones humanitarias y estamos muy agradecidos porque sentimos que no estuvimos solos en este camino.",
  },
]

export function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0)

  const nextTestimonial = () => setCurrentIndex((prev) => (prev + 1) % testimonials.length)
  const prevTestimonial = () => setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)

  const current = testimonials[currentIndex]

  return (
    <section
      id="testimonios"
      className="relative py-24 overflow-hidden bg-gradient-to-b from-background via-muted/10 to-background"
    >
      {/* Ambient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute top-10 left-1/3 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-10 right-1/3 w-80 h-80 bg-secondary/5 rounded-full blur-[100px]" />
      </div>

      <div className="container relative z-10 mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-playfair font-bold mb-4 tracking-tight">
            Lo que dicen nuestros{" "}
            <span className="bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent">
              clientes
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Miles de inmigrantes han confiado en nosotros para hacer realidad sus sueños
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Card */}
          <div className="relative rounded-2xl border border-primary/20 bg-gradient-to-br from-card via-card to-primary/3 shadow-xl shadow-primary/5 p-8 md:p-12">
            {/* Decorative quote mark */}
            <Quote className="absolute top-6 right-8 h-16 w-16 text-primary/8 rotate-180" aria-hidden="true" />

            {/* Stars */}
            <div className="flex items-center gap-1 mb-6">
              {[...Array(current.rating)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
              ))}
            </div>

            <blockquote className="text-lg md:text-xl leading-relaxed text-pretty mb-8 text-foreground/90">
              &quot;{current.text}&quot;
            </blockquote>

            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="font-semibold text-lg">{current.name}</div>
                <div className="text-muted-foreground text-sm">{current.country}</div>
                <div className="text-sm font-semibold text-primary mt-1">{current.service}</div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={prevTestimonial}
                  className="w-9 h-9 rounded-full border border-border/70 bg-background/80 flex items-center justify-center text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                  aria-label="Testimonio anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={nextTestimonial}
                  className="w-9 h-9 rounded-full border border-border/70 bg-background/80 flex items-center justify-center text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                  aria-label="Testimonio siguiente"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Dot indicators */}
          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                aria-label={`Ver testimonio ${index + 1}`}
                className={`rounded-full transition-all duration-200 ${
                  index === currentIndex
                    ? "w-6 h-2.5 bg-primary"
                    : "w-2.5 h-2.5 bg-border hover:bg-primary/40"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

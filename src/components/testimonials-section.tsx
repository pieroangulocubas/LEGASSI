"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length)
  }

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  const currentTestimonial = testimonials[currentIndex]

  return (
    <section id="testimonios" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-playfair font-bold mb-4">
            Lo que dicen nuestros <span className="text-primary">clientes</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Miles de inmigrantes han confiado en nosotros para hacer realidad sus sueños
          </p>
        </div>

        <div className="max-w-4xl mx-auto relative">
          <Card className="relative overflow-hidden">
            <CardContent className="p-8 md:p-12">
              <Quote className="h-12 w-12 text-primary/20 mb-6" />

              <div className="mb-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(currentTestimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                  ))}
                </div>

                <blockquote className="text-lg md:text-xl leading-relaxed text-pretty mb-6">
                  &quot;{currentTestimonial.text}&quot;
                </blockquote>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-lg">{currentTestimonial.name}</div>
                  <div className="text-muted-foreground">{currentTestimonial.country}</div>
                  <div className="text-sm text-primary font-medium">{currentTestimonial.service}</div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={prevTestimonial}
                    className="rounded-full bg-transparent"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={nextTestimonial}
                    className="rounded-full bg-transparent"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Testimonial indicators */}
          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentIndex ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

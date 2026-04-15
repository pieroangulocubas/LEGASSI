"use client"

import { useRef, useState, useEffect } from "react"
import { createPortal } from "react-dom"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react"

type Resolucion = { src: string; alt: string; label: string; service: string }

const resoluciones: Resolucion[] = [
  { src: "/favorables/1.png",  alt: "Resolución favorable 1",  label: "Resolución favorable", service: "LEGASSI" },
  { src: "/favorables/2.png",  alt: "Resolución favorable 2",  label: "Resolución favorable", service: "LEGASSI" },
  { src: "/favorables/3.png",  alt: "Resolución favorable 3",  label: "Resolución favorable", service: "LEGASSI" },
  { src: "/favorables/4.png",  alt: "Resolución favorable 4",  label: "Resolución favorable", service: "LEGASSI" },
  { src: "/favorables/5.png",  alt: "Resolución favorable 5",  label: "Resolución favorable", service: "LEGASSI" },
  { src: "/favorables/6.png",  alt: "Resolución favorable 6",  label: "Resolución favorable", service: "LEGASSI" },
  { src: "/favorables/7.png",  alt: "Resolución favorable 7",  label: "Resolución favorable", service: "LEGASSI" },
  { src: "/favorables/8.png",  alt: "Resolución favorable 8",  label: "Resolución favorable", service: "LEGASSI" },
  { src: "/favorables/10.png", alt: "Resolución favorable 10", label: "Resolución favorable", service: "LEGASSI" },
  { src: "/favorables/11.png", alt: "Resolución favorable 11", label: "Resolución favorable", service: "LEGASSI" },
  { src: "/favorables/12.png", alt: "Resolución favorable 12", label: "Resolución favorable", service: "LEGASSI" },
  { src: "/favorables/13.png", alt: "Resolución favorable 13", label: "Resolución favorable", service: "LEGASSI" },
  { src: "/favorables/14.png", alt: "Resolución favorable 14", label: "Resolución favorable", service: "LEGASSI" },
  { src: "/favorables/15.png", alt: "Resolución favorable 15", label: "Resolución favorable", service: "LEGASSI" },
  { src: "/favorables/16.png", alt: "Resolución favorable 16", label: "Resolución favorable", service: "LEGASSI" },
  { src: "/favorables/17.png", alt: "Resolución favorable 17", label: "Resolución favorable", service: "LEGASSI" },
]

export function ResolucionesFavorablesSection() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState<Resolucion | null>(null)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: dir === "left" ? -300 : 300, behavior: "smooth" })
  }

  const modal = mounted && selected ? createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-sm p-6"
      onClick={() => setSelected(null)}
    >
      <div className="relative max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => setSelected(null)}
          className="absolute -top-9 right-0 text-white/70 hover:text-white flex items-center gap-1.5 text-sm"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" /> Cerrar
        </button>
        <div className="relative rounded-2xl overflow-hidden shadow-2xl">
          <Image
            src={selected.src}
            alt={selected.alt}
            width={800}
            height={1100}
            className="w-full max-h-[72vh] object-contain"
          />
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-5 py-4 rounded-b-2xl">
            <p className="text-white font-semibold text-sm">{selected.label}</p>
            <p className="text-white/60 text-xs">{selected.service} · LEGASSI</p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  ) : null

  return (
    <section id="resoluciones" className="py-20 overflow-hidden bg-muted/20">
      <div className="container mx-auto px-6 sm:px-10 lg:px-16">

        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">Casos reales</p>
            <h2 className="text-3xl md:text-4xl font-playfair font-bold tracking-tight">
              Nuestras últimas{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                resoluciones favorables
              </span>
            </h2>
          </div>

          <div className="hidden md:flex items-center gap-2 shrink-0 ml-6">
            <button
              onClick={() => scroll("left")}
              className="w-9 h-9 rounded-full border border-border/70 bg-background flex items-center justify-center text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
              aria-label="Anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="w-9 h-9 rounded-full border border-border/70 bg-background flex items-center justify-center text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
              aria-label="Siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Carousel */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {resoluciones.map((res, i) => (
            <button
              key={i}
              onClick={() => setSelected(res)}
              className="group snap-start shrink-0 w-[75%] sm:w-[calc(33.333%-11px)] lg:w-[calc(25%-12px)] rounded-xl overflow-hidden border border-border/60 bg-card shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 text-left"
            >
              <div className="relative aspect-[3/4] overflow-hidden">
                <Image
                  src={res.src}
                  alt={res.alt}
                  fill
                  sizes="(max-width: 640px) 75vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                    <Expand className="h-3.5 w-3.5 text-primary" />
                  </div>
                </div>
              </div>
              <div className="px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">{res.service}</p>
                <p className="text-xs font-semibold text-foreground leading-snug">{res.label}</p>
              </div>
            </button>
          ))}
        </div>

        <p className="mt-4 text-xs text-muted-foreground text-center">
          Documentos compartidos con autorización expresa de nuestros clientes.
        </p>
      </div>

      {modal}
    </section>
  )
}

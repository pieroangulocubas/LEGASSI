import Link from "next/link"
import { FileSearch, FileSpreadsheet, Users, FileCheck, ClipboardList, ArrowRight, Lock, ShieldCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const availableTools = [
  {
    icon: FileSearch,
    title: "Verifica tus pruebas de permanencia para la regularización extraordinaria",
    description:
      "Sube tus documentos de permanencia, la IA los clasifica por meses, detecta los válidos y genera tu expediente en PDF listo para presentar.",
    href: "/herramientas/clasificador-documentos",
    badge: "Disponible",
  },
]

const comingSoonTools = [
  {
    icon: ShieldCheck,
    title: "Antecedentes Penales de Perú con Apostilla",
    description:
      "Nuestro sistema RPA tramita automáticamente tu Certificado de Antecedentes Penales y su apostilla en los portales oficiales del gobierno peruano.",
  },
  {
    icon: FileSpreadsheet,
    title: "Rellena Modelo EX17 y TASA 790 en segundos",
    description:
      "Completa automáticamente los formularios oficiales EX17 y la tasa 790 a partir de tus datos. Sin errores, sin perder tiempo.",
  },
  {
    icon: Users,
    title: "Simulador de arraigo social",
    description:
      "Calcula si cumples los requisitos de arraigo social según tu situación: tiempo en España, vínculos familiares e integración.",
  },
  {
    icon: FileCheck,
    title: "Verificador de requisitos por permiso",
    description:
      "Indica qué permiso deseas solicitar y te decimos exactamente qué documentos necesitas según la normativa vigente.",
  },
  {
    icon: ClipboardList,
    title: "Generador de carta de motivación",
    description:
      "Crea una carta de motivación personalizada para acompañar tu solicitud de residencia o nacionalidad con IA.",
  },
]

export function ToolsSection() {
  return (
    <section id="herramientas" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-14">
          <Badge variant="outline" className="mb-4 text-primary border-primary/40 bg-primary/5">
            Herramientas IA
          </Badge>
          <h2 className="text-3xl md:text-4xl font-playfair font-bold mb-4">
            Haz tus trámites{" "}
            <span className="text-primary">más rápido</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Herramientas inteligentes para simplificar los procesos de extranjería. Algunas ya están disponibles,
            otras están en camino.
          </p>
        </div>

        {/* Available tools */}
        <div className="mb-10">
          {availableTools.map((tool) => (
            <Link
              key={tool.title}
              href={tool.href}
              className="group block max-w-2xl mx-auto rounded-2xl border-2 border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/60 transition-all duration-200 p-6 shadow-sm hover:shadow-md"
            >
              <div className="flex items-start gap-5">
                <div className="shrink-0 w-14 h-14 rounded-xl bg-primary/15 flex items-center justify-center">
                  <tool.icon className="h-7 w-7 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="font-semibold text-foreground text-lg leading-snug">{tool.title}</p>
                    <Badge className="bg-primary text-primary-foreground text-xs shrink-0">{tool.badge}</Badge>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">{tool.description}</p>
                </div>
                <ArrowRight className="shrink-0 h-5 w-5 text-primary mt-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>

        {/* Coming soon grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {comingSoonTools.map((tool) => (
            <div
              key={tool.title}
              className="relative rounded-2xl border border-border bg-muted/30 p-5 overflow-hidden select-none"
            >
              {/* Blur overlay */}
              <div className="absolute inset-0 z-10 backdrop-blur-[2px] bg-background/30 flex flex-col items-center justify-center gap-2 rounded-2xl">
                <div className="flex items-center gap-1.5 rounded-full bg-muted border border-border px-3 py-1.5 shadow-sm">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">Próximamente</span>
                </div>
              </div>

              {/* Card content (blurred behind overlay) */}
              <div className="flex items-start gap-4 mb-3">
                <div className="shrink-0 w-11 h-11 rounded-xl bg-muted flex items-center justify-center">
                  <tool.icon className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
              <p className="font-semibold text-foreground text-sm leading-snug mb-2">{tool.title}</p>
              <p className="text-muted-foreground text-xs leading-relaxed">{tool.description}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground mb-4">
            ¿Quieres que desarrollemos una herramienta específica? Cuéntanos.
          </p>
          <Button variant="outline" asChild>
            <Link href="https://wa.me/34640049993" target="_blank" rel="noopener noreferrer">
              Contactar por WhatsApp
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

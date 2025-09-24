import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Target, Eye, Heart } from "lucide-react"

export function MissionSection() {
  return (
    <section id="mision" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-playfair font-bold mb-4">
            Nuestra <span className="text-primary">Misión</span> y <span className="text-secondary">Visión</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl font-playfair">Nuestra Misión</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base leading-relaxed text-pretty">
                Democratizar los trámites de extranjería y acortar la brecha de desinformación, agilizando los procesos
                de miles de inmigrantes con la integración de herramientas tecnológicas y costos accesibles. Evitamos
                que recurran a abogados o gestores abusivos, siendo un puente entre asesores expertos y conscientes con
                inmigrantes soñadores que buscan salir adelante en esta aventura de buscar un futuro mejor.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="mx-auto mb-4 w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center">
                <Eye className="h-8 w-8 text-secondary" />
              </div>
              <CardTitle className="text-2xl font-playfair">Nuestra Visión</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base leading-relaxed text-pretty">
                Ser el centro de confianza líder en servicios de extranjería, reconocido por nuestra innovación
                tecnológica, atención personalizada y compromiso con los derechos de los inmigrantes. Aspiramos a
                transformar la experiencia de los trámites migratorios, haciéndolos más accesibles, transparentes y
                humanos para cada persona que sueña con un futuro mejor.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 text-center">
          <Card className="max-w-4xl mx-auto bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
            <CardContent className="p-8">
              <Heart className="h-12 w-12 text-primary mx-auto mb-6" />
              <h3 className="text-xl font-playfair font-semibold mb-4">Nuestro Compromiso Contigo</h3>
              <p className="text-base leading-relaxed text-pretty">
                No somos solo otro despacho de abogados. Somos tu aliado en este camino hacia un futuro mejor. Te
                acompañamos en cada paso, desde la primera consulta hasta la celebración de tu éxito. Porque creemos que
                cada sueño de inmigración merece ser tratado con respeto, profesionalidad y esperanza.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}

import { Scale, Mail, Phone, MapPin } from "lucide-react"
import Image from "next/image"

export function Footer() {
  return (
    <footer className="bg-card border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Logo and description */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <Image src="/imagotipo.svg" alt="LEGASSI" className="h-8 w-auto" width={20} height={20} />
              <span className="text-xl font-bold text-primary">LEGASSI</span>
            </div>
            <p className="text-muted-foreground mb-4 text-pretty">
              Tu centro de confianza en servicios de extranjería. Democratizamos los trámites migratorios con tecnología
              avanzada y atención personalizada.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Scale className="h-4 w-4 text-primary" />
              <span>Servicios legales especializados desde 2021</span>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold mb-4">Servicios</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Extranjería
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Nacionalidad
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Protección Internacional
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Reagrupación Familiar
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Homologación y Canje de Licencia
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4">Contacto</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <span>+34 672 29 74 68</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <span>info@legassi.es
                </span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-primary mt-0.5" />
                <span>
                  Alicante, España
                  <br />
                  Atención online en toda España
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} LEGASSI. Todos los derechos reservados.</p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">
              Política de Privacidad
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Términos de Servicio
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Aviso Legal
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

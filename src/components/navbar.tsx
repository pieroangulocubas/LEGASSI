"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Menu, CalendarArrowUpIcon } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  const navItems = [
    { href: "#servicios", label: "Servicios" },
    { href: "#por-que-elegirnos", label: "Por qué elegirnos" },
    { href: "#testimonios", label: "Testimonios" },
    { href: "#mision", label: "Misión y Visión" },
    { href: "#faq", label: "FAQ" },
    { href: "#contacto", label: "Contacto" },
  ]

  return (
    <>
      {/* Skip to content link for accessibility */}
      {/* <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 rounded-lg"
      >
        Saltar al contenido principal
      </a> */}

      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="/imagotipo.svg"
                alt="LEGASSI — LegalTech de Extranjería"
                width={40}
                height={40}
                className="h-10 w-auto"
                priority
              />
              <span className="font-bold text-xl text-foreground">LEGASSI</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6" aria-label="Navegación principal">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Desktop CTA and Theme Toggle */}
            <div className="hidden md:flex items-center space-x-4">
              <ThemeToggle />
              <Button asChild className="hover:bg-primary/90 font-semibold">
                <Link
                  href="https://app.bookitit.com/es/hosteds/widgetdefault/26decc853aa1cd84555728af0588da93e#datetime"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Habla con un asesor por WhatsApp"
                >
                  <CalendarArrowUpIcon className="mr-1 h-4 w-4" />
                  Agenda una asesoría
                </Link>
              </Button>
            </div>

            {/* Mobile Menu */}
            <div className="md:hidden flex items-center space-x-2">
              <ThemeToggle />
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Abrir menú">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[400px] px-5">
                  <SheetTitle className="sr-only">menu mobile</SheetTitle>
                  <nav className="flex flex-col space-y-4 mt-8 gap-y-2">
                    <Link href="/" className="flex items-center  space-x-2 mb-10">
                      <Image
                        src="/Imagotipo.svg"
                        alt="LEGASSI — LegalTech de Extranjería"
                        width={40}
                        height={40}
                        className="h-10 w-auto"
                        priority
                      />
                      <span className="font-bold text-xl text-foreground">LEGASSI</span>
                    </Link>
                    {navItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="text-lg font-medium text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setIsOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ))}
                    <Button asChild className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
                      <Link
                        href="https://app.bookitit.com/es/hosteds/widgetdefault/26decc853aa1cd84555728af0588da93e#datetime"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setIsOpen(false)}
                      >
                        <CalendarArrowUpIcon className="mr-2 h-4 w-4" />
                        Agenda una asesoría
                      </Link>
                    </Button>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>
    </>
  )
}

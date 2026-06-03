"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Menu, CalendarArrowUpIcon } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "#servicios",          label: "Servicios" },
  { href: "#por-que-elegirnos",  label: "Por qué elegirnos" },
  { href: "#testimonios",        label: "Testimonios" },
  { href: "#faq",                label: "FAQ" },
  { href: "#contacto",           label: "Contacto" },
  { href: "/blog",               label: "Blog" },
]

export function Navbar() {
  const [isOpen,    setIsOpen]    = useState(false)
  const [scrolled,  setScrolled]  = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <>
      <header
        className={cn(
          "fixed z-40 w-full transition-all duration-300",
          scrolled
            ? "top-3 px-4 sm:px-6"
            : "top-0 px-0"
        )}
      >
        <div
          className={cn(
            "mx-auto transition-all duration-300",
            scrolled
              ? "max-w-5xl rounded-2xl border border-border bg-background/95 backdrop-blur-md shadow-float px-5 h-14"
              : "max-w-7xl px-4 sm:px-6 lg:px-8 border-b border-border/60 bg-background/95 backdrop-blur-md h-16"
          )}
        >
          <div className="flex h-full items-center justify-between">

            {/* Logo */}
            <Link href="/" aria-label="Ir a inicio — LEGASSI">
              <Image
                src="/imagotipo_ligth.svg" alt="LEGASSI" width={130} height={36}
                className={cn("w-auto block dark:hidden transition-all", scrolled ? "h-7" : "h-9")}
                priority
              />
              <Image
                src="/imagotipo_dark.svg" alt="LEGASSI" width={130} height={36}
                className={cn("w-auto hidden dark:block transition-all", scrolled ? "h-7" : "h-9")}
                priority
              />
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1" aria-label="Navegación principal">
              {navItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-muted/60 transition-all"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-3">
              <ThemeToggle />
              <Button variant="cta" size={scrolled ? "sm" : "default"} asChild>
                <Link
                  href="https://wa.me/34672297468?text=Hola,%20quisiera%20agendar%20una%20consulta%20completa%20para%20el%20tr%C3%A1mite%20de%20"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <CalendarArrowUpIcon className="size-4 shrink-0" />
                  Agenda una asesoría
                </Link>
              </Button>
            </div>

            {/* Mobile */}
            <div className="md:hidden flex items-center gap-2">
              <ThemeToggle />
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Abrir menú">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[400px] px-5">
                  <SheetTitle className="sr-only">Menú</SheetTitle>
                  <nav className="flex flex-col space-y-1 mt-8">
                    <Link href="/" className="mb-8 inline-block" onClick={() => setIsOpen(false)}>
                      <Image src="/imagotipo_ligth.svg" alt="LEGASSI" width={130} height={36} className="h-8 w-auto block dark:hidden" />
                      <Image src="/imagotipo_dark.svg"  alt="LEGASSI" width={130} height={36} className="h-8 w-auto hidden dark:block" />
                    </Link>
                    {navItems.map(item => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="text-base font-medium text-muted-foreground hover:text-foreground px-3 py-2.5 rounded-xl hover:bg-muted/60 transition-all"
                        onClick={() => setIsOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ))}
                    <Button variant="cta" size="lg" asChild className="mt-6 w-full">
                      <Link
                        href="https://wa.me/34672297468?text=Hola,%20quisiera%20agendar%20una%20consulta%20completa%20para%20el%20tr%C3%A1mite%20de%20"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setIsOpen(false)}
                      >
                        <CalendarArrowUpIcon className="size-4 shrink-0" />
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

      {/* Spacer para compensar el fixed */}
      <div className={scrolled ? "h-0" : "h-16"} aria-hidden="true" />
    </>
  )
}

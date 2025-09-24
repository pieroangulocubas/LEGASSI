"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center">
          <span className="text-2xl font-bold text-primary">LEGASSI</span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <a href="#servicios" className="text-sm font-medium hover:text-primary transition-colors">
            Servicios
          </a>
          <a href="#por-que-elegirnos" className="text-sm font-medium hover:text-primary transition-colors">
            Por qué elegirnos
          </a>
          <a href="#testimonios" className="text-sm font-medium hover:text-primary transition-colors">
            Testimonios
          </a>
          <a href="#mision" className="text-sm font-medium hover:text-primary transition-colors">
            Misión y Visión
          </a>
          <a href="#faq" className="text-sm font-medium hover:text-primary transition-colors">
            FAQ
          </a>
          <a href="#contacto" className="text-sm font-medium hover:text-primary transition-colors">
            Contacto
          </a>
        </nav>

        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="hidden md:inline-flex"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          <Button className="hidden md:inline-flex" asChild>
            <a href="https://wa.me/34611759973" target="_blank" rel="noopener noreferrer">
              Habla con un asesor
            </a>
          </Button>

          {/* Mobile menu button */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="flex flex-col space-y-4 p-4">
            <a href="#servicios" className="text-sm font-medium hover:text-primary transition-colors">
              Servicios
            </a>
            <a href="#por-que-elegirnos" className="text-sm font-medium hover:text-primary transition-colors">
              Por qué elegirnos
            </a>
            <a href="#testimonios" className="text-sm font-medium hover:text-primary transition-colors">
              Testimonios
            </a>
            <a href="#mision" className="text-sm font-medium hover:text-primary transition-colors">
              Misión y Visión
            </a>
            <a href="#faq" className="text-sm font-medium hover:text-primary transition-colors">
              FAQ
            </a>
            <a href="#contacto" className="text-sm font-medium hover:text-primary transition-colors">
              Contacto
            </a>
            <Button className="w-full mt-4" asChild>
              <a href="https://wa.me/34611759973" target="_blank" rel="noopener noreferrer">
                Habla con un asesor
              </a>
            </Button>
          </nav>
        </div>
      )}
    </header>
  )
}

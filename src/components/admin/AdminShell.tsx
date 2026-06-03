"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  FileText, Plus, LayoutDashboard, Menu, X, LogOut,
  Wrench, Star, ImageIcon, Mail,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Nav config ──────────────────────────────────────────────────────────────
// Add new sections here as the admin grows.
const NAV_SECTIONS = [
  {
    label: "General",
    items: [
      { label: "Dashboard", href: "/admin",       icon: LayoutDashboard },
    ],
  },
  {
    label: "Blog",
    items: [
      { label: "Artículos", href: "/admin/posts",     icon: FileText },
      { label: "Nuevo",     href: "/admin/posts/new", icon: Plus },
    ],
  },
  {
    label: "Herramientas",
    items: [
      { label: "Permanencia IA",  href: "/admin/herramientas/permanencia", icon: Wrench },
      { label: "Evaluador",       href: "/admin/herramientas/evaluador",   icon: Wrench },
    ],
  },
  {
    label: "CMS",
    items: [
      { label: "Reseñas",       href: "/admin/cms/resenas",     icon: Star },
      { label: "Expedientes",   href: "/admin/cms/expedientes", icon: ImageIcon },
      { label: "Newsletter",    href: "/admin/cms/newsletter",  icon: Mail },
    ],
  },
]

// ─── Logout ───────────────────────────────────────────────────────────────────
async function logout() {
  await fetch("/api/admin/auth/logout", { method: "POST" })
  window.location.href = "/admin/login"
}

// ─── Sidebar content ──────────────────────────────────────────────────────────
function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border/60">
        <Link href="/admin/posts" onClick={onNavigate}>
          <Image
            src="/imagotipo_ligth.svg"
            alt="LEGASSI"
            width={110}
            height={32}
            className="h-8 w-auto block dark:hidden"
          />
          <Image
            src="/imagotipo_dark.svg"
            alt="LEGASSI"
            width={110}
            height={32}
            className="h-8 w-auto hidden dark:block"
          />
        </Link>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1.5">
          Panel de administración
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {NAV_SECTIONS.map(section => (
          <div key={section.label}>
            <p className="px-2 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map(item => {
                const active = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <item.icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-border/60">
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}

// ─── Shell ────────────────────────────────────────────────────────────────────
export function AdminShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen flex bg-muted/20">

      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex lg:w-60 xl:w-64 shrink-0 flex-col border-r border-border bg-card fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {/* ── Mobile: overlay + drawer ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 border-r border-border bg-card flex flex-col transition-transform duration-300 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
        <SidebarContent onNavigate={() => setMobileOpen(false)} />
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col lg:pl-60 xl:pl-64">

        {/* Mobile top bar */}
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/95 backdrop-blur px-4 h-14 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Image
            src="/imagotipo_ligth.svg"
            alt="LEGASSI"
            width={90}
            height={28}
            className="h-7 w-auto block dark:hidden"
          />
          <Image
            src="/imagotipo_dark.svg"
            alt="LEGASSI"
            width={90}
            height={28}
            className="h-7 w-auto hidden dark:block"
          />
        </header>

        {/* Page content */}
        <main className="flex-1 px-6 py-8 max-w-5xl w-full mx-auto">
          {children}
        </main>
      </div>

    </div>
  )
}

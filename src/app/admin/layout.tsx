import Link from "next/link"
import Image from "next/image"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { FileText, LogOut, Plus } from "lucide-react"
import { COOKIE_NAME } from "@/lib/auth"

async function logout() {
  "use server"
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
  redirect("/admin/login")
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/20">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto max-w-6xl px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/admin/posts">
              <Image src="/imagotipo_ligth.svg" alt="LEGASSI" width={100} height={30} className="h-7 w-auto block dark:hidden" />
              <Image src="/imagotipo_dark.svg" alt="LEGASSI" width={100} height={30} className="h-7 w-auto hidden dark:block" />
            </Link>
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground border-l border-border pl-4">Admin</span>
          </div>

          <nav className="flex items-center gap-2">
            <Link
              href="/admin/posts"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <FileText className="h-3.5 w-3.5" />
              Artículos
            </Link>
            <Link
              href="/admin/posts/new"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <Plus className="h-3.5 w-3.5" />
              Nuevo
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                Salir
              </button>
            </form>
          </nav>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl px-4 py-8">
        {children}
      </main>
    </div>
  )
}

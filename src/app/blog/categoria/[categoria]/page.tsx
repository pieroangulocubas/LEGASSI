import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ArrowLeft, ArrowRight, BookOpen, AlertTriangle, GitBranch, FileText, Users, Compass } from "lucide-react"
import { getPostsByCategory, CATEGORIES, TAGS, formatDate } from "@/lib/notion"
import type { CategorySlug, TagSlug } from "@/lib/notion"
import { cn } from "@/lib/utils"

export const revalidate = 3600

const CATEGORY_ICONS: Record<CategorySlug, React.ElementType> = {
  salida:   Compass,
  opciones: GitBranch,
  tramite:  FileText,
  errores:  AlertTriangle,
  casos:    Users,
}

const CATEGORY_COLOR_CLASSES: Record<CategorySlug, { border: string; bg: string; icon: string; badge: string; iconBg: string }> = {
  salida:   { border: "border-blue-200 dark:border-blue-800",   bg: "bg-blue-50/60 dark:bg-blue-950/20",   icon: "text-blue-600 dark:text-blue-400",   badge: "bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",   iconBg: "bg-blue-100 dark:bg-blue-950/50" },
  opciones: { border: "border-emerald-200 dark:border-emerald-800", bg: "bg-emerald-50/60 dark:bg-emerald-950/20", icon: "text-emerald-600 dark:text-emerald-400", badge: "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800", iconBg: "bg-emerald-100 dark:bg-emerald-950/50" },
  tramite:  { border: "border-violet-200 dark:border-violet-800",  bg: "bg-violet-50/60 dark:bg-violet-950/20",  icon: "text-violet-600 dark:text-violet-400",  badge: "bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800",  iconBg: "bg-violet-100 dark:bg-violet-950/50" },
  errores:  { border: "border-rose-200 dark:border-rose-800",    bg: "bg-rose-50/60 dark:bg-rose-950/20",    icon: "text-rose-600 dark:text-rose-400",    badge: "bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800",    iconBg: "bg-rose-100 dark:bg-rose-950/50" },
  casos:    { border: "border-amber-200 dark:border-amber-800",   bg: "bg-amber-50/60 dark:bg-amber-950/20",   icon: "text-amber-600 dark:text-amber-400",   badge: "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",   iconBg: "bg-amber-100 dark:bg-amber-950/50" },
}

export async function generateStaticParams() {
  return (Object.keys(CATEGORIES) as CategorySlug[]).map(categoria => ({ categoria }))
}

export async function generateMetadata({ params }: { params: Promise<{ categoria: string }> }): Promise<Metadata> {
  const { categoria } = await params
  const cat = CATEGORIES[categoria as CategorySlug]
  if (!cat) return {}
  return {
    title: `${cat.label} – Blog LEGASSI`,
    description: cat.description,
    openGraph: { title: `${cat.label} – Blog LEGASSI`, description: cat.description },
  }
}

export default async function CategoriaPage({ params }: { params: Promise<{ categoria: string }> }) {
  const { categoria } = await params
  if (!(categoria in CATEGORIES)) notFound()

  const slug = categoria as CategorySlug
  const cat = CATEGORIES[slug]
  const Icon = CATEGORY_ICONS[slug]
  const colors = CATEGORY_COLOR_CLASSES[slug]
  const posts = await getPostsByCategory(slug)

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background pt-20 pb-20">
        <div className="container mx-auto max-w-4xl px-6 sm:px-10">

          {/* Back */}
          <div className="pt-8 mb-8">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Volver al blog
            </Link>
          </div>

          {/* Category header */}
          <div className={cn("rounded-2xl border p-6 sm:p-8 mb-10 flex gap-5 items-start", colors.border, colors.bg)}>
            <div className={cn("shrink-0 w-12 h-12 rounded-xl flex items-center justify-center border", colors.iconBg, colors.border)}>
              <Icon className={cn("h-6 w-6", colors.icon)} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Categoría</p>
              <h1 className="text-section font-heading font-bold tracking-tight mb-2">{cat.label}</h1>
              <p className="text-sm text-muted-foreground">{cat.description}</p>
            </div>
          </div>

          {/* Articles */}
          {posts.length > 0 ? (
            <div className="flex flex-col gap-4">
              {posts.map(post => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group flex items-start gap-5 rounded-2xl border border-border/50 bg-card p-5 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all duration-300"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {post.tags.map(tag => {
                        const t = TAGS[tag as TagSlug]
                        if (!t) return null
                        return (
                          <span key={tag} className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", t.bg, t.text, t.border)}>
                            {t.label}
                          </span>
                        )
                      })}
                    </div>
                    <h2 className="font-heading font-bold text-base leading-snug group-hover:text-primary transition-colors mb-1.5">
                      {post.title}
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{post.excerpt}</p>
                    <p className="text-xs text-muted-foreground/60 mt-2">{formatDate(post.publishedAt)} · {post.readingTimeMinutes} min de lectura</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-primary shrink-0 mt-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <BookOpen className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground text-sm">Aún no hay artículos en esta categoría.</p>
              <Link href="/blog" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
                <ArrowLeft className="h-3.5 w-3.5" /> Ver todas las categorías
              </Link>
            </div>
          )}

        </div>
      </main>
      <Footer />
    </>
  )
}

import type { Metadata } from "next"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ArrowRight, AlertTriangle, BookOpen, GitBranch, FileText, Users, Compass } from "lucide-react"
import { getAllPosts, getFeaturedPosts, CATEGORIES, TAGS, formatDate } from "@/lib/blog"
import type { BlogPost, CategorySlug, TagSlug } from "@/lib/blog"
import { cn } from "@/lib/utils"

export const revalidate = 3600

export const metadata: Metadata = {
  title: "Blog – LEGASSI",
  description: "Guías, casos reales y avisos sobre extranjería en España. Sin burocracia. Sin tecnicismos vacíos.",
  openGraph: {
    title: "Blog LEGASSI – Extranjería explicada con criterio",
    description: "Guías, casos reales y avisos sobre extranjería en España.",
    url: "https://legassi.es/blog",
  },
}

// ─── Category icons ────────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<CategorySlug, React.ElementType> = {
  salida:   Compass,
  opciones: GitBranch,
  tramite:  FileText,
  errores:  AlertTriangle,
  casos:    Users,
}

const CATEGORY_COLOR_CLASSES: Record<CategorySlug, { border: string; bg: string; icon: string; badge: string }> = {
  salida:   { border: "border-blue-200 dark:border-blue-800",   bg: "bg-blue-50 dark:bg-blue-950/30",   icon: "text-blue-600 dark:text-blue-400",   badge: "bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800" },
  opciones: { border: "border-emerald-200 dark:border-emerald-800", bg: "bg-emerald-50 dark:bg-emerald-950/30", icon: "text-emerald-600 dark:text-emerald-400", badge: "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" },
  tramite:  { border: "border-violet-200 dark:border-violet-800",  bg: "bg-violet-50 dark:bg-violet-950/30",  icon: "text-violet-600 dark:text-violet-400",  badge: "bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800" },
  errores:  { border: "border-rose-200 dark:border-rose-800",    bg: "bg-rose-50 dark:bg-rose-950/30",    icon: "text-rose-600 dark:text-rose-400",    badge: "bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800" },
  casos:    { border: "border-amber-200 dark:border-amber-800",   bg: "bg-amber-50 dark:bg-amber-950/30",   icon: "text-amber-600 dark:text-amber-400",   badge: "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800" },
}

// ─── Subcomponents ─────────────────────────────────────────────────────────────

function TagBadge({ tag }: { tag: TagSlug }) {
  const t = TAGS[tag]
  if (!t) return null
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", t.bg, t.text, t.border)}>
      {t.label}
    </span>
  )
}

function CategoryBadge({ category }: { category: CategorySlug }) {
  const c = CATEGORY_COLOR_CLASSES[category]
  const cat = CATEGORIES[category]
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide", c.badge)}>
      {cat.label}
    </span>
  )
}

function PostCard({ post }: { post: BlogPost }) {
  const colors = CATEGORY_COLOR_CLASSES[post.category]
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col gap-3 rounded-2xl border border-border/50 bg-card p-5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
    >
      <div className="flex flex-wrap gap-1.5 items-center">
        <CategoryBadge category={post.category} />
        {post.tags.map(tag => <TagBadge key={tag} tag={tag} />)}
      </div>
      <h3 className="font-heading font-bold text-base leading-snug group-hover:text-primary transition-colors line-clamp-2">
        {post.title}
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 flex-1">
        {post.excerpt}
      </p>
      <div className="flex items-center justify-between pt-2 border-t border-border/40">
        <span className="text-xs text-muted-foreground/60">{formatDate(post.publishedAt)} · {post.readingTimeMinutes} min</span>
        <ArrowRight className="h-3.5 w-3.5 text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
      </div>
    </Link>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function BlogPage() {
  const [allPosts, featured] = await Promise.all([getAllPosts(), getFeaturedPosts()])
  const recentPosts = allPosts.slice(0, 6)

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background pt-20 pb-20">
        <div className="container mx-auto max-w-5xl px-6 sm:px-10">

          {/* Header */}
          <div className="py-12 border-b border-border/40 mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">Blog</p>
            <h1 className="text-section font-heading font-bold tracking-tight mb-3">
              Extranjería explicada{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                con criterio
              </span>
            </h1>
            <p className="text-muted-foreground max-w-xl text-pretty">
              Sin burocracia. Sin tecnicismos vacíos. Cada artículo responde una pregunta concreta: si esto te afecta, qué puedes hacer y cuándo.
            </p>
          </div>

          {/* Cambios importantes */}
          {featured.length > 0 && (
            <section className="mb-14">
              <div className="flex items-center gap-2 mb-5">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <p className="text-sm font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400">
                  Cambios importantes
                </p>
              </div>
              <div className="rounded-2xl border border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20 overflow-hidden divide-y divide-orange-100 dark:divide-orange-900">
                {featured.map(post => (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    className="flex items-start justify-between gap-4 px-5 py-4 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-1.5 mb-1.5">
                        {post.tags.map(tag => <TagBadge key={tag} tag={tag} />)}
                      </div>
                      <p className="font-semibold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-1">
                        {post.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDate(post.publishedAt)}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-orange-500 shrink-0 mt-1 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Categorías */}
          <section className="mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-5">
              Categorías
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(Object.entries(CATEGORIES) as [CategorySlug, typeof CATEGORIES[CategorySlug]][]).map(([slug, cat]) => {
                const Icon = CATEGORY_ICONS[slug]
                const colors = CATEGORY_COLOR_CLASSES[slug]
                return (
                  <Link
                    key={slug}
                    href={`/blog/categoria/${slug}`}
                    className={cn(
                      "group flex gap-4 items-start rounded-2xl border p-5 hover:shadow-md transition-all duration-300",
                      colors.border,
                      colors.bg,
                    )}
                  >
                    <div className={cn("shrink-0 w-9 h-9 rounded-lg bg-white/70 dark:bg-black/20 border flex items-center justify-center", colors.border)}>
                      <Icon className={cn("h-4 w-4", colors.icon)} />
                    </div>
                    <div className="min-w-0">
                      <p className={cn("font-semibold text-sm leading-snug mb-1 group-hover:underline underline-offset-2", colors.icon)}>
                        {cat.label}
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{cat.description}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>

          {/* Últimas publicaciones */}
          {recentPosts.length > 0 && (
            <section>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-5">
                Últimas publicaciones
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {recentPosts.map(post => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
              {allPosts.length > 6 && (
                <div className="mt-8 text-center">
                  <Link
                    href="/blog/categoria/salida"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline underline-offset-2"
                  >
                    Ver todos los artículos
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}
            </section>
          )}

          {/* Empty state */}
          {allPosts.length === 0 && (
            <div className="text-center py-24">
              <BookOpen className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground text-sm">Los artículos llegarán pronto.</p>
            </div>
          )}

        </div>
      </main>
      <Footer />
    </>
  )
}

import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ArrowRight, AlertTriangle, BookOpen, GitBranch, FileText, Users, Compass, Clock, CalendarDays } from "lucide-react"
import { getAllPosts, getFeaturedPosts, CATEGORIES, TAGS, formatDate } from "@/lib/blog"
import type { BlogPost, CategorySlug, TagSlug } from "@/lib/blog"
import { cn } from "@/lib/utils"

export const revalidate = 3600

export const metadata: Metadata = {
  title: "Blog – LEGASSI",
  description: "Guías, casos reales y avisos sobre extranjería en España. Sin burocracia. Sin tecnicismos vacíos.",
  alternates: { canonical: "https://legassi.es/blog" },
  openGraph: {
    title: "Blog LEGASSI – Extranjería explicada con criterio",
    description: "Guías, casos reales y avisos sobre extranjería en España.",
    url: "https://legassi.es/blog",
    siteName: "LEGASSI",
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog LEGASSI – Extranjería explicada con criterio",
    description: "Guías, casos reales y avisos sobre extranjería en España.",
  },
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<CategorySlug, React.ElementType> = {
  salida:   Compass,
  opciones: GitBranch,
  tramite:  FileText,
  errores:  AlertTriangle,
  casos:    Users,
}

const CATEGORY_COLORS: Record<CategorySlug, { border: string; bg: string; icon: string; badge: string; gradient: string }> = {
  salida:   { border: "border-blue-200 dark:border-blue-800",   bg: "bg-blue-50 dark:bg-blue-950/30",   icon: "text-blue-600 dark:text-blue-400",   badge: "bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",   gradient: "from-blue-900 to-blue-950" },
  opciones: { border: "border-emerald-200 dark:border-emerald-800", bg: "bg-emerald-50 dark:bg-emerald-950/30", icon: "text-emerald-600 dark:text-emerald-400", badge: "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800", gradient: "from-emerald-900 to-emerald-950" },
  tramite:  { border: "border-violet-200 dark:border-violet-800",  bg: "bg-violet-50 dark:bg-violet-950/30",  icon: "text-violet-600 dark:text-violet-400",  badge: "bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800",  gradient: "from-violet-900 to-violet-950" },
  errores:  { border: "border-rose-200 dark:border-rose-800",    bg: "bg-rose-50 dark:bg-rose-950/30",    icon: "text-rose-600 dark:text-rose-400",    badge: "bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800",    gradient: "from-rose-900 to-rose-950" },
  casos:    { border: "border-amber-200 dark:border-amber-800",   bg: "bg-amber-50 dark:bg-amber-950/30",   icon: "text-amber-600 dark:text-amber-400",   badge: "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",   gradient: "from-amber-900 to-amber-950" },
}

// ─── Cover image ───────────────────────────────────────────────────────────────

function CoverImage({ src, alt, category, className }: { src?: string; alt: string; category: CategorySlug; className?: string }) {
  const colors = CATEGORY_COLORS[category]
  if (src) {
    return (
      <div className={cn("relative overflow-hidden", className)}>
        <Image src={src} alt={alt} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
      </div>
    )
  }
  return (
    <div className={cn("relative overflow-hidden bg-gradient-to-br", colors.gradient, className)}>
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 30% 50%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
    </div>
  )
}

// ─── Tag badge ──────────────────────────────────────────────────────────────────

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
  const c = CATEGORY_COLORS[category]
  const cat = CATEGORIES[category]
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide", c.badge)}>
      {cat.label}
    </span>
  )
}

// ─── Featured hero post ────────────────────────────────────────────────────────

function HeroPost({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group block rounded-2xl overflow-hidden border border-border/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-500">
      <div className="grid md:grid-cols-[3fr_2fr] min-h-[320px]">
        {/* Image */}
        <div className="relative min-h-[220px] md:min-h-0">
          <CoverImage src={post.coverImage} alt={post.title} category={post.category} className="absolute inset-0 w-full h-full" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-background/80 hidden md:block" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent md:hidden" />
          {/* Badges over image on mobile */}
          <div className="absolute top-4 left-4 flex flex-wrap gap-1.5 md:hidden">
            <CategoryBadge category={post.category} />
            {post.tags.map(tag => <TagBadge key={tag} tag={tag as TagSlug} />)}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col justify-center gap-4 p-7 bg-card">
          <div className="hidden md:flex flex-wrap gap-1.5">
            <CategoryBadge category={post.category} />
            {post.tags.map(tag => <TagBadge key={tag} tag={tag as TagSlug} />)}
          </div>
          <div>
            <h2 className="font-heading font-bold text-xl leading-snug group-hover:text-primary transition-colors mb-3">
              {post.title}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
              {post.excerpt}
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground/60 pt-1 border-t border-border/40">
            <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{formatDate(post.publishedAt)}</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{post.readingTimeMinutes} min</span>
          </div>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
            Leer artículo
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </div>
    </Link>
  )
}

// ─── Post card ─────────────────────────────────────────────────────────────────

function PostCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col rounded-2xl overflow-hidden border border-border/50 bg-card hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
    >
      {/* Cover */}
      <div className="relative aspect-[16/9]">
        <CoverImage src={post.coverImage} alt={post.title} category={post.category} className="absolute inset-0 w-full h-full" />
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5 gap-3">
        <div className="flex flex-wrap gap-1.5">
          <CategoryBadge category={post.category} />
          {post.tags.map(tag => <TagBadge key={tag} tag={tag as TagSlug} />)}
        </div>
        <h3 className="font-heading font-bold text-base leading-snug group-hover:text-primary transition-colors line-clamp-2 flex-1">
          {post.title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
          {post.excerpt}
        </p>
        <div className="flex items-center justify-between pt-2 border-t border-border/40">
          <span className="text-xs text-muted-foreground/60">{formatDate(post.publishedAt)} · {post.readingTimeMinutes} min</span>
          <ArrowRight className="h-3.5 w-3.5 text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    </Link>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function BlogPage() {
  const [allPosts, featuredPosts] = await Promise.all([getAllPosts(), getFeaturedPosts()])
  const heroPost = allPosts[0]
  const gridPosts = allPosts.slice(1, 7)

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background pt-20 pb-24">

        {/* ── Header ── */}
        <div className="border-b border-border/40 bg-muted/20">
          <div className="container mx-auto max-w-6xl px-6 sm:px-10 py-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">Blog LEGASSI</p>
            <h1 className="text-section font-heading font-bold tracking-tight mb-2">
              Extranjería explicada con criterio
            </h1>
            <p className="text-muted-foreground text-sm max-w-lg">
              Sin burocracia. Sin tecnicismos vacíos. Cada artículo responde una pregunta concreta.
            </p>
          </div>
        </div>

        <div className="container mx-auto max-w-6xl px-6 sm:px-10">

          {/* ── Cambios importantes ── */}
          {featuredPosts.length > 0 && (
            <div className="mt-8 mb-10 rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-orange-200 dark:border-orange-800">
                <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400">Cambios importantes</span>
              </div>
              <div className="divide-y divide-orange-100 dark:divide-orange-900">
                {featuredPosts.map(post => (
                  <Link key={post.id} href={`/blog/${post.slug}`} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors group">
                    <div className="flex items-center gap-3 min-w-0">
                      {post.coverImage && (
                        <div className="relative w-10 h-10 rounded-md overflow-hidden shrink-0">
                          <Image src={post.coverImage} alt={post.title} fill className="object-cover" sizes="40px" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-1">{post.title}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(post.publishedAt)}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-orange-500 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* ── Hero post ── */}
          {heroPost && (
            <div className="mb-12">
              <HeroPost post={heroPost} />
            </div>
          )}

          {/* ── Main content + sidebar ── */}
          {gridPosts.length > 0 && (
            <div className="grid lg:grid-cols-[1fr_280px] gap-10 mb-14">

              {/* Articles grid */}
              <section>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-5">
                  Últimas publicaciones
                </p>
                <div className="grid sm:grid-cols-2 gap-5">
                  {gridPosts.map(post => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
                {allPosts.length > 7 && (
                  <div className="mt-8 text-center">
                    <Link href="/blog/categoria/salida" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline underline-offset-2">
                      Ver todos los artículos <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                )}
              </section>

              {/* Sidebar: categories */}
              <aside>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                  Categorías
                </p>
                <div className="flex flex-col gap-2">
                  {(Object.entries(CATEGORIES) as [CategorySlug, typeof CATEGORIES[CategorySlug]][]).map(([slug, cat]) => {
                    const Icon = CATEGORY_ICONS[slug]
                    const colors = CATEGORY_COLORS[slug]
                    return (
                      <Link
                        key={slug}
                        href={`/blog/categoria/${slug}`}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border px-4 py-3 hover:shadow-sm transition-all group",
                          colors.border, colors.bg
                        )}
                      >
                        <Icon className={cn("h-4 w-4 shrink-0", colors.icon)} />
                        <span className={cn("text-sm font-medium group-hover:underline underline-offset-2", colors.icon)}>
                          {cat.label}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              </aside>
            </div>
          )}

          {/* ── Only hero, no grid posts — show categories differently ── */}
          {gridPosts.length === 0 && heroPost && (
            <section className="mb-14">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-5">Categorías</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(Object.entries(CATEGORIES) as [CategorySlug, typeof CATEGORIES[CategorySlug]][]).map(([slug, cat]) => {
                  const Icon = CATEGORY_ICONS[slug]
                  const colors = CATEGORY_COLORS[slug]
                  return (
                    <Link key={slug} href={`/blog/categoria/${slug}`}
                      className={cn("group flex gap-4 items-start rounded-2xl border p-5 hover:shadow-md transition-all", colors.border, colors.bg)}>
                      <div className={cn("shrink-0 w-9 h-9 rounded-lg bg-white/70 dark:bg-black/20 border flex items-center justify-center", colors.border)}>
                        <Icon className={cn("h-4 w-4", colors.icon)} />
                      </div>
                      <div className="min-w-0">
                        <p className={cn("font-semibold text-sm leading-snug mb-1 group-hover:underline underline-offset-2", colors.icon)}>{cat.label}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{cat.description}</p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          )}

          {/* ── Empty state ── */}
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

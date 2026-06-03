export const dynamic = "force-dynamic"
import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { Suspense } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ArrowRight, Clock, CalendarDays, BookOpen } from "lucide-react"
import { getAllPosts, CATEGORIES, TAGS, formatDate, computeTopTags } from "@/lib/blog"
import type { BlogPost, CategorySlug, TagSlug } from "@/lib/blog"
import { CATEGORY_COLORS } from "@/lib/categories"
import { BlogFilters } from "@/components/blog/BlogFilters"
import { BlogSidebar } from "@/components/blog/BlogSidebar"
import { NewsletterSection } from "@/components/blog/NewsletterSection"
import { cn } from "@/lib/utils"

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Ordena por: destacado → más likes → más reciente */
function sortByRelevance(posts: BlogPost[]) {
  return [...posts].sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1
    if (b.likesCount !== a.likesCount) return b.likesCount - a.likesCount
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  })
}

function filterPosts(posts: BlogPost[], q: string, categoria: string): BlogPost[] {
  const lq = q.toLowerCase().trim()
  return posts.filter(p => {
    const matchesCategory = !categoria || p.category === categoria
    const matchesSearch = !lq || p.title.toLowerCase().includes(lq) || p.excerpt.toLowerCase().includes(lq)
    return matchesCategory && matchesSearch
  })
}

// ─── Badges ───────────────────────────────────────────────────────────────────

function CategoryBadge({ category }: { category: CategorySlug }) {
  const c = CATEGORY_COLORS[category]
  const cat = CATEGORIES[category]
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide", c.badge)}>
      {cat.label}
    </span>
  )
}

function TagBadge({ tag }: { tag: string }) {
  const t = TAGS[tag as TagSlug]
  if (!t) return null
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", t.bg, t.text, t.border)}>
      {t.label}
    </span>
  )
}

// ─── Hero principal (izquierda) — imagen + texto separados ──────────────────

function HeroMainCard({ post }: { post: BlogPost }) {
  const colors = CATEGORY_COLORS[post.category]
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-border bg-card flex flex-col">
      {/* Imagen */}
      <div className="relative aspect-video overflow-hidden bg-muted">
        {post.coverImage ? (
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700"
            sizes="(max-width: 768px) 100vw, 60vw"
            priority
          />
        ) : (
          <div className={cn("absolute inset-0 bg-gradient-to-br", colors.heroGradient)} />
        )}
      </div>

      {/* Texto debajo de la imagen */}
      <div className="flex flex-col flex-1 p-5 sm:p-6">
        {/* Badges encima del título */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {post.featured && (
            <span className="inline-flex items-center rounded-md bg-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground">
              Post destacado
            </span>
          )}
          <CategoryBadge category={post.category} />
          {post.tags.map(tag => <TagBadge key={tag} tag={tag} />)}
        </div>
        <h2 className="font-heading font-bold text-xl sm:text-2xl leading-snug mb-2 group-hover:text-primary transition-colors text-balance">
          <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0">
            {post.title}
          </Link>
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-4 flex-1 text-pretty">
          {post.excerpt}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" />{post.readingTimeMinutes} min</span>
            <span className="flex items-center gap-1.5"><CalendarDays className="h-3 w-3" />{formatDate(post.publishedAt)}</span>
          </div>
          <span className="text-xs font-semibold text-primary flex items-center gap-1">
            Leer artículo <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </div>
    </article>
  )
}

// ─── Lista lateral (derecha del hero) ────────────────────────────────────────

function HeroSideItem({ post }: { post: BlogPost }) {
  const colors = CATEGORY_COLORS[post.category]
  return (
    <Link href={`/blog/${post.slug}`} className="group flex items-start gap-3">
      {/* Thumbnail */}
      <div className="relative aspect-video w-72 shrink-0 overflow-hidden rounded-lg bg-muted">
        {post.coverImage ? (
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="288px"
          />
        ) : (
          <div className={cn("absolute inset-0 bg-gradient-to-br", colors.heroGradient)} />
        )}
      </div>
      {/* Texto */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors mb-2">
          {post.title}
        </p>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{post.readingTimeMinutes} min</span>
          <span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />{formatDate(post.publishedAt)}</span>
        </div>
      </div>
    </Link>
  )
}

// ─── Article card (grid) ──────────────────────────────────────────────────────

function ArticleCard({ post }: { post: BlogPost }) {
  const colors = CATEGORY_COLORS[post.category]
  return (
    <Link href={`/blog/${post.slug}`} className="group flex flex-col">
      <div className="relative w-full aspect-video overflow-hidden rounded-xl mb-3 bg-muted">
        {post.coverImage ? (
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className={cn("absolute inset-0 bg-gradient-to-br", colors.heroGradient)}>
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 30% 50%, white 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
          </div>
        )}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1">
          {post.featured && (
            <span className="inline-flex items-center rounded-full bg-primary/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary-foreground shadow">
              Destacado
            </span>
          )}
          <CategoryBadge category={post.category} />
        </div>
        {post.tags.length > 0 && (
          <div className="absolute top-2.5 right-2.5 flex flex-wrap gap-1 justify-end">
            {post.tags.map(tag => <TagBadge key={tag} tag={tag} />)}
          </div>
        )}
      </div>
      <div className="flex flex-col flex-1 gap-2 px-0.5">
        <h3 className="font-heading font-bold text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {post.title}
        </h3>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto pt-1">
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{post.readingTimeMinutes} min</span>
          <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{formatDate(post.publishedAt)}</span>
        </div>
      </div>
    </Link>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoria?: string }>
}) {
  const { q = "", categoria = "" } = await searchParams
  const allPosts = await getAllPosts()

  const sorted = sortByRelevance(allPosts)
  const heroMain = sorted[0] ?? null          // card grande izquierda
  const heroSide = sorted.slice(1, 4)         // lista derecha (3)
  const topTags  = computeTopTags(allPosts)

  // Grid: posts filtrados, excluyendo el hero principal si no hay filtro
  const filtered = filterPosts(allPosts, q, categoria)
  const heroMainId = heroMain?.id
  const gridPosts = (q || categoria)
    ? filtered
    : filtered.filter(p => p.id !== heroMainId)

  const hasFilter = !!(q || categoria)

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background pt-20">

        {/* ── Header ── */}
        <div className="border-b border-border/40 bg-muted/20">
          <div className="container mx-auto max-w-7xl px-6 sm:px-10 py-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1.5">Blog LEGASSI</p>
            <h1 className="text-section font-heading font-bold tracking-tight mb-1.5">
              Extranjería explicada con criterio
            </h1>
            <p className="text-muted-foreground text-sm max-w-lg">
              Sin burocracia. Sin tecnicismos vacíos. Cada artículo responde una pregunta concreta.
            </p>
          </div>
        </div>

        <div className="container mx-auto max-w-7xl px-6 sm:px-10 mt-8 pb-12">

          {/* ── Hero: card grande + lista lateral — siempre visible ── */}
          {heroMain && (
            <div className="grid md:grid-cols-2 gap-6 mb-10">
              {/* Izquierda: post principal con imagen full-bleed */}
              <HeroMainCard post={heroMain} />

              {/* Derecha: lista de los siguientes posts */}
              {heroSide.length > 0 && (
                <div className="flex flex-col h-full">
                  <p className="text-xl font-heading font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    También te puede interesar
                  </p>
                  <div className="flex flex-col gap-6">
                    {heroSide.map(post => (
                      <HeroSideItem key={post.id} post={post} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Contenido principal + Sidebar ── */}
          <div className="grid lg:grid-cols-3 gap-8 items-start">

            {/* Columna principal */}
            <div className="lg:col-span-2">

              {/* ── Filtros (búsqueda + categorías) ── */}
              <Suspense>
                <BlogFilters initialQ={q} initialCategory={categoria} />
              </Suspense>

              {/* ── Grid de artículos ── */}
              {gridPosts.length > 0 ? (
                <>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-6">
                    {hasFilter
                      ? `${gridPosts.length} resultado${gridPosts.length !== 1 ? "s" : ""}`
                      : "Últimos artículos"}
                  </p>
                  <div className="grid sm:grid-cols-2 gap-x-6 gap-y-10">
                    {gridPosts.map(post => <ArticleCard key={post.id} post={post} />)}
                  </div>
                </>
              ) : allPosts.length === 0 ? (
                <div className="text-center py-20">
                  <BookOpen className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground text-sm">Los artículos llegarán pronto.</p>
                </div>
              ) : hasFilter ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-sm">No hay artículos que coincidan con tu búsqueda.</p>
                </div>
              ) : null}

            </div>

            {/* Sidebar */}
            <div className="hidden lg:block">
              <div className="sticky top-24 max-h-[calc(100vh-6rem)] overflow-y-auto">
                <BlogSidebar topTags={topTags} />
              </div>
            </div>

          </div>

        </div>

        {/* ── Newsletter ── */}
        <NewsletterSection />
      </main>
      <Footer />
    </>
  )
}

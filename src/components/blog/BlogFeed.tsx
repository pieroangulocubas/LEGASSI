"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  Search, X, ArrowRight, Clock, CalendarDays, BookOpen, TrendingUp,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { CATEGORIES, TAGS, formatDate } from "@/lib/blog"
import type { BlogPost, CategorySlug, TagSlug } from "@/lib/blog"
import { CATEGORY_COLORS, CATEGORY_ICONS, safeCategorySlug as safeCategory } from "@/lib/categories"

// ─── Sub-components ────────────────────────────────────────────────────────────

function CoverImage({ src, alt, category, className }: { src?: string; alt: string; category: CategorySlug; className?: string }) {
  const colors = CATEGORY_COLORS[category]
  if (src) {
    return (
      <div className={cn("relative overflow-hidden", className)}>
        <Image src={src} alt={alt} fill className="object-cover" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
      </div>
    )
  }
  return (
    <div className={cn("relative overflow-hidden bg-gradient-to-br", colors.cardGradient, className)}>
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 30% 50%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
    </div>
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

function CategoryBadge({ category }: { category: CategorySlug }) {
  const c = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.situacion
  const cat = CATEGORIES[category] ?? CATEGORIES.situacion
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide", c.badge)}>
      {cat.label}
    </span>
  )
}

function HeroPost({ post }: { post: BlogPost }) {
  const cat = safeCategory(post.category)
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block rounded-2xl overflow-hidden border border-border/50 bg-card hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-500"
    >
      {/* Cover image */}
      <div className="relative aspect-video">
        <CoverImage src={post.coverImage} alt={post.title} category={cat} className="absolute inset-0 w-full h-full" />
        {post.featured && (
          <span className="absolute top-4 left-4 inline-flex items-center rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow">
            Post destacado
          </span>
        )}
      </div>

      {/* Text body */}
      <div className="p-5 sm:p-6 space-y-3">
        <div className="flex flex-wrap gap-1.5">
          <CategoryBadge category={cat} />
          {post.tags.map(tag => <TagBadge key={tag} tag={tag} />)}
        </div>
        <h2 className="font-heading font-bold text-xl sm:text-2xl leading-snug group-hover:text-primary transition-colors line-clamp-2">
          {post.title}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{post.excerpt}</p>
        <div className="flex items-center gap-4 pt-3 border-t border-border/40 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />{formatDate(post.publishedAt)}</span>
          <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{post.readingTimeMinutes} min de lectura</span>
          <span className="inline-flex items-center gap-1 text-primary font-semibold ml-auto">
            Leer <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </div>
    </Link>
  )
}

function PostCard({ post }: { post: BlogPost }) {
  const cat = safeCategory(post.category)
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col rounded-2xl overflow-hidden border border-border/50 bg-card hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
    >
      <div className="relative aspect-video">
        <CoverImage src={post.coverImage} alt={post.title} category={cat} className="absolute inset-0 w-full h-full" />
      </div>
      <div className="flex flex-col flex-1 p-6 gap-3">
        <div className="flex flex-wrap gap-1.5">
          <CategoryBadge category={cat} />
          {post.tags.map(tag => <TagBadge key={tag} tag={tag} />)}
        </div>
        <h3 className="font-heading font-bold text-lg leading-snug group-hover:text-primary transition-colors line-clamp-2 flex-1">
          {post.title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{post.excerpt}</p>
        <div className="flex items-center justify-between pt-2 border-t border-border/40">
          <span className="text-xs text-muted-foreground/60">{formatDate(post.publishedAt)} · {post.readingTimeMinutes} min</span>
          <ArrowRight className="h-3.5 w-3.5 text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    </Link>
  )
}

function PopularCard({ post }: { post: BlogPost }) {
  const cat = safeCategory(post.category)
  return (
    <article className="grid grid-cols-7 items-start gap-4">
      <Link href={`/blog/${post.slug}`} className="col-span-3 overflow-hidden rounded-lg">
        <CoverImage src={post.coverImage} alt={post.title} category={cat} className="aspect-video object-cover w-full h-full" />
      </Link>
      <div className="col-span-4">
        <h3 className="mb-2 font-heading text-base font-semibold leading-snug sm:text-lg line-clamp-2">
          <Link href={`/blog/${post.slug}`} className="hover:text-primary transition-colors hover:underline">
            {post.title}
          </Link>
        </h3>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground sm:text-sm">
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />Lectura de {post.readingTimeMinutes}min</span>
          <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{formatDate(post.publishedAt)}</span>
        </div>
      </div>
    </article>
  )
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden border border-border/30 bg-card animate-pulse">
      <div className="aspect-video bg-muted/50" />
      <div className="p-5 space-y-3">
        <div className="h-3 bg-muted rounded-full w-1/3" />
        <div className="h-4 bg-muted rounded-full w-full" />
        <div className="h-4 bg-muted rounded-full w-4/5" />
        <div className="h-3 bg-muted rounded-full w-1/2 mt-4" />
      </div>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export function BlogFeed({
  initialPosts,
  initialHasMore,
  popularPosts,
  heroPost: heroPostProp,
}: {
  initialPosts: BlogPost[]
  initialHasMore: boolean
  popularPosts: BlogPost[]
  heroPost?: BlogPost | null
}) {
  const [q, setQ] = useState("")
  const [debouncedQ, setDebouncedQ] = useState("")
  const [category, setCategory] = useState<CategorySlug | "">("")
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState<number | null>(null)

  const sentinelRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFetchingRef = useRef(false)
  const stateRef = useRef({ page, hasMore, debouncedQ, category })
  stateRef.current = { page, hasMore, debouncedQ, category }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedQ(q), 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [q])

  const fetchPage = useCallback(async (pageNum: number, qVal: string, cat: string) => {
    const params = new URLSearchParams({ page: String(pageNum) })
    if (qVal) params.set("q", qVal)
    if (cat) params.set("category", cat)
    const res = await fetch(`/api/blog/posts?${params}`)
    return res.json() as Promise<{ posts: BlogPost[]; total: number; hasMore: boolean }>
  }, [])

  useEffect(() => {
    const isDefault = debouncedQ === "" && category === ""
    if (isDefault) {
      setPosts(initialPosts)
      setHasMore(initialHasMore)
      setTotal(null)
      setPage(1)
      isFetchingRef.current = false
      return
    }
    let cancelled = false
    isFetchingRef.current = true
    setLoading(true)
    fetchPage(0, debouncedQ, category).then(data => {
      if (cancelled) return
      setPosts(data.posts)
      setHasMore(data.hasMore)
      setTotal(data.total)
      setPage(1)
      setLoading(false)
      isFetchingRef.current = false
    })
    return () => { cancelled = true }
  }, [debouncedQ, category, initialPosts, initialHasMore, fetchPage])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      async (entries) => {
        if (!entries[0].isIntersecting) return
        const s = stateRef.current
        if (isFetchingRef.current || !s.hasMore) return
        isFetchingRef.current = true
        setLoading(true)
        const data = await fetchPage(s.page, s.debouncedQ, s.category)
        setPosts(prev => [...prev, ...data.posts])
        setHasMore(data.hasMore)
        setTotal(data.total)
        setPage(p => p + 1)
        setLoading(false)
        isFetchingRef.current = false
      },
      { rootMargin: "400px" }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [fetchPage])

  const isFiltered = debouncedQ !== "" || category !== ""
  const heroPost = !isFiltered ? (heroPostProp ?? posts[0] ?? null) : null

  // Posts restantes (sin el hero)
  const remainingPosts = !isFiltered ? posts.filter(p => p.id !== heroPost?.id) : posts

  // Sidebar: populares reales o fallback con los primeros 3 del feed
  const sidebarPosts = popularPosts.length > 0
    ? popularPosts
    : remainingPosts.slice(0, 3)
  const sidebarLabel = popularPosts.length > 0 ? "Lo más leído" : "También te puede interesar"
  const sidebarIds = new Set(sidebarPosts.map(p => p.id))

  // Grid inferior: excluye posts ya mostrados en el sidebar (solo cuando son del fallback)
  const gridPosts = isFiltered
    ? posts
    : popularPosts.length > 0
      ? remainingPosts
      : remainingPosts.filter(p => !sidebarIds.has(p.id))

  return (
    <div>
      {/* ── Search + Filters ── */}
      <div className="py-6 border-b border-border/40 mb-8">
        <div className="relative mb-4 max-w-lg">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Buscar artículos..."
            className="w-full h-10 pl-10 pr-9 rounded-xl border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
          />
          {q && (
            <button onClick={() => setQ("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategory("")}
            className={cn(
              "inline-flex items-center rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all",
              category === ""
                ? "bg-foreground text-background border-foreground"
                : "bg-background text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground"
            )}
          >
            Todos
          </button>
          {(Object.entries(CATEGORIES) as [CategorySlug, typeof CATEGORIES[CategorySlug]][]).map(([slug, cat]) => {
            const Icon = CATEGORY_ICONS[slug]
            const active = category === slug
            return (
              <button
                key={slug}
                onClick={() => setCategory(active ? "" : slug)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all",
                  active
                    ? cn(CATEGORY_COLORS[slug].badge)
                    : "bg-background text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground"
                )}
              >
                <Icon className="h-3 w-3" />
                {cat.label}
              </button>
            )
          })}
        </div>

        {isFiltered && !loading && total !== null && (
          <p className="mt-3 text-xs text-muted-foreground">
            {total === 0 ? "Sin resultados" : `${total} artículo${total !== 1 ? "s" : ""} encontrado${total !== 1 ? "s" : ""}`}
          </p>
        )}
      </div>

      {/* ── Layout: filtrado → grid full / normal → hero + sidebar ── */}
      {isFiltered ? (
        <>
          {(gridPosts.length > 0 || loading) && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {gridPosts.map(post => <PostCard key={post.id} post={post} />)}
              {loading && Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={`sk-${i}`} />)}
            </div>
          )}
          {!loading && posts.length === 0 && (
            <div className="text-center py-20">
              <BookOpen className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground text-sm mb-3">No hay artículos que coincidan.</p>
              <button onClick={() => { setQ(""); setCategory("") }} className="text-sm font-semibold text-primary hover:underline">
                Ver todos
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Fila superior: Hero + Sidebar — siempre 2 columnas */}
          <div className="grid lg:grid-cols-2 gap-8 lg:items-start mb-10">
            {heroPost && <HeroPost post={heroPost} />}

            {sidebarPosts.length > 0 && (
              <aside className="flex flex-col">
                <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  {sidebarLabel}
                </h3>
                <ul className="flex flex-col gap-8">
                  {sidebarPosts.map((post) => (
                    <li key={post.id}>
                      <PopularCard post={post} />
                    </li>
                  ))}
                </ul>
              </aside>
            )}
          </div>

          {/* Fila inferior: grid ancho completo */}
          {(gridPosts.length > 0 || loading) && (
            <>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-5">
                Últimos artículos
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {gridPosts.map(post => <PostCard key={post.id} post={post} />)}
                {loading && Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={`sk-${i}`} />)}
              </div>
            </>
          )}
        </>
      )}

      <div ref={sentinelRef} className="h-1 mt-10" />

      {!hasMore && posts.length > 0 && !loading && (
        <p className="text-center text-xs text-muted-foreground/40 mt-6 pb-4">
          Has visto todos los artículos
        </p>
      )}
    </div>
  )
}

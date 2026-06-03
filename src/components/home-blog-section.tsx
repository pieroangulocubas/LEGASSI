import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Clock, CalendarDays } from "lucide-react"
import { getAllPosts, CATEGORIES, formatDate } from "@/lib/blog"
import type { CategorySlug } from "@/lib/blog"
import { CATEGORY_COLORS } from "@/lib/categories"
import { cn } from "@/lib/utils"

export async function HomeBlogSection() {
  const allPosts = await getAllPosts()
  if (allPosts.length === 0) return null

  const sorted = [...allPosts].sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  })

  const [featured, ...rest] = sorted
  const side = rest.slice(0, 3)

  return (
    <section className="bg-background py-16 sm:py-20 border-t border-border/40">
      <div className="container mx-auto px-6 sm:px-10 lg:px-16">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1.5">Blog LEGASSI</p>
            <h2 className="font-heading font-bold text-2xl sm:text-3xl tracking-tight">
              Extranjería explicada con criterio
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Sin burocracia. Sin tecnicismos vacíos.</p>
          </div>
          <Link href="/blog" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline shrink-0">
            Ver todos <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Layout idéntico al hero del blog */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* Izquierda — featured card igual que HeroMainCard */}
          <Link
            href={`/blog/${featured.slug}`}
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card hover:shadow-float transition-all duration-300"
          >
            <div className="relative aspect-video overflow-hidden bg-muted">
              {featured.coverImage ? (
                <Image
                  src={featured.coverImage}
                  alt={featured.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              ) : (
                <div className={cn("absolute inset-0 bg-gradient-to-br", CATEGORY_COLORS[featured.category as CategorySlug].heroGradient)} />
              )}
              <div className="absolute top-3 left-3 flex gap-1.5">
                {featured.featured && (
                  <span className="inline-flex items-center rounded-md bg-primary px-2.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                    Post destacado
                  </span>
                )}
                <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide backdrop-blur-sm", CATEGORY_COLORS[featured.category as CategorySlug].badge)}>
                  {CATEGORIES[featured.category as CategorySlug]?.label}
                </span>
              </div>
            </div>
            <div className="flex flex-col flex-1 p-5 sm:p-6">
              <h3 className="font-heading font-bold text-lg sm:text-xl leading-snug line-clamp-2 group-hover:text-primary transition-colors mb-2">
                {featured.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed flex-1 text-pretty">
                {featured.excerpt}
              </p>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/60">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" />{featured.readingTimeMinutes} min</span>
                  <span className="flex items-center gap-1.5"><CalendarDays className="h-3 w-3" />{formatDate(featured.publishedAt)}</span>
                </div>
                <span className="text-xs font-semibold text-primary flex items-center gap-1">
                  Leer artículo <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </div>
          </Link>

          {/* Derecha — lista idéntica al HeroSideItem del blog */}
          <div className="flex flex-col h-full">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
              También te puede interesar
            </p>
            <div className="flex flex-col gap-6 flex-1">
              {side.map(post => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group flex items-start gap-3"
                >
                  <div className="relative aspect-video w-48 sm:w-56 md:w-40 lg:w-56 xl:w-72 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {post.coverImage ? (
                      <Image
                        src={post.coverImage}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 192px, (max-width: 768px) 224px, (max-width: 1024px) 160px, (max-width: 1280px) 224px, 288px"
                      />
                    ) : (
                      <div className={cn("absolute inset-0 bg-gradient-to-br", CATEGORY_COLORS[post.category as CategorySlug].heroGradient)} />
                    )}
                  </div>
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
              ))}
            </div>
          </div>

        </div>

        {/* CTA */}
        <div className="mt-8 flex justify-center">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-8 py-3.5 text-sm font-bold hover:border-primary/50 hover:text-primary hover:shadow-card transition-all"
          >
            Explorar todos los artículos <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

      </div>
    </section>
  )
}

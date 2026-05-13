import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ArrowLeft, ArrowRight, Clock, CalendarDays, MessageCircle, GitBranch, FileText, Users, Compass, AlertTriangle } from "lucide-react"
import { getAllPosts, getPostBySlug, getRelatedPosts, CATEGORIES, TAGS, formatDate } from "@/lib/blog"
import type { BlogPost, CategorySlug, TagSlug } from "@/lib/blog"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export const revalidate = 3600

const CATEGORY_COLORS: Record<CategorySlug, { badge: string; gradient: string }> = {
  salida:   { badge: "bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",   gradient: "from-blue-950 to-slate-950" },
  opciones: { badge: "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800", gradient: "from-emerald-950 to-slate-950" },
  tramite:  { badge: "bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800",  gradient: "from-violet-950 to-slate-950" },
  errores:  { badge: "bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800",    gradient: "from-rose-950 to-slate-950" },
  casos:    { badge: "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",   gradient: "from-amber-950 to-slate-950" },
}

export async function generateStaticParams() {
  const posts = await getAllPosts()
  return posts.filter(p => p.slug).map(p => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) return {}
  return {
    title: `${post.title} – LEGASSI`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: post.coverImage ? [{ url: post.coverImage }] : [],
      url: `https://legassi.es/blog/${slug}`,
      type: "article",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
    },
  }
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [post, related] = await Promise.all([
    getPostBySlug(slug),
    getPostBySlug(slug).then(p => p ? getRelatedPosts(slug, p.category) : []),
  ])
  if (!post) notFound()

  const catColors = CATEGORY_COLORS[post.category]
  const cat = CATEGORIES[post.category]

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background pt-20 pb-20">

        {/* ── Cover image ── */}
        <div className="relative w-full h-64 sm:h-80 md:h-96 overflow-hidden">
          {post.coverImage ? (
            <>
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                className="object-cover"
                priority
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
            </>
          ) : (
            <div className={cn("absolute inset-0 bg-gradient-to-br", catColors.gradient)}>
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 30% 50%, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
              <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
            </div>
          )}
        </div>

        <div className="container mx-auto max-w-3xl px-6 sm:px-10">

          {/* ── Back ── */}
          <div className="mb-7 -mt-1">
            <Link
              href={`/blog/categoria/${post.category}`}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {cat.label}
            </Link>
          </div>

          {/* ── Article header ── */}
          <header className="mb-10">
            <div className="flex flex-wrap gap-2 mb-5">
              <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide", catColors.badge)}>
                {cat.label}
              </span>
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

            <h1 className="text-section font-heading font-bold tracking-tight mb-4 leading-snug">
              {post.title}
            </h1>

            <p className="text-base text-muted-foreground leading-relaxed mb-6">
              {post.excerpt}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground/70 border-t border-border/40 pt-4">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                {formatDate(post.publishedAt)}
              </span>
              {post.updatedAt && post.updatedAt !== post.publishedAt && (
                <span>Actualizado: {formatDate(post.updatedAt)}</span>
              )}
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {post.readingTimeMinutes} min de lectura
              </span>
            </div>
          </header>

          {/* ── Content ── */}
          <article
            className={cn(
              "text-foreground/90",
              "[&_h1]:text-2xl [&_h1]:font-heading [&_h1]:font-bold [&_h1]:mt-10 [&_h1]:mb-4 [&_h1]:tracking-tight",
              "[&_h2]:text-xl [&_h2]:font-heading [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:tracking-tight",
              "[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2",
              "[&_h4]:text-base [&_h4]:font-semibold [&_h4]:mt-4 [&_h4]:mb-1.5",
              "[&_p]:text-muted-foreground [&_p]:leading-relaxed [&_p]:mb-4",
              "[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:space-y-1.5",
              "[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_ol]:space-y-1.5",
              "[&_li]:text-muted-foreground [&_li]:leading-relaxed",
              "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_a]:hover:opacity-80",
              "[&_strong]:text-foreground [&_strong]:font-semibold",
              "[&_em]:italic [&_u]:underline",
              "[&_blockquote]:border-l-4 [&_blockquote]:border-primary/40 [&_blockquote]:pl-5 [&_blockquote]:py-1 [&_blockquote]:my-6 [&_blockquote]:text-muted-foreground [&_blockquote]:italic",
              "[&_code]:bg-muted [&_code]:rounded [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm [&_code]:font-mono [&_code]:text-foreground",
              "[&_pre]:bg-muted [&_pre]:rounded-xl [&_pre]:p-4 [&_pre]:overflow-x-auto [&_pre]:mb-4",
              "[&_pre_code]:bg-transparent [&_pre_code]:px-0 [&_pre_code]:py-0",
              "[&_hr]:border-border/40 [&_hr]:my-8",
              "[&_table]:w-full [&_table]:border-collapse [&_table]:mb-4",
              "[&_th]:border [&_th]:border-border [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:text-sm [&_th]:font-semibold [&_th]:bg-muted/50",
              "[&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2 [&_td]:text-sm [&_td]:text-muted-foreground",
              "[&_img]:rounded-xl [&_img]:w-full [&_img]:my-6 [&_img]:border [&_img]:border-border/40",
            )}
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* ── CTA ── */}
          <div className="mt-12 rounded-2xl border border-primary/25 bg-primary/5 px-6 py-6 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm mb-1 flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-primary shrink-0" />
                ¿Aplica a tu caso?
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Consulta con uno de nuestros asesores. Revisamos tu situación y te decimos si tienes salida y cuál es.
              </p>
            </div>
            <Button variant="cta" size="sm" asChild className="shrink-0 whitespace-nowrap">
              <a href="https://wa.me/34672297468?text=Hola,%20leí%20un%20artículo%20del%20blog%20de%20LEGASSI%20y%20tengo%20una%20consulta" target="_blank" rel="noopener noreferrer">
                Hablar con asesor
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </Button>
          </div>

          {/* ── Related ── */}
          {related.length > 0 && (
            <section className="mt-14">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-5">
                Artículos relacionados
              </p>
              <div className="grid sm:grid-cols-3 gap-4">
                {related.map(rel => (
                  <Link
                    key={rel.id}
                    href={`/blog/${rel.slug}`}
                    className="group flex flex-col rounded-xl overflow-hidden border border-border/50 hover:border-primary/30 hover:shadow-md transition-all"
                  >
                    <div className="relative aspect-[16/9]">
                      {rel.coverImage ? (
                        <Image src={rel.coverImage} alt={rel.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 280px" />
                      ) : (
                        <div className={cn("absolute inset-0 bg-gradient-to-br", CATEGORY_COLORS[rel.category].gradient)} />
                      )}
                    </div>
                    <div className="p-3 bg-card flex-1">
                      <p className="font-semibold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2 mb-1">
                        {rel.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground">{formatDate(rel.publishedAt)} · {rel.readingTimeMinutes} min</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

        </div>
      </main>
      <Footer />
    </>
  )
}

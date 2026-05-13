import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ArrowLeft, ArrowRight, BookOpen, AlertTriangle, GitBranch, FileText, Users, Compass, Clock, CalendarDays } from "lucide-react"
import { getPostsByCategory, CATEGORIES, TAGS, formatDate } from "@/lib/blog"
import type { CategorySlug, TagSlug } from "@/lib/blog"
import { cn } from "@/lib/utils"

export const revalidate = 3600

const CATEGORY_ICONS: Record<CategorySlug, React.ElementType> = {
  salida:   Compass,
  opciones: GitBranch,
  tramite:  FileText,
  errores:  AlertTriangle,
  casos:    Users,
}

const CATEGORY_COLORS: Record<CategorySlug, { border: string; bg: string; icon: string; badge: string; gradient: string; iconBg: string }> = {
  salida:   { border: "border-blue-200 dark:border-blue-800",   bg: "bg-blue-50/60 dark:bg-blue-950/20",   icon: "text-blue-600 dark:text-blue-400",   badge: "bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",   gradient: "from-blue-950 to-slate-950",   iconBg: "bg-blue-100 dark:bg-blue-950/50" },
  opciones: { border: "border-emerald-200 dark:border-emerald-800", bg: "bg-emerald-50/60 dark:bg-emerald-950/20", icon: "text-emerald-600 dark:text-emerald-400", badge: "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800", gradient: "from-emerald-950 to-slate-950", iconBg: "bg-emerald-100 dark:bg-emerald-950/50" },
  tramite:  { border: "border-violet-200 dark:border-violet-800",  bg: "bg-violet-50/60 dark:bg-violet-950/20",  icon: "text-violet-600 dark:text-violet-400",  badge: "bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800",  gradient: "from-violet-950 to-slate-950",  iconBg: "bg-violet-100 dark:bg-violet-950/50" },
  errores:  { border: "border-rose-200 dark:border-rose-800",    bg: "bg-rose-50/60 dark:bg-rose-950/20",    icon: "text-rose-600 dark:text-rose-400",    badge: "bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800",    gradient: "from-rose-950 to-slate-950",    iconBg: "bg-rose-100 dark:bg-rose-950/50" },
  casos:    { border: "border-amber-200 dark:border-amber-800",   bg: "bg-amber-50/60 dark:bg-amber-950/20",   icon: "text-amber-600 dark:text-amber-400",   badge: "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",   gradient: "from-amber-950 to-slate-950",   iconBg: "bg-amber-100 dark:bg-amber-950/50" },
}

export async function generateStaticParams() {
  return (Object.keys(CATEGORIES) as CategorySlug[]).map(categoria => ({ categoria }))
}

export async function generateMetadata({ params }: { params: Promise<{ categoria: string }> }): Promise<Metadata> {
  const { categoria } = await params
  const cat = CATEGORIES[categoria as CategorySlug]
  if (!cat) return {}
  const url = `https://legassi.es/blog/categoria/${categoria}`
  return {
    title: `${cat.label} – Blog LEGASSI`,
    description: cat.description,
    alternates: { canonical: url },
    openGraph: {
      title: `${cat.label} – Blog LEGASSI`,
      description: cat.description,
      url,
      siteName: "LEGASSI",
      locale: "es_ES",
    },
    twitter: {
      card: "summary",
      title: `${cat.label} – Blog LEGASSI`,
      description: cat.description,
    },
  }
}

export default async function CategoriaPage({ params }: { params: Promise<{ categoria: string }> }) {
  const { categoria } = await params
  if (!(categoria in CATEGORIES)) notFound()

  const slug = categoria as CategorySlug
  const cat = CATEGORIES[slug]
  const Icon = CATEGORY_ICONS[slug]
  const colors = CATEGORY_COLORS[slug]
  const posts = await getPostsByCategory(slug)

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background pt-20 pb-20">
        <div className="container mx-auto max-w-5xl px-6 sm:px-10">

          {/* Back */}
          <div className="pt-8 mb-6">
            <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
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
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {posts.map(post => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group flex flex-col rounded-2xl overflow-hidden border border-border/50 bg-card hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
                >
                  {/* Cover */}
                  <div className="relative aspect-[16/9]">
                    {post.coverImage ? (
                      <Image src={post.coverImage} alt={post.title} fill className="object-cover" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                    ) : (
                      <div className={cn("absolute inset-0 bg-gradient-to-br", colors.gradient)}>
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 30% 50%, white 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex flex-col flex-1 p-5 gap-3">
                    <div className="flex flex-wrap gap-1.5">
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
                    <h2 className="font-heading font-bold text-base leading-snug group-hover:text-primary transition-colors line-clamp-2 flex-1">
                      {post.title}
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{post.excerpt}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-border/40">
                      <span className="flex items-center gap-3 text-xs text-muted-foreground/60">
                        <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{formatDate(post.publishedAt)}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{post.readingTimeMinutes} min</span>
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
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

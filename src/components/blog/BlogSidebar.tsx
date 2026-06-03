import Link from "next/link"
import { MessageCircle, Tag } from "lucide-react"
import { CATEGORIES, TAGS, type CategorySlug, type TagSlug } from "@/lib/blog"
import { CATEGORY_COLORS, CATEGORY_ICONS } from "@/lib/categories"
import { BlogSidebarSearch } from "@/components/blog/BlogSidebarSearch"
import { cn } from "@/lib/utils"

export function BlogSidebar({ topTags = [] }: { topTags?: string[] }) {
  return (
    <aside className="space-y-6">

      {/* Search */}
      <BlogSidebarSearch />

      {/* Categories */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
          Categorías
        </p>
        <div className="space-y-1">
          {(Object.entries(CATEGORIES) as [CategorySlug, (typeof CATEGORIES)[CategorySlug]][]).map(
            ([slug, cat]) => {
              const Icon = CATEGORY_ICONS[slug]
              const c = CATEGORY_COLORS[slug]
              return (
                <Link
                  key={slug}
                  href={`/blog/categoria/${slug}`}
                  className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-muted/60"
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border",
                      c.iconBg,
                      c.border,
                    )}
                  >
                    <Icon className={cn("h-3.5 w-3.5", c.icon)} />
                  </span>
                  <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors leading-tight">
                    {cat.label}
                  </span>
                </Link>
              )
            },
          )}
        </div>
      </div>

      {/* Tags cloud */}
      {topTags.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
            <Tag className="h-3.5 w-3.5" /> Etiquetas
          </p>
          <div className="flex flex-wrap gap-2">
            {topTags.map(tag => {
              const visual = TAGS[tag as TagSlug]
              return visual ? (
                <Link
                  key={tag}
                  href={`/blog?q=${encodeURIComponent(tag)}`}
                  className={cn(
                    "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide transition-opacity hover:opacity-75",
                    visual.bg, visual.text, visual.border,
                  )}
                >
                  {visual.label}
                </Link>
              ) : (
                <Link
                  key={tag}
                  href={`/blog?q=${encodeURIComponent(tag)}`}
                  className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                >
                  {tag}
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="rounded-2xl p-6 brand-gradient text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 mx-auto mb-3">
          <MessageCircle className="h-5 w-5 text-white" />
        </div>
        <h3 className="font-heading font-bold text-white text-base mb-1.5">
          ¿Tienes dudas sobre tu caso?
        </h3>
        <p className="text-white/75 text-xs leading-relaxed mb-4">
          Consulta gratis con un abogado especializado en extranjería.
        </p>
        <a
          href="https://wa.me/34672297468?text=Hola,%20leí%20el%20blog%20de%20LEGASSI%20y%20tengo%20una%20consulta"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 px-4 py-2.5 text-sm font-bold text-white transition-all"
        >
          Consultar por WhatsApp
        </a>
      </div>

    </aside>
  )
}

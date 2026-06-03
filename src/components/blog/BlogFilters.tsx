"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { CATEGORIES, type CategorySlug } from "@/lib/blog"
import { CATEGORY_COLORS } from "@/lib/categories"
import { cn } from "@/lib/utils"

interface BlogFiltersProps {
  initialQ: string
  initialCategory: string
}

export function BlogFilters({ initialQ, initialCategory }: BlogFiltersProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  function navigateCategory(slug: string) {
    const params = new URLSearchParams()
    if (initialQ.trim()) params.set("q", initialQ.trim())
    if (slug) params.set("categoria", slug)
    startTransition(() => {
      router.push(`/blog${params.size ? `?${params}` : ""}`, { scroll: false })
    })
  }

  return (
    <div className="flex items-center gap-2 flex-wrap border-b border-border/40 pb-3 mb-8">
      <button
        type="button"
        onClick={() => navigateCategory("")}
        className={cn(
          "inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-colors",
          !initialCategory
            ? "bg-primary text-primary-foreground border-primary"
            : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
        )}
      >
        Todos
      </button>
      {(Object.entries(CATEGORIES) as [CategorySlug, typeof CATEGORIES[CategorySlug]][]).map(([slug, cat]) => {
        const active = initialCategory === slug
        const c = CATEGORY_COLORS[slug]
        return (
          <button
            key={slug}
            type="button"
            onClick={() => navigateCategory(slug)}
            className={cn(
              "inline-flex items-center rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all",
              active ? c.badge : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
            )}
          >
            {cat.label}
          </button>
        )
      })}
    </div>
  )
}

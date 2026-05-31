import { Compass, FileText, AlertTriangle, Users, GitBranch } from "lucide-react"
import type { CategorySlug } from "@/lib/blog"

export type CategoryColors = {
  badge: string
  cardGradient: string  // for card backgrounds (lighter dark)
  heroGradient: string  // for hero/full-bleed gradients (deeper dark)
  border: string
  bg: string
  icon: string
  iconBg: string
}

export const CATEGORY_COLORS: Record<CategorySlug, CategoryColors> = {
  situacion: {
    badge:        "bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    cardGradient: "from-blue-900 to-blue-950",
    heroGradient: "from-blue-950 to-slate-950",
    border:       "border-blue-200 dark:border-blue-800",
    bg:           "bg-blue-50/60 dark:bg-blue-950/20",
    icon:         "text-blue-600 dark:text-blue-400",
    iconBg:       "bg-blue-100 dark:bg-blue-950/50",
  },
  tramite: {
    badge:        "bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800",
    cardGradient: "from-violet-900 to-violet-950",
    heroGradient: "from-violet-950 to-slate-950",
    border:       "border-violet-200 dark:border-violet-800",
    bg:           "bg-violet-50/60 dark:bg-violet-950/20",
    icon:         "text-violet-600 dark:text-violet-400",
    iconBg:       "bg-violet-100 dark:bg-violet-950/50",
  },
  errores: {
    badge:        "bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800",
    cardGradient: "from-rose-900 to-rose-950",
    heroGradient: "from-rose-950 to-slate-950",
    border:       "border-rose-200 dark:border-rose-800",
    bg:           "bg-rose-50/60 dark:bg-rose-950/20",
    icon:         "text-rose-600 dark:text-rose-400",
    iconBg:       "bg-rose-100 dark:bg-rose-950/50",
  },
  casos: {
    badge:        "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    cardGradient: "from-amber-900 to-amber-950",
    heroGradient: "from-amber-950 to-slate-950",
    border:       "border-amber-200 dark:border-amber-800",
    bg:           "bg-amber-50/60 dark:bg-amber-950/20",
    icon:         "text-amber-600 dark:text-amber-400",
    iconBg:       "bg-amber-100 dark:bg-amber-950/50",
  },
  actualidad: {
    badge:        "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    cardGradient: "from-emerald-900 to-emerald-950",
    heroGradient: "from-emerald-950 to-slate-950",
    border:       "border-emerald-200 dark:border-emerald-800",
    bg:           "bg-emerald-50/60 dark:bg-emerald-950/20",
    icon:         "text-emerald-600 dark:text-emerald-400",
    iconBg:       "bg-emerald-100 dark:bg-emerald-950/50",
  },
}

export const CATEGORY_ICONS: Record<CategorySlug, React.ElementType> = {
  situacion:  Compass,
  tramite:    FileText,
  errores:    AlertTriangle,
  casos:      Users,
  actualidad: GitBranch,
}

export function safeCategorySlug(cat: string): CategorySlug {
  return (cat in CATEGORY_COLORS ? cat : "situacion") as CategorySlug
}

import { createServerClient } from "@/lib/supabase"

// ─── Constants (shared with notion.ts) ───────────────────────────────────────

export const CATEGORIES = {
  salida: {
    label: "¿Hay salida para mi caso?",
    description: "Entiende si tienes opciones reales y cuáles son según tu situación.",
    color: "blue",
  },
  opciones: {
    label: "Qué opción me conviene",
    description: "Compara vías y elige la que encaja con tu caso concreto.",
    color: "emerald",
  },
  tramite: {
    label: "Cómo funciona el trámite",
    description: "Paso a paso: qué pasa, cuánto tarda y qué necesitas.",
    color: "violet",
  },
  errores: {
    label: "Errores frecuentes",
    description: "Los fallos que más retrasos y denegaciones causan.",
    color: "rose",
  },
  casos: {
    label: "Casos reales",
    description: "Situaciones reales que gestionamos y cómo las resolvimos.",
    color: "amber",
  },
} as const

export type CategorySlug = keyof typeof CATEGORIES

export const TAGS = {
  actualizado: { label: "Actualizado 2026", bg: "bg-amber-100 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-400", border: "border-amber-200 dark:border-amber-800" },
  "cambio-legal": { label: "Cambio legal", bg: "bg-rose-100 dark:bg-rose-950/40", text: "text-rose-700 dark:text-rose-400", border: "border-rose-200 dark:border-rose-800" },
  aviso: { label: "Aviso importante", bg: "bg-orange-100 dark:bg-orange-950/40", text: "text-orange-700 dark:text-orange-400", border: "border-orange-200 dark:border-orange-800" },
} as const

export type TagSlug = keyof typeof TAGS

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string
  category: CategorySlug
  tags: TagSlug[]
  publishedAt: string
  updatedAt?: string
  featured: boolean
  readingTimeMinutes: number
  coverImage?: string
}

export interface BlogPostWithContent extends BlogPost {
  content: string // HTML from Tiptap
}

// For the admin (includes drafts + all fields)
export interface BlogPostRow {
  id: string
  slug: string
  title: string
  excerpt: string
  category: string
  tags: string[]
  content: string
  published: boolean
  featured: boolean
  published_at: string | null
  updated_at: string
  created_at: string
  cover_image?: string | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

function estimateReadingTime(html: string): number {
  return Math.max(1, Math.ceil(stripHtml(html).split(" ").length / 200))
}

function rowToPost(row: BlogPostRow): BlogPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    category: row.category as CategorySlug,
    tags: (row.tags ?? []) as TagSlug[],
    publishedAt: row.published_at ?? row.created_at,
    updatedAt: row.updated_at !== row.published_at ? row.updated_at : undefined,
    featured: row.featured,
    readingTimeMinutes: estimateReadingTime(row.content),
    coverImage: row.cover_image ?? undefined,
  }
}

export function formatDate(iso: string): string {
  if (!iso) return ""
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

// ─── Public queries (published posts only) ───────────────────────────────────

export async function getAllPosts(): Promise<BlogPost[]> {
  const supabase = createServerClient()
  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("published", true)
    .order("published_at", { ascending: false })
  return (data ?? []).map(rowToPost)
}

export async function getPostBySlug(slug: string): Promise<BlogPostWithContent | null> {
  const supabase = createServerClient()
  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("published", true)
    .eq("slug", slug)
    .single()
  if (!data) return null
  return { ...rowToPost(data as BlogPostRow), content: data.content }
}

export async function getPostsByCategory(category: CategorySlug): Promise<BlogPost[]> {
  const supabase = createServerClient()
  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("published", true)
    .eq("category", category)
    .order("published_at", { ascending: false })
  return (data ?? []).map(rowToPost)
}

export async function getFeaturedPosts(): Promise<BlogPost[]> {
  const supabase = createServerClient()
  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("published", true)
    .eq("featured", true)
    .order("published_at", { ascending: false })
    .limit(5)
  return (data ?? []).map(rowToPost)
}

export async function getRelatedPosts(currentSlug: string, category: CategorySlug): Promise<BlogPost[]> {
  const supabase = createServerClient()
  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("published", true)
    .eq("category", category)
    .neq("slug", currentSlug)
    .order("published_at", { ascending: false })
    .limit(3)
  return (data ?? []).map(rowToPost)
}

// ─── Admin queries (all posts including drafts) ───────────────────────────────

export async function adminGetAllPosts(): Promise<BlogPostRow[]> {
  const supabase = createServerClient()
  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .order("created_at", { ascending: false })
  return (data ?? []) as BlogPostRow[]
}

export async function adminGetPost(id: string): Promise<BlogPostRow | null> {
  const supabase = createServerClient()
  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .single()
  return data as BlogPostRow | null
}

export async function adminCreatePost(payload: Omit<BlogPostRow, "id" | "created_at" | "updated_at">): Promise<BlogPostRow> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("blog_posts")
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data as BlogPostRow
}

export async function adminUpdatePost(id: string, payload: Partial<Omit<BlogPostRow, "id" | "created_at">>): Promise<void> {
  const supabase = createServerClient()
  const { error } = await supabase
    .from("blog_posts")
    .update(payload)
    .eq("id", id)
  if (error) throw error
}

export async function adminDeletePost(id: string): Promise<void> {
  const supabase = createServerClient()
  const { error } = await supabase
    .from("blog_posts")
    .delete()
    .eq("id", id)
  if (error) throw error
}

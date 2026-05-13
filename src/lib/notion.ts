import { Client } from "@notionhq/client"
import { NotionToMarkdown } from "notion-to-md"
import type { PageObjectResponse, RichTextItemResponse } from "@notionhq/client/build/src/api-endpoints"

// ─── Client ───────────────────────────────────────────────────────────────────

const notion = new Client({ auth: process.env.NOTION_TOKEN })
const n2m = new NotionToMarkdown({ notionClient: notion })
const DATABASE_ID = process.env.NOTION_DATABASE_ID ?? ""

// ─── Constants ────────────────────────────────────────────────────────────────

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
}

export interface BlogPostWithContent extends BlogPost {
  content: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractText(richText: RichTextItemResponse[]): string {
  return richText?.map(t => t.plain_text).join("") ?? ""
}

function estimateReadingTime(text: string): number {
  return Math.max(1, Math.ceil(text.split(/\s+/).length / 200))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pageToPost(page: PageObjectResponse): BlogPost {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = page.properties as Record<string, any>
  const excerpt = extractText(p.Excerpt?.rich_text ?? [])
  return {
    id: page.id,
    slug: extractText(p.Slug?.rich_text ?? []),
    title: extractText(p.Title?.title ?? []),
    excerpt,
    category: (p.Category?.select?.name ?? "salida") as CategorySlug,
    tags: ((p.Tags?.multi_select ?? []) as { name: string }[]).map(t => t.name) as TagSlug[],
    publishedAt: p.PublishedAt?.date?.start ?? "",
    updatedAt: p.UpdatedAt?.date?.start ?? undefined,
    featured: p.Featured?.checkbox ?? false,
    readingTimeMinutes: estimateReadingTime(excerpt),
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

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getAllPosts(): Promise<BlogPost[]> {
  if (!DATABASE_ID) return []
  const res = await notion.dataSources.query({
    data_source_id: DATABASE_ID,
    filter: { property: "Published", checkbox: { equals: true } },
    sorts: [{ property: "PublishedAt", direction: "descending" }],
  })
  return (res.results as PageObjectResponse[]).map(pageToPost)
}

export async function getPostBySlug(slug: string): Promise<BlogPostWithContent | null> {
  if (!DATABASE_ID) return null
  const res = await notion.dataSources.query({
    data_source_id: DATABASE_ID,
    filter: {
      and: [
        { property: "Published", checkbox: { equals: true } },
        { property: "Slug", rich_text: { equals: slug } },
      ],
    },
  })
  if (!res.results.length) return null
  const page = res.results[0] as PageObjectResponse
  const post = pageToPost(page)
  const mdBlocks = await n2m.pageToMarkdown(page.id)
  const content = n2m.toMarkdownString(mdBlocks).parent
  return { ...post, content, readingTimeMinutes: estimateReadingTime(content) }
}

export async function getPostsByCategory(category: CategorySlug): Promise<BlogPost[]> {
  if (!DATABASE_ID) return []
  const res = await notion.dataSources.query({
    data_source_id: DATABASE_ID,
    filter: {
      and: [
        { property: "Published", checkbox: { equals: true } },
        { property: "Category", select: { equals: category } },
      ],
    },
    sorts: [{ property: "PublishedAt", direction: "descending" }],
  })
  return (res.results as PageObjectResponse[]).map(pageToPost)
}

export async function getFeaturedPosts(): Promise<BlogPost[]> {
  if (!DATABASE_ID) return []
  const res = await notion.dataSources.query({
    data_source_id: DATABASE_ID,
    filter: {
      and: [
        { property: "Published", checkbox: { equals: true } },
        { property: "Featured", checkbox: { equals: true } },
      ],
    },
    sorts: [{ property: "PublishedAt", direction: "descending" }],
    page_size: 5,
  })
  return (res.results as PageObjectResponse[]).map(pageToPost)
}

export async function getRelatedPosts(currentSlug: string, category: CategorySlug): Promise<BlogPost[]> {
  const posts = await getPostsByCategory(category)
  return posts.filter(p => p.slug !== currentSlug).slice(0, 3)
}

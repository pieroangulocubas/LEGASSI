import type { MetadataRoute } from "next"
import { getAllPosts, CATEGORIES } from "@/lib/blog"
import type { CategorySlug } from "@/lib/blog"

const BASE = "https://legassi.es"

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let posts: Awaited<ReturnType<typeof getAllPosts>> = []
  try { posts = await getAllPosts() } catch { /* sin posts en build time */ }

  const postEntries: MetadataRoute.Sitemap = posts.map(post => ({
    url: `${BASE}/blog/${post.slug}`,
    lastModified: post.updatedAt ?? post.publishedAt,
    changeFrequency: "monthly",
    priority: 0.8,
  }))

  const categoryEntries: MetadataRoute.Sitemap = (Object.keys(CATEGORIES) as CategorySlug[]).map(slug => ({
    url: `${BASE}/blog/categoria/${slug}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }))

  return [
    { url: BASE,              changeFrequency: "weekly",  priority: 1.0 },
    { url: `${BASE}/blog`,    changeFrequency: "daily",   priority: 0.9 },
    ...categoryEntries,
    ...postEntries,
  ]
}

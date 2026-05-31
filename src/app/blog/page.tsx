import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { getPostsPage, getPopularPosts, getHeroPost, PAGE_SIZE } from "@/lib/blog"
import { BlogFeed } from "@/components/blog/BlogFeed"

export const revalidate = 3600

export const metadata: Metadata = {
  title: "Blog – LEGASSI",
  description: "Guías, casos reales y avisos sobre extranjería en España. Sin burocracia. Sin tecnicismos vacíos.",
  alternates: { canonical: "https://legassi.es/blog" },
  openGraph: {
    title: "Blog LEGASSI – Extranjería explicada con criterio",
    description: "Guías, casos reales y avisos sobre extranjería en España.",
    url: "https://legassi.es/blog",
    siteName: "LEGASSI",
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog LEGASSI – Extranjería explicada con criterio",
    description: "Guías, casos reales y avisos sobre extranjería en España.",
  },
}

export default async function BlogPage() {
  const [{ posts: initialPosts, total }, popularPosts, heroPost] = await Promise.all([
    getPostsPage(0),
    getPopularPosts(5),
    getHeroPost(),
  ])
  const initialHasMore = total > PAGE_SIZE

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background pt-20 pb-24">

        {/* ── Header ── */}
        <div className="border-b border-border/40 bg-muted/20">
          <div className="container mx-auto max-w-7xl px-6 sm:px-10 py-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">Blog LEGASSI</p>
            <h1 className="text-section font-heading font-bold tracking-tight mb-2">
              Extranjería explicada con criterio
            </h1>
            <p className="text-muted-foreground text-sm max-w-lg">
              Sin burocracia. Sin tecnicismos vacíos. Cada artículo responde una pregunta concreta.
            </p>
          </div>
        </div>

        <div className="container mx-auto max-w-7xl px-6 sm:px-10 mt-8">
          <BlogFeed
            initialPosts={initialPosts}
            initialHasMore={initialHasMore}
            popularPosts={popularPosts}
            heroPost={heroPost}
          />
        </div>

      </main>
      <Footer />
    </>
  )
}

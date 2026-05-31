import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export const runtime = "nodejs"

export async function POST(_: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createServerClient()

  const { data } = await supabase
    .from("blog_posts")
    .select("id, views_count")
    .eq("slug", slug)
    .eq("published", true)
    .single()

  if (!data) return NextResponse.json({ ok: false })

  await supabase
    .from("blog_posts")
    .update({ views_count: (data.views_count ?? 0) + 1 })
    .eq("id", data.id)

  return NextResponse.json({ ok: true })
}

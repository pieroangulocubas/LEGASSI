import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export const runtime = "nodejs"

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { unlike = false } = await req.json().catch(() => ({}))
  const supabase = createServerClient()

  const { data } = await supabase
    .from("blog_posts")
    .select("id, likes_count")
    .eq("slug", slug)
    .single()

  if (!data) return NextResponse.json({ ok: false }, { status: 404 })

  const newCount = Math.max(0, (data.likes_count ?? 0) + (unlike ? -1 : 1))
  await supabase
    .from("blog_posts")
    .update({ likes_count: newCount })
    .eq("id", data.id)

  return NextResponse.json({ ok: true, count: newCount })
}

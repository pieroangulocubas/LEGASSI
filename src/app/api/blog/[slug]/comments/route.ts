import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export const runtime = "nodejs"

export async function GET(_: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createServerClient()

  const { data: post } = await supabase
    .from("blog_posts")
    .select("id")
    .eq("slug", slug)
    .single()

  if (!post) return NextResponse.json({ comments: [] })

  const { data } = await supabase
    .from("post_comments")
    .select("id, author_name, content, created_at")
    .eq("post_id", post.id)
    .eq("approved", true)
    .order("created_at", { ascending: true })

  return NextResponse.json({ comments: data ?? [] })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const body = await req.json().catch(() => null)
  const author_name = body?.author_name?.trim()
  const content = body?.content?.trim()

  if (!author_name || !content) {
    return NextResponse.json({ error: "Nombre y comentario son obligatorios" }, { status: 400 })
  }

  const supabase = createServerClient()

  const { data: post } = await supabase
    .from("blog_posts")
    .select("id")
    .eq("slug", slug)
    .single()

  if (!post) return NextResponse.json({ error: "Artículo no encontrado" }, { status: 404 })

  const { error } = await supabase.from("post_comments").insert({
    post_id: post.id,
    author_name,
    content,
    approved: true,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

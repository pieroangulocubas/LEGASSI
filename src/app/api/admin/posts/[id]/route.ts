import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { adminUpdatePost, adminDeletePost } from "@/lib/blog"
import type { BlogPostRow } from "@/lib/blog"

type EditableFields = Pick<BlogPostRow,
  "title" | "slug" | "excerpt" | "category" | "tags" | "content" |
  "published" | "featured" | "cover_image" | "published_at"
>

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAuth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  try {
    const body = await req.json()
    const allowed: Partial<EditableFields> = {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.slug !== undefined && { slug: body.slug }),
      ...(body.excerpt !== undefined && { excerpt: body.excerpt }),
      ...(body.category !== undefined && { category: body.category }),
      ...(body.tags !== undefined && { tags: body.tags }),
      ...(body.content !== undefined && { content: body.content }),
      ...(body.published !== undefined && { published: body.published }),
      ...(body.featured !== undefined && { featured: body.featured }),
      ...(body.cover_image !== undefined && { cover_image: body.cover_image }),
      ...(body.published_at !== undefined && { published_at: body.published_at }),
    }
    await adminUpdatePost(id, allowed)
    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error"
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAuth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  try {
    await adminDeletePost(id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error"
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}

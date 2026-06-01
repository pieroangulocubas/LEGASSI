export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { adminGetAllPosts, adminCreatePost } from "@/lib/blog"

export async function GET(req: NextRequest) {
  if (!(await requireAuth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const posts = await adminGetAllPosts()
  return NextResponse.json(posts)
}

export async function POST(req: NextRequest) {
  if (!(await requireAuth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const body = await req.json()
    const post = await adminCreatePost(body)
    return NextResponse.json(post, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : (e as { message?: string })?.message ?? "Error al guardar"
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}

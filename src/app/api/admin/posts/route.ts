import { NextRequest, NextResponse } from "next/server"
import { verifyToken, COOKIE_NAME } from "@/lib/auth"
import { adminGetAllPosts, adminCreatePost } from "@/lib/blog"

async function auth(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(COOKIE_NAME)?.value
  return !!token && verifyToken(token)
}

export async function GET(req: NextRequest) {
  if (!(await auth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const posts = await adminGetAllPosts()
  return NextResponse.json(posts)
}

export async function POST(req: NextRequest) {
  if (!(await auth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const body = await req.json()
    const post = await adminCreatePost(body)
    return NextResponse.json(post, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error"
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}

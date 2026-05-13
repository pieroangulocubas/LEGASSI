import { NextRequest, NextResponse } from "next/server"
import { verifyToken, COOKIE_NAME } from "@/lib/auth"
import { adminUpdatePost, adminDeletePost } from "@/lib/blog"

async function auth(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(COOKIE_NAME)?.value
  return !!token && verifyToken(token)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await auth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  try {
    const body = await req.json()
    await adminUpdatePost(id, body)
    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error"
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await auth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  try {
    await adminDeletePost(id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error"
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { getPostsPage } from "@/lib/blog"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const q = (searchParams.get("q") ?? "").trim()
  const category = searchParams.get("category") ?? ""
  const page = Math.max(0, parseInt(searchParams.get("page") ?? "0"))

  try {
    const result = await getPostsPage(page, { q, category })
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

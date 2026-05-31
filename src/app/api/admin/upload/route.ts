export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { requireAuth } from "@/lib/auth"

const BUCKET = "blog-images"
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"])
const MAX_BYTES = 5 * 1024 * 1024 // 5 MB

export async function POST(req: NextRequest) {
  if (!(await requireAuth(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let supabase
  try {
    const { createServerClient } = await import("@/lib/supabase")
    supabase = createServerClient()
  } catch {
    return NextResponse.json({ error: "Storage not configured" }, { status: 500 })
  }

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 })

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Tipo de archivo no permitido. Solo JPEG, PNG, GIF o WebP." }, { status: 400 })
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "El archivo supera el límite de 5 MB." }, { status: 413 })
  }

  const ext = file.type.split("/")[1] // derive extension from validated MIME, not filename
  const filename = `${randomUUID()}.${ext}`
  const buffer = await file.arrayBuffer()

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, buffer, { contentType: file.type, upsert: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(filename)
  return NextResponse.json({ url: publicUrl })
}

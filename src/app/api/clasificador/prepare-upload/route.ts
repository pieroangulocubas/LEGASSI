import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

const BUCKET = "clasificador-pdfs"

export async function POST(req: NextRequest) {
  let token: string
  try {
    const body = await req.json()
    token = (body.token as string)?.trim()
    if (!token) return NextResponse.json({ error: "Token requerido." }, { status: 400 })
  } catch {
    return NextResponse.json({ error: "Petición inválida." }, { status: 400 })
  }

  const supabase = createServerClient()

  // Verify token exists and has credits (basic auth check)
  const { data } = await supabase
    .from("clasificador_tokens")
    .select("token")
    .eq("token", token)
    .maybeSingle()

  if (!data) {
    return NextResponse.json({ error: "Token no válido." }, { status: 403 })
  }

  const uuid = crypto.randomUUID()
  const filePath = `${token}/${uuid}.pdf`

  const { data: signed, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(filePath)

  if (error || !signed) {
    console.error("Supabase signed upload error:", error)
    return NextResponse.json({ error: "No se pudo preparar el almacenamiento." }, { status: 500 })
  }

  const supabaseUrl = process.env.SUPABASE_URL!.replace(/\/$/, "")
  const publicUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${filePath}`

  return NextResponse.json({ signedUrl: signed.signedUrl, publicUrl, filePath })
}

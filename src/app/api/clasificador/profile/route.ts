import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")
  if (!token) {
    return NextResponse.json({ error: "token requerido." }, { status: 400 })
  }

  const supabase = createServerClient()

  const { data } = await supabase
    .from("clasificador_tokens")
    .select("email, nombre, telefono, credits, is_freemium")
    .eq("token", token)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle()

  if (!data) {
    return NextResponse.json({ error: "Token no válido." }, { status: 404 })
  }

  return NextResponse.json({
    email: data.email,
    nombre: data.nombre,
    telefono: data.telefono,
    credits: data.credits,
    is_freemium: data.is_freemium ?? false,
  })
}

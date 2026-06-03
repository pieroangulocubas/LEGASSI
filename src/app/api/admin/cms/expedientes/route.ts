import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET() {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("expedientes_favorables")
    .select("*")
    .order("orden", { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("expedientes_favorables")
    .insert({ titulo: body.titulo, descripcion: body.descripcion || null, imagen_url: body.imagen_url, visible: true, orden: body.orden ?? 0 })
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

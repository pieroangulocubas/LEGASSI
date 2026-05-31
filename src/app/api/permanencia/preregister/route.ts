import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST(req: NextRequest) {
  let nombre: string | null = null
  let email: string | null = null
  let telefono: string | null = null

  try {
    const body = await req.json()
    nombre   = (body.nombre   as string)?.trim() || null
    email    = (body.email    as string)?.trim().toLowerCase() || null
    telefono = (body.telefono as string)?.trim() || null
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  if (!email) return NextResponse.json({ ok: true }) // sin email no hay clave de búsqueda

  const supabase = createServerClient()

  const { data: existing } = await supabase
    .from("clasificador_tokens")
    .select("credits")
    .eq("email", email)
    .maybeSingle()

  if (existing) {
    // Ya existe: solo actualizamos datos si aún no ha pagado (credits = 0)
    // Si ya tiene créditos, no tocamos nada
    if (existing.credits === 0) {
      await supabase
        .from("clasificador_tokens")
        .update({ nombre, telefono })
        .eq("email", email)
    }
    return NextResponse.json({ ok: true })
  }

  // Registro nuevo sin pago todavía
  await supabase.from("clasificador_tokens").insert({
    token: crypto.randomUUID(),
    email,
    nombre,
    telefono,
    credits: 0,
  })

  return NextResponse.json({ ok: true })
}

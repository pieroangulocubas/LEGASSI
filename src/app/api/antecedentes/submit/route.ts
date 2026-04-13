import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import type { AntecedentesFormData } from "@/app/herramientas/antecedentes-penales-peru/types"

export async function POST(req: NextRequest) {
  let body: Partial<AntecedentesFormData>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: "Cuerpo de la solicitud inválido." }, { status: 400 })
  }

  const {
    nombre_completo,
    dni,
    fecha_emision_dni,
    fecha_nacimiento,
    nombre_madre,
    nombre_padre,
    departamento_nacimiento,
    provincia_nacimiento,
    distrito_nacimiento,
    email,
    telefono,
  } = body

  // ── Validate required fields ───────────────────────────────────────────────
  if (
    !nombre_completo?.trim() ||
    !dni?.trim() ||
    !fecha_emision_dni?.trim() ||
    !fecha_nacimiento?.trim() ||
    !nombre_madre?.trim() ||
    !nombre_padre?.trim() ||
    !departamento_nacimiento?.trim() ||
    !provincia_nacimiento?.trim() ||
    !distrito_nacimiento?.trim() ||
    !email?.trim() ||
    !telefono?.trim()
  ) {
    return NextResponse.json(
      { success: false, error: "Todos los campos son obligatorios." },
      { status: 400 }
    )
  }

  if (!/^\d{8}$/.test(dni.trim())) {
    return NextResponse.json(
      { success: false, error: "El DNI debe tener exactamente 8 dígitos numéricos." },
      { status: 400 }
    )
  }

  // Nombre completo must include at least nombre + apellido (2+ words)
  const nameParts = nombre_completo.trim().split(/\s+/).filter(Boolean)
  if (nameParts.length < 2) {
    return NextResponse.json(
      {
        success: false,
        error:
          "El nombre completo debe incluir nombre y apellidos (ej: Juan García López). No se aceptan solo nombres de pila.",
      },
      { status: 400 }
    )
  }

  const supabase = createServerClient()

  // ── Check if DNI already exists ────────────────────────────────────────────
  const { data: existing, error: fetchError } = await supabase
    .from("antecedentes_penales_peru")
    .select("id, dni, status")
    .eq("dni", dni.trim())
    .maybeSingle()

  if (fetchError) {
    console.error("[antecedentes/submit] fetch error:", fetchError)
    return NextResponse.json(
      { success: false, error: "Error al verificar la solicitud. Inténtalo de nuevo." },
      { status: 500 }
    )
  }

  if (existing) {
    return NextResponse.json({
      success: true,
      already_exists: true,
      dni: existing.dni,
      status: existing.status,
    })
  }

  // ── Get current queue count ────────────────────────────────────────────────
  const { count: queueCount, error: countError } = await supabase
    .from("antecedentes_penales_peru")
    .select("id", { count: "exact", head: true })
    .in("status", ["en_cola", "obteniendo_certificado", "certificado_emitido", "obteniendo_apostilla", "esperando_apostilla"])

  const queuePosition = countError ? null : (queueCount ?? 0) + 1

  // ── Insert new record ──────────────────────────────────────────────────────
  const { data: inserted, error: insertError } = await supabase
    .from("antecedentes_penales_peru")
    .insert({
      dni: dni.trim(),
      nombre_completo: nombre_completo.trim(),
      fecha_emision_dni: fecha_emision_dni.trim(),
      fecha_nacimiento: fecha_nacimiento.trim(),
      nombre_madre: nombre_madre.trim(),
      nombre_padre: nombre_padre.trim(),
      departamento_nacimiento: departamento_nacimiento.trim().toUpperCase(),
      provincia_nacimiento: provincia_nacimiento.trim().toUpperCase(),
      distrito_nacimiento: distrito_nacimiento.trim().toUpperCase(),
      email: email.trim().toLowerCase(),
      telefono: telefono.trim(),
      status: "en_cola",
      queue_position: queuePosition,
    })
    .select("id, dni")
    .single()

  if (insertError || !inserted) {
    console.error("[antecedentes/submit] insert error:", insertError)
    return NextResponse.json(
      { success: false, error: "Error al registrar la solicitud. Por favor inténtalo de nuevo." },
      { status: 500 }
    )
  }

  // ── Insert initial log entry ───────────────────────────────────────────────
  await supabase.from("antecedentes_penales_logs").insert({
    request_id: inserted.id,
    step: "solicitud_recibida",
    message: "Solicitud recibida y añadida a la cola",
  })

  return NextResponse.json({
    success: true,
    dni: inserted.dni,
    id: inserted.id,
  })
}

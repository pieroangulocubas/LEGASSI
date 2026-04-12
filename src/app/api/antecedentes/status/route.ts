import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const dni = searchParams.get("dni")?.trim() ?? ""

  if (!dni || !/^\d{8}$/.test(dni)) {
    return NextResponse.json(
      { error: "El parámetro 'dni' debe tener exactamente 8 dígitos." },
      { status: 400 }
    )
  }

  const supabase = createServerClient()

  // ── Fetch request ──────────────────────────────────────────────────────────
  const { data: request, error: requestError } = await supabase
    .from("antecedentes_penales_peru")
    .select("*")
    .eq("dni", dni)
    .maybeSingle()

  if (requestError) {
    console.error("[antecedentes/status] fetch error:", requestError)
    return NextResponse.json(
      { error: "Error al consultar el estado. Inténtalo de nuevo." },
      { status: 500 }
    )
  }

  if (!request) {
    return NextResponse.json(
      { error: "No se encontró ninguna solicitud con ese DNI." },
      { status: 404 }
    )
  }

  // ── Fetch logs ─────────────────────────────────────────────────────────────
  const { data: logs, error: logsError } = await supabase
    .from("antecedentes_penales_logs")
    .select("*")
    .eq("request_id", request.id)
    .order("created_at", { ascending: false })

  if (logsError) {
    console.error("[antecedentes/status] logs fetch error:", logsError)
    // Non-fatal: return request with empty logs
  }

  return NextResponse.json({
    request,
    logs: logs ?? [],
  })
}

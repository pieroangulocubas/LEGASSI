import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { createServerClient } from "@/lib/supabase"

interface MonthSummary {
  label: string
  status: "CUBIERTO" | "DÉBIL" | "VACÍO"
  isOptional: boolean
}

interface ValidDocSummary {
  tipo: string
  descripcion_breve: string
  fechas: string[]
  fuerza: "fuerte" | "media" | "débil"
  nombre_sugerido: string
}

interface InvalidDocSummary {
  tipo: string
  descripcion_breve: string
  motivo_rechazo: string | null
}

type Veredicto = "CUMPLE" | "CUMPLE_PARCIALMENTE" | "NO_CUMPLE"

function escapeHtml(s: string) {
  return (s ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
}

const VEREDICTO_LABEL: Record<Veredicto, { text: string; color: string; icon: string }> = {
  CUMPLE:              { text: "CUMPLE — expediente completo",        color: "#16a34a", icon: "✅" },
  CUMPLE_PARCIALMENTE: { text: "CUMPLE PARCIALMENTE — revisar meses", color: "#d97706", icon: "⚠️" },
  NO_CUMPLE:           { text: "NO CUMPLE — faltan documentos",       color: "#dc2626", icon: "❌" },
}

const FUERZA_LABEL: Record<string, { text: string; color: string }> = {
  fuerte: { text: "Prueba fuerte",  color: "#16a34a" },
  media:  { text: "Prueba media",   color: "#d97706" },
  débil:  { text: "Prueba débil",   color: "#dc2626" },
}

const MONTH_SHORT: Record<string, string> = {
  "01":"Ene","02":"Feb","03":"Mar","04":"Abr",
  "05":"May","06":"Jun","07":"Jul","08":"Ago",
  "09":"Sep","10":"Oct","11":"Nov","12":"Dic",
}

function formatFechas(fechas: string[]): string {
  if (fechas.length === 0) return "—"
  const fmt = (ym: string) => {
    const [y, m] = ym.split("-")
    return `${MONTH_SHORT[m] ?? m} ${String(y).slice(2)}`
  }
  if (fechas.length === 1) return fmt(fechas[0])
  if (fechas.length === 2) return fechas.map(fmt).join(" · ")
  return `${fmt(fechas[0])} – ${fmt(fechas[fechas.length - 1])} (${fechas.length}m)`
}

export async function POST(req: NextRequest) {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) return NextResponse.json({ ok: false })

  let token: string
  let veredicto: Veredicto
  let months: MonthSummary[]
  let creditsRemaining: number
  let validDocs: ValidDocSummary[]
  let invalidDocs: InvalidDocSummary[]

  try {
    const body      = await req.json()
    token           = (body.token as string)?.trim()
    veredicto       = body.veredicto as Veredicto
    months          = body.months as MonthSummary[]
    creditsRemaining = typeof body.creditsRemaining === "number" ? body.creditsRemaining : 0
    validDocs       = Array.isArray(body.validDocs)   ? body.validDocs   : []
    invalidDocs     = Array.isArray(body.invalidDocs) ? body.invalidDocs : []
    if (!token || !veredicto || !months) return NextResponse.json({ ok: false })
  } catch {
    return NextResponse.json({ ok: false })
  }

  const supabase = createServerClient()
  const { data: userData } = await supabase
    .from("clasificador_tokens")
    .select("email, nombre")
    .eq("token", token)
    .maybeSingle()

  if (!userData?.email) return NextResponse.json({ ok: false }, { status: 403 })

  const email     = userData.email
  const nombre    = userData.nombre ?? ""
  const firstName = escapeHtml(nombre.split(" ")[0] || "usuario")
  const vConfig   = VEREDICTO_LABEL[veredicto] ?? VEREDICTO_LABEL["NO_CUMPLE"]

  const statusIcon = (s: MonthSummary["status"]) =>
    s === "CUBIERTO" ? "✅" : s === "DÉBIL" ? "⚠️" : "❌"

  // ── Tabla de meses ───────────────────────────────────────────────────────────
  const monthRows = months.map((m) => `
    <tr>
      <td style="padding:6px 12px;font-size:14px;color:#3f3f46;">${statusIcon(m.status)} ${escapeHtml(m.label)}</td>
      <td style="padding:6px 12px;font-size:13px;font-weight:600;color:${
        m.status === "CUBIERTO" ? "#16a34a" : m.status === "DÉBIL" ? "#d97706" : "#dc2626"
      };">${
        m.status === "CUBIERTO" ? "Cubierto"
        : m.status === "DÉBIL"  ? "Cobertura débil"
        : m.isOptional          ? "Mes opcional"
        : "Sin documentos"
      }</td>
    </tr>`).join("")

  // ── Lista de documentos válidos ──────────────────────────────────────────────
  const validDocsRows = validDocs.length > 0
    ? validDocs.map((d) => {
        const fuerza = FUERZA_LABEL[d.fuerza] ?? FUERZA_LABEL["débil"]
        return `
    <tr style="border-bottom:1px solid #f4f4f5;">
      <td style="padding:8px 12px;font-size:13px;color:#3f3f46;">
        <span style="font-weight:600;color:#18181b;">${escapeHtml(d.tipo)}</span><br/>
        <span style="color:#71717a;">${escapeHtml(d.descripcion_breve)}</span>
      </td>
      <td style="padding:8px 12px;font-size:13px;color:#52525b;white-space:nowrap;">${escapeHtml(formatFechas(d.fechas))}</td>
      <td style="padding:8px 12px;font-size:12px;font-weight:600;color:${fuerza.color};white-space:nowrap;">${fuerza.text}</td>
    </tr>`
      }).join("")
    : `<tr><td colspan="3" style="padding:12px;font-size:13px;color:#71717a;text-align:center;">Ningún documento válido encontrado</td></tr>`

  // ── Lista de documentos descartados ─────────────────────────────────────────
  const invalidDocsSection = invalidDocs.length > 0
    ? `
      <p style="margin:24px 0 8px;font-size:13px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:.05em;">
        Documentos descartados (${invalidDocs.length})
      </p>
      <table width="100%" cellpadding="0" cellspacing="0"
             style="border:1px solid #e4e4e7;border-radius:8px;overflow:hidden;margin-bottom:8px;">
        <tbody>
          ${invalidDocs.map((d) => `
          <tr style="border-bottom:1px solid #f4f4f5;">
            <td style="padding:7px 12px;font-size:13px;color:#71717a;">
              ${escapeHtml(d.tipo)}${d.descripcion_breve ? ` — ${escapeHtml(d.descripcion_breve)}` : ""}
            </td>
            <td style="padding:7px 12px;font-size:12px;color:#dc2626;">${escapeHtml(d.motivo_rechazo ?? "No válido")}</td>
          </tr>`).join("")}
        </tbody>
      </table>`
    : ""

  // ── CTA según veredicto ──────────────────────────────────────────────────────
  const ctaBlock = veredicto !== "CUMPLE"
    ? `<p style="margin:20px 0 8px;font-size:14px;color:#3f3f46;">
        ¿Necesitas ayuda para completar los meses que faltan? Un asesor de Legassi puede orientarte.
       </p>
       <a href="https://wa.me/34640049993?text=Hola%2C%20necesito%20ayuda%20con%20mi%20expediente%20de%20permanencia"
          style="display:inline-block;background:#16a34a;color:#fff;font-size:14px;font-weight:600;
                 text-decoration:none;padding:12px 24px;border-radius:8px;">
         Hablar con un asesor →
       </a>`
    : `<a href="https://legassi.es/herramientas/clasificador-documentos"
          style="display:inline-block;background:#b8941f;color:#fff;font-size:14px;font-weight:600;
                 text-decoration:none;padding:12px 24px;border-radius:8px;">
         Descargar expediente PDF →
       </a>`

  const resend = new Resend(resendKey)

  await resend.emails.send({
    from: "Legassi <noreply@legassi.es>",
    to: email,
    subject: `Resultado de tu análisis: ${vConfig.icon} ${vConfig.text} — Legassi`,
    html: `
<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0"
           style="background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">

      <!-- Header -->
      <tr><td style="background:#1a1a2e;padding:28px 32px;">
        <p style="margin:0;font-size:20px;font-weight:700;color:#fff;">Legassi · Clasificador de documentos</p>
      </td></tr>

      <!-- Body -->
      <tr><td style="padding:32px;">

        <p style="margin:0 0 4px;font-size:15px;color:#3f3f46;">Hola, <strong>${firstName}</strong>,</p>
        <p style="margin:0 0 20px;font-size:14px;color:#71717a;">
          Guarda este correo — es el resumen completo de tu análisis y puedes consultarlo siempre que lo necesites.
        </p>

        <!-- Veredicto -->
        <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:.05em;">Veredicto</p>
        <p style="margin:0 0 24px;font-size:17px;font-weight:700;color:${vConfig.color};">
          ${vConfig.icon} ${escapeHtml(vConfig.text)}
        </p>

        <!-- Tabla de meses -->
        <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:.05em;">
          Cobertura por mes
        </p>
        <table width="100%" cellpadding="0" cellspacing="0"
               style="border:1px solid #e4e4e7;border-radius:8px;overflow:hidden;margin-bottom:24px;">
          <thead>
            <tr style="background:#f4f4f5;">
              <th style="padding:8px 12px;text-align:left;font-size:12px;color:#71717a;font-weight:600;">Mes</th>
              <th style="padding:8px 12px;text-align:left;font-size:12px;color:#71717a;font-weight:600;">Estado</th>
            </tr>
          </thead>
          <tbody>${monthRows}</tbody>
        </table>

        <!-- Documentos válidos -->
        <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:.05em;">
          Documentos aceptados (${validDocs.length})
        </p>
        <table width="100%" cellpadding="0" cellspacing="0"
               style="border:1px solid #e4e4e7;border-radius:8px;overflow:hidden;margin-bottom:24px;">
          <thead>
            <tr style="background:#f4f4f5;">
              <th style="padding:8px 12px;text-align:left;font-size:12px;color:#71717a;font-weight:600;">Documento</th>
              <th style="padding:8px 12px;text-align:left;font-size:12px;color:#71717a;font-weight:600;">Meses</th>
              <th style="padding:8px 12px;text-align:left;font-size:12px;color:#71717a;font-weight:600;">Valor</th>
            </tr>
          </thead>
          <tbody>${validDocsRows}</tbody>
        </table>

        ${invalidDocsSection}

        <!-- CTA -->
        ${ctaBlock}

        <!-- Créditos restantes -->
        <p style="margin:24px 0 0;font-size:12px;color:#a1a1aa;">
          Te quedan <strong>${creditsRemaining} análisis</strong> disponibles en tu cuenta.
          Puedes volver a analizar en cualquier momento en legassi.es.
        </p>

      </td></tr>

      <!-- Footer -->
      <tr><td style="padding:20px 32px;border-top:1px solid #e4e4e7;">
        <p style="margin:0;font-size:12px;color:#a1a1aa;">Legassi · Despacho de extranjería online</p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body></html>`.trim(),
  }).catch((e) => console.error("[notify-analysis] email failed:", e))

  return NextResponse.json({ ok: true })
}

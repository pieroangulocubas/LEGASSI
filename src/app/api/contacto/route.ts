import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

const TIPO_LABELS: Record<string, string> = {
  preevaluacion: "Preevaluación de mi caso",
  precios:       "Consulta sobre precios",
  proceso:       "Cómo funciona LEGASSI",
  otro:          "Otro",
}

// Simple in-memory rate limit: max 3 requests per IP per 10 min
const recentRequests = new Map<string, number[]>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const window = 10 * 60 * 1000
  const hits = (recentRequests.get(ip) ?? []).filter(t => now - t < window)
  if (hits.length >= 3) return true
  recentRequests.set(ip, [...hits, now])
  return false
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"

  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Demasiados intentos. Inténtalo más tarde." }, { status: 429 })
  }

  let nombre = "", email = "", telefono = "", tipo = "", mensaje = "", honeypot = ""
  try {
    const body = await req.json()
    nombre    = (body.nombre   as string)?.trim().slice(0, 200) ?? ""
    email     = (body.email    as string)?.trim().toLowerCase().slice(0, 200) ?? ""
    telefono  = (body.telefono as string)?.trim().slice(0, 30)  ?? ""
    tipo      = (body.tipo     as string)?.trim().slice(0, 50)  ?? ""
    mensaje   = (body.mensaje  as string)?.trim().slice(0, 2000) ?? ""
    honeypot  = (body.website  as string) ?? "" // campo trampa
  } catch {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 })
  }

  // Bot check — honeypot
  if (honeypot) return NextResponse.json({ ok: true }) // silently discard

  if (!nombre || !email || !mensaje) {
    return NextResponse.json({ error: "Nombre, email y consulta son obligatorios." }, { status: 400 })
  }

  const tipoLabel = TIPO_LABELS[tipo] ?? tipo

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
      <div style="background:linear-gradient(135deg,#c97b1a,#8b5a2b);padding:28px 32px;border-radius:12px 12px 0 0">
        <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700">Nueva consulta recibida</h1>
        <p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:13px">Vía formulario de contacto · legassi.es</p>
      </div>
      <div style="background:#fff;padding:28px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;width:140px;color:#6b7280;font-size:13px;font-weight:600">Nombre</td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:14px">${nombre}</td></tr>
          <tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:13px;font-weight:600">Email</td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:14px"><a href="mailto:${email}" style="color:#c97b1a">${email}</a></td></tr>
          ${telefono ? `<tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:13px;font-weight:600">Teléfono</td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:14px">${telefono}</td></tr>` : ""}
          <tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:13px;font-weight:600">Tipo</td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:14px">${tipoLabel}</td></tr>
        </table>
        <div style="margin-top:20px">
          <p style="margin:0 0 8px;color:#6b7280;font-size:13px;font-weight:600">Consulta</p>
          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px;font-size:14px;line-height:1.6;white-space:pre-wrap">${mensaje}</div>
        </div>
        <div style="margin-top:20px;padding-top:16px;border-top:1px solid #f3f4f6">
          <p style="margin:0;color:#9ca3af;font-size:11px">Responder directamente a este email enviará la respuesta a <strong>${email}</strong></p>
        </div>
      </div>
    </div>
  `

  try {
    await resend.emails.send({
      from:     "LEGASSI Web <noreply@legassi.es>",
      to:       ["consulta@legassi.es"],
      replyTo:  email,
      subject:  `[${tipoLabel}] Consulta de ${nombre}`,
      html,
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[contacto] Resend error:", err)
    return NextResponse.json({ error: "No se pudo enviar. Escríbenos directamente a consulta@legassi.es" }, { status: 500 })
  }
}

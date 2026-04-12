import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { createServerClient } from "@/lib/supabase"

interface MonthSummary {
  label: string
  status: "CUBIERTO" | "DÉBIL" | "VACÍO"
  isOptional: boolean
}

const BUCKET = "clasificador-pdfs"

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export async function POST(req: NextRequest) {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) return NextResponse.json({ ok: false })

  let token: string
  let publicUrl: string
  let months: MonthSummary[]

  try {
    const body = await req.json()
    token = (body.token as string)?.trim()
    publicUrl = (body.publicUrl as string)?.trim()
    months = body.months as MonthSummary[]

    if (!token || !publicUrl || !months) {
      return NextResponse.json({ ok: false })
    }
  } catch {
    return NextResponse.json({ ok: false })
  }

  // Verify the token belongs to a real user and retrieve their data
  const supabase = createServerClient()
  const { data: userData } = await supabase
    .from("clasificador_tokens")
    .select("email, nombre")
    .eq("token", token)
    .maybeSingle()

  if (!userData?.email) {
    return NextResponse.json({ ok: false }, { status: 403 })
  }

  // Ensure the publicUrl points to our own storage bucket (prevent open redirect in email)
  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "") ?? ""
  const expectedPrefix = `${supabaseUrl}/storage/v1/object/`
  if (!publicUrl.startsWith(expectedPrefix) || !publicUrl.includes(`/${BUCKET}/`)) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const email = userData.email
  const nombre = userData.nombre ?? ""
  const firstName = escapeHtml(nombre.split(" ")[0] || "usuario")
  const safePublicUrl = encodeURI(publicUrl)

  const statusIcon = (s: MonthSummary["status"]) =>
    s === "CUBIERTO" ? "✅" : s === "DÉBIL" ? "⚠️" : "❌"

  const monthRows = months
    .map(
      (m) =>
        `<tr>
          <td style="padding:6px 12px;font-size:14px;color:#3f3f46;">${statusIcon(m.status)} ${m.label}</td>
          <td style="padding:6px 12px;font-size:13px;color:${
            m.status === "CUBIERTO" ? "#16a34a" : m.status === "DÉBIL" ? "#d97706" : "#dc2626"
          };font-weight:600;">${
            m.status === "CUBIERTO"
              ? "Cubierto"
              : m.status === "DÉBIL"
              ? "Cobertura débil"
              : m.isOptional
              ? "Mes opcional"
              : "Sin documentos"
          }</td>
        </tr>`
    )
    .join("")

  const resend = new Resend(resendKey)

  await resend.emails.send({
    from: "Legassi <noreply@legassi.es>",
    to: email,
    subject: "Tu expediente de permanencia está listo — Legassi",
    html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">
          <!-- Header -->
          <tr>
            <td style="background:#1a1a2e;padding:28px 32px;">
              <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;">
                Legassi · Clasificador de documentos
              </p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 8px;font-size:15px;color:#3f3f46;">Hola, <strong>${firstName}</strong>,</p>
              <p style="margin:0 0 20px;font-size:15px;color:#3f3f46;">
                Tu expediente de permanencia ha sido analizado con éxito.
                Aquí tienes el resumen de cobertura por mes:
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

              <p style="margin:0 0 24px;font-size:15px;color:#3f3f46;">
                Pulsa el botón para descargar o compartir tu expediente en PDF:
              </p>
              <a href="${safePublicUrl}"
                 style="display:inline-block;background:#b8941f;color:#ffffff;font-size:15px;
                        font-weight:600;text-decoration:none;padding:14px 28px;border-radius:8px;">
                Ver y descargar expediente →
              </a>
              <p style="margin:24px 0 0;font-size:12px;color:#a1a1aa;">
                Este enlace es permanente y puede compartirse con el funcionario o tu abogado.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #e4e4e7;">
              <p style="margin:0;font-size:12px;color:#a1a1aa;">
                Legassi · Despacho de extranjería online
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  })

  return NextResponse.json({ ok: true })
}

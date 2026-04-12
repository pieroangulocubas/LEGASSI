import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { createServerClient } from "@/lib/supabase"
import type { AntecedentesStatus } from "@/app/herramientas/antecedentes-penales-peru/types"

interface WebhookBody {
  dni: string
  status: AntecedentesStatus
  message?: string
  certificado_url?: string
  apostilla_url?: string
}

function buildCompletionEmail(
  nombreCompleto: string,
  dni: string,
  apostillaUrl: string,
  baseUrl: string
): string {
  const trackingUrl = `${baseUrl}/herramientas/antecedentes-penales-peru/seguimiento?dni=${dni}`

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Tu Apostilla está lista</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:#16a34a;padding:32px 40px;text-align:center;">
              <p style="margin:0;font-size:40px;">✅</p>
              <h1 style="margin:12px 0 0;font-size:22px;color:#ffffff;font-weight:700;">
                ¡Tu Apostilla está lista!
              </h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              <p style="margin:0 0 16px;font-size:15px;color:#374151;">
                Hola <strong>${nombreCompleto}</strong>,
              </p>
              <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
                Tu <strong>Certificado de Antecedentes Penales con Apostilla de Perú</strong> ha
                sido procesado con éxito y está disponible para descargar.
              </p>
              <!-- Download button -->
              <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
                <tr>
                  <td style="background:#16a34a;border-radius:8px;">
                    <a
                      href="${apostillaUrl}"
                      style="display:inline-block;padding:12px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;"
                    >
                      Descargar mi Apostilla
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;font-size:14px;color:#6b7280;">
                También puedes ver el estado completo de tu solicitud en:
              </p>
              <a
                href="${trackingUrl}"
                style="font-size:14px;color:#2563eb;word-break:break-all;"
              >
                ${trackingUrl}
              </a>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.5;">
                Este mensaje fue enviado por <strong>Legassi</strong> en relación a tu solicitud
                de Antecedentes Penales con DNI ${dni}. Si tienes alguna pregunta, responde a
                este correo o contáctanos.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function POST(req: NextRequest) {
  // ── Auth ───────────────────────────────────────────────────────────────────
  const secret = req.headers.get("x-webhook-secret")
  const expectedSecret = process.env.ANTECEDENTES_WEBHOOK_SECRET

  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // ── Parse body ─────────────────────────────────────────────────────────────
  let body: Partial<WebhookBody>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo de la solicitud inválido." }, { status: 400 })
  }

  const { dni, status, message, certificado_url, apostilla_url } = body

  if (!dni || !/^\d{8}$/.test(dni.trim())) {
    return NextResponse.json({ error: "Campo 'dni' inválido o ausente." }, { status: 400 })
  }

  if (!status) {
    return NextResponse.json({ error: "Campo 'status' requerido." }, { status: 400 })
  }

  const supabase = createServerClient()

  // ── Fetch existing record ──────────────────────────────────────────────────
  const { data: existing, error: fetchError } = await supabase
    .from("antecedentes_penales_peru")
    .select("id, nombre_completo, email, dni")
    .eq("dni", dni.trim())
    .maybeSingle()

  if (fetchError) {
    console.error("[antecedentes/webhook] fetch error:", fetchError)
    return NextResponse.json({ error: "Error al buscar la solicitud." }, { status: 500 })
  }

  if (!existing) {
    return NextResponse.json(
      { error: "No se encontró ninguna solicitud con ese DNI." },
      { status: 404 }
    )
  }

  // ── Build update payload ───────────────────────────────────────────────────
  const updatePayload: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (message) updatePayload.error_message = message
  if (certificado_url) updatePayload.certificado_url = certificado_url
  if (apostilla_url) updatePayload.apostilla_url = apostilla_url

  // ── Update record ──────────────────────────────────────────────────────────
  const { error: updateError } = await supabase
    .from("antecedentes_penales_peru")
    .update(updatePayload)
    .eq("id", existing.id)

  if (updateError) {
    console.error("[antecedentes/webhook] update error:", updateError)
    return NextResponse.json({ error: "Error al actualizar el estado." }, { status: 500 })
  }

  // ── Insert log entry ───────────────────────────────────────────────────────
  await supabase.from("antecedentes_penales_logs").insert({
    request_id: existing.id,
    step: status,
    message: message ?? null,
  })

  // ── Send completion email ──────────────────────────────────────────────────
  if (status === "completado" && apostilla_url) {
    const resendKey = process.env.RESEND_API_KEY

    if (resendKey) {
      const resend = new Resend(resendKey)

      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ??
        (req.headers.get("origin") || "https://legassi.es")

      try {
        await resend.emails.send({
          from: "Legassi <noreply@legassi.es>",
          to: [existing.email],
          subject: "Tu Apostilla de Antecedentes Penales de Perú está lista",
          html: buildCompletionEmail(
            existing.nombre_completo,
            existing.dni,
            apostilla_url,
            baseUrl
          ),
        })
      } catch (emailError) {
        // Non-fatal: log but don't fail the webhook response
        console.error("[antecedentes/webhook] email error:", emailError)
      }
    } else {
      console.warn("[antecedentes/webhook] RESEND_API_KEY not set, skipping email notification.")
    }
  }

  return NextResponse.json({ ok: true })
}

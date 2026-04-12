import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { createServerClient } from "@/lib/supabase"

export async function POST(req: NextRequest) {
  const resendKey = process.env.RESEND_API_KEY
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000"

  if (!resendKey) {
    return NextResponse.json({ error: "Servicio de email no configurado." }, { status: 500 })
  }

  let email: string
  try {
    const body = await req.json()
    email = (body.email as string)?.trim().toLowerCase()
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Email no válido." }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: "Petición inválida." }, { status: 400 })
  }

  const supabase = createServerClient()

  // Look up the most recent active token for this email
  const { data } = await supabase
    .from("clasificador_tokens")
    .select("token, credits, expires_at")
    .eq("email", email)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  // Email not found — tell the user so they can pay directly
  if (!data) {
    return NextResponse.json({ ok: true, notFound: true })
  }

  // Email found but no credits — block email explicitly.
  // Use (credits ?? 0) to safely handle null/undefined from Supabase at runtime.
  if ((data.credits ?? 0) <= 0) {
    return NextResponse.json({ ok: true, exhausted: true })
  }

  const recoveryLink = `${appUrl}/herramientas/clasificador-documentos?recover_token=${data.token}`

  const resend = new Resend(resendKey)

  await resend.emails.send({
    from: "Legassi <noreply@legassi.es>",
    to: email,
    subject: "Tu acceso al Clasificador de documentos",
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
              <p style="margin:0 0 16px;font-size:15px;color:#3f3f46;">Hola,</p>
              <p style="margin:0 0 16px;font-size:15px;color:#3f3f46;">
                Recibimos una solicitud de recuperación de acceso para esta dirección de correo.
                Tienes <strong>${data.credits} análisis disponibles</strong>.
              </p>
              <p style="margin:0 0 24px;font-size:15px;color:#3f3f46;">
                Pulsa el botón para recuperar tu acceso directamente en el navegador:
              </p>
              <a href="${recoveryLink}"
                 style="display:inline-block;background:#b8941f;color:#ffffff;font-size:15px;
                        font-weight:600;text-decoration:none;padding:14px 28px;border-radius:8px;">
                Recuperar acceso →
              </a>
              <p style="margin:24px 0 0;font-size:12px;color:#a1a1aa;">
                Si no solicitaste esto, ignora este correo. El enlace es válido durante 24 horas.
                Tus análisis no caducan.
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

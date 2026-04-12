import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { Resend } from "resend"
import { createServerClient } from "@/lib/supabase"

const CREDITS_PER_PAYMENT = 7

function escapeHtml(s: string) {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
}

async function sendPaymentConfirmationEmail(email: string, nombre: string, credits: number) {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey || !email) return
  const resend   = new Resend(resendKey)
  const firstName = escapeHtml((nombre ?? "").split(" ")[0] || "usuario")
  await resend.emails.send({
    from: "Legassi <noreply@legassi.es>",
    to: email,
    subject: "¡Pago confirmado! Tus análisis están listos — Legassi",
    html: `
<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0"
           style="background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">
      <tr><td style="background:#1a1a2e;padding:28px 32px;">
        <p style="margin:0;font-size:20px;font-weight:700;color:#fff;">Legassi · Clasificador de documentos</p>
      </td></tr>
      <tr><td style="padding:32px;">
        <p style="margin:0 0 16px;font-size:15px;color:#3f3f46;">Hola, <strong>${firstName}</strong>,</p>
        <p style="margin:0 0 20px;font-size:15px;color:#3f3f46;">
          Tu pago se ha procesado correctamente. Tienes <strong>${credits} análisis disponibles</strong>
          para usar cuando quieras, con tu cuenta o con cualquier familiar.
        </p>
        <a href="https://legassi.es/herramientas/clasificador-documentos"
           style="display:inline-block;background:#b8941f;color:#fff;font-size:15px;font-weight:600;
                  text-decoration:none;padding:14px 28px;border-radius:8px;">
          Ir al clasificador →
        </a>
        <p style="margin:24px 0 0;font-size:12px;color:#a1a1aa;">
          Recuerda que puedes cambiar el nombre antes de cada análisis para verificar documentos
          de distintas personas con los mismos créditos.
        </p>
      </td></tr>
      <tr><td style="padding:20px 32px;border-top:1px solid #e4e4e7;">
        <p style="margin:0;font-size:12px;color:#a1a1aa;">Legassi · Despacho de extranjería online</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`.trim(),
  }).catch((e) => console.error("[verify] payment email failed:", e))
}

export async function GET(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    return NextResponse.json({ paid: false, error: "No configurado." }, { status: 500 })
  }

  const sessionId = req.nextUrl.searchParams.get("session_id")
  if (!sessionId) {
    return NextResponse.json({ paid: false, error: "session_id requerido." }, { status: 400 })
  }

  const stripe = new Stripe(secretKey)

  let session: Stripe.Checkout.Session
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId)
  } catch (err) {
    console.error("Stripe session retrieve error:", err)
    return NextResponse.json({ paid: false, error: "No se pudo verificar el pago." }, { status: 400 })
  }

  if (session.payment_status !== "paid") {
    return NextResponse.json({ paid: false })
  }

  const supabase = createServerClient()

  // Idempotent: return existing record if this session was already processed
  const { data: bySession } = await supabase
    .from("clasificador_tokens")
    .select("token, credits, email, nombre, telefono")
    .eq("stripe_session_id", sessionId)
    .maybeSingle()

  if (bySession) {
    return NextResponse.json({
      paid: true,
      token: bySession.token,
      credits: bySession.credits,
      email: bySession.email,
      nombre: bySession.nombre,
      telefono: bySession.telefono,
    })
  }

  const email         = session.customer_details?.email ?? session.customer_email ?? null
  const nombre        = session.metadata?.nombre        ?? null
  const telefono      = session.metadata?.telefono      ?? null
  const existingToken = session.metadata?.existing_token ?? null

  // Priority 1: returning user has their token in metadata — top it up directly
  if (existingToken) {
    const { data: byToken } = await supabase
      .from("clasificador_tokens")
      .select("token, credits, nombre, telefono, email")
      .eq("token", existingToken)
      .maybeSingle()

    if (byToken) {
      const newCredits = byToken.credits + CREDITS_PER_PAYMENT
      await supabase
        .from("clasificador_tokens")
        .update({
          credits: newCredits,
          is_freemium: false,
          stripe_session_id: sessionId,
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          ...(email    ? { email }    : {}),
          ...(telefono && !byToken.telefono ? { telefono } : {}),
        })
        .eq("token", existingToken)

      const finalEmail  = byToken.email ?? email
      const finalNombre = byToken.nombre ?? nombre ?? ""
      await sendPaymentConfirmationEmail(finalEmail ?? "", finalNombre, newCredits)

      return NextResponse.json({
        paid: true,
        token: byToken.token,
        credits: newCredits,
        email: finalEmail,
        nombre: finalNombre,
        telefono: byToken.telefono ?? telefono,
      })
    }
  }

  // Priority 2: returning user identified by email → top up credits on their existing token
  if (email) {
    const { data: byEmail } = await supabase
      .from("clasificador_tokens")
      .select("token, credits, nombre, telefono")
      .eq("email", email)
      .maybeSingle()

    if (byEmail) {
      const newCredits = byEmail.credits + CREDITS_PER_PAYMENT
      await supabase
        .from("clasificador_tokens")
        .update({
          credits: newCredits,
          is_freemium: false,
          stripe_session_id: sessionId,
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq("email", email)

      await sendPaymentConfirmationEmail(email, byEmail.nombre ?? nombre ?? "", newCredits)

      return NextResponse.json({
        paid: true,
        token: byEmail.token,
        credits: newCredits,
        email,
        nombre: byEmail.nombre ?? nombre,
        telefono: byEmail.telefono ?? telefono,
      })
    }
  }

  // New user → insert fresh token
  const token = crypto.randomUUID()
  const { error } = await supabase.from("clasificador_tokens").insert({
    token,
    email,
    nombre,
    telefono,
    credits: CREDITS_PER_PAYMENT,
    is_freemium: false,
    stripe_session_id: sessionId,
  })

  if (error) {
    console.error("Supabase insert error:", error)
    return NextResponse.json({ paid: false, error: "Error al registrar el pago." }, { status: 500 })
  }

  await sendPaymentConfirmationEmail(email ?? "", nombre ?? "", CREDITS_PER_PAYMENT)

  return NextResponse.json({ paid: true, token, credits: CREDITS_PER_PAYMENT, email, nombre, telefono })
}

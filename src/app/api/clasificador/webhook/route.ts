import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createServerClient } from "@/lib/supabase"

const CREDITS_PER_PAYMENT = 7

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!secretKey || !webhookSecret) {
    console.error("Webhook: missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET")
    return NextResponse.json({ error: "No configurado." }, { status: 500 })
  }

  const rawBody = await req.text()
  const sig = req.headers.get("stripe-signature")

  if (!sig) {
    return NextResponse.json({ error: "Missing Stripe-Signature header." }, { status: 400 })
  }

  const stripe = new Stripe(secretKey)

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 })
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session

    if (session.payment_status !== "paid") {
      return NextResponse.json({ received: true })
    }

    const supabase = createServerClient()

    // Idempotent: skip if this session was already processed
    const { data: bySession } = await supabase
      .from("clasificador_tokens")
      .select("token")
      .eq("stripe_session_id", session.id)
      .maybeSingle()

    if (bySession) {
      return NextResponse.json({ received: true })
    }

    const email    = session.customer_details?.email ?? session.customer_email ?? null
    const nombre   = session.metadata?.nombre   ?? null
    const telefono = session.metadata?.telefono ?? null

    // Returning user (same email) → top up credits on their existing token
    if (email) {
      const { data: byEmail } = await supabase
        .from("clasificador_tokens")
        .select("token, credits")
        .eq("email", email)
        .maybeSingle()

      if (byEmail) {
        const newCredits = byEmail.credits + CREDITS_PER_PAYMENT
        const { error } = await supabase
          .from("clasificador_tokens")
          .update({
            credits: newCredits,
            stripe_session_id: session.id,
            expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .eq("email", email)

        if (error) {
          console.error("[webhook] Supabase update error:", error)
        } else {
          console.log(`[webhook] Credits topped up for ${email}: ${newCredits}`)
        }
        return NextResponse.json({ received: true })
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
      stripe_session_id: session.id,
    })

    if (error) {
      console.error("[webhook] Supabase insert error:", error)
    } else {
      console.log(`[webhook] New token issued for session ${session.id}`)
    }
  }

  return NextResponse.json({ received: true })
}

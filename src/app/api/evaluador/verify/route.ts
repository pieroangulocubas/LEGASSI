import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id")
  if (!sessionId) {
    return NextResponse.json({ error: "session_id requerido" }, { status: 400 })
  }

  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    return NextResponse.json({ error: "Servicio no disponible." }, { status: 503 })
  }

  try {
    const stripe = new Stripe(secretKey)
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Pago no completado." }, { status: 402 })
    }

    return NextResponse.json({
      token: sessionId,
      email: session.customer_email ?? "",
    })
  } catch (err) {
    console.error("Stripe verify evaluador:", err)
    return NextResponse.json({ error: "No se pudo verificar el pago." }, { status: 500 })
  }
}

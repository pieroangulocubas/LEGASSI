import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    return NextResponse.json(
      { error: "Pasarela de pago no configurada." },
      { status: 500 }
    )
  }

  const stripe = new Stripe(secretKey)

  const origin =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    req.headers.get("origin") ||
    "http://localhost:3000"

  const returnUrl = `${origin}/herramientas/clasificador-documentos`

  // Read form data passed from the client
  let nombre = ""
  let telefono = ""
  let email = ""
  let existingToken = ""
  try {
    const body = await req.json()
    nombre        = (body.nombre         as string)?.trim().slice(0, 200) ?? ""
    telefono      = (body.telefono       as string)?.trim().slice(0, 30)  ?? ""
    email         = (body.email          as string)?.trim().toLowerCase() ?? ""
    existingToken = (body.existingToken  as string)?.trim().slice(0, 100) ?? ""
  } catch {
    // Non-fatal — proceed without metadata
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      // Pre-fill the email so Stripe stores the same address we have in our form
      ...(email ? { customer_email: email } : {}),
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: 790, // 7,90 €
            product_data: {
              name: "Clasificador de documentos — análisis IA",
              description:
                "7 análisis de documentos de permanencia con IA, clasificación por meses y generación del expediente en PDF.",
              images: [
                `${origin}/legassi_despacho_online.png`,
              ],
            },
          },
          quantity: 1,
        },
      ],
      // Store form data so verify/webhook can persist it without a second round-trip
      metadata: {
        nombre,
        telefono,
        ...(existingToken ? { existing_token: existingToken } : {}),
      },
      success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${returnUrl}?cancelled=true`,
      locale: "es",
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error("Stripe checkout error:", err)
    return NextResponse.json(
      { error: "No se pudo iniciar el proceso de pago. Inténtalo de nuevo." },
      { status: 500 }
    )
  }
}

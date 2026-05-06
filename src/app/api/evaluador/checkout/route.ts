import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    return NextResponse.json({ error: "Pasarela de pago no configurada." }, { status: 500 })
  }

  const stripe = new Stripe(secretKey)
  const origin =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    req.headers.get("origin") ||
    "http://localhost:3000"

  const returnUrl = `${origin}/herramientas/evaluador-regularizacion`

  let nombre = "", email = ""
  try {
    const body = await req.json()
    nombre = (body.nombre as string)?.trim().slice(0, 200) ?? ""
    email  = (body.email  as string)?.trim().toLowerCase() ?? ""
  } catch { /* non-fatal */ }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      ...(email ? { customer_email: email } : {}),
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: 990, // 9,90 €
            product_data: {
              name: "Kit Expediente Regularización 2026",
              description:
                "Formulario oficial EX31/EX32 pre-rellenado con tus datos + verificación IA de todos los documentos del expediente + sugerencias presenciales y telemáticas.",
              images: [`${origin}/legassi_despacho_online.png`],
            },
          },
          quantity: 1,
        },
      ],
      metadata: { nombre },
      success_url: `${returnUrl}?evaluador_session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${returnUrl}?evaluador_cancelled=true`,
      locale: "es",
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error("Stripe checkout evaluador:", err)
    return NextResponse.json(
      { error: "No se pudo iniciar el proceso de pago. Inténtalo de nuevo." },
      { status: 500 },
    )
  }
}

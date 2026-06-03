import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST(req: NextRequest) {
  let email: string | null = null
  try {
    const body = await req.json()
    email = (body.email as string)?.trim().toLowerCase() || null
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  if (!email) return NextResponse.json({ ok: false, error: "Email requerido" }, { status: 400 })

  const supabase = createServerClient()
  const { error } = await supabase
    .from("newsletter_subscribers")
    .upsert({ email }, { onConflict: "email", ignoreDuplicates: true })

  if (error) {
    console.error("[newsletter] Supabase error:", error.message)
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

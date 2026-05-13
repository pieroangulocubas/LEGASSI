import { NextRequest, NextResponse } from "next/server"
import { createToken, COOKIE_NAME, COOKIE_MAX_AGE } from "@/lib/auth"

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  const validEmail = process.env.ADMIN_EMAIL
  const validPassword = process.env.ADMIN_PASSWORD

  if (!validEmail || !validPassword) {
    return NextResponse.json({ error: "Admin credentials not configured" }, { status: 500 })
  }

  if (email !== validEmail || password !== validPassword) {
    return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 })
  }

  const token = await createToken()
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  })
  return res
}

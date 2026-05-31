export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { timingSafeEqual } from "crypto"
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import { createToken, COOKIE_NAME, COOKIE_MAX_AGE } from "@/lib/auth"

function safeEqual(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a)
    const bufB = Buffer.from(b)
    if (bufA.length !== bufB.length) {
      // Compare against dummy buffer to avoid length-based timing leak
      timingSafeEqual(bufA, Buffer.alloc(bufA.length))
      return false
    }
    return timingSafeEqual(bufA, bufB)
  } catch {
    return false
  }
}

function buildRatelimiter(): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(5, "1 m"),
    prefix: "admin_login",
  })
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "anonymous"

  const ratelimiter = buildRatelimiter()
  if (ratelimiter) {
    const { success } = await ratelimiter.limit(ip)
    if (!success) {
      return NextResponse.json({ error: "Demasiados intentos. Espera 1 minuto." }, { status: 429 })
    }
  }

  const body = await req.json().catch(() => ({}))
  const { email, password } = body as { email?: string; password?: string }

  const validEmail = process.env.ADMIN_EMAIL
  const validPassword = process.env.ADMIN_PASSWORD

  if (!validEmail || !validPassword) {
    return NextResponse.json({ error: "Admin credentials not configured" }, { status: 500 })
  }

  if (!email || !password || !safeEqual(email, validEmail) || !safeEqual(password, validPassword)) {
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

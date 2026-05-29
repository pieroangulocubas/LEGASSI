import { SignJWT, jwtVerify } from "jose"
import type { NextRequest } from "next/server"

function resolveJwtSecret(): string {
  const secret = process.env.JWT_SECRET

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET is required in production")
    }
    console.warn("[auth] JWT_SECRET not set — using dev-only fallback. Set JWT_SECRET in .env.local.")
    return "dev-secret-local-only-never-use-in-production"
  }

  if (process.env.NODE_ENV === "production" && secret.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters in production")
  }

  return secret
}

const SECRET = new TextEncoder().encode(resolveJwtSecret())

export const COOKIE_NAME = "admin_session"
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export async function createToken(): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET)
}

export async function verifyToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload.role === "admin"
  } catch {
    return false
  }
}

export async function requireAuth(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(COOKIE_NAME)?.value
  return !!token && verifyToken(token)
}

import { SignJWT, jwtVerify } from "jose"

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "dev-secret-change-in-production"
)

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
    await jwtVerify(token, SECRET)
    return true
  } catch {
    return false
  }
}

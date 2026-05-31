import { describe, it, expect, beforeAll } from "vitest"

// Set required env vars before module import
beforeAll(() => {
  process.env.JWT_SECRET = "test-secret-that-is-long-enough-32chars"
})

// Dynamically import to pick up the env var set above
const getAuth = () => import("./auth")

describe("verifyToken", () => {
  it("returns true for a valid admin token", async () => {
    const { createToken, verifyToken } = await getAuth()
    const token = await createToken()
    expect(await verifyToken(token)).toBe(true)
  })

  it("returns false for a tampered token", async () => {
    const { createToken, verifyToken } = await getAuth()
    const token = await createToken()
    const tampered = token.slice(0, -4) + "XXXX"
    expect(await verifyToken(tampered)).toBe(false)
  })

  it("returns false for an empty string", async () => {
    const { verifyToken } = await getAuth()
    expect(await verifyToken("")).toBe(false)
  })

  it("returns false for a random string", async () => {
    const { verifyToken } = await getAuth()
    expect(await verifyToken("not.a.jwt")).toBe(false)
  })
})

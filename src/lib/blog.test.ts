import { describe, it, expect, vi } from "vitest"

// Mock Supabase so blog.ts can be imported without a real DB connection
vi.mock("@/lib/supabase", () => ({
  createServerClient: vi.fn(),
}))

import { formatDate } from "./blog"

describe("formatDate", () => {
  it("formats a valid ISO date in Spanish locale", () => {
    const result = formatDate("2026-01-15T00:00:00Z")
    expect(result).toContain("2026")
    expect(result).toContain("enero")
    expect(result).toContain("15")
  })

  it("returns empty string for an empty input", () => {
    expect(formatDate("")).toBe("")
  })
})

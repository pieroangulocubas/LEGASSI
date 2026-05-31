import { describe, it, expect } from "vitest"
import { evaluateEligibility } from "./logic"
import type { QuizAnswers } from "./types"

function buildAnswers(overrides: Partial<QuizAnswers> = {}): QuizAnswers {
  return {
    forWhom: "self",
    inSpainBefore2026: true,
    permitStatus: "none",
    hasChildrenToRegularize: false,
    isUkrainian: false,
    hasPiHistory: false,
    da20IncludesFamily: false,
    da21Supuesto: "work_history",
    familyType: null,
    minorCount: null,
    minorsBornInSpain: null,
    minorsSchooled: null,
    bothParentsCohabiting: null,
    otherParentInSpain: null,
    familySimultaneous: null,
    familyMembers: [],
    permanenceDocs: ["empadronamiento"],
    criminalStatus: "clean",
    passportStatus: "valid",
    ...overrides,
  }
}

describe("evaluateEligibility", () => {
  it("marca como no elegible si no estaba en Espana antes de 2026", () => {
    const result = evaluateEligibility(
      buildAnswers({
        inSpainBefore2026: false,
      })
    )

    expect(result.eligible).toBe(false)
    expect(result.pathway).toBe("ineligible")
    expect(result.score).toBe(0)
    expect(result.ineligibleReason).toContain("1 de enero de 2026")
  })

  it("usa la via EX25 si tiene residencia y desea regularizar hijos", () => {
    const result = evaluateEligibility(
      buildAnswers({
        permitStatus: "has_permit",
        hasChildrenToRegularize: true,
      })
    )

    expect(result.eligible).toBe(true)
    expect(result.pathway).toBe("EX25_children")
    expect(result.formName).toBe("EX25")
    expect(result.checklist.some((item) => item.id === "form_ex25")).toBe(true)
  })

  it("bloquea DA21 cuando no se acredita ningun supuesto", () => {
    const result = evaluateEligibility(
      buildAnswers({
        hasPiHistory: false,
        da21Supuesto: null,
      })
    )

    expect(result.eligible).toBe(false)
    expect(result.pathway).toBe("ineligible")
    expect(result.ineligibleReason).toContain("DA21")
  })

  it("incluye documentacion PI en la via DA20", () => {
    const result = evaluateEligibility(
      buildAnswers({
        hasPiHistory: true,
        da21Supuesto: null,
      })
    )

    expect(result.pathway).toBe("DA20")
    expect(result.checklist.some((item) => item.id === "pi_docs")).toBe(true)
  })

  it("incluye certificado de vulnerabilidad cuando aplica DA21 por vulnerabilidad", () => {
    const result = evaluateEligibility(
      buildAnswers({
        hasPiHistory: false,
        da21Supuesto: "vulnerability",
      })
    )

    expect(result.pathway).toBe("DA21")
    expect(result.checklist.some((item) => item.id === "vulnerability_cert")).toBe(true)
  })
})

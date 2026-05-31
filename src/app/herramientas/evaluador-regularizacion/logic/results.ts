import type { EligibilityResult } from "../types"

export function buildIneligibleResult(params: {
  days: number
  reason: string
  recommendations: string[]
}): EligibilityResult {
  const { days, reason, recommendations } = params
  return {
    eligible: false,
    pathway: "ineligible",
    score: 0,
    scoreLabel: "No elegible",
    ineligibleReason: reason,
    checklist: [],
    recommendations,
    formName: null,
    formUrl: null,
    deadlineDays: days,
    hasSimultaneousFamily: false,
  }
}

import type {
  PresentationMonth,
  DocumentResult,
  MonthCoverage,
  MonthStatus,
  Veredicto,
  AnalysisResult,
} from "./types"

export const MONTH_LABELS: Record<string, string> = {
  "2025-11": "Noviembre 2025",
  "2025-12": "Diciembre 2025",
  "2026-01": "Enero 2026",
  "2026-02": "Febrero 2026",
  "2026-03": "Marzo 2026",
  "2026-04": "Abril 2026",
  "2026-05": "Mayo 2026",
  "2026-06": "Junio 2026",
}

export const PRESENTATION_MONTH_LABELS: Record<PresentationMonth, string> = {
  "2026-04": "Abril 2026",
  "2026-05": "Mayo 2026",
  "2026-06": "Junio 2026",
}

export const TEMPORAL_WINDOWS: Record<
  PresentationMonth,
  { required: string[]; optional: string[] }
> = {
  "2026-04": {
    required: ["2025-11", "2025-12", "2026-01", "2026-02", "2026-03"],
    optional: ["2026-04"],
  },
  "2026-05": {
    required: ["2025-12", "2026-01", "2026-02", "2026-03", "2026-04"],
    optional: ["2026-05"],
  },
  "2026-06": {
    required: ["2026-01", "2026-02", "2026-03","2026-04", "2026-05"],
    optional: ["2026-06"],
  },
}

// Short label: "Nov 25", "Feb 26", etc.
function shortMonthLabel(ym: string): string {
  const SHORT: Record<string, string> = {
    "01":"Ene","02":"Feb","03":"Mar","04":"Abr",
    "05":"May","06":"Jun","07":"Jul","08":"Ago",
    "09":"Sep","10":"Oct","11":"Nov","12":"Dic",
  }
  const [y, m] = ym.split("-")
  return `${SHORT[m] ?? m} ${String(y).slice(2)}`
}

// Compact range for display: "Nov 25", "Nov 25 · Dic 25", "Feb 23 – Jul 23 (6m)"
export function formatFechasRange(fechas: string[]): string {
  if (fechas.length === 0) return "—"
  if (fechas.length === 1) return MONTH_LABELS[fechas[0]] ?? fechas[0]
  if (fechas.length === 2) return fechas.map(shortMonthLabel).join(" · ")
  return `${shortMonthLabel(fechas[0])} – ${shortMonthLabel(fechas[fechas.length - 1])} (${fechas.length}m)`
}

export function runRulesEngine(
  geminiResults: DocumentResult[],
  presentationMonth: PresentationMonth
): AnalysisResult {
  const window = TEMPORAL_WINDOWS[presentationMonth] // recoge que meses son obligatorios y cuales son opcionalees para el mes de presentación seleccionado
  const allMonths = [...window.required, ...window.optional] // los coloca en un solo array

  const monthsMap = new Map<string, DocumentResult[]>() // creamos uno nuevo mapa donde la clave es cada mes y el valor son docuemntos válido que cubren ese mes
  for (const m of allMonths) {
    monthsMap.set(m, [])
  }

  const observadoDocs: DocumentResult[] = []
  const invalidDocs: DocumentResult[] = []

  for (const doc of geminiResults) {
    if (doc.observado) {
      // Partial name match — shown separately, not counted in coverage until reviewed
      observadoDocs.push(doc)
      continue
    }

    if (!doc.valido) {
      invalidDocs.push(doc)
      continue
    }

    const coveredMonths = doc.fechas.filter((ym) => monthsMap.has(ym))
    if (coveredMonths.length === 0) {
      // Válido como documento pero fuera de la ventana temporal → también inválido a efectos del expediente
      invalidDocs.push(doc)
    } else {
      for (const ym of coveredMonths) {
        monthsMap.get(ym)!.push(doc)
      }
    }
  }

  const months: MonthCoverage[] = allMonths.map((ym) => {
    const docs = monthsMap.get(ym) || []
    const isOptional = window.optional.includes(ym)

    let status: MonthStatus = "VACÍO"
    if (docs.length > 0) {
      const hasFuerteOrMedia = docs.some(
        (d) => d.fuerza === "fuerte" || d.fuerza === "media"
      )
      status = hasFuerteOrMedia ? "CUBIERTO" : "DÉBIL"
    }

    return {
      yearMonth: ym,
      label: MONTH_LABELS[ym] || ym,
      status,
      docs,
      isOptional,
    }
  })

  const requiredMonths = months.filter((m) => !m.isOptional)
  let veredicto: Veredicto
  if (requiredMonths.some((m) => m.status === "VACÍO")) {
    veredicto = "NO_CUMPLE"
  } else if (requiredMonths.some((m) => m.status === "DÉBIL")) {
    veredicto = "CUMPLE_PARCIALMENTE"
  } else {
    veredicto = "CUMPLE"
  }

  // validDocs = solo los que están dentro de la ventana temporal, en orden cronológico
  const validDocs = months
    .flatMap((m) => m.docs)
    .sort((a, b) => (a.fechas[0] ?? "").localeCompare(b.fechas[0] ?? ""))

  return { veredicto, months, observadoDocs, invalidDocs, validDocs }
}

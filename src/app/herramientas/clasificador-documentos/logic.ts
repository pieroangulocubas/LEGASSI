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

function areConsecutive(sorted: string[]): boolean {
  for (let i = 1; i < sorted.length; i++) {
    const [py, pm] = sorted[i - 1].split("-").map(Number)
    const expectedY = pm === 12 ? py + 1 : py
    const expectedM = pm === 12 ? 1 : pm + 1
    const expected = `${expectedY}-${String(expectedM).padStart(2, "0")}`
    if (sorted[i] !== expected) return false
  }
  return true
}

// Consecutive range → "Sep 24 – Abr 26"; non-consecutive → "Nov 24, Ene 25, Mar 25"
export function formatFechasRange(fechas: string[]): string {
  if (fechas.length === 0) return "—"
  if (fechas.length === 1) return MONTH_LABELS[fechas[0]] ?? fechas[0]
  const sorted = [...fechas].sort()
  if (areConsecutive(sorted)) {
    return `${shortMonthLabel(sorted[0])} – ${shortMonthLabel(sorted[sorted.length - 1])}`
  }
  return sorted.map(shortMonthLabel).join(", ")
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

    const isContrato = doc.tipo === "contrato" || doc.tipo === "contrato de trabajo" || doc.tipo === "contrato de alquiler"

    if (!doc.valido) {
      // Contratos nunca van a inválidos: al menos a observados para revisión manual
      if (isContrato) {
        observadoDocs.push(doc)
      } else {
        invalidDocs.push(doc)
      }
      continue
    }

    const coveredMonths = doc.fechas.filter((ym) => monthsMap.has(ym))
    if (coveredMonths.length === 0) {
      // Válido como documento pero fuera de la ventana temporal
      // Contratos → observados; resto → inválidos
      if (isContrato) {
        observadoDocs.push(doc)
      } else {
        invalidDocs.push(doc)
      }
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

const EMISION_NOTA = "Además, el mes en que se emitió este documento siempre se incluye como prueba de presencia: recoger o solicitar un documento acredita que la persona estaba físicamente en España ese mes."

// ─── Category mapping ─────────────────────────────────────────────────────────

export const CATEGORY_BADGE_CFG: Record<string, { bg: string; text: string; label: string }> = {
  "Domicilio":      { bg: "bg-blue-100 dark:bg-blue-900/30",    text: "text-blue-700 dark:text-blue-300",     label: "Domicilio" },
  "Laboral":        { bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-700 dark:text-indigo-300", label: "Laboral" },
  "Sanitaria":      { bg: "bg-rose-100 dark:bg-rose-900/30",    text: "text-rose-700 dark:text-rose-300",     label: "Sanitaria" },
  "Económica":      { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300", label: "Económica" },
  "Vida Diaria":    { bg: "bg-amber-100 dark:bg-amber-900/30",  text: "text-amber-700 dark:text-amber-300",   label: "Vida Diaria" },
  "Administración": { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-300", label: "Administración" },
}

export function getCategoryForTipo(tipo: string): string | null {
  const cats: Record<string, string> = {
    "padrón":                   "Domicilio",
    "empadronamiento histórico":"Domicilio",
    "recibo de alquiler":       "Domicilio",
    "contrato de alquiler":     "Domicilio",
    "contrato":                 "Domicilio",
    "nómina":                   "Laboral",
    "certificado empresa":      "Laboral",
    "contrato de trabajo":      "Laboral",
    "historial médico":         "Sanitaria",
    "extracto bancario":        "Económica",
    "factura de servicios":     "Vida Diaria",
    "matrícula":                "Administración",
  }
  return cats[tipo] ?? null
}

// Returns a suggestion if a month's docs don't have 2+ different categories
export function getMonthSuggestion(docs: DocumentResult[]): string | null {
  if (docs.length === 0) return null
  const cats = [...new Set(docs.map((d) => getCategoryForTipo(d.tipo)).filter(Boolean))]
  if (cats.length < 2) return "Refuerza con un documento de otra categoría"
  return null
}

// ─── Criteria by type ────────────────────────────────────────────────────────

export function getCriterioPorTipo(tipo: string): string | null {
  const criterios: Record<string, string> = {
    "nómina":
      `Se toma el mes del periodo retributivo indicado en la nómina (el mes al que corresponde el salario, no necesariamente el mes de pago). ${EMISION_NOTA}`,
    "extracto bancario":
      `Se incluyen únicamente los meses en que aparecen transacciones, cargos o abonos reales realizados por el titular: uso de la cuenta en España. No se infiere presencia entre dos fechas. ${EMISION_NOTA}`,
    "contrato de trabajo":
      `Se incluye el periodo completo entre la fecha de inicio y la fecha de fin del contrato laboral. Si el contrato no tiene fecha de fin o es de duración indefinida, se toma solo el mes de inicio y se marca como indefinido. ${EMISION_NOTA}`,
    "contrato de alquiler":
      `Se incluye el periodo completo entre la fecha de inicio y la fecha de fin del contrato de arrendamiento. Si el contrato no tiene fecha de fin o es de duración indefinida, se toma solo el mes de inicio y se marca como indefinido. ${EMISION_NOTA}`,
    "contrato":
      `Se incluye el periodo completo entre la fecha de inicio y la fecha de fin del contrato. Si el contrato no tiene fecha de fin o es de duración indefinida, se toma solo el mes de inicio y se marca como indefinido. ${EMISION_NOTA}`,
    "certificado empresa":
      `Se toma el periodo de actividad laboral declarado en el certificado (desde cuándo hasta cuándo ha trabajado la persona en esa empresa). ${EMISION_NOTA}`,
    "padrón":
      `Se toman exclusivamente las fechas concretas que aparecen: fecha de expedición del certificado, fecha de alta en padrón y/o fecha de alta en vivienda. No se rellena el rango entre ninguna de estas fechas.`,
    "empadronamiento histórico":
      `Se toma el mes exacto de cada acción registral explícitamente listada: alta, modificación o baja. No se infieren meses entre una acción y la siguiente. ${EMISION_NOTA}`,
    "factura de servicios":
      `Se toma el mes del periodo de servicio facturado (el mes al que corresponde el consumo o servicio, no el mes de emisión de la factura). ${EMISION_NOTA}`,
    "recibo de alquiler":
      `Se incluye el periodo arrendado que indica el recibo. Si cubre varios meses, se incluyen todos. ${EMISION_NOTA}`,
    "historial médico":
      `Se incluyen únicamente los meses en que hay una cita, visita o atención médica explícitamente registrada. No se rellena el rango entre la primera y la última visita. ${EMISION_NOTA}`,
    "matrícula":
      `Se incluye el periodo académico completo entre la fecha de inicio y la fecha de fin del curso o matrícula. ${EMISION_NOTA}`,
  }
  return criterios[tipo] ?? `Mes de emisión del documento incluido como prueba de presencia. ${EMISION_NOTA}`
}

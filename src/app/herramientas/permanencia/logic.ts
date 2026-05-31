import type {
  PresentationMonth,
  DocumentResult,
  MonthCoverage,
  MonthStatus,
  Veredicto,
  AnalysisResult,
} from "./types"

export const MONTH_LABELS: Record<string, string> = {
  "2025-10": "Octubre 2025",
  "2025-11": "Noviembre 2025",
  "2025-12": "Diciembre 2025",
  "2026-01": "Enero 2026",
  "2026-02": "Febrero 2026",
  "2026-03": "Marzo 2026",
  "2026-04": "Abril 2026",
  "2026-05": "Mayo 2026",
  "2026-06": "Junio 2026",
  "2026-07": "Julio 2026",
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

// Card summary:
//   consecutive          → "Sep 24 – Abr 26"
//   non-consecutive ≤ 4  → "Nov 24, Ene 25, Mar 25"
//   non-consecutive > 4  → "Sep 24 – Abr 26 · 17m"
export function formatFechasCompact(fechas: string[]): string {
  if (fechas.length === 0) return "—"
  if (fechas.length === 1) return shortMonthLabel(fechas[0])
  const sorted = [...fechas].sort()
  if (areConsecutive(sorted)) {
    return `${shortMonthLabel(sorted[0])} – ${shortMonthLabel(sorted[sorted.length - 1])}`
  }
  if (sorted.length <= 4) return sorted.map(shortMonthLabel).join(", ")
  return `${shortMonthLabel(sorted[0])} – ${shortMonthLabel(sorted[sorted.length - 1])} · ${sorted.length}m`
}

// Groups consecutive months into runs: [[Sep24,Oct24,...,Ene25],[Feb25],[Abr25,...]]
export function groupConsecutiveMonths(fechas: string[]): string[][] {
  if (fechas.length === 0) return []
  const sorted = [...fechas].sort()
  const groups: string[][] = []
  let current: string[] = [sorted[0]]
  for (let i = 1; i < sorted.length; i++) {
    const [py, pm] = sorted[i - 1].split("-").map(Number)
    const ey = pm === 12 ? py + 1 : py
    const em = pm === 12 ? 1 : pm + 1
    if (sorted[i] === `${ey}-${String(em).padStart(2, "0")}`) {
      current.push(sorted[i])
    } else {
      groups.push(current)
      current = [sorted[i]]
    }
  }
  groups.push(current)
  return groups
}

// Formats a group of consecutive months as "Sep 24 – Ene 25" or "Feb 25"
export function formatGroupLabel(group: string[]): string {
  if (group.length === 0) return "—"
  if (group.length === 1) return shortMonthLabel(group[0])
  return `${shortMonthLabel(group[0])} – ${shortMonthLabel(group[group.length - 1])}`
}

function addMonths(ym: string, n: number): string {
  const [y, m] = ym.split("-").map(Number)
  const d = new Date(y, m - 1 + n, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

export function getBorderMonths(presentationMonth: PresentationMonth): { before: string; after: string } {
  const w = TEMPORAL_WINDOWS[presentationMonth]
  const sorted = [...w.required, ...w.optional].sort()
  return {
    before: addMonths(sorted[0], -1),
    after:  addMonths(sorted[sorted.length - 1], 1),
  }
}

export function runRulesEngine(
  geminiResults: DocumentResult[],
  presentationMonth: PresentationMonth,
  includedBorderMonths?: Set<string>,
  skippedMonths?: Set<string>
): AnalysisResult {
  const window = TEMPORAL_WINDOWS[presentationMonth]
  const allWindowMonths = [...window.required, ...window.optional]
  const includedBorders = includedBorderMonths ?? new Set<string>()

  // ±1 border months (just outside the window)
  const sortedWindow = [...allWindowMonths].sort()
  const borderBefore = addMonths(sortedWindow[0], -1)
  const borderAfter  = addMonths(sortedWindow[sortedWindow.length - 1], 1)
  const borderMonthSet = new Set([borderBefore, borderAfter])

  // All months in map = window + user-included border months, sorted chronologically
  const allMonths = [
    ...allWindowMonths,
    ...Array.from(includedBorders).filter(m => borderMonthSet.has(m)),
  ].sort()

  const monthsMap = new Map<string, DocumentResult[]>()
  for (const m of allMonths) {
    if (!monthsMap.has(m)) monthsMap.set(m, [])
  }

  const observadoDocs: DocumentResult[] = []
  const invalidDocs: DocumentResult[] = []
  const borderDocs: DocumentResult[] = []

  for (const doc of geminiResults) {
    const isContrato = doc.tipo === "contrato" || doc.tipo === "contrato de trabajo" || doc.tipo === "contrato de alquiler"

    // 1. Invalidity check first — a doc cannot appear in two buckets
    if (!doc.valido) {
      if (isContrato) observadoDocs.push(doc)
      else invalidDocs.push(doc)
      continue
    }

    // 2. Partial name match — valid doc but name needs manual confirmation
    if (doc.observado) {
      observadoDocs.push(doc)
      continue
    }

    // 3. Coverage check
    const coveredMonths = doc.fechas.filter((ym) => monthsMap.has(ym))
    if (coveredMonths.length === 0) {
      // Check if any fecha is in a border month (not yet included → not in monthsMap)
      const inBorder = doc.fechas.some((ym) => borderMonthSet.has(ym))
      if (inBorder) {
        borderDocs.push(doc)
      } else {
        if (isContrato) observadoDocs.push(doc)
        else invalidDocs.push(doc)
      }
    } else {
      for (const ym of coveredMonths) {
        monthsMap.get(ym)!.push(doc)
      }
    }
  }

  const months: MonthCoverage[] = allMonths.map((ym) => {
    const docs = monthsMap.get(ym) || []
    const isOptional  = window.optional.includes(ym)
    const isLimitrofe = includedBorders.has(ym)

    let status: MonthStatus = "VACÍO"
    if (docs.length > 0) {
      const hasFuerteOrMedia = docs.some(
        (d) => d.fuerza === "fuerte" || d.fuerza === "media"
      )
      status = hasFuerteOrMedia ? "CUBIERTO" : "DÉBIL"
    }

    return { yearMonth: ym, label: MONTH_LABELS[ym] || ym, status, docs, isOptional, isLimitrofe }
  })

  // Veredicto: only required months (non-optional, non-limítrofe, non-omitido)
  const requiredMonths = months.filter(
    (m) => !m.isOptional && !m.isLimitrofe && !skippedMonths?.has(m.yearMonth)
  )
  let veredicto: Veredicto
  if (requiredMonths.some((m) => m.status === "VACÍO")) {
    veredicto = "NO_CUMPLE"
  } else if (requiredMonths.some((m) => m.status === "DÉBIL")) {
    veredicto = "CUMPLE_PARCIALMENTE"
  } else {
    veredicto = "CUMPLE"
  }

  const validDocs = months
    .flatMap((m) => m.docs)
    .sort((a, b) => (a.fechas[0] ?? "").localeCompare(b.fechas[0] ?? ""))

  return { veredicto, months, observadoDocs, invalidDocs, validDocs, borderDocs }
}

const EMISION_NOTA = "Mes de emisión incluido."

// ─── Category mapping ─────────────────────────────────────────────────────────

export const CATEGORY_BADGE_CFG: Record<string, { bg: string; text: string; label: string }> = {
  "Domicilio":      { bg: "bg-blue-100 dark:bg-blue-900/30",    text: "text-blue-700 dark:text-blue-300",     label: "Domicilio" },
  "Laboral":        { bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-700 dark:text-indigo-300", label: "Laboral" },
  "Sanitaria":      { bg: "bg-rose-100 dark:bg-rose-900/30",    text: "text-rose-700 dark:text-rose-300",     label: "Sanitaria" },
  "Económica":      { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300", label: "Económica" },
  "Vida Diaria":    { bg: "bg-amber-100 dark:bg-amber-900/30",  text: "text-amber-700 dark:text-amber-300",   label: "Vida Diaria" },
  "Administración": { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-300", label: "Administración" },
  "Social":         { bg: "bg-teal-100 dark:bg-teal-900/30",    text: "text-teal-700 dark:text-teal-300",     label: "Social" },
}

export function getCategoryForTipo(tipo: string): string[] {
  const cats: Record<string, string[]> = {
    "padrón":                   ["Domicilio"],
    "empadronamiento histórico":["Domicilio"],
    "recibo de alquiler":       ["Domicilio"],
    "contrato de alquiler":     ["Domicilio"],
    "contrato":                 ["Domicilio"],
    "nómina":                   ["Laboral"],
    "certificado empresa":      ["Laboral"],
    "contrato de trabajo":      ["Laboral"],
    "historial médico":         ["Sanitaria"],
    "extracto bancario":        ["Económica"],
    "factura de servicios":     ["Vida Diaria"],
    "matrícula":                ["Administración", "Social"],
    "otro":                     ["Administración"],
  }
  return cats[tipo] ?? ["Administración"]
}

// Returns a suggestion if a month's docs don't have 2+ different categories
export function getMonthSuggestion(docs: DocumentResult[]): string | null {
  if (docs.length === 0) return null
  const cats = new Set(docs.flatMap((d) => getCategoryForTipo(d.tipo)))
  if (cats.size < 2) return "Refuerza con un documento de otra categoría"
  return null
}

// ─── Criteria by type ────────────────────────────────────────────────────────

export function getCriterioPorTipo(tipo: string): string | null {
  const criterios: Record<string, string> = {
    "nómina":
      `Mes del periodo retributivo al que corresponde el salario. ${EMISION_NOTA}`,
    "extracto bancario":
      `Meses con transacciones reales del titular. No se infiere presencia entre fechas. ${EMISION_NOTA}`,
    "contrato de trabajo":
      `Periodo entre fecha de inicio y fin del contrato laboral. Si es indefinido, solo el mes de inicio. ${EMISION_NOTA}`,
    "contrato de alquiler":
      `Periodo arrendado entre fecha de inicio y fin. Si es indefinido, solo el mes de inicio. ${EMISION_NOTA}`,
    "contrato":
      `Periodo entre fecha de inicio y fin del contrato. Si es indefinido, solo el mes de inicio. ${EMISION_NOTA}`,
    "certificado empresa":
      `Por cada situación laboral: rango entre fecha de alta y fecha de baja. Si la situación está activa (sin fecha de baja), el rango llega hasta el mes de emisión.`,
    "padrón":
      `Fechas concretas del documento: expedición, alta en padrón y/o alta en vivienda. No se rellena el rango entre ellas.`,
    "empadronamiento histórico":
      `Mes de cada acción registral explícita: alta, modificación o baja. No se infieren meses intermedios. ${EMISION_NOTA}`,
    "factura de servicios":
      `Mes del periodo de servicio facturado. ${EMISION_NOTA}`,
    "recibo de alquiler":
      `Periodo arrendado indicado en el recibo. ${EMISION_NOTA}`,
    "historial médico":
      `Meses con citas o visitas explícitamente registradas. No se rellena entre visitas. ${EMISION_NOTA}`,
    "matrícula":
      `Periodo académico completo entre fecha de inicio y fin. ${EMISION_NOTA}`,
  }
  return criterios[tipo] ?? `Mes de emisión incluido como prueba de presencia.`
}

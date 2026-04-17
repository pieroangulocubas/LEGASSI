// ─── Shared utilities for /api/clasificador and Inngest function ──────────────

// ─── Email helpers ────────────────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim())
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

// ─── Name normalization helpers ───────────────────────────────────────────────
function normalizeBase(s: string): string {
  return s
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function tokenizeName(s: string): string[] {
  return normalizeBase(s).split(" ").filter((t) => t.length > 0)
}

function levenshtein(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, () =>
    Array<number>(b.length + 1).fill(0)
  )
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      )
    }
  }
  return matrix[a.length][b.length]
}

// ─── Fuzzy person identity check ─────────────────────────────────────────────
// Returns true if name1 and name2 likely refer to the same person.
//
// Rule: ALL tokens of the shorter name must be found (within edit distance 1)
// in the longer name, and there must be at least 2 such matches.
//
// Examples:
//   "Juana García"           vs "Juana García Vera"      → 2/2 → true  (same, 2nd apellido omitted)
//   "Juana García Vera"      vs "Juana García Rodríguez" → 2/3 → false (different people)
//   "Juan García"            vs "Juan López"             → 1/2 → false (different apellido)
//   "JHONNY García"          vs "JHONY García"           → 2/2 → true  (typo tolerance)
export function isSamePerson(name1: string, name2: string): boolean {
  const t1 = tokenizeName(name1)
  const t2 = tokenizeName(name2)
  if (t1.length === 0 || t2.length === 0) return false

  // Use the shorter name as the reference — every one of its tokens must match
  const [shorter, longer] = t1.length <= t2.length ? [t1, t2] : [t2, t1]

  let matches = 0
  for (const a of shorter) {
    for (const b of longer) {
      if (levenshtein(a, b) <= 1) { matches++; break }
    }
  }

  return matches === shorter.length && matches >= 2
}

// ─── Gemini prompt ────────────────────────────────────────────────────────────
export function buildGeminiPrompt(nombre: string): string {
  return `Analiza estos documentos como pruebas de permanencia en España (regularización extraordinaria 2025-2026).

SOLICITANTE: "${nombre}"

INSTRUCCIONES:

1. IDENTIDAD: Copia en "nombre_en_doc" el nombre de la persona física que aparece en el
   documento. Cuando haya varios nombres de persona:
     a) Si el nombre del SOLICITANTE aparece en el documento → cópialo exactamente como aparece.
     b) Si el SOLICITANTE no aparece → copia el nombre más prominente que encuentres.
     c) Sin ningún nombre visible → null.

   CRÍTICO — el campo "valido" NUNCA depende del nombre:
     · Que el nombre no sea el del solicitante NO es motivo de rechazo.
     · Que el documento sea de un tercero NO es motivo de rechazo.
     · NO uses "titularidad ajena", "nombre incorrecto" ni similares en motivo_rechazo.
   "valido" solo depende de si el documento tiene fechas razonables de presencia en España.
   Si hay un identificador único (DNI/NIE/PASAPORTE/NASS) y no hay nombre → valido=true.
   Si no hay nombre ni identificador ni fechas → valido=false.

2. RELEVANCIA: el documento debe ser una prueba razonable de presencia física en España.

---

Devuelve un array JSON, un objeto por documento, mismo orden. Campos:

"tipo": nómina|contrato|padrón|empadronamiento histórico|extracto bancario|factura de servicios|recibo de alquiler|historial médico|matrícula|certificado empresa|otro

"fechas": array YYYY-MM de los meses que prueban presencia física en España.

  ── CRITERIO ÚNICO (aplica a cualquier tipo de documento) ──────────────────────
  Antes de incluir un mes pregúntate: ¿esta fecha representa un acto real de la persona
  en España en ese momento? Es decir, ¿la persona estaba ahí recibiendo un servicio,
  trabajando, usando una cuenta bancaria, viviendo, siendo atendida médicamente?
  Si la respuesta no es inequívocamente sí → no incluyas ese mes.

  Una fecha es válida SOLO cuando describe un hecho activo ocurrido en ese mes:
    · Un periodo de servicio consumido        (factura, extracto, recibo)
    · Un acto laboral o de pago ocurrido      (nómina, transferencia)
    · Una acción registral real               (alta padrón, modificación, baja)
    · Un evento presencial con fecha          (cita médica, matrícula)
    · La emisión de un documento oficial      (cuando la emisión implica que el titular
                                               estaba vinculado al servicio en esa fecha)

  Una fecha NO es válida cuando describe un metadato administrativo del documento, no
  un hecho de la persona. Ejemplos universales de fechas inválidas:
    · Cualquier "fecha de fin / vencimiento / caducidad / baja" de un contrato o servicio
    · Cualquier "fecha de inicio de contrato" sin periodo de facturación asociado visible
    · Fechas de nacimiento, expiración de DNI/NIE/pasaporte
    · Fechas en contenido no referido a la persona: tablas estadísticas, información
      regulatoria, condiciones generales, publicidad, datos técnicos
    · Meses futuros respecto a la fecha de emisión del documento

  ── REGLAS POR TIPO DE DOCUMENTO ──────────────────────────────────────────────

  PADRÓN MUNICIPAL (certificado individual / volante de empadronamiento):
    → Incluye únicamente los meses de estas fechas concretas si aparecen explícitamente:
        (1) Fecha de expedición / emisión del certificado.
        (2) Fecha de "Alta en Padrón".
        (3) Fecha de "Alta en Vivienda" (también válida como prueba de presencia).
    → NUNCA incluyas los meses intermedios entre cualquiera de estas fechas.
    → NUNCA uses "fecha de baja", "fecha de caducidad" ni ninguna otra fecha del documento.
    → Resultado típico: entre uno y tres meses concretos, nunca un rango.
    → Ejemplo: Alta en Vivienda 15/01/2024, Alta en Padrón 03/02/2025, emitido 10/04/2026
               → fechas: ["2024-01", "2025-02", "2026-04"]

  EMPADRONAMIENTO HISTÓRICO (historial de inscripciones):
    → Incluye únicamente el mes de cada acción registral explícita que aparezca listada
      (alta, modificación, baja). Cada acción = un mes concreto.
    → NUNCA rellenes el hueco entre dos acciones consecutivas como si fueran meses continuos.
    → Ejemplo: Alta feb 2023, modificación sep 2024, baja ene 2026 → ["2023-02","2024-09","2026-01"]

  CONTRATO DE TRABAJO / CERTIFICADO EMPRESA / INFORME MÉDICO CON PERIODO:
    → Estos SÍ prueban permanencia continua: incluye todos los meses desde el inicio
      hasta el fin del periodo explícitamente indicado en el documento.
    → Solo si el documento muestra un rango activo (fecha inicio + fecha fin o "hasta la fecha").

  NÓMINA / FACTURA / RECIBO / EXTRACTO BANCARIO:
    → Solo el mes o meses concretos a los que corresponde el documento o la transacción.
    → Nunca inferir continuidad.

  HISTORIAL MÉDICO CON LISTA DE VISITAS / CITAS:
    → Solo los meses en que hay una cita o visita explícitamente registrada.
    → Nunca el rango entre primera y última visita.

"nombre_en_doc": string o null. Nombre literal del titular tal como aparece en el documento. null si no hay nombre.
  IMPORTANTE: si el documento no tiene nombre explícito pero el concepto, asunto o descripción
  menciona "familia", "flia", "fam" seguido de uno o más apellidos (ej. "noviembre flia Bastardo Boscan",
  "alquiler fam García"), copia ese fragmento completo en nombre_en_doc — cuenta como referencia de nombre.

"fileIndex": integer. Índice del archivo donde se encuentra este documento (usa el número del marcador FILE_INDEX:N más cercano antes de este documento).

"paginas": array de enteros (1-based). Páginas del PDF que pertenecen a este documento.
  - Documento de una sola página o imagen: [1]
  - Documento que ocupa las páginas 1 y 2 de un PDF: [1, 2]
  - PDF de 4 páginas donde la página 3 está en blanco: [1, 2, 4]
  - Tercer documento escaneado en un PDF de 5 páginas, ocupa la página 3: [3]
  Si un PDF contiene varios documentos distintos escaneados juntos, devuelve un objeto
  separado por cada documento identificado, con sus páginas correspondientes.

Solo JSON válido, sin texto adicional, sin markdown.
Ejemplo con un archivo que contiene dos documentos escaneados:
[
  {"fileIndex":0,"paginas":[1],"tipo":"nómina","fechas":["2026-01"],"nombre_en_doc":"GARCIA LUIS","valido":true,"observacion":null,"fuerza":"fuerte","motivo_rechazo":null,"nombre_sugerido":"2026-01_nomina_empresa","descripcion_breve":"Nómina enero 2026"},
  {"fileIndex":0,"paginas":[2,3],"tipo":"factura de servicios","fechas":["2026-01"],"nombre_en_doc":"GARCIA LUIS","valido":true,"observacion":null,"fuerza":"media","motivo_rechazo":null,"nombre_sugerido":"2026-01_factura_luz","descripcion_breve":"Factura luz enero 2026"}
]`
}

// ─── Name match check ─────────────────────────────────────────────────────────
//
//  "exact"    → every token in the solicitante's name appears verbatim in the doc
//  "observado"→ any token is missing → needs manual review
//
// Normalisation applied to both sides: uppercase, accents stripped, common
// separators (comma, dash, slash) treated as spaces, stopwords ignored.
// Fuzzy/typo tolerance is intentionally removed — the person fills in their own
// name so we expect an exact match; any discrepancy goes to human review.
export function checkNameMatchLevel(
  solicitante: string,
  nombreEnDoc: string,
): "exact" | "observado" {
  const cleanDoc = nombreEnDoc.replace(/[,\-/\\|]/g, " ")
  const sTokens = tokenizeName(solicitante)
  const dSet = new Set(tokenizeName(cleanDoc))

  if (sTokens.length === 0) return "exact"  // nothing to validate

  for (const s of sTokens) {
    if (!dSet.has(s)) return "observado"
  }
  return "exact"
}

// Builds the observacion message listing which tokens are missing
function buildNameObservacion(solicitante: string, nombreEnDoc: string): string {
  const cleanDoc = nombreEnDoc.replace(/[,\-/\\|]/g, " ")
  const sTokens = tokenizeName(solicitante)
  const dSet = new Set(tokenizeName(cleanDoc))
  const missing = sTokens.filter((t) => !dSet.has(t))
  const missingText = missing.length > 0 ? `No coincide: ${missing.join(", ")}. ` : ""
  return `En el documento: «${nombreEnDoc}». ${missingText}Requiere revisión manual.`
}

// ─── Familia pattern check ────────────────────────────────────────────────────
// Returns true if nombreEnDoc contains "familia/flia/fam" and at least one token
// from the solicitante's name (≥3 chars) appears in the text (edit-distance ≤1).
function checkFamiliaMatch(solicitante: string, nombreEnDoc: string): boolean {
  if (!/\b(flia|familia|fam)\b/i.test(nombreEnDoc)) return false
  const sTokens = tokenizeName(solicitante).filter((t) => t.length >= 3)
  const dTokens = tokenizeName(nombreEnDoc)
  for (const st of sTokens) {
    for (const dt of dTokens) {
      if (levenshtein(st, dt) <= 1) return true
    }
  }
  return false
}

// ─── Date parsing ─────────────────────────────────────────────────────────────
// Converts any recognizable date string to "YYYY-MM". Returns null if unrecognizable.
// Handles: YYYY-MM, YYYY-MM-DD, DD/MM/YYYY, D/M/YYYY, DD-MM-YYYY,
//          "15 de marzo de 2024", "marzo 2024", "marzo de 2024", etc.
const MONTH_MAP: Record<string, string> = {
  enero: "01", january: "01", jan: "01",
  febrero: "02", february: "02", feb: "02",
  marzo: "03", march: "03", mar: "03",
  abril: "04", april: "04", apr: "04",
  mayo: "05", may: "05",
  junio: "06", june: "06", jun: "06",
  julio: "07", july: "07", jul: "07",
  agosto: "08", august: "08", aug: "08",
  septiembre: "09", setiembre: "09", september: "09", sep: "09", sept: "09",
  octubre: "10", october: "10", oct: "10",
  noviembre: "11", november: "11", nov: "11",
  diciembre: "12", december: "12", dec: "12",
}

export function parseDateToYearMonth(raw: string): string | null {
  const s = raw.trim()

  // Already YYYY-MM
  if (/^\d{4}-\d{2}$/.test(s)) return s

  // YYYY-MM-DD or YYYY/MM/DD
  const isoFull = s.match(/^(\d{4})[-/](\d{1,2})[-/]\d{1,2}$/)
  if (isoFull) return `${isoFull[1]}-${isoFull[2].padStart(2, "0")}`

  // DD/MM/YYYY or DD-MM-YYYY or D/M/YYYY
  const dmy = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, "0")}`

  // "15 de marzo de 2024" / "15 marzo 2024"
  const dayMonthYear = s.match(/^(\d{1,2})\s+(?:de\s+)?([a-záéíóúñ]+)(?:\s+de)?\s+(\d{4})$/i)
  if (dayMonthYear) {
    const mm = MONTH_MAP[dayMonthYear[2].toLowerCase()]
    if (mm) return `${dayMonthYear[3]}-${mm}`
  }

  // "marzo de 2024" / "marzo 2024"
  const monthYear = s.match(/^([a-záéíóúñ]+)(?:\s+de)?\s+(\d{4})$/i)
  if (monthYear) {
    const mm = MONTH_MAP[monthYear[1].toLowerCase()]
    if (mm) return `${monthYear[2]}-${mm}`
  }

  // MM/YYYY or MM-YYYY
  const mmyyyy = s.match(/^(\d{1,2})[-/](\d{4})$/)
  if (mmyyyy) return `${mmyyyy[2]}-${mmyyyy[1].padStart(2, "0")}`

  return null
}

// ─── Date helpers ─────────────────────────────────────────────────────────────
const RANGE_TIPOS = new Set([
  "contrato",
  "extracto bancario",
  "certificado empresa",
])

function fillMonthRange(from: string, to: string): string[] {
  const [fy, fm] = from.split("-").map(Number)
  const [ty, tm] = to.split("-").map(Number)
  const months: string[] = []
  let y = fy, m = fm
  while ((y < ty || (y === ty && m <= tm)) && months.length < 48) {
    months.push(`${y}-${String(m).padStart(2, "0")}`)
    m++
    if (m > 12) { m = 1; y++ }
  }
  return months
}

export function normalizeFechas(fechas: string[], tipo: string): string[] {
  const sorted = [...fechas].sort()
  if (sorted.length === 0) return []

  let expanded = sorted
  if (RANGE_TIPOS.has(tipo) && sorted.length >= 2) {
    expanded = fillMonthRange(sorted[0], sorted[sorted.length - 1])
  }

  return [...new Set(expanded)]
}

export function getMimeType(filename: string): string {
  const lower = filename.toLowerCase()
  if (lower.endsWith(".pdf")) return "application/pdf"
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg"
  if (lower.endsWith(".png")) return "image/png"
  return "application/octet-stream"
}

// ─── Enrich raw Gemini results ─────────────────────────────────────────────────
// allFileNames: original file names for ALL uploaded files (including duplicates),
// indexed by position — matches the FILE_INDEX:N markers Gemini received.
export function enrichGeminiResults(
  parsed: unknown[],
  nombre: string,
  allFileNames: string[],
): Record<string, unknown>[] {
  return parsed.map((item) => {
    const doc = item as Record<string, unknown>

    const fileIndex =
      typeof doc.fileIndex === "number" &&
      doc.fileIndex >= 0 &&
      doc.fileIndex < allFileNames.length
        ? doc.fileIndex
        : 0

    const rawPageRange: number[] | null =
      Array.isArray(doc.paginas) && (doc.paginas as unknown[]).length > 0
        ? (doc.paginas as unknown[]).filter(
            (p): p is number => typeof p === "number" && p > 0
          )
        : null

    const tipo = typeof doc.tipo === "string" ? doc.tipo : ""
    let rawFechas: string[] = []
    if (Array.isArray(doc.fechas)) {
      rawFechas = (doc.fechas as string[])
        .map((f) => (typeof f === "string" ? parseDateToYearMonth(f) : null))
        .filter((f): f is string => f !== null)
    } else if (typeof doc.fecha === "string") {
      const parsed = parseDateToYearMonth(doc.fecha)
      if (parsed) rawFechas = [parsed]
    }
    const fechas = normalizeFechas(rawFechas, tipo)

    let valido = doc.valido as boolean
    let observado = false
    let observacion = (doc.observacion as string | null) ?? null
    let motivo_rechazo = (doc.motivo_rechazo as string | null) ?? null

    // Name check runs only when Gemini considered the document valid on dates/relevance.
    // If Gemini already rejected it (bad dates, no date, irrelevant), keep it invalid.
    if (valido) {
      const nameInDoc = typeof doc.nombre_en_doc === "string" ? doc.nombre_en_doc : null
      if (nameInDoc?.trim()) {
        if (checkNameMatchLevel(nombre, nameInDoc) === "observado") {
          // Any token missing → manual review; dates are fine so keep for the queue
          valido = false
          observado = true
          observacion = buildNameObservacion(nombre, nameInDoc)
          motivo_rechazo = null
        }
        // "exact" → no changes; nombre_en_doc absent → trust Gemini (identifier-based)
      }
    }

    // Familia rescue: if Gemini rejected the doc but nombre_en_doc contains
    // "familia/flia/fam" + a matching surname → send to manual review instead of invalid.
    if (!valido && !observado) {
      const nameInDoc = typeof doc.nombre_en_doc === "string" ? doc.nombre_en_doc : null
      if (nameInDoc?.trim() && checkFamiliaMatch(nombre, nameInDoc)) {
        observado = true
        observacion = `Referencia familiar detectada. En el documento: «${nameInDoc}». Requiere revisión manual.`
        motivo_rechazo = null
      }
    }

    return {
      ...doc,
      fechas,
      valido,
      observacion,
      observado,
      motivo_rechazo,
      evidencia_por_mes:
        doc.evidencia_por_mes &&
        typeof doc.evidencia_por_mes === "object" &&
        !Array.isArray(doc.evidencia_por_mes)
          ? (doc.evidencia_por_mes as Record<string, string>)
          : null,
      fecha: undefined,
      paginas: undefined,
      originalName: allFileNames[fileIndex] ?? `archivo_${fileIndex + 1}`,
      fileIndex,
      pageRange: rawPageRange,
    }
  })
}

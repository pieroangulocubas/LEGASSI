// ─── Shared utilities for /api/clasificador and Inngest function ──────────────

// ─── Email helpers ────────────────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim())
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

// ─── Name normalization helpers (used by isSamePerson and checkNombreDoc) ─────
function normalizeBase(s: string): string {
  return s
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

const STOPWORDS = new Set(["DE", "LA", "DEL", "LOS", "LAS", "Y"])

function tokenizeName(s: string): string[] {
  return normalizeBase(s)
    .split(" ")
    .filter((t) => t.length > 0 && !STOPWORDS.has(t))
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
export function isSamePerson(name1: string, name2: string): boolean {
  const t1 = tokenizeName(name1)
  const t2 = tokenizeName(name2)
  if (t1.length === 0 || t2.length === 0) return false

  let matches = 0
  for (const a of t1) {
    for (const b of t2) {
      if (levenshtein(a, b) <= 1) { matches++; break }
    }
  }
  // Same person: at least 2 tokens match, or 1 match when names are short (1 token each)
  return matches >= 2 || (Math.min(t1.length, t2.length) === 1 && matches >= 1)
}

// ─── Gemini prompt ────────────────────────────────────────────────────────────
export function buildGeminiPrompt(nombre: string): string {
  return `Analiza estos documentos como pruebas de permanencia en España (regularización extraordinaria 2025-2026).

SOLICITANTE: "${nombre}"

INSTRUCCIONES DE VALIDACIÓN DE IDENTIDAD (CRÍTICO):

1. NORMALIZACIÓN:
   - Convierte todos los nombres a MAYÚSCULAS
   - Elimina tildes
   - Ignora comas, puntos y símbolos
   - Trata múltiples espacios como uno solo

2. TOKENIZACIÓN: divide los nombres en palabras (tokens).
   Las partículas "DE", "LA", "DEL", "LOS" NO son obligatorias para validar identidad.
   Ejemplo: "DE LA CRUZ" equivale a "CRUZ"

3. ORDEN: el orden de nombres y apellidos puede variar.
   Ejemplo válido: "PEREZ JUAN" = "JUAN PEREZ"

4. COINCIDENCIA FLEXIBLE:
   - Si hay identificador único (DNI/NIE/PASAPORTE/NASS): valido=true directamente.
   - Si hay nombre: cuenta cuántos tokens principales coinciden (ignorando partículas).
     Si coinciden al menos 2 tokens relevantes → valido=true
     Si coincide solo 1 token en un documento que solo muestra 1 nombre → válido pero menor confianza

5. TOLERANCIA DE ERRORES:
   - Permite diferencias de hasta 1 letra por token (ej: PEREZ vs PERES)
   - Si detectas exactamente 1 error leve en un token → valido=true + observación
   - Si hay múltiples errores o diferencias grandes → valido=false

6. CASOS ESPECIALES:
   - Si el nombre está dividido en varias zonas del documento → combínalo mentalmente
   - Si no hay nombre pero hay identificador → válido
   - Si no hay ni nombre ni identificador → inválido

7. RELEVANCIA: el documento debe ser una prueba razonable de presencia física en España.

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

  ── CÓMO EXTRAER LOS MESES según la naturaleza del documento ──────────────────
  Documentos puntuales (acreditan uno o pocos meses discretos):
    → Incluye solo el mes o meses en que ocurrió el hecho activo.
    → Nunca rellenes huecos ni inferir continuidad entre dos fechas.
    → Ejemplos: nómina, factura, recibo, cita médica, padrón.

  Documentos de periodo continuo (el contrato PRUEBA que la persona estuvo durante todo ese rango):
    → Incluye todos los meses desde el inicio hasta el fin del periodo visible en el documento.
    → Solo si el documento muestra explícitamente un rango activo (fecha inicio + fecha fin o
       "hasta la fecha"), no si solo menciona una fecha de contrato.
    → Ejemplos: contrato de trabajo, extracto bancario con saldo mes a mes, certificado empresa.

  Documentos históricos/certificados:
    → Incluye únicamente los meses específicos que el documento certifica o lista explícitamente.
    → Ejemplos: empadronamiento histórico, historial médico con lista de visitas.

"nombre_en_doc": string o null. Nombre literal del titular tal como aparece en el documento. null si no hay nombre.

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

// ─── Programmatic name check ──────────────────────────────────────────────────
type NameCheckResult =
  | { override: false }
  | { override: true; valido: boolean; observacion: string | null; motivo: string | null }

export function checkNombreDoc(
  nombreSolicitante: string,
  nombreEnDoc: string | null,
): NameCheckResult {
  if (!nombreEnDoc?.trim()) return { override: false }

  const inputTokens = tokenizeName(nombreSolicitante)
  const docTokens = tokenizeName(nombreEnDoc)

  if (inputTokens.length === 0 || docTokens.length === 0) return { override: false }

  let matches = 0
  const observaciones: string[] = []

  for (const inputToken of inputTokens) {
    let bestDist = Infinity
    let bestMatch = ""
    for (const docToken of docTokens) {
      const d = levenshtein(inputToken, docToken)
      if (d < bestDist) { bestDist = d; bestMatch = docToken }
    }

    if (bestDist === 0) {
      matches++
    } else if (bestDist === 1) {
      matches++
      observaciones.push(`Posible error: «${bestMatch}» en lugar de «${inputToken}»`)
    } else if (bestDist === 2 && inputToken.length > 4) {
      matches++
      observaciones.push(`Posible variación: «${bestMatch}» vs «${inputToken}»`)
    }
  }

  const valido =
    matches >= 2 ||
    (inputTokens.length === 1 && matches === 1)

  if (!valido) {
    return {
      override: true,
      valido: false,
      observacion: null,
      motivo: "Nombre del documento no coincide con el solicitante",
    }
  }

  const observacion =
    observaciones.length > 0
      ? observaciones[0] + ". Verificar antes de presentar."
      : null

  if (observacion) {
    return { override: true, valido: true, observacion, motivo: null }
  }

  return { override: false }
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
      rawFechas = (doc.fechas as string[]).filter((f) => /^\d{4}-\d{2}$/.test(f))
    } else if (typeof doc.fecha === "string" && /^\d{4}-\d{2}$/.test(doc.fecha)) {
      rawFechas = [doc.fecha]
    }
    const fechas = normalizeFechas(rawFechas, tipo)

    let valido = doc.valido as boolean
    let observacion = (doc.observacion as string | null) ?? null
    let motivo_rechazo = (doc.motivo_rechazo as string | null) ?? null

    if (valido) {
      const check = checkNombreDoc(
        nombre,
        typeof doc.nombre_en_doc === "string" ? doc.nombre_en_doc : null,
      )
      if (check.override) {
        valido = check.valido
        observacion = check.observacion
        motivo_rechazo = check.motivo
      }
    }

    return {
      ...doc,
      fechas,
      valido,
      observacion,
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

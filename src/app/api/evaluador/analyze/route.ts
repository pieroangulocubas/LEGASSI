import { NextRequest, NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"

export const maxDuration = 60

interface FilePayload {
  name: string
  mimeType: string
  data: string // base64
}

interface AnalyzePayload {
  pathway: "DA20" | "DA21"
  supuestos: string[]
  files: FilePayload[]
}

function buildPrompt(pathway: "DA20" | "DA21", supuestos: string[]): string {
  const supuestosLabel =
    pathway === "DA21" && supuestos.length > 0
      ? supuestos.join(", ")
      : "N/A"

  return `Eres un asesor experto en extranjería española especializado en la regularización extraordinaria del RD 316/2026 (BOE 15/04/2026). Analiza cada documento adjunto y verifica si es válido y suficiente para acompañar una solicitud de regularización.

VÍA APLICABLE: ${pathway === "DA20" ? "DA20 — Solicitante de Protección Internacional (formulario EX31)" : "DA21 — Extranjero en situación irregular (formulario EX32)"}
${pathway === "DA21" ? `SUPUESTO DA21 ALEGADO: ${supuestosLabel}` : ""}

─── CRITERIOS POR TIPO DE DOCUMENTO ─────────────────────────────────────────

PASAPORTE / DOCUMENTO DE VIAJE:
- Debe estar VIGENTE (no caducado). Si está caducado → estado "invalido".
- Debe ser legible y mostrar nombre, apellidos, fecha de nacimiento, número, nacionalidad.
- Falta de legibilidad parcial → "valido_con_observaciones".

DOCUMENTACIÓN DE PROTECCIÓN INTERNACIONAL (solo DA20):
- Puede ser: tarjeta roja de solicitante de asilo, resguardo de solicitud OAR, resolución (positiva/negativa/en trámite), acuse de recurso, carta de CEAR/ACNUR.
- Debe mostrar nombre del solicitante y fecha de solicitud anterior al 01/01/2026.
- El estado de la solicitud (pendiente, denegada, desistida, recurso) NO afecta a la validez — todos son válidos.
- Si no hay fecha visible o la fecha es posterior al 01/01/2026 → "invalido".

CERTIFICADO DE VULNERABILIDAD — ANEXO II (DA21 supuesto vulnerabilidad):
- Debe tener: nombre y datos del solicitante, nombre de la entidad emisora, número de inscripción RECEX, sello físico o electrónico de la entidad.
- Debe incluir circunstancias de vulnerabilidad marcadas.
- Si falta sello o número RECEX → "invalido".
- Si falta firma pero hay sello → "valido_con_observaciones".

ANTECEDENTES PENALES DE ESPAÑA:
- Emitido por el Registro Central de Penados (Ministerio de Justicia).
- Debe estar a nombre del solicitante y ser reciente.
- Si muestra anotaciones (antecedentes activos) → "valido_con_observaciones" con advertencia de que puede impedir la solicitud.
- Si está caducado o ilegible → "invalido".

ANTECEDENTES PENALES DEL PAÍS DE ORIGEN / PAÍSES DE RESIDENCIA:
- Debe estar apostillado (Convenio de La Haya) si el país es parte, o legalizado en su defecto.
- Debe tener traducción jurada al español si el documento no está en español.
- Si falta apostilla o legalización → "valido_con_observaciones" con instrucción de apostillar.
- Si falta traducción jurada → "valido_con_observaciones".
- Ambas ausentes → "invalido".

JUSTIFICANTE DE PAGO (Modelo 790 código 052):
- Debe mostrar código 052 explícitamente.
- Importe correcto: €38,28 (adulto) o €10,94 (menor de edad).
- Debe mostrar datos del solicitante (nombre/NIF o pasaporte).
- Debe tener sello/validación bancaria o código de validación electrónica.
- Sin sello ni validación → "invalido".
- Importe incorrecto → "invalido".

CONTRATOS DE TRABAJO / NÓMINAS (DA21 supuesto trabajo):
- El contrato debe ser por mínimo 90 días/año y estar firmado por empleador.
- Las nóminas deben ser nominativas y de empresa con CIF español.
- Si el contrato es de duración inferior a 90 días/año → "invalido".

INFORME DE VIDA LABORAL (DA21 supuesto trabajo):
- Emitido por la TGSS/Seguridad Social.
- Debe mostrar nombre del solicitante e historial de cotizaciones en España.
- Sin cotizaciones registradas → "valido_con_observaciones" con nota de insuficiencia.

DOCUMENTACIÓN FAMILIAR (DA21 supuesto familia):
- Libro de familia: válido si muestra hijos menores o relación de parentesco con ascendiente dependiente.
- Empadronamiento conjunto: debe ser reciente y mostrar convivencia de todos los miembros.
- Sin empadronamiento conjunto → "valido_con_observaciones" (recomendamos añadirlo).

FORMULARIO EX31 o EX32:
- EX31 para DA20, EX32 para DA21. Si se sube el formulario equivocado → "invalido".
- Debe estar cumplimentado en todos los campos obligatorios y firmado.
- Si está en blanco o incompleto → "invalido".

CUALQUIER OTRO DOCUMENTO:
- Si no es reconocible como parte del expediente de regularización → "no_identificado".
- Si es una prueba de permanencia → indicar que debería verificarse con el Clasificador de Documentos de Legassi.

─── FORMATO DE SALIDA ────────────────────────────────────────────────────────

Devuelve un array JSON con un objeto por documento. Campos exactos:

{
  "docIndex": número 0-based del documento (según el marcador DOC_N),
  "fileName": nombre del archivo tal como aparece en el marcador,
  "tipoDocumento": tipo identificado en español (ej. "Pasaporte", "Antecedentes penales España", "Certificado de vulnerabilidad"),
  "estado": "valido" | "valido_con_observaciones" | "invalido" | "no_identificado",
  "observaciones": array de strings — problemas concretos encontrados (vacío si no hay),
  "sugerencias_presencial": array de strings — qué mejorar/corregir si se presenta presencialmente en Correos, OEX o comisaría,
  "sugerencias_telematica": ${pathway === "DA20" ? 'array de strings — qué revisar para presentación telemática vía MERCURIO con certificado digital' : 'null'},
  "descripcion": string breve — descripción del documento en 1 línea
}

Solo JSON válido (array), sin texto adicional, sin markdown.`
}

export async function POST(req: NextRequest) {
  let body: AnalyzePayload
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Petición no válida." }, { status: 400 })
  }

  const { pathway, supuestos, files } = body

  if (!files || files.length === 0) {
    return NextResponse.json({ error: "No se han recibido archivos." }, { status: 400 })
  }

  if (files.length > 15) {
    return NextResponse.json({ error: "Máximo 15 documentos por análisis." }, { status: 400 })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "Servicio no disponible temporalmente." }, { status: 503 })
  }

  const ai = new GoogleGenAI({ apiKey })

  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
    { text: buildPrompt(pathway, supuestos) },
  ]

  for (let i = 0; i < files.length; i++) {
    parts.push({ text: `DOC_${i}: ${files[i].name}` })
    parts.push({ inlineData: { mimeType: files[i].mimeType, data: files[i].data } })
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts }],
      config: {
        temperature: 0,
        responseMimeType: "application/json",
        maxOutputTokens: 16384,
      },
    })

    const raw = response.text ?? "[]"
    const parsed = JSON.parse(raw)

    return NextResponse.json({ results: Array.isArray(parsed) ? parsed : [] })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error desconocido"
    return NextResponse.json({ error: `Error en el análisis: ${msg}` }, { status: 500 })
  }
}

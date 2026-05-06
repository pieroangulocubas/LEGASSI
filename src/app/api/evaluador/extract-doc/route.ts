import { NextRequest, NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"
import type { ExtractDocResult } from "@/app/herramientas/evaluador-regularizacion/types"

export const maxDuration = 45

interface ExtractPayload {
  pathway: "DA20" | "DA21"
  docHint?: string
  file: { name: string; mimeType: string; data: string }
}

function buildPrompt(pathway: "DA20" | "DA21", docHint?: string): string {
  return `Eres un experto en documentación de extranjería española especializado en el RD 316/2026 (Regularización Extraordinaria 2026).

VÍA: ${pathway === "DA20" ? "DA20 — Solicitante de Protección Internacional (EX31)" : "DA21 — Extranjero en situación irregular (EX32)"}
${docHint ? `CONTEXTO DEL DOCUMENTO: ${docHint}` : ""}

TAREA 1 — VALIDACIÓN para el expediente de regularización:
Valida el documento según los criterios del RD 316/2026:
- Pasaporte: debe estar vigente, legible, con nombre, nº, nacionalidad y fecha de nacimiento visibles.
- Doc. PI (tarjeta roja, resguardo OAR, resolución, recurso): válido en cualquier estado si fecha anterior a 01/01/2026.
- Antecedentes penales España: emitido por Registro Central de Penados, sin anotaciones activas.
- Antecedentes penales extranjero: debe tener apostilla o legalización + traducción jurada si no está en español.
- Certificado vulnerabilidad: sello de entidad + número RECEX obligatorios.
- Modelo 790-052: código 052 explícito, importe correcto (38,28€ adulto / 10,94€ menor), sello/validación.
- Contratos/nóminas: nominativos, ≥90 días/año, con CIF español.
- Libro de familia / certificados nacimiento: válidos si muestran la filiación.
- Empadronamiento: válido si es reciente y nominativo.
- Si no se puede identificar: "no_identificado".

TAREA 2 — EXTRACCIÓN de datos personales visibles:
Extrae TODOS los datos que veas en el documento. Para fechas usa formato YYYY-MM-DD. Para sexo usa "H" o "M". Si un dato no está visible, usa null.

Devuelve EXCLUSIVAMENTE un JSON con esta estructura exacta (sin texto adicional, sin markdown):
{
  "tipoDocumento": "nombre en español del tipo de documento",
  "estado": "valido|valido_con_observaciones|invalido|no_identificado",
  "observaciones": ["problema concreto si lo hay"],
  "sugerencias_presencial": ["qué mejorar para presentar presencialmente"],
  "extractedData": {
    "nombre": null,
    "primerApellido": null,
    "segundoApellido": null,
    "sexo": null,
    "fechaNacimiento": null,
    "lugarNacimiento": null,
    "paisNacimiento": null,
    "nacionalidad": null,
    "pasaporte": null,
    "nie": null,
    "domicilio": null,
    "piso": null,
    "localidad": null,
    "provincia": null,
    "cp": null,
    "telefono": null,
    "email": null,
    "numExpedientePi": null,
    "estadoPi": null
  }
}`
}

export async function POST(req: NextRequest) {
  let body: ExtractPayload
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Petición no válida." }, { status: 400 })
  }

  const { pathway, docHint, file } = body
  if (!file?.data) {
    return NextResponse.json({ error: "No se recibió ningún archivo." }, { status: 400 })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "Servicio no disponible." }, { status: 503 })
  }

  try {
    const ai = new GoogleGenAI({ apiKey })
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{
        role: "user",
        parts: [
          { text: buildPrompt(pathway, docHint) },
          { text: `Documento: ${file.name}` },
          { inlineData: { mimeType: file.mimeType, data: file.data } },
        ],
      }],
      config: { temperature: 0, responseMimeType: "application/json", maxOutputTokens: 4096 },
    })

    const raw = response.text ?? "{}"
    const parsed = JSON.parse(raw) as ExtractDocResult
    return NextResponse.json(parsed)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error desconocido"
    return NextResponse.json({ error: `Error en el análisis: ${msg}` }, { status: 500 })
  }
}

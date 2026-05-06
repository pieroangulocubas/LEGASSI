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
  return `Eres un experto en documentación de extranjería española especializado en el RD 316/2026 (Regularización Extraordinaria 2026). Fecha de referencia: ${new Date().toISOString().slice(0, 10)}.

VÍA: ${pathway === "DA20" ? "DA20 — Solicitante de Protección Internacional (EX31)" : "DA21 — Extranjero en situación irregular (EX32)"}
${docHint ? `CONTEXTO DEL DOCUMENTO: ${docHint}` : ""}

TAREA 1 — VALIDACIÓN Y AUTENTICIDAD:
Valida el documento según los criterios del RD 316/2026. Detecta:
- CADUCIDAD: compara la fecha de vencimiento visible con la fecha de referencia. Si está caducado o caduca en <30 días, anótalo.
- AUTENTICIDAD: detecta si parece fotocopia, escaneado de fotocopia, imagen degradada, sin sellos/firmas esperados, o alteraciones.
- APOSTILLA/LEGALIZACIÓN: para documentos extranjeros, ¿tiene apostilla del Convenio de La Haya o legalización consular?
- TRADUCCIÓN JURADA: si el documento no está en español, ¿va acompañado de traducción jurada?
- SELLOS/REGISTROS OBLIGATORIOS: antecedentes penales (Registro Central de Penados), certificado vulnerabilidad (sello RECEX + número), modelo 790-052 (código 052 + importe correcto).
- CONTRADICCIONES: si hay datos que parecen inconsistentes (nombre diferente en dos partes, fechas imposibles, etc.).

Criterios de validez por tipo:
- Pasaporte: vigente, legible, nombre/nº/nacionalidad/nacimiento visibles.
- Doc. PI (tarjeta roja, resguardo OAR, resolución, recurso): válido si fecha anterior a 01/01/2026.
- Antecedentes penales España: Registro Central de Penados, sin anotaciones activas.
- Antecedentes penales extranjero: apostilla + traducción jurada si no está en español.
- Certificado vulnerabilidad: sello entidad + número RECEX obligatorios.
- Modelo 790-052: código 052 explícito, importe 38,28€ (adulto) o 10,94€ (menor), sello/validación bancaria.
- Contratos/nóminas: nominativos, ≥90 días/año, CIF español.
- Empadronamiento: reciente, nominativo.

TAREA 2 — EXTRACCIÓN de datos personales visibles:
Extrae TODOS los datos visibles. Fechas en formato YYYY-MM-DD. Sexo como "H" o "M". Usa null si no está visible.

Devuelve EXCLUSIVAMENTE un JSON con esta estructura exacta (sin texto adicional, sin markdown):
{
  "tipoDocumento": "nombre en español del tipo de documento",
  "estado": "valido|valido_con_observaciones|invalido|no_identificado",
  "observaciones": ["descripción concreta del problema si lo hay"],
  "alertasValidez": [
    "alerta específica sobre validez, caducidad o autenticidad. Ej: 'Pasaporte caducado el 2025-03-15 — renuévalo antes de presentar'. Ej: 'Parece ser fotocopia — lleva el original'. Ej: 'Falta apostilla del Convenio de La Haya'. Dejar vacío si no hay alertas."
  ],
  "fechaVencimiento": null,
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
      model: "gemini-3-flash-preview",
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

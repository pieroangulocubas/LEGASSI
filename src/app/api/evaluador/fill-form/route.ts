import { NextRequest, NextResponse } from "next/server"
import { PDFDocument } from "pdf-lib"
import { readFile } from "fs/promises"
import path from "path"
import type { PersonalData } from "@/app/herramientas/evaluador-regularizacion/types"

export const maxDuration = 60

// Sub-form file names per pathway (indexed by annex id "02".."05")
const ANNEX_FILES: Record<"DA20" | "DA21", Record<string, string>> = {
  DA20: {
    "02": "EX31_02_Datos_Menor_Representado_y_Firma.pdf",
    "03": "EX31_03_Anexo_I-1_Declaracion_Imposibilidad_Antecedentes_Penales.pdf",
    "04": "EX31_04_Anexo_I-2_Solicitud_Antecedentes_Penales_Pais_Origen.pdf",
  },
  DA21: {
    "02": "EX32_02_Datos_Menor_y_Declaracion_Actividad_Cuenta_Propia.pdf",
    "03": "EX32_03_Anexo_I-1_Declaracion_Imposibilidad_Antecedentes_Penales.pdf",
    "04": "EX32_04_Anexo_I-2_Solicitud_Antecedentes_Penales_Pais_Origen.pdf",
    "05": "EX32_05_Anexo_II_Acreditacion_Situacion_Vulnerabilidad.pdf",
  },
}

const MAIN_FILE: Record<"DA20" | "DA21", string> = {
  DA20: "EX31_01_Solicitud_Datos_Personales_y_Tipo_Autorizacion.pdf",
  DA21: "EX32_01_Solicitud_Datos_Personales_y_Tipo_Autorizacion.pdf",
}

function setText(form: ReturnType<PDFDocument["getForm"]>, name: string, value: string) {
  try { form.getTextField(name).setText(value || "") } catch { /* campo no existente */ }
}

function setCheckBox(form: ReturnType<PDFDocument["getForm"]>, name: string, checked: boolean) {
  try {
    const cb = form.getCheckBox(name)
    if (checked) cb.check(); else cb.uncheck()
  } catch { /* campo no existente */ }
}

async function buildPersonDoc(
  data: PersonalData,
  pathway: "DA20" | "DA21",
  annexes: string[],
): Promise<PDFDocument> {
  const formDir = path.join(process.cwd(), "public", "forms", pathway)

  // ── Load and fill main form ──────────────────────────────────────────────────
  const mainBytes = await readFile(path.join(formDir, MAIN_FILE[pathway]))
  const mainDoc = await PDFDocument.load(mainBytes)
  const form = mainDoc.getForm()

  // Parse YYYY-MM-DD
  const [year = "", month = "", day = ""] = (data.fechaNacimiento || "").split("-")

  // Sección 1: datos personales (mismos campos EX31/EX32)
  setText(form, "Texto1",  data.pasaporte)
  setText(form, "Texto3",  data.nie)
  setText(form, "Texto5",  data.primerApellido)
  setText(form, "Texto6",  data.segundoApellido)
  setText(form, "Texto7",  data.nombre)
  setText(form, "Texto8",  day)
  setText(form, "Texto9",  month)
  setText(form, "Texto10", year)
  setText(form, "Texto11", data.lugarNacimiento)
  setText(form, "Texto12", data.paisNacimiento)
  setText(form, "Texto13", data.nacionalidad)
  setText(form, "Texto14", data.nombrePadre)
  setText(form, "Texto15", data.nombreMadre)
  setText(form, "Texto16", data.domicilio)
  setText(form, "Texto18", data.piso)
  setText(form, "Texto19", data.localidad)
  setText(form, "Texto20", data.cp)
  setText(form, "Texto21", data.provincia)
  setText(form, "Texto22", data.telefono)
  setText(form, "Texto23", data.email)

  if (pathway === "DA20") {
    // Sexo
    setCheckBox(form, "Casilla de verificación141", data.sexo === "H")
    setCheckBox(form, "Casilla de verificación142", data.sexo === "M")
    // Estado civil
    setCheckBox(form, "Casilla de verificación143", data.estadoCivil === "S")
    setCheckBox(form, "Casilla de verificación144", data.estadoCivil === "C")
    setCheckBox(form, "Casilla de verificación145", data.estadoCivil === "V")
    setCheckBox(form, "Casilla de verificación146", data.estadoCivil === "D")
    setCheckBox(form, "Casilla de verificación147", data.estadoCivil === "Sp")
    // Tipo autorización — DA20 siempre marca "Solicitante PI"
    setCheckBox(form, "Casilla de verificación148", true)
    // Nº expediente
    setText(form, "Texto50", data.numExpedientePi)
  } else {
    // Sexo
    setCheckBox(form, "Casilla de verificación165", data.sexo === "H")
    setCheckBox(form, "Casilla de verificación166", data.sexo === "M")
    // Estado civil
    setCheckBox(form, "Casilla de verificación167", data.estadoCivil === "S")
    setCheckBox(form, "Casilla de verificación168", data.estadoCivil === "C")
    setCheckBox(form, "Casilla de verificación169", data.estadoCivil === "V")
    setCheckBox(form, "Casilla de verificación170", data.estadoCivil === "D")
    setCheckBox(form, "Casilla de verificación171", data.estadoCivil === "Sp")
    // Tipo — DA21 siempre marca situación irregular
    setCheckBox(form, "Casilla de verificación172", true)
    // Supuesto
    const sup = data.da21Supuesto
    setCheckBox(form, "Casilla de verificación173", sup.includes("work_history") || sup.includes("job_offer") || sup.includes("self_employed"))
    setCheckBox(form, "Casilla de verificación174", sup.includes("family"))
    setCheckBox(form, "Casilla de verificación175", sup.includes("vulnerability"))
  }

  // Flatten so filled text becomes permanent page content
  form.flatten()

  // ── Merge into per-person doc ─────────────────────────────────────────────────
  const personDoc = await PDFDocument.create()
  const mainPages = await personDoc.copyPages(mainDoc, mainDoc.getPageIndices())
  mainPages.forEach((p) => personDoc.addPage(p))

  // ── Append selected annexes ───────────────────────────────────────────────────
  const annexMap = ANNEX_FILES[pathway]
  for (const id of annexes) {
    const fileName = annexMap[id]
    if (!fileName) continue
    try {
      const annexBytes = await readFile(path.join(formDir, fileName))
      const annexDoc = await PDFDocument.load(annexBytes)
      const annexPages = await personDoc.copyPages(annexDoc, annexDoc.getPageIndices())
      annexPages.forEach((p) => personDoc.addPage(p))
    } catch { /* annex file not found */ }
  }

  return personDoc
}

// ─── Route handler ────────────────────────────────────────────────────────────

interface FillPayload {
  persons: PersonalData[]
  pathway: "DA20" | "DA21"
  annexes: string[] // e.g. ["03", "04"]
}

export async function POST(req: NextRequest) {
  let body: FillPayload
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Petición no válida." }, { status: 400 })
  }

  const { persons, pathway, annexes = [] } = body

  if (!persons || persons.length === 0) {
    return NextResponse.json({ error: "Se requiere al menos una persona." }, { status: 400 })
  }
  if (persons.length > 10) {
    return NextResponse.json({ error: "Máximo 10 personas por descarga." }, { status: 400 })
  }

  try {
    const mergedDoc = await PDFDocument.create()

    for (const person of persons) {
      const personDoc = await buildPersonDoc(person, pathway, annexes)
      const pages = await mergedDoc.copyPages(personDoc, personDoc.getPageIndices())
      pages.forEach((p) => mergedDoc.addPage(p))
    }

    const pdfBytes = await mergedDoc.save()
    const formName = pathway === "DA20" ? "EX31" : "EX32"
    const personSuffix = persons.length > 1 ? `_${persons.length}personas` : ""

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="solicitud-${formName}${personSuffix}-legassi.pdf"`,
        "Content-Length": String(pdfBytes.byteLength),
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error desconocido"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

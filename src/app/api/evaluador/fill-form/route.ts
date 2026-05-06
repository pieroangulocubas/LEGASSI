import { NextRequest, NextResponse } from "next/server"
import { PDFDocument } from "pdf-lib"
import { readFile } from "fs/promises"
import path from "path"
import type { PersonalData } from "@/app/herramientas/evaluador-regularizacion/types"

export const maxDuration = 60

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

// ─── Payload types ────────────────────────────────────────────────────────────

interface RepresentanteData {
  nombre: string; primerApellido: string; segundoApellido: string; nif: string
  domicilio: string; piso: string; localidad: string; provincia: string; cp: string
  telefono: string; email: string
}

interface NotifData {
  domicilio: string; piso: string; localidad: string; provincia: string; cp: string
}

interface FillPayload {
  persons: PersonalData[]
  pathway: "DA20" | "DA21"
  annexes: string[]
  hasRepresentante?: boolean
  representante?: RepresentanteData | null
  notifData?: NotifData | null
  consiento?: boolean
}

// ─── PDF builder ──────────────────────────────────────────────────────────────

async function buildPersonDoc(
  data: PersonalData,
  pathway: "DA20" | "DA21",
  annexes: string[],
  opts?: { representante?: RepresentanteData | null; notifData?: NotifData | null; consiento?: boolean },
): Promise<PDFDocument> {
  const formDir = path.join(process.cwd(), "public", "forms", pathway)
  const mainBytes = await readFile(path.join(formDir, MAIN_FILE[pathway]))
  const mainDoc = await PDFDocument.load(mainBytes)
  const form = mainDoc.getForm()

  // Parse YYYY-MM-DD
  const [year = "", month = "", day = ""] = (data.fechaNacimiento || "").split("-")

  // Sección 1: datos personales
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
    setCheckBox(form, "Casilla de verificación141", data.sexo === "H")
    setCheckBox(form, "Casilla de verificación142", data.sexo === "M")
    setCheckBox(form, "Casilla de verificación143", data.estadoCivil === "S")
    setCheckBox(form, "Casilla de verificación144", data.estadoCivil === "C")
    setCheckBox(form, "Casilla de verificación145", data.estadoCivil === "V")
    setCheckBox(form, "Casilla de verificación146", data.estadoCivil === "D")
    setCheckBox(form, "Casilla de verificación147", data.estadoCivil === "Sp")
    setCheckBox(form, "Casilla de verificación148", true)
    setText(form, "Texto50", data.numExpedientePi)
  } else {
    setCheckBox(form, "Casilla de verificación165", data.sexo === "H")
    setCheckBox(form, "Casilla de verificación166", data.sexo === "M")
    setCheckBox(form, "Casilla de verificación167", data.estadoCivil === "S")
    setCheckBox(form, "Casilla de verificación168", data.estadoCivil === "C")
    setCheckBox(form, "Casilla de verificación169", data.estadoCivil === "V")
    setCheckBox(form, "Casilla de verificación170", data.estadoCivil === "D")
    setCheckBox(form, "Casilla de verificación171", data.estadoCivil === "Sp")
    setCheckBox(form, "Casilla de verificación172", true)
    const sup = data.da21Supuesto
    setCheckBox(form, "Casilla de verificación173", sup.includes("work_history") || sup.includes("job_offer") || sup.includes("self_employed"))
    setCheckBox(form, "Casilla de verificación174", sup.includes("family"))
    setCheckBox(form, "Casilla de verificación175", sup.includes("vulnerability"))
  }

  // Sección 2: representante (best-guess field names, fails silently if wrong)
  const rep = opts?.representante
  if (rep) {
    setText(form, "Texto24", rep.nombre)
    setText(form, "Texto25", rep.primerApellido)
    setText(form, "Texto26", rep.segundoApellido)
    setText(form, "Texto27", rep.nif)
    setText(form, "Texto28", rep.domicilio)
    setText(form, "Texto29", rep.piso)
    setText(form, "Texto30", rep.localidad)
    setText(form, "Texto31", rep.cp)
    setText(form, "Texto32", rep.provincia)
    setText(form, "Texto33", rep.telefono)
    setText(form, "Texto34", rep.email)
  }

  // Sección 3: domicilio a efectos de notificaciones
  const notif = opts?.notifData
  if (notif) {
    setText(form, "Texto36", notif.domicilio)
    setText(form, "Texto37", notif.piso)
    setText(form, "Texto38", notif.localidad)
    setText(form, "Texto39", notif.cp)
    setText(form, "Texto40", notif.provincia)
  }

  // Consiento
  setCheckBox(form, "Casilla de verificación176", opts?.consiento ?? true)

  form.flatten()

  const personDoc = await PDFDocument.create()
  const mainPages = await personDoc.copyPages(mainDoc, mainDoc.getPageIndices())
  mainPages.forEach((p) => personDoc.addPage(p))

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

export async function POST(req: NextRequest) {
  let body: FillPayload
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Petición no válida." }, { status: 400 })
  }

  const { persons, pathway, annexes = [], hasRepresentante, representante, notifData, consiento = true } = body

  if (!persons || persons.length === 0) {
    return NextResponse.json({ error: "Se requiere al menos una persona." }, { status: 400 })
  }
  if (persons.length > 10) {
    return NextResponse.json({ error: "Máximo 10 personas por descarga." }, { status: 400 })
  }

  try {
    const mergedDoc = await PDFDocument.create()

    for (const person of persons) {
      const personDoc = await buildPersonDoc(person, pathway, annexes, {
        representante: hasRepresentante ? representante : null,
        notifData,
        consiento,
      })
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

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
  nombre: string; nie: string
  domicilio: string; piso: string; localidad: string; provincia: string; cp: string
  telefono: string; email: string
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

// EX32 field map (verified from labeled PDF inspection):
//
// Section 1 — Datos de la persona extranjera:
//   Texto1=Pasaporte  Texto2=NIE-letra  Texto3=NIE-num  Texto4=NIE-check
//   Texto5=1erApellido  Texto6=2ºApellido  Texto7=Nombre
//   Texto8=día-nac  Texto9=mes-nac  Texto10=año-nac  Texto11=Lugar  Texto12=País
//   Texto13=Nacionalidad  Texto14=NombrePadre  Texto15=NombreMadre
//   Texto16=Domicilio  Texto17=Nº  Texto18=Piso  Texto19=Localidad
//   Texto20=CP  Texto21=Provincia  Texto22=Teléfono  Texto23=Email
//   Texto24=RepLegal-nombre  Texto25=RepLegal-DNI  Texto26=RepLegal-Título
//
// Section 2 — Datos del representante:
//   Texto27=Nombre/RazónSocial  Texto28=DNI/NIE/PAS  Texto29=Domicilio
//   Texto30=Nº  Texto31=Piso  Texto32=Localidad  Texto33=CP  Texto34=Provincia
//   Texto35=Teléfono  Texto36=Email
//   Texto37=RepLegal-nombre  Texto38=RepLegal-DNI  Texto39=RepLegal-Título
//
// Section 3 — Domicilio a efectos de notificaciones:
//   Texto40=Nombre/RazónSocial  Texto41=DNI/NIE/PAS  Texto42=Domicilio
//   Texto43=Nº  Texto44=Piso  Texto45=Localidad  Texto46=CP  Texto47=Provincia
//   Texto48=Teléfono  Texto49=Email
//
// Section 4 — Tipo de autorización (checkboxes):
//   Casilla164=SexoX  Casilla165=SexoH  Casilla166=SexoM
//   Casilla167=EstCivS  Casilla168=C  Casilla169=V  Casilla170=D  Casilla171=Sp
//   Casilla172=Irregular  Casilla173=Trabajo  Casilla174=Familia  Casilla175=Vulnerabilidad
//   Casilla176=HijoMenorNacidoES  Casilla177=HijoMenorNONacidoES
//   Casilla178=FamiliarDA21  Casilla179=PrórrogaEmpleo  Casilla180=PrórrogaEnfermedad
//   Casilla181=CONSIENTO

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

  const [year = "", month = "", day = ""] = (data.fechaNacimiento || "").split("-")
  const fullName = [data.nombre, data.primerApellido, data.segundoApellido].filter(Boolean).join(" ")

  // ── Sección 1: Datos de la persona extranjera ──────────────────────────────
  setText(form, "Texto1",  data.pasaporte)
  // NIE: split X-1234567-A into 3 boxes
  const nieParts = (data.nie || "").replace(/-/g, "").toUpperCase()
  if (nieParts.length >= 2) {
    setText(form, "Texto2", nieParts[0])
    setText(form, "Texto3", nieParts.slice(1, -1))
    setText(form, "Texto4", nieParts[nieParts.length - 1])
  } else {
    setText(form, "Texto3", data.nie)
  }
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
  // Texto17 = Nº — skipped (typically included in domicilio string)
  setText(form, "Texto18", data.piso)
  setText(form, "Texto19", data.localidad)
  setText(form, "Texto20", data.cp)
  setText(form, "Texto21", data.provincia)
  setText(form, "Texto22", data.telefono)
  setText(form, "Texto23", data.email)
  // Texto24-26: rep legal de la sección 1 — leave blank (same-day presenter)

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
    // EX32 checkboxes (verified positions)
    setCheckBox(form, "Casilla de verificación165", data.sexo === "H")
    setCheckBox(form, "Casilla de verificación166", data.sexo === "M")
    setCheckBox(form, "Casilla de verificación167", data.estadoCivil === "S")
    setCheckBox(form, "Casilla de verificación168", data.estadoCivil === "C")
    setCheckBox(form, "Casilla de verificación169", data.estadoCivil === "V")
    setCheckBox(form, "Casilla de verificación170", data.estadoCivil === "D")
    setCheckBox(form, "Casilla de verificación171", data.estadoCivil === "Sp")
    setCheckBox(form, "Casilla de verificación172", true) // situación irregular
    const sup = data.da21Supuesto
    setCheckBox(form, "Casilla de verificación173", sup.includes("work_history") || sup.includes("job_offer") || sup.includes("self_employed"))
    setCheckBox(form, "Casilla de verificación174", sup.includes("family"))
    setCheckBox(form, "Casilla de verificación175", sup.includes("vulnerability"))
    // Casilla 181 = CONSIENTO (verified)
    setCheckBox(form, "Casilla de verificación181", opts?.consiento ?? true)
  }

  // ── Sección 2: Datos del representante ────────────────────────────────────
  const rep = opts?.representante
  if (rep) {
    const repFullName = [rep.nombre, rep.primerApellido, rep.segundoApellido].filter(Boolean).join(" ")
    setText(form, "Texto27", repFullName)
    setText(form, "Texto28", rep.nif)
    setText(form, "Texto29", rep.domicilio)
    // Texto30 = Nº — skipped
    setText(form, "Texto31", rep.piso)
    setText(form, "Texto32", rep.localidad)
    setText(form, "Texto33", rep.cp)
    setText(form, "Texto34", rep.provincia)
    setText(form, "Texto35", rep.telefono)
    setText(form, "Texto36", rep.email)
  }

  // ── Sección 3: Domicilio a efectos de notificaciones ──────────────────────
  const notif = opts?.notifData
  if (notif) {
    setText(form, "Texto40", notif.nombre || fullName)
    setText(form, "Texto41", notif.nie || data.nie || data.pasaporte)
    setText(form, "Texto42", notif.domicilio)
    // Texto43 = Nº — skipped
    setText(form, "Texto44", notif.piso)
    setText(form, "Texto45", notif.localidad)
    setText(form, "Texto46", notif.cp)
    setText(form, "Texto47", notif.provincia)
    setText(form, "Texto48", notif.telefono || data.telefono)
    setText(form, "Texto49", notif.email || data.email)
  }

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

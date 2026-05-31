import type {
  QuizAnswers, EligibilityResult, ChecklistItem, Pathway,
} from "./types"
import { evaluatePermitAndEx25 } from "./logic/ex25"
import { buildDa20CaseChecklist } from "./logic/da20"
import { buildDa21CaseChecklist, buildDa21NoSupuestoIneligible } from "./logic/da21"
import { buildIneligibleResult } from "./logic/results"
import { buildFamilyDocsChecklist } from "./logic/familyDocs"

function deadlineDays(): number {
  return Math.max(0, Math.ceil((new Date("2026-06-30").getTime() - Date.now()) / 86_400_000))
}

export function evaluateEligibility(answers: QuizAnswers): EligibilityResult {
  const days = deadlineDays()


  // Hard disqualifiers
  if (!answers.inSpainBefore2026) {
    return buildIneligibleResult({
      days,
      reason:
        "Este proceso exige haber estado en Espana antes del 1 de enero de 2026. Si llegaste despues, no puedes acogerte al RD 316/2026.",
      recommendations: [
        "Consulta con nuestros asesores sobre otras vias de regularizacion disponibles para tu situacion.",
      ],
    })
  }

  const permitOrEx25Result = evaluatePermitAndEx25(answers, days)
  if (permitOrEx25Result) return permitOrEx25Result

  if (answers.isUkrainian) {
    return buildIneligibleResult({
      days,
      reason:
        "Los beneficiarios de la Proteccion Temporal Ucraniana estan excluidos de este proceso por normativa especifica.",
      recommendations: [
        "La proteccion temporal ucraniana tiene su propia regulacion y plazos. Consulta con nuestros asesores.",
      ],
    })
  }
  // ── Pathway ────────────────────────────────────────────────────────────────
  const pathway: Pathway = answers.hasPiHistory ? "DA20" : "DA21"
  const supuesto = answers.da21Supuesto

  // ── Family analysis ────────────────────────────────────────────────────────
  const fm = answers.familyMembers
  const hasSpouse = fm.includes("spouse_partner")
  const hasMinorChildren = fm.includes("minor_children") || answers.familyType === "minor_children"
  const hasAdultDisabled = fm.includes("adult_disabled_children") || answers.familyType === "adult_disabled"
  const hasAscendants = fm.includes("cohabiting_ascendants") || answers.familyType === "ascendants"
  const hasSimultaneousFamily = hasSpouse || hasAscendants
  // DA20 family is always simultaneous; DA21 depends on user answer
  const effectiveFamilySimultaneous =
    (pathway === "DA20" && answers.da20IncludesFamily === true && answers.familyType !== null) ||
    answers.familySimultaneous === true

  // Effective supuesto: si da21Supuesto === "family" y tiene familiares, vale como supuesto b)
  const familyQualifies = hasMinorChildren || hasAdultDisabled || hasAscendants
  const effectiveSupuesto = supuesto ?? (pathway === "DA21" && familyQualifies ? "family" : null)
  const hasEffectiveSupuesto = effectiveSupuesto !== null
  const effectivePathwayReady = pathway === "DA20" || hasEffectiveSupuesto

  // DA21 sin supuesto → inelegible
  if (pathway === "DA21" && !hasEffectiveSupuesto) {
    return buildDa21NoSupuestoIneligible(days)
  }

  // ── Score ──────────────────────────────────────────────────────────────────
  const noDocs = answers.permanenceDocs.includes("none")
  const docCount = noDocs ? 0 : answers.permanenceDocs.length
  const hasDocs = !noDocs && docCount > 0

  let score = 20

  if (effectivePathwayReady) {
    score += 30
    if (pathway === "DA21" && (effectiveSupuesto === "work_history" || effectiveSupuesto === "job_offer")) score += 5
    if (pathway === "DA21" && familyQualifies) score += 3
  }

  if (docCount >= 3) score += 25
  else if (docCount >= 1) score += 15

  if (answers.criminalStatus === "clean") score += 15
  else if (answers.criminalStatus === "maybe_origin") score += 8
  else if (answers.criminalStatus === "unknown") score += 5

  if (answers.passportStatus === "valid") score += 10
  else if (answers.passportStatus === "expired") score += 3

  score = Math.min(score, 100)

  let scoreLabel: string
  if (score >= 85) scoreLabel = "Excelente"
  else if (score >= 70) scoreLabel = "Bueno"
  else if (score >= 50) scoreLabel = "Con posibilidades"
  else scoreLabel = "Necesita refuerzo"

  // ── Checklist ──────────────────────────────────────────────────────────────
  const checklist: ChecklistItem[] = []
  const formName = pathway === "DA20" ? "EX31" : "EX32"

  // ── 1. IDENTITY ───────────────────────────────────────────────────────────
  checklist.push({
    id: "passport",
    label: "Pasaporte completo — todas las páginas escaneadas",
    status: answers.passportStatus === "valid" ? "available" : answers.passportStatus === "expired" ? "warning" : "missing",
    section: "identity",
    detail: answers.passportStatus !== "valid"
      ? "Imprescindible y debe estar vigente. Renuévalo en el consulado. Escanea TODAS las páginas del pasaporte — no solo la hoja de datos personales."
      : "Escanea TODAS las páginas: hoja de datos, páginas de sellos, páginas en blanco y contraportada. No es válido presentar únicamente la hoja de datos.",
    uploadable: true,
    uploadHint: "Pasaporte o documento de viaje. Extrae: nombre, apellidos, fecha de nacimiento, lugar y país de nacimiento, nacionalidad, número de pasaporte, sexo.",
    criteria: ["Vigente en la fecha de solicitud", "Todas las páginas incluidas", "Datos personales legibles", "Número de pasaporte visible"],
  })
  // ── 2. CASE-SPECIFIC ──────────────────────────────────────────────────────
  if (pathway === "DA20") {
    checklist.push(...buildDa20CaseChecklist())
  } else {
    checklist.push(...buildDa21CaseChecklist({
      effectiveSupuesto,
      hasMinorChildren,
      hasAdultDisabled,
      hasAscendants,
    }))
  }

  // ── 3. CRIMINAL ───────────────────────────────────────────────────────────
  checklist.push({
    id: "criminal_spain",
    label: "Certificado de Antecedentes Penales de España",
    status: answers.criminalStatus === "has_spain" ? "warning" : "info",
    section: "criminal",
    optional: true,
    detail: answers.criminalStatus === "has_spain"
      ? "ATENCIÓN: Tienes antecedentes en España. Esto puede bloquear la regularización. Consulta urgentemente sobre la cancelación de antecedentes."
      : "Opcional: la Administración puede solicitarlo de oficio. Sin embargo, si lo aportas tú, el expediente se resuelve antes. Solicítalo gratis en el Ministerio de Justicia (presencial o sede electrónica).",
    uploadable: true,
    uploadHint: "Certificado de antecedentes penales de España (Registro Central de Penados). Verifica si hay anotaciones activas.",
    criteria: ["Sin anotaciones activas", "Expedido por el Ministerio de Justicia", "Emitido hace menos de 3 meses"],
  })
  checklist.push({
    id: "criminal_origin",
    label: "Antecedentes penales del país de origen (y de los países donde hayas residido legalmente en los 5 años previos a llegar a España)",
    status: answers.criminalStatus === "maybe_origin" || answers.criminalStatus === "has_spain" || answers.criminalStatus === "unknown"
      ? "warning" : "available",
    section: "criminal",
    detail: "Apostillado (Convenio de La Haya) + traducción jurada si no está en español. Si no lo recibes en 1 mes, usa los Anexos I-1 (declaración de imposibilidad) e I-2 (solicitud diplomática) del formulario.",
    uploadable: true,
    uploadHint: "Certificado de antecedentes penales del país de origen. Verifica apostilla, traducción jurada y si hay anotaciones.",
    criteria: ["Apostillado (Convenio de La Haya)", "Traducción jurada al español", "Sin condenas graves activas", "Fecha reciente de expedición"],
    annexActions: [
      { id: "03", label: "No puedo obtenerlo — Declaración de imposibilidad (Anexo I-1)", hint: "Si el certificado no puede obtenerse por causas ajenas a ti, el Anexo I-1 documenta la imposibilidad" },
      { id: "04", label: "Solicitar vía diplomática — Solicitud al Ministerio (Anexo I-2)", hint: "El Anexo I-2 solicita el certificado directamente al país de origen a través del Ministerio" },
    ],
  })

  // ── 4 & 5. FAMILY DOCS ───────────────────────────────────────────────────
  checklist.push(...buildFamilyDocsChecklist({
    answers,
    hasSpouse,
    hasMinorChildren,
    hasAdultDisabled,
    hasAscendants,
    effectiveFamilySimultaneous,
  }))

  checklist.push({
    id: "permanence_other",
    label: "Pruebas de permanencia ininterrumpida en España (5 meses previos a la solicitud)",
    status: "missing",
    section: "permanence",
    isClasificadorResult: true,
    detail: "Usa el Clasificador de documentos para verificar que cubres los 5 meses sin lagunas. El resultado aparece aquí automáticamente cuando usas esa herramienta.",
    linkLabel: "Verificar permanencia con el Clasificador",
    linkHref: "/herramientas/permanencia",
    isClassificadorLink: true,
    criteria: ["Cubre los 5 meses previos a la solicitud", "Tu nombre visible (nominativo)", "Fechado con día, mes y año", "Emitido en España"],
  })

  // ── 6. ADMIN ──────────────────────────────────────────────────────────────
  checklist.push({
    id: "fee_payment",
    label: "Pago de tasas — Modelo 790 código 052 (38,28 € adulto · 10,94 € menor)",
    status: pathway === "DA20" ? "missing" : "info",
    section: "admin",
    optional: pathway !== "DA20",
    detail: pathway === "DA20"
      ? "Como solicitante de PI dispones de NIE. Genera el Modelo 790-052 en la sede electrónica del Ministerio del Interior y págalo en banco colaborador o telemáticamente. Uno por persona (incluidos menores y cónyuge)."
      : "La tasa se paga con el Modelo 790-052. Si aún no tienes NIE, se te asignará en la cita de presentación en la oficina de extranjería — genera y paga la tasa con ese NIE antes de entregar el expediente.",
    uploadable: true,
    uploadHint: "Justificante de pago del Modelo 790 código 052. Verifica: código 052, importe, nombre del solicitante, sello o validación bancaria.",
    criteria: ["Modelo 790 código 052", "Importe correcto (38,28€ adulto / 10,94€ menor)", "Nombre del solicitante", "Sello bancario o validación electrónica"],
  })
  checklist.push({
    id: "form",
    label: `Formulario ${formName} cumplimentado y firmado`,
    status: "missing",
    section: "admin",
    detail: `Formulario oficial ${formName} del Ministerio. Puedes rellenarlo con la herramienta de abajo o descargarlo desde la web del Ministerio.${hasMinorChildren ? ` Los datos de los menores van en el Anexo 02 del ${formName}.` : ""}`,
  })

  // ── Recommendations ────────────────────────────────────────────────────────
  const recommendations: string[] = []

  if (!effectivePathwayReady && pathway === "DA21") {
    recommendations.push(
      "No has indicado ningún supuesto DA21. Necesitas al menos uno. Si no tienes trabajo ni familia a cargo, el Certificado de Vulnerabilidad puede ser tu vía — acude a los Servicios Sociales de tu ayuntamiento o a una entidad RECEX.",
    )
  }

  if (hasSimultaneousFamily) {
    recommendations.push(
      `Tu ${hasSpouse && hasAscendants ? "cónyuge/pareja y tus ascendientes" : hasSpouse ? "cónyuge/pareja" : "ascendiente"} pueden presentar la solicitud SIMULTÁNEAMENTE contigo (DA21 aptdo. 3). No necesitan acreditar ningún supuesto a/b/c propio — se benefician de tu cualificación. Ambas solicitudes se resuelven juntas. Incluye sus documentos en el mismo expediente.`,
    )
  }

  if (hasMinorChildren) {
    const bornInSpain = answers.minorsBornInSpain
    const authNote = answers.bothParentsCohabiting === false
      ? answers.otherParentInSpain
        ? " Necesitas la autorización notarial del otro progenitor, legalizada ante notario español."
        : " Necesitas la autorización notarial del otro progenitor, apostillada desde el extranjero."
      : ""
    recommendations.push(
      bornInSpain === "all"
        ? `Los datos de tus hijos menores se incluyen en el Anexo 02 del formulario ${formName}. Al haber nacido en España, no necesitan acreditar permanencia propia. Tasa: 10,94€ por menor.${authNote}`
        : bornInSpain === "none"
          ? `Los datos de tus hijos menores se incluyen en el Anexo 02 del formulario ${formName}. Al no haber nacido en España, deben acreditar 5 meses de permanencia. Tasa: 10,94€ por menor.${authNote}`
          : `Los datos de tus hijos menores se incluyen en el Anexo 02 del formulario ${formName}. Los nacidos fuera de España deben acreditar 5 meses de permanencia; los nacidos en España no. Tasa: 10,94€ por menor.${authNote}`,
    )
  }

  if (hasAdultDisabled) {
    recommendations.push(
      "El hijo/a mayor con discapacidad te habilita para el supuesto b) (DA21). La discapacidad debe implicar necesidad de apoyo o incapacidad objetiva para valerse. Incluye certificado oficial de discapacidad o dependencia, más empadronamiento conjunto.",
    )
  }

  if (hasAscendants) {
    recommendations.push(
      "Para el supuesto b) con ascendientes: la convivencia debe estar acreditada mediante empadronamiento colectivo. El ascendiente puede también solicitar simultáneamente bajo DA21 aptdo. 3 sin necesitar supuesto propio.",
    )
  }

  if (!hasDocs) {
    recommendations.push(
      "La acreditación de los 5 meses de permanencia es el requisito más delicado. Reúne ya todo documento nominativo y fechado. El Clasificador de Documentos verifica si cubres el período completo.",
    )
  } else if (docCount < 3) {
    recommendations.push("Refuerza tu expediente de permanencia. Cuanta más evidencia, mejor respaldada estará tu solicitud.")
  }

  if (answers.criminalStatus === "has_spain") {
    recommendations.push(
      "ATENCIÓN: Los antecedentes penales en España pueden bloquear la regularización. Consulta urgentemente sobre cancelación de antecedentes penales o policiales antes de presentar.",
    )
  }

  if (answers.passportStatus !== "valid") {
    recommendations.push(
      "El pasaporte vigente es imprescindible. Renuévalo urgentemente en tu consulado. El plazo cierra el 30 de junio de 2026.",
    )
  }

  if (effectiveSupuesto === "vulnerability") {
    recommendations.push(
      "El Certificado de Vulnerabilidad es gratuito. Lo emiten entidades RECEX (Cruz Roja, Cáritas, ACNUR…) y Servicios Sociales. No necesitas ser usuario habitual. Solicítalo cuanto antes: la demanda es alta.",
    )
  }

  if (days <= 55) {
    recommendations.push(`Quedan ~${days} días para el cierre (30 jun 2026). No esperes para reunir la documentación.`)
  }

  return {
    eligible: true,
    pathway,
    score,
    scoreLabel,
    checklist,
    recommendations,
    formName,
    formUrl: pathway === "DA20"
      ? "/forms/DA20/EX31_01_Solicitud_Datos_Personales_y_Tipo_Autorizacion.pdf"
      : "/forms/DA21/EX32_01_Solicitud_Datos_Personales_y_Tipo_Autorizacion.pdf",
    deadlineDays: days,
    hasSimultaneousFamily,
  }
}

export { generateFamilyChecklist, getFamilyMemberChecklist } from "./logic/familyChecklists"

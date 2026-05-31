import type { ChecklistItem, EligibilityResult, QuizAnswers } from "../types"
import { buildIneligibleResult } from "./results"

function buildEx25Checklist(): ChecklistItem[] {
  return [
    {
      id: "parent_residencia",
      label: "Permiso de residencia del padre/madre en vigor",
      status: "available",
      section: "identity",
      detail: "Tu permiso de residencia acredita que cumples el requisito del titular. Debe estar vigente.",
      uploadable: true,
      uploadHint: "Tarjeta de residencia o permiso de residencia. Extrae: nombre del titular, numero NIE, fecha de caducidad.",
      criteria: ["En vigor (no caducado)", "Nombre del titular visible", "Numero NIE legible"],
    },
    {
      id: "children_birth_cert",
      label: "Partida de nacimiento apostillada de cada hijo menor",
      status: "missing",
      section: "minors",
      detail: "Una por hijo. Certifica la filiacion. Si esta en otro idioma: apostilla + traduccion jurada al espanol.",
      uploadable: true,
      uploadHint: "Partida de nacimiento del hijo menor. Extrae: nombre del menor, fecha de nacimiento, nombres de los padres.",
      criteria: ["Apostillada (Convenio de La Haya)", "Nombre del menor y de los padres", "Traduccion jurada si no esta en espanol"],
    },
    {
      id: "children_passport_ex25",
      label: "Pasaporte o documento de viaje del menor - todas las paginas escaneadas",
      status: "missing",
      section: "minors",
      detail: "Imprescindible como documento de identidad. Si esta caducado, renuevalo en el consulado. Escanea TODAS las paginas.",
      uploadable: true,
      uploadHint: "Pasaporte del menor. Extrae: nombre, apellidos, fecha de nacimiento, numero de pasaporte, nacionalidad.",
      criteria: ["Vigente (no caducado)", "Todas las paginas incluidas", "Datos del menor legibles", "Numero de pasaporte visible"],
    },
    {
      id: "children_schooling_ex25",
      label: "Certificado de escolarizacion del menor",
      status: "info",
      section: "minors",
      optional: true,
      detail: "Refuerza la prueba de permanencia y arraigo en Espana, especialmente para el art. 160. Solicitalo en el centro educativo.",
      uploadable: true,
      uploadHint: "Certificado de escolarizacion o matricula escolar. Extrae: nombre del menor, nombre del centro, curso, municipio.",
      criteria: ["Nombre del menor", "Centro educativo y municipio", "Curso o periodo academico"],
    },
    {
      id: "children_empadronamiento_ex25",
      label: "Empadronamiento del menor en Espana - individual o familiar",
      status: "missing",
      section: "permanence",
      detail: "Prueba la residencia del menor en Espana. Solicita tambien el empadronamiento historico si es posible.",
      uploadable: true,
      uploadHint: "Certificado de empadronamiento del menor. Extrae: nombre del menor, domicilio, fecha de alta en padron.",
      criteria: ["Nombre del menor visible", "Domicilio en Espana", "Fecha de alta en padron", "Sello del ayuntamiento"],
    },
    {
      id: "children_permanence_ex25",
      label: "Otras pruebas de permanencia del menor en Espana - 5 meses (solo si no nacio en Espana, art. 160)",
      status: "missing",
      section: "permanence",
      detail: "Si el hijo nacio en Espana (art. 159) no se exige. Si no nacio en Espana (art. 160), acredita 5 meses de permanencia ininterrumpida: empadronamiento, informes escolares, medicos pediatricos.",
      uploadable: true,
      uploadHint: "Documentos de permanencia del menor en Espana: empadronamiento, informes escolares o medicos pediatricos.",
      criteria: ["5 meses de permanencia acreditados", "Nombre del menor visible", "Fechado con dia, mes y ano"],
    },
    {
      id: "fee_ex25",
      label: "Pago de tasas - Modelo 790 codigo 052 (10,94 EUR por menor)",
      status: "missing",
      section: "admin",
      detail: "Tasa reducida para menores. Genera el Modelo 790-052 en la sede electronica y pagalo. Uno por cada hijo que presentes.",
      uploadable: true,
      uploadHint: "Justificante de pago del Modelo 790 codigo 052 para menor. Verifica: codigo 052, importe 10,94EUR, nombre del menor.",
      criteria: ["Modelo 790 codigo 052", "Importe 10,94EUR", "Nombre del menor", "Sello bancario o validacion electronica"],
    },
    {
      id: "form_ex25",
      label: "Formulario EX25 cumplimentado y firmado",
      status: "missing",
      section: "admin",
      detail: "Formulario oficial EX25 - Solicitud de residencia por circunstancias excepcionales para menores (Disposicion Transitoria Primera). Uno por cada hijo menor.",
    },
  ]
}

function buildEx25EligibleResult(days: number): EligibilityResult {
  return {
    eligible: true,
    pathway: "EX25_children",
    score: 70,
    scoreLabel: "Bueno",
    checklist: buildEx25Checklist(),
    recommendations: [
      "Como titular de residencia vigente, tramitas la regularizacion de tus hijos via EX25 (Disposicion Transitoria Primera del RD 316/2026), no mediante EX31/EX32.",
      "Art. 159 - Hijos nacidos en Espana: no necesitan acreditar permanencia propia.",
      "Art. 160 - Hijos no nacidos en Espana: deben demostrar 5 meses de permanencia ininterrumpida en Espana antes de la solicitud.",
      "Presenta todos los EX25 a la vez y adjunta tu permiso de residencia en vigor. La tasa por menor es 10,94EUR.",
      "El plazo de presentacion cierra el 30 de junio de 2026.",
    ],
    formName: "EX25",
    formUrl: null,
    deadlineDays: days,
    hasSimultaneousFamily: false,
    isEX25Path: true,
  }
}

export function evaluatePermitAndEx25(
  answers: QuizAnswers,
  days: number
): EligibilityResult | null {
  if (answers.permitStatus === "pending_procedure") {
    return buildIneligibleResult({
      days,
      reason:
        "Tienes un procedimiento de residencia pendiente de resolucion. La normativa excluye a quienes ya tienen un tramite activo.",
      recommendations: [
        "Espera la resolucion de tu procedimiento. Si te deniegan, podrias explorar otras vias. Contacta con nuestros asesores.",
      ],
    })
  }

  if (answers.permitStatus !== "has_permit") return null

  if (answers.hasChildrenToRegularize) {
    return buildEx25EligibleResult(days)
  }

  return buildIneligibleResult({
    days,
    reason:
      "Ya tienes un permiso de residencia o estancia vigente. Este proceso es solo para personas sin documentacion en vigor.",
    recommendations: [
      "Si tu permiso esta proximo a caducar, consulta con nuestros asesores sobre la renovacion.",
    ],
  })
}

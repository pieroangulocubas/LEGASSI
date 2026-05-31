import type { ChecklistItem, DA21Supuesto, EligibilityResult } from "../types"
import { buildIneligibleResult } from "./results"

export function buildDa21NoSupuestoIneligible(days: number): EligibilityResult {
  return buildIneligibleResult({
    days,
    reason:
      "Para acogerte a la DA21 debes cumplir al menos uno de los supuestos: historial laboral, oferta de empleo, cuenta propia, familia a cargo o certificado de vulnerabilidad. Sin acreditar ninguno, la solicitud no puede prosperar.",
    recommendations: [
      "Si no tienes trabajo ni familia a cargo, el Certificado de Vulnerabilidad puede ser tu via. Lo emiten gratuitamente Cruz Roja, Caritas, ACNUR, Medicos del Mundo y Servicios Sociales del ayuntamiento. Solicitalo cuanto antes.",
    ],
  })
}

export function buildDa21CaseChecklist(params: {
  effectiveSupuesto: DA21Supuesto | null
  hasMinorChildren: boolean
  hasAdultDisabled: boolean
  hasAscendants: boolean
}): ChecklistItem[] {
  const { effectiveSupuesto, hasMinorChildren, hasAdultDisabled, hasAscendants } = params
  const checklist: ChecklistItem[] = []

  if (!effectiveSupuesto) {
    checklist.push({
      id: "supuesto_missing",
      label: "Documentacion del supuesto DA21 (ninguno seleccionado)",
      status: "missing",
      section: "case",
      detail:
        "Debes acreditar al menos uno: actividad laboral, unidad familiar con dependientes, o certificado de vulnerabilidad.",
    })
    return checklist
  }

  if (effectiveSupuesto === "work_history") {
    checklist.push({
      id: "work_history",
      label: "Prueba de actividad laboral - nominas, contratos o vida laboral TGSS",
      status: "available",
      section: "case",
      detail: "Informe de vida laboral + contratos/nominas. El contrato debe cubrir >=90 dias por ano.",
      uploadable: true,
      uploadHint:
        "Nomina, contrato de trabajo o informe de vida laboral de la Seguridad Social. Extrae: nombre del trabajador, empresa, fechas, salario si visible.",
      criteria: [
        "Nombre del trabajador",
        "Fechas de alta y baja",
        "Contratos con >=90 dias/ano",
        "Expedido por TGSS o empresa",
      ],
    })
  }

  if (effectiveSupuesto === "job_offer") {
    checklist.push({
      id: "job_offer",
      label: "Oferta de trabajo - contrato minimo 90 dias/ano firmado por el empleador",
      status: "available",
      section: "case",
      detail: "Firmado por el empleador, especificando duracion y condiciones.",
      uploadable: true,
      uploadHint:
        "Contrato de trabajo u oferta de empleo. Extrae: nombre del trabajador, nombre del empleador, duracion del contrato, jornada.",
      criteria: [
        "Firmado por el empleador",
        "Duracion minima 90 dias/ano",
        "Condiciones de trabajo visibles",
        "Nombre del trabajador",
      ],
    })
  }

  if (effectiveSupuesto === "self_employed") {
    checklist.push({
      id: "self_employed",
      label: "Declaracion de intencion de alta como autonomo o actividad por cuenta propia",
      status: "available",
      section: "case",
      detail:
        "Declaracion responsable de actividad economica por cuenta propia. Consulta con nuestros asesores el formato exacto.",
      uploadable: true,
      uploadHint: "Declaracion de actividad por cuenta propia o documentacion de autonomo.",
      criteria: ["Declaracion firmada", "Actividad economica especificada", "Nombre del solicitante"],
    })
  }

  if (effectiveSupuesto === "vulnerability") {
    checklist.push({
      id: "vulnerability_cert",
      label: "Certificado de Vulnerabilidad - Anexo II (entidad RECEX o Servicios Sociales)",
      status: "missing",
      section: "case",
      detail:
        "Siempre GRATUITO. Lo emite Cruz Roja, Caritas, ACNUR, Medicos del Mundo, Servicios Sociales del ayuntamiento u otras entidades RECEX. Debe incluir sello y numero RECEX.",
      uploadable: true,
      uploadHint:
        "Certificado de vulnerabilidad (Anexo II). Verifica: nombre del solicitante, entidad emisora, numero RECEX, sello.",
      criteria: ["Nombre del solicitante", "Entidad RECEX o Servicios Sociales", "Numero RECEX y sello oficial"],
    })
  }

  if (effectiveSupuesto === "family" && !hasMinorChildren && !hasAdultDisabled && !hasAscendants) {
    checklist.push({
      id: "family_docs",
      label: "Documentacion de unidad familiar",
      status: "available",
      section: "case",
      detail:
        "Libro de familia, certificados de nacimiento y/o certificados de discapacidad/dependencia. Empadronamiento conjunto acreditando la convivencia.",
      uploadable: true,
      uploadHint: "Documentacion familiar: libro de familia, certificados de nacimiento, empadronamiento colectivo.",
      criteria: ["Nombres de todos los familiares", "Vinculo familiar acreditado", "Empadronamiento conjunto incluido"],
    })
  }

  return checklist
}

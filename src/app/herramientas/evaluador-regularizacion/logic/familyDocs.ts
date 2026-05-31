import type { ChecklistItem, QuizAnswers } from "../types"

interface BuildFamilyDocsParams {
  answers: QuizAnswers
  hasSpouse: boolean
  hasMinorChildren: boolean
  hasAdultDisabled: boolean
  hasAscendants: boolean
  effectiveFamilySimultaneous: boolean
}

export function buildFamilyDocsChecklist(params: BuildFamilyDocsParams): ChecklistItem[] {
  const {
    answers,
    hasSpouse,
    hasMinorChildren,
    hasAdultDisabled,
    hasAscendants,
    effectiveFamilySimultaneous,
  } = params

  const checklist: ChecklistItem[] = []
  if (!hasMinorChildren && !hasAdultDisabled && !hasAscendants) return checklist

  const onlyChild = hasMinorChildren && answers.minorCount === 1
  const minorLabel = onlyChild ? "del menor" : "de los menores"
  const minorLabelCap = onlyChild ? "Del menor" : "De los menores"

  checklist.push({
    id: "family_empadronamiento_colectivo",
    label: "Empadronamiento colectivo familiar",
    status: "missing",
    section: "family",
    detail:
      "Certificado de empadronamiento que recoja a todos los convivientes en el mismo domicilio. Acredita la convivencia con el/los familiar/es a cargo.",
    uploadable: true,
    uploadHint: "Empadronamiento colectivo. Extrae: nombres de todos los convivientes, domicilio compartido, fecha de alta.",
    criteria: ["Todos los convivientes incluidos", "Domicilio compartido visible", "Sello del ayuntamiento"],
  })

  if (!effectiveFamilySimultaneous) {
    if (hasSpouse) {
      checklist.push({
        id: "spouse_docs",
        label: "Certificado de matrimonio o de pareja de hecho registrada",
        status: "missing",
        section: "family",
        detail: "Apostillado + traduccion jurada si no esta en espanol.",
        uploadable: true,
        uploadHint: "Certificado de matrimonio o pareja de hecho. Extrae: nombres de los conyuges, fecha del matrimonio/registro, lugar.",
        criteria: [
          "Apostillado (Convenio de La Haya)",
          "Nombres de ambos conyuges",
          "Fecha del matrimonio/registro",
          "Traduccion jurada si no esta en espanol",
        ],
      })
    }

    checklist.push({
      id: "family_passport_nie",
      label: hasMinorChildren
        ? onlyChild
          ? "Pasaporte o NIE del menor (si ya lo tuviera)"
          : "Pasaporte o NIE de los menores (si ya lo tuvieran)"
        : hasAdultDisabled
          ? "Pasaporte o NIE del hijo/a mayor con discapacidad (si ya lo tuviera)"
          : "Pasaporte o NIE del ascendiente (si ya lo tuviera)",
      status: "info",
      section: "family",
      optional: true,
      detail: "Si el familiar ya dispone de pasaporte vigente o NIE, incluyelo como documento de identidad.",
      uploadable: true,
      uploadHint: "Pasaporte o NIE del familiar. Extrae: nombre, numero de documento, fecha de caducidad.",
      criteria: ["Documento vigente o identificable", "Nombre del familiar visible"],
    })

    if (hasMinorChildren) {
      const bornInSpain = answers.minorsBornInSpain
      checklist.push({
        id: "minor_birth_cert",
        label: `Partida de nacimiento ${minorLabel}`,
        status: "missing",
        section: "family",
        detail: onlyChild
          ? "Certifica la filiacion. Si esta en otro idioma: apostilla del Convenio de La Haya + traduccion jurada al espanol."
          : "Una por cada hijo menor. Certifica la filiacion. Si esta en otro idioma: apostilla del Convenio de La Haya + traduccion jurada al espanol.",
        uploadable: true,
        uploadHint: "Partida de nacimiento del hijo menor. Extrae: nombre del menor, fecha de nacimiento, nombres de los padres.",
        criteria: [
          bornInSpain === "all" ? "Apostilla no requerida (nacido en Espana)" : "Apostillada (Convenio de La Haya)",
          "Nombre del menor y de los padres",
          "Fecha de nacimiento legible",
          bornInSpain === "all" ? "Registro Civil espanol" : "Traduccion jurada si no esta en espanol",
        ],
      })
      checklist.push({
        id: "minor_schooling",
        label: `Certificado de escolarizacion ${minorLabel}`,
        status: answers.minorsSchooled === true ? "available" : "info",
        section: "family",
        optional: answers.minorsSchooled !== true,
        detail:
          answers.minorsSchooled === true
            ? `${minorLabelCap} - escolarizado/a. Incluye el certificado: refuerza significativamente el arraigo.`
            : "Refuerza el arraigo en Espana. No es obligatorio pero es muy valorado.",
        uploadable: true,
        uploadHint: "Certificado de escolarizacion o matricula escolar del menor.",
        criteria: ["Nombre del menor", "Centro educativo y municipio", "Curso o periodo academico"],
      })
      if (answers.bothParentsCohabiting === false) {
        const inSpain = answers.otherParentInSpain
        checklist.push({
          id: "other_parent_auth",
          label: inSpain
            ? "Autorizacion del otro progenitor - legalizada ante notario espanol"
            : "Autorizacion del otro progenitor - apostillada",
          status: "missing",
          section: "family",
          detail: inSpain
            ? "El otro progenitor esta en Espana: la autorizacion debe estar legalizada ante notario espanol. No sirve autorizacion simple ni firma ante consul extranjero."
            : "El otro progenitor esta en el extranjero: apostillada segun el Convenio de La Haya + traduccion jurada al espanol.",
          uploadable: true,
          uploadHint: "Autorizacion parental notarial. Extrae: nombre del autorizante, nombre del menor, tipo de autorizacion, fecha.",
          criteria: inSpain
            ? ["Legalizada ante notario espanol", "Nombre del otro progenitor", "Nombre del menor", "Firma del notario espanol"]
            : ["Apostillada (Convenio de La Haya)", "Traduccion jurada al espanol", "Nombre del otro progenitor", "Nombre del menor"],
        })
      }
    }

    if (hasAscendants) {
      checklist.push({
        id: "titular_birth_cert",
        label: "Partida de nacimiento del solicitante (acredita parentesco con el ascendiente)",
        status: "missing",
        section: "family",
        detail:
          "Tu partida de nacimiento prueba que esa persona es tu padre/madre. Apostillada + traduccion jurada si no esta en espanol.",
        uploadable: true,
        uploadHint: "Partida de nacimiento del solicitante. Extrae: nombre del titular, nombres de los padres.",
        criteria: [
          "Nombre del solicitante y de los padres",
          "Apostillada si se expidio en el extranjero",
          "Traduccion jurada si no esta en espanol",
        ],
      })
    }

    if (hasAdultDisabled) {
      checklist.push({
        id: "adult_disabled_birth_cert",
        label: "Partida de nacimiento del hijo/a mayor con discapacidad",
        status: "missing",
        section: "family",
        detail: "Certifica la filiacion. Apostillada + traduccion jurada si no esta en espanol.",
        uploadable: true,
        uploadHint: "Partida de nacimiento del hijo/a mayor. Extrae: nombre, fecha de nacimiento, nombres de los padres.",
        criteria: [
          "Apostillada si se expidio en el extranjero",
          "Nombre del hijo/a y de los padres",
          "Traduccion jurada si no esta en espanol",
        ],
      })
      checklist.push({
        id: "adult_disabled_id",
        label: "Documento de identidad del hijo/a mayor (pasaporte o NIE)",
        status: "missing",
        section: "family",
        detail: "Pasaporte vigente o NIE del hijo/a mayor.",
        uploadable: true,
        uploadHint: "Pasaporte o NIE del hijo/a mayor. Extrae: nombre, numero de documento.",
        criteria: ["Vigente (no caducado)", "Nombre y datos del familiar legibles"],
      })
      checklist.push({
        id: "adult_disabled_cert",
        label: "Certificado de discapacidad, dependencia o enfermedad del hijo/a mayor",
        status: "warning",
        section: "family",
        detail: "Certificado oficial de discapacidad, resolucion de dependencia, o informe medico que acredite la incapacidad funcional.",
        uploadable: true,
        uploadHint: "Certificado de discapacidad o dependencia.",
        criteria: ["Nombre del familiar visible", "Diagnostico o grado de discapacidad/dependencia", "Expedido por organismo oficial"],
      })
      if (answers.bothParentsCohabiting === false) {
        const inSpain = answers.otherParentInSpain
        checklist.push({
          id: "other_parent_auth_disabled",
          label: inSpain
            ? "Autorizacion del otro progenitor - legalizada ante notario espanol"
            : "Autorizacion del otro progenitor - apostillada",
          status: "missing",
          section: "family",
          detail: inSpain
            ? "El otro progenitor esta en Espana: autorizacion legalizada ante notario espanol."
            : "El otro progenitor esta en el extranjero: apostillada + traduccion jurada al espanol.",
          uploadable: true,
          uploadHint: "Autorizacion parental notarial.",
          criteria: inSpain
            ? ["Legalizada ante notario espanol", "Nombre del otro progenitor", "Nombre del hijo/a", "Firma del notario"]
            : ["Apostillada (Convenio de La Haya)", "Traduccion jurada al espanol", "Nombre del otro progenitor"],
        })
      }
    }
  }

  return checklist
}

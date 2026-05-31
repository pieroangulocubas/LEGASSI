import type { ChecklistItem, FamilyMemberType, MinorsBornInSpain } from "../types"
export function generateFamilyChecklist(params: {
  type: FamilyMemberType
  count: number
  bornInSpain?: MinorsBornInSpain
  schooled?: boolean
  bothParentsCohabiting?: boolean
  otherParentInSpain?: boolean
  pathway: "DA20" | "DA21"
}): ChecklistItem[] {
  const { type, bornInSpain, schooled, bothParentsCohabiting, otherParentInSpain, pathway } = params
  const formName = pathway === "DA20" ? "EX31" : "EX32"
  const items: ChecklistItem[] = []

  if (type === "spouse_partner") {
    items.push(
      {
        id: "sp_passport",
        label: "Pasaporte del cónyuge/pareja — todas las páginas escaneadas",
        status: "missing", section: "identity",
        uploadable: true,
        uploadHint: "Pasaporte del cónyuge. Extrae: nombre, apellidos, fecha de nacimiento, número de pasaporte, nacionalidad.",
        criteria: ["Vigente (no caducado)", "Todas las páginas incluidas", "Datos personales legibles"],
      },
      {
        id: "sp_marriage_cert",
        label: "Certificado de matrimonio o de pareja de hecho registrada",
        status: "missing", section: "identity",
        detail: "Apostillado + traducción jurada si no está en español.",
        uploadable: true,
        uploadHint: "Certificado de matrimonio o pareja de hecho. Extrae: nombres de los cónyuges, fecha del matrimonio.",
        criteria: ["Apostillado (Convenio de La Haya)", "Nombres de ambos cónyuges", "Fecha del matrimonio/registro", "Traducción jurada si no está en español"],
      },
      {
        id: "sp_criminal",
        label: "Antecedentes penales del cónyuge (país de origen)",
        status: "missing", section: "criminal",
        detail: "Apostillado + traducción jurada al español.",
        uploadable: true,
        uploadHint: "Certificado de antecedentes penales del cónyuge. Verifica apostilla y traducción.",
        criteria: ["Apostillado", "Traducción jurada si no está en español", "Sin condenas graves"],
        annexActions: [
          { id: "I-1", label: "Anexo I-1 — Imposibilidad de obtener certificado de origen" },
        ],
      },
      {
        id: "sp_permanence",
        label: "Pruebas de permanencia del cónyuge en España — 5 meses continuados",
        status: "missing", section: "permanence",
        detail: "Mismos criterios que el titular: empadronamiento, contratos, nóminas, extractos bancarios a su nombre.",
        uploadable: true,
        uploadHint: "Documentos de permanencia del cónyuge en España.",
        criteria: ["Nombre del cónyuge visible", "5 meses de permanencia acreditados", "Fechado con día, mes y año"],
      },
    )
    return items
  }

  if (type === "ascendants") {
    items.push(
      {
        id: "asc_passport",
        label: "Pasaporte del ascendiente — todas las páginas escaneadas",
        status: "missing", section: "identity",
        uploadable: true,
        uploadHint: "Pasaporte del ascendiente. Extrae: nombre, apellidos, fecha de nacimiento, número de pasaporte.",
        criteria: ["Vigente (no caducado)", "Todas las páginas incluidas", "Datos personales legibles"],
      },
      {
        id: "asc_kinship",
        label: "Certificado de nacimiento del solicitante (acredita parentesco con el ascendiente)",
        status: "missing", section: "identity",
        detail: "Tu partida de nacimiento es la que prueba que esa persona es tu padre/madre. Apostillada + traducción jurada si no está en español.",
        uploadable: true,
        uploadHint: "Partida de nacimiento del solicitante principal. Extrae: nombre del titular, nombres de los padres.",
        criteria: ["Nombre del solicitante y de los padres", "Apostillada si se expidió en el extranjero", "Traducción jurada si no está en español"],
        sharedWithMain: true,
      },
      {
        id: "asc_cohabitation",
        label: "Empadronamiento colectivo — convivencia con el ascendiente",
        status: "missing", section: "permanence",
        detail: "Certificado de empadronamiento que recoja a todos los convivientes en el mismo domicilio.",
        uploadable: true,
        uploadHint: "Empadronamiento colectivo. Extrae: nombres, domicilio, fecha de alta.",
        criteria: ["Nombre del ascendiente y del solicitante", "Domicilio compartido", "Sello del ayuntamiento"],
        sharedWithMain: true,
      },
      {
        id: "asc_criminal",
        label: "Antecedentes penales del ascendiente (país de origen)",
        status: "missing", section: "criminal",
        detail: "Apostillado + traducción jurada al español.",
        uploadable: true,
        uploadHint: "Certificado de antecedentes penales del ascendiente.",
        criteria: ["Apostillado", "Traducción jurada si no está en español", "Sin condenas graves"],
        annexActions: [
          { id: "I-1", label: "Anexo I-1 — Imposibilidad de obtener certificado de origen" },
        ],
      },
      {
        id: "asc_permanence",
        label: "Pruebas de permanencia del ascendiente en España — 5 meses",
        status: "missing", section: "permanence",
        detail: "Empadronamiento histórico + documentos adicionales a nombre del ascendiente que acrediten 5 meses en España.",
        uploadable: true,
        uploadHint: "Documentos de permanencia del ascendiente.",
        criteria: ["Nombre del ascendiente visible", "5 meses de permanencia", "Fechado con día, mes y año"],
      },
    )
    return items
  }

  // minor_children o adult_disabled
  const labelSuffix = type === "adult_disabled" ? "del hijo/a mayor con discapacidad" : "del/los menor/es"

  items.push(
    {
      id: "fam_birth_cert",
      label: `Partida de nacimiento ${labelSuffix}`,
      status: "missing", section: "identity",
      detail: bornInSpain === "all"
        ? "Nacido/s en España: certificado del Registro Civil español."
        : "Apostillada (Convenio de La Haya) + traducción jurada al español si no está en español.",
      uploadable: true,
      uploadHint: "Partida de nacimiento. Extrae: nombre del menor/familiar, fecha de nacimiento, nombres de los padres.",
      criteria: [
        bornInSpain === "all" ? "Registro Civil español" : "Apostillada (Convenio de La Haya)",
        "Nombre del menor y de los padres",
        bornInSpain === "all" ? "Inscripción en Registro Civil español" : "Traducción jurada si no está en español",
      ],
    },
    {
      id: "fam_passport",
      label: `Pasaporte o documento de viaje ${labelSuffix}`,
      status: "missing", section: "identity",
      detail: "Imprescindible como documento de identidad. Si está caducado, renuévalo en el consulado.",
      uploadable: true,
      uploadHint: "Pasaporte del menor/familiar. Extrae: nombre, apellidos, fecha de nacimiento, número de pasaporte.",
      criteria: ["Vigente (no caducado)", "Nombre y fecha de nacimiento visible", "Número de pasaporte visible"],
    },
    {
      id: "fam_empadronamiento",
      label: `Empadronamiento ${labelSuffix}`,
      status: "missing", section: "permanence",
      detail: "Puede constar en el padrón familiar o ser individual.",
      uploadable: true,
      uploadHint: "Certificado de empadronamiento.",
      criteria: ["Nombre visible", "Domicilio en España", "Fecha de alta en padrón", "Sello del ayuntamiento"],
      sharedWithMain: true,
    },
  )

  if (type === "minor_children" && schooled) {
    items.push({
      id: "fam_schooling",
      label: "Certificado de escolarización del/los menor/es",
      status: "available", section: "identity",
      detail: "El menor está escolarizado — incluye el certificado. Refuerza significativamente el arraigo.",
      uploadable: true,
      uploadHint: "Certificado de escolarización. Extrae: nombre del menor, centro educativo, curso, municipio.",
      criteria: ["Nombre del menor", "Centro educativo y municipio", "Curso o período académico"],
    })
  } else if (type === "minor_children") {
    items.push({
      id: "fam_schooling",
      label: "Certificado de escolarización del/los menor/es (opcional pero recomendado)",
      status: "info", section: "identity", optional: true,
      detail: "Refuerza el arraigo aunque no sea obligatorio.",
      uploadable: true,
      uploadHint: "Certificado de escolarización.",
      criteria: ["Nombre del menor", "Centro educativo", "Curso"],
    })
  }

  if (type === "adult_disabled") {
    items.push({
      id: "fam_disability_cert",
      label: "Certificado de discapacidad o dependencia",
      status: "warning", section: "identity",
      detail: "Certificado oficial de discapacidad, resolución de dependencia, o informe médico de incapacidad.",
      uploadable: true,
      uploadHint: "Certificado de discapacidad o dependencia.",
      criteria: ["Nombre del familiar", "Diagnóstico o grado de discapacidad/dependencia", "Expedido por organismo oficial"],
    })
  }

  if (bornInSpain !== "all") {
    items.push({
      id: "fam_permanence",
      label: bornInSpain === "none"
        ? `Prueba de permanencia ${labelSuffix} en España — 5 meses`
        : `Prueba de permanencia ${labelSuffix} nacidos fuera de España — 5 meses`,
      status: "missing", section: "permanence",
      detail: "Empadronamiento, informes escolares, médicos pediátricos. Los nacidos en España no necesitan este requisito.",
      uploadable: true,
      uploadHint: "Documentos de permanencia.",
      criteria: ["5 meses de permanencia acreditados", "Nombre del menor visible", "Fechado con día, mes y año"],
    })
  }

  if (bothParentsCohabiting === false) {
    const inSpain = otherParentInSpain
    items.push({
      id: "fam_other_parent_auth",
      label: inSpain
        ? "Autorización del otro progenitor — legalizada ante notario español"
        : "Autorización del otro progenitor — apostillada",
      status: "missing", section: "identity",
      detail: inSpain
        ? "El otro progenitor está en España: autorización legalizada ante notario español. No sirve autorización simple."
        : "El otro progenitor está en el extranjero: autorización apostillada según Convenio de La Haya + traducción jurada al español.",
      uploadable: true,
      uploadHint: "Autorización parental notarial. Extrae: nombre del autorizante, nombre del menor, fecha.",
      criteria: inSpain
        ? ["Legalizada ante notario español", "Nombre del otro progenitor", "Nombre del menor", "Firma del notario"]
        : ["Apostillada (Convenio de La Haya)", "Traducción jurada al español", "Nombre del otro progenitor", "Nombre del menor"],
    })
  }

  items.push({
    id: "fam_fee",
    label: `Pago de tasas — Modelo 790 código 052 (${type === "minor_children" ? "10,94 € por menor" : "38,28 € adulto"})`,
    status: "missing", section: "admin",
    detail: `Genera el Modelo 790-052 en la sede electrónica del Ministerio. ${type === "minor_children" ? "Uno por cada menor." : ""}`,
    uploadable: true,
    uploadHint: "Justificante de pago del Modelo 790 código 052.",
    criteria: [`Importe correcto (${type === "minor_children" ? "10,94€" : "38,28€"})`, "Modelo 790 código 052", "Sello bancario o validación electrónica"],
  })

  if (type === "minor_children") {
    items.push({
      id: "fam_form_note",
      label: `Datos del menor en el Anexo 02 del formulario ${formName}`,
      status: "info", section: "admin", optional: true,
      detail: `Los datos de los menores se registran en el Anexo 02 del ${formName} del titular, no en un formulario separado.`,
    })
  }

  return items
}

// ─── Family member checklists (simultaneous applicants) ───────────────────────

export function getFamilyMemberChecklist(
  memberType: "spouse_partner" | "cohabiting_ascendants",
): ChecklistItem[] {
  const prefix = memberType === "spouse_partner" ? "sp" : "asc"

  return [
    {
      id: `${prefix}_passport`,
      label: "Pasaporte — todas las páginas escaneadas",
      status: "missing", section: "identity",
      uploadable: true,
      uploadHint: "Pasaporte del familiar. Extrae: nombre, apellidos, fecha de nacimiento, número de pasaporte, nacionalidad.",
      criteria: ["Vigente (no caducado)", "Todas las páginas incluidas", "Datos personales legibles"],
    },
    {
      id: `${prefix}_criminal_origin`,
      label: "Antecedentes penales del país de origen (apostillado + traducción jurada)",
      status: "missing", section: "criminal",
      uploadable: true,
      uploadHint: "Certificado de antecedentes penales del país de origen del familiar. Verifica apostilla, traducción y anotaciones.",
      criteria: ["Apostillado (Convenio de La Haya)", "Traducción jurada al español", "Sin condenas graves activas"],
      annexActions: [
        { id: "I-1", label: "Anexo I-1 — Imposibilidad de obtener certificado de origen" },
      ],
    },
    {
      id: `${prefix}_permanence`,
      label: memberType === "spouse_partner"
        ? "Pruebas de permanencia del cónyuge en España — 5 meses continuados"
        : "Pruebas de permanencia del ascendiente en España — 5 meses continuados",
      status: "missing", section: "permanence",
      uploadable: true,
      uploadHint: memberType === "spouse_partner"
        ? "Documentos de permanencia del cónyuge: empadronamiento, facturas, extractos bancarios a su nombre."
        : "Documentos de permanencia del ascendiente: empadronamiento, facturas, extractos bancarios a su nombre.",
      criteria: ["Nombre del familiar visible", "5 meses de permanencia acreditados", "Fechado con día, mes y año", "Emitido en España"],
    },
  ]
}




import type { QuizAnswers, EligibilityResult, ChecklistItem, Pathway } from "./types"

function deadlineDays(): number {
  return Math.max(0, Math.ceil((new Date("2026-06-30").getTime() - Date.now()) / 86_400_000))
}

export function evaluateEligibility(answers: QuizAnswers): EligibilityResult {
  const days = deadlineDays()

  // ── Hard disqualifiers ─────────────────────────────────────────────────────
  if (!answers.inSpainBefore2026) {
    return {
      eligible: false, pathway: "ineligible", score: 0, scoreLabel: "No elegible",
      ineligibleReason: "Este proceso exige haber estado en España antes del 1 de enero de 2026. Si llegaste después, no puedes acogerte al RD 316/2026.",
      checklist: [], recommendations: ["Consulta con nuestros asesores sobre otras vías de regularización disponibles para tu situación."],
      formName: null, formUrl: null, deadlineDays: days, hasSimultaneousFamily: false,
    }
  }

  if (answers.permitStatus === "pending_procedure") {
    return {
      eligible: false, pathway: "ineligible", score: 0, scoreLabel: "No elegible",
      ineligibleReason: "Tienes un procedimiento de residencia pendiente de resolución. La normativa excluye a quienes ya tienen un trámite activo.",
      checklist: [], recommendations: ["Espera la resolución de tu procedimiento. Si te deniegan, podrías explorar otras vías. Contacta con nuestros asesores."],
      formName: null, formUrl: null, deadlineDays: days, hasSimultaneousFamily: false,
    }
  }

  if (answers.permitStatus === "has_permit") {
    if (answers.hasChildrenToRegularize) {
      // Parent has residencia → children apply via EX25 (arts. 159/160)
      const ex25Checklist: ChecklistItem[] = [
        {
          id: "parent_residencia",
          label: "Permiso de residencia del padre/madre en vigor",
          status: "available",
          section: "identity",
          detail: "Tu permiso de residencia acredita que cumples el requisito del titular. Debe estar vigente.",
          uploadable: true,
          uploadHint: "Tarjeta de residencia o permiso de residencia. Extrae: nombre del titular, número NIE, fecha de caducidad.",
        },
        {
          id: "children_birth_cert",
          label: "Partida de nacimiento apostillada de cada hijo menor",
          status: "missing",
          section: "minors",
          detail: "Una por hijo. Certifica la filiación. Si está en otro idioma: apostilla + traducción jurada al español.",
          uploadable: true,
          uploadHint: "Partida de nacimiento del hijo menor. Extrae: nombre del menor, fecha de nacimiento, nombres de los padres.",
        },
        {
          id: "children_passport_ex25",
          label: "Pasaporte o documento de viaje del menor — todas las páginas escaneadas",
          status: "missing",
          section: "minors",
          detail: "Imprescindible como documento de identidad. Si está caducado, renuévalo en el consulado. Escanea TODAS las páginas.",
          uploadable: true,
          uploadHint: "Pasaporte del menor. Extrae: nombre, apellidos, fecha de nacimiento, número de pasaporte, nacionalidad.",
        },
        {
          id: "children_schooling_ex25",
          label: "Certificado de escolarización del menor",
          status: "info",
          section: "minors",
          optional: true,
          detail: "Refuerza la prueba de permanencia y arraigo en España, especialmente para el art. 160. Solicítalo en el centro educativo.",
          uploadable: true,
          uploadHint: "Certificado de escolarización o matrícula escolar. Extrae: nombre del menor, nombre del centro, curso, municipio.",
        },
        {
          id: "children_empadronamiento_ex25",
          label: "Empadronamiento del menor en España — individual o familiar",
          status: "missing",
          section: "permanence",
          detail: "Prueba la residencia del menor en España. Solicita también el empadronamiento histórico si es posible.",
          uploadable: true,
          uploadHint: "Certificado de empadronamiento del menor. Extrae: nombre del menor, domicilio, fecha de alta en padrón.",
        },
        {
          id: "children_permanence_ex25",
          label: "Otras pruebas de permanencia del menor en España — 5 meses (solo si no nació en España, art. 160)",
          status: "missing",
          section: "permanence",
          detail: "Si el hijo nació en España (art. 159) no se exige. Si no nació en España (art. 160), acredita 5 meses de permanencia ininterrumpida: empadronamiento, informes escolares, médicos pediátricos.",
          uploadable: true,
          uploadHint: "Documentos de permanencia del menor en España: empadronamiento, informes escolares o médicos pediátricos.",
        },
        {
          id: "fee_ex25",
          label: "Pago de tasas — Modelo 790 código 052 (10,94 € por menor)",
          status: "missing",
          section: "admin",
          detail: "Tasa reducida para menores. Genera el Modelo 790-052 en la sede electrónica y págalo. Uno por cada hijo que presentes.",
          uploadable: true,
          uploadHint: "Justificante de pago del Modelo 790 código 052 para menor. Verifica: código 052, importe 10,94€, nombre del menor.",
        },
        {
          id: "form_ex25",
          label: "Formulario EX25 cumplimentado y firmado",
          status: "missing",
          section: "admin",
          detail: "Formulario oficial EX25 — Solicitud de residencia por circunstancias excepcionales para menores (Disposición Transitoria Primera). Uno por cada hijo menor.",
        },
      ]
      return {
        eligible: true,
        pathway: "EX25_children",
        score: 70,
        scoreLabel: "Bueno",
        checklist: ex25Checklist,
        recommendations: [
          "Como titular de residencia vigente, tramitas la regularización de tus hijos vía EX25 (Disposición Transitoria Primera del RD 316/2026), no mediante EX31/EX32.",
          "Art. 159 — Hijos nacidos en España: no necesitan acreditar permanencia propia.",
          "Art. 160 — Hijos no nacidos en España: deben demostrar 5 meses de permanencia ininterrumpida en España antes de la solicitud.",
          "Presenta todos los EX25 a la vez y adjunta tu permiso de residencia en vigor. La tasa por menor es 10,94€.",
          "El plazo de presentación cierra el 30 de junio de 2026.",
        ],
        formName: "EX25",
        formUrl: null,
        deadlineDays: days,
        hasSimultaneousFamily: false,
        isEX25Path: true,
      }
    }
    return {
      eligible: false, pathway: "ineligible", score: 0, scoreLabel: "No elegible",
      ineligibleReason: "Ya tienes un permiso de residencia o estancia vigente. Este proceso es solo para personas sin documentación en vigor.",
      checklist: [], recommendations: ["Si tu permiso está próximo a caducar, consulta con nuestros asesores sobre la renovación."],
      formName: null, formUrl: null, deadlineDays: days, hasSimultaneousFamily: false,
    }
  }

  if (answers.isUkrainian) {
    return {
      eligible: false, pathway: "ineligible", score: 0, scoreLabel: "No elegible",
      ineligibleReason: "Los beneficiarios de la Protección Temporal Ucraniana están excluidos de este proceso por normativa específica.",
      checklist: [], recommendations: ["La protección temporal ucraniana tiene su propia regulación y plazos. Consulta con nuestros asesores."],
      formName: null, formUrl: null, deadlineDays: days, hasSimultaneousFamily: false,
    }
  }

  // ── Pathway ────────────────────────────────────────────────────────────────
  const pathway: Pathway = answers.hasPiHistory ? "DA20" : "DA21"
  const hasSupuesto = answers.da21Supuestos.length > 0
  const pathwayReady = pathway === "DA20" || hasSupuesto

  // ── Family analysis ────────────────────────────────────────────────────────
  const fm = answers.familyMembers
  const hasSpouse = fm.includes("spouse_partner")
  const hasMinorChildren = fm.includes("minor_children")
  const hasAdultDisabled = fm.includes("adult_disabled_children")
  const hasAscendants = fm.includes("cohabiting_ascendants")
  const hasSimultaneousFamily = hasSpouse || hasAscendants  // aptdo. 3 simultaneous

  // If family supuesto but no DA21 supuesto explicitly selected, auto-add family supuesto
  const familyQualifies = hasMinorChildren || hasAdultDisabled || hasAscendants
  const effectiveSupuestos = [...answers.da21Supuestos]
  if (pathway === "DA21" && familyQualifies && !effectiveSupuestos.includes("family")) {
    effectiveSupuestos.push("family")
  }
  const hasEffectiveSupuesto = effectiveSupuestos.length > 0
  const effectivePathwayReady = pathway === "DA20" || hasEffectiveSupuesto

  // ── Score ──────────────────────────────────────────────────────────────────
  const noDocs = answers.permanenceDocs.includes("none")
  const docCount = noDocs ? 0 : answers.permanenceDocs.length
  const hasDocs = !noDocs && docCount > 0

  let score = 20

  if (effectivePathwayReady) {
    score += 30
    if (pathway === "DA21" && (
      effectiveSupuestos.includes("work_history") || effectiveSupuestos.includes("job_offer")
    )) score += 5

    // Family-strengthened case
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
  })

  // ── 2. PERMANENCE ─────────────────────────────────────────────────────────
  checklist.push({
    id: "empadronamiento_individual",
    label: "Certificado(s) de Empadronamiento Individual",
    status: "info",
    section: "permanence",
    optional: true,
    detail: "Puedes tener varios si has vivido en distintos municipios. Es una de las pruebas más sólidas de permanencia. Solicítalo gratis en la oficina de padrón o en la sede electrónica del ayuntamiento.",
    uploadable: true,
    uploadHint: "Certificado de empadronamiento individual. Extrae: nombre completo, domicilio, fecha de alta en padrón.",
  })
  checklist.push({
    id: "empadronamiento_historico",
    label: "Certificado de Empadronamiento Histórico",
    status: "info",
    section: "permanence",
    optional: true,
    detail: "Recoge todos los domicilios en los que has estado empadronado históricamente. Especialmente útil para acreditar períodos largos. Solicítalo en el ayuntamiento donde estás empadronado actualmente.",
    uploadable: true,
    uploadHint: "Certificado de empadronamiento histórico. Extrae: nombre, domicilios con fechas de alta y baja.",
  })
  checklist.push({
    id: "permanence_other",
    label: "Otras pruebas de permanencia ininterrumpida en España (5 meses previos a la solicitud)",
    status: hasDocs ? (docCount >= 2 ? "available" : "warning") : "missing",
    section: "permanence",
    detail: hasDocs
      ? docCount < 2
        ? "Tienes documentos pero refuerza el expediente. Válidos: contratos de alquiler, nóminas, extractos bancarios, billetes de transporte, facturas a tu nombre en España."
        : "Válidos: contratos de alquiler, nóminas, extractos bancarios, billetes de transporte, facturas. Usa el Clasificador para confirmar que cubres los 5 meses sin lagunas."
      : "Reúne documentos nominativos y fechados: contratos de alquiler, nóminas, extractos bancarios, billetes de transporte, facturas en España. El Clasificador verifica la cobertura.",
    linkLabel: "Verificar permanencia con el Clasificador",
    linkHref: "/herramientas/clasificador-documentos",
    isClassificadorLink: true,
    uploadable: true,
    uploadHint: "Documento de permanencia en España: contrato de alquiler, nómina, extracto bancario, billete de transporte. Extrae: nombre, fecha, tipo de documento.",
  })

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
  })

  // ── 4. MINORS BASE DOCS ───────────────────────────────────────────────────
  if (hasMinorChildren) {
    checklist.push({
      id: "minor_birth_cert",
      label: "Partida de nacimiento apostillada del/los menor/es",
      status: "missing",
      section: "minors",
      detail: "Una por cada hijo menor. Certifica la filiación. Si está en otro idioma: apostilla del Convenio de La Haya + traducción jurada al español. Solicítala en el Registro Civil del país de nacimiento.",
      uploadable: true,
      uploadHint: "Partida de nacimiento del hijo menor. Extrae: nombre del menor, fecha de nacimiento, nombres de los padres.",
    })
    checklist.push({
      id: "minor_schooling",
      label: "Certificado de escolarización del/los menor/es",
      status: "info",
      section: "minors",
      optional: true,
      detail: "Refuerza la prueba de arraigo en España. No es obligatorio pero es muy valorado. Solicítalo en el centro educativo.",
      uploadable: true,
      uploadHint: "Certificado de escolarización o matrícula escolar del menor. Extrae: nombre del menor, nombre del centro educativo, curso, municipio.",
    })
  }

  // ── 5. FAMILY BLOCK ───────────────────────────────────────────────────────
  if (hasSpouse) {
    checklist.push({
      id: "spouse_docs",
      label: "Certificado de matrimonio o de pareja de hecho registrada",
      status: "missing",
      section: "family",
      detail: "Para la presentación simultánea del cónyuge/pareja (DA21 aptdo. 3). Apostillado + traducción jurada si no está en español. El cónyuge también debe cumplir los requisitos base.",
      uploadable: true,
      uploadHint: "Certificado de matrimonio o pareja de hecho. Extrae: nombres de los cónyuges, fecha del matrimonio/registro, lugar.",
    })
    checklist.push({
      id: "spouse_permanence",
      label: "Prueba de permanencia del cónyuge/pareja (5 meses en España)",
      status: "missing",
      section: "family",
      detail: "El cónyuge también debe acreditar 5 meses de permanencia en España. Aplica el mismo criterio que para el solicitante principal.",
      uploadable: true,
      uploadHint: "Documentos de permanencia del cónyuge: empadronamiento, facturas, extractos bancarios a su nombre.",
    })
  }

  if (hasMinorChildren) {
    checklist.push({
      id: "children_passport",
      label: "Pasaporte o documento de viaje del menor en vigor",
      status: "missing",
      section: "family",
      detail: "Imprescindible como documento de identidad del menor. Si está caducado, renuévalo en el consulado antes de presentar.",
      uploadable: true,
      uploadHint: "Pasaporte del menor. Extrae: nombre, apellidos, fecha de nacimiento, número de pasaporte, nacionalidad.",
    })
    checklist.push({
      id: "children_empadronamiento",
      label: "Empadronamiento del menor — individual o en padrón familiar",
      status: "missing",
      section: "family",
      detail: "Acredita la residencia del menor en España. Puede constar en el mismo padrón que los padres o ser certificado individual. Si es posible, solicita también el empadronamiento histórico.",
      uploadable: true,
      uploadHint: "Certificado de empadronamiento del menor. Extrae: nombre del menor, domicilio, fecha de alta en padrón.",
    })
    checklist.push({
      id: "children_permanence",
      label: "Prueba de permanencia de hijos menores en España — 5 meses (solo si no nacieron en España, art. 160)",
      status: "missing",
      section: "family",
      detail: "Los menores NO nacidos en España deben acreditar 5 meses de permanencia ininterrumpida. Los nacidos en España (art. 159) no la necesitan. Los datos del menor van en el Anexo 02 del formulario.",
      uploadable: true,
      uploadHint: "Documentos de permanencia de menores: empadronamiento, informes escolares, informes médicos pediátricos.",
    })
  }

  if (hasAdultDisabled) {
    checklist.push({
      id: "family_disabled",
      label: "Certificado de discapacidad o dependencia del hijo/a mayor",
      status: "warning",
      section: "family",
      detail: "Certificado oficial que acredite la discapacidad o incapacidad funcional. Empadronamiento conjunto obligatorio.",
      uploadable: true,
      uploadHint: "Certificado de discapacidad, resolución de dependencia o informe médico de incapacidad funcional.",
    })
  }

  if (hasAscendants) {
    checklist.push({
      id: "family_ascendant",
      label: "Acreditación de convivencia con ascendientes — empadronamiento conjunto",
      status: "available",
      section: "family",
      detail: "Certificado de empadronamiento colectivo (todos los convivientes). La relación de parentesco se acredita con el certificado de nacimiento del solicitante.",
      uploadable: true,
      uploadHint: "Empadronamiento colectivo o certificado de convivencia. Extrae: nombres, domicilio completo, fecha del certificado.",
    })
  }

  // ── 6. CASE-SPECIFIC ──────────────────────────────────────────────────────
  if (pathway === "DA20") {
    checklist.push({
      id: "pi_docs",
      label: "Documentación de tu solicitud de Protección Internacional",
      status: "missing",
      section: "case",
      detail: "Resguardo de solicitud de asilo, tarjeta roja de solicitante, resolución, o acuse de recurso. Cualquiera es válido. Debe mostrar fecha anterior al 01/01/2026.",
      uploadable: true,
      uploadHint: "Documento de Protección Internacional. Extrae: nombre del solicitante, número de expediente PI, fecha de solicitud, estado de la solicitud.",
    })
  } else {
    if (!hasEffectiveSupuesto) {
      checklist.push({
        id: "supuesto_missing",
        label: "Documentación del supuesto DA21 (ninguno seleccionado)",
        status: "missing",
        section: "case",
        detail: "Debes acreditar al menos uno: actividad laboral, unidad familiar con dependientes, o certificado de vulnerabilidad.",
      })
    } else {
      if (effectiveSupuestos.includes("work_history")) {
        checklist.push({
          id: "work_history",
          label: "Prueba de actividad laboral — nóminas, contratos o vida laboral TGSS",
          status: "available",
          section: "case",
          detail: "Informe de vida laboral + contratos/nóminas. El contrato debe cubrir ≥90 días por año.",
          uploadable: true,
          uploadHint: "Nómina, contrato de trabajo o informe de vida laboral de la Seguridad Social. Extrae: nombre del trabajador, empresa, fechas, salario si visible.",
        })
      }
      if (effectiveSupuestos.includes("job_offer")) {
        checklist.push({
          id: "job_offer",
          label: "Oferta de trabajo — contrato mínimo 90 días/año firmado por el empleador",
          status: "available",
          section: "case",
          detail: "Firmado por el empleador, especificando duración y condiciones.",
          uploadable: true,
          uploadHint: "Contrato de trabajo u oferta de empleo. Extrae: nombre del trabajador, nombre del empleador, duración del contrato, jornada.",
        })
      }
      if (effectiveSupuestos.includes("self_employed")) {
        checklist.push({
          id: "self_employed",
          label: "Declaración de intención de alta como autónomo o actividad por cuenta propia",
          status: "available",
          section: "case",
          detail: "Declaración responsable de actividad económica por cuenta propia. Consulta con nuestros asesores el formato exacto.",
          uploadable: true,
          uploadHint: "Declaración de actividad por cuenta propia o documentación de autónomo.",
        })
      }
      if (effectiveSupuestos.includes("vulnerability")) {
        checklist.push({
          id: "vulnerability_cert",
          label: "Certificado de Vulnerabilidad — Anexo II (entidad RECEX o Servicios Sociales)",
          status: "missing",
          section: "case",
          detail: "Siempre GRATUITO. Lo emite Cruz Roja, Cáritas, ACNUR, Médicos del Mundo, Servicios Sociales del ayuntamiento u otras entidades RECEX. Debe incluir sello y número RECEX.",
          uploadable: true,
          uploadHint: "Certificado de vulnerabilidad (Anexo II). Verifica: nombre del solicitante, entidad emisora, número RECEX, sello.",
        })
      }
      if (!hasMinorChildren && !hasAdultDisabled && !hasAscendants && effectiveSupuestos.includes("family")) {
        checklist.push({
          id: "family_docs",
          label: "Documentación de unidad familiar",
          status: "available",
          section: "case",
          detail: "Libro de familia, certificados de nacimiento y/o certificados de discapacidad/dependencia. Empadronamiento conjunto acreditando la convivencia.",
          uploadable: true,
          uploadHint: "Documentación familiar: libro de familia, certificados de nacimiento, empadronamiento colectivo.",
        })
      }
    }
  }

  // ── 7. ADMIN ──────────────────────────────────────────────────────────────
  // DA20 (PI applicants) already have a NIE from their tarjeta roja → can pay tasa now.
  // DA21 (irregular) may not have a NIE yet → tasa is paid after NIE is assigned.
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
    recommendations.push(
      `Los datos de tus hijos menores se incluyen en la página 2 del formulario ${formName} (Anexo 02 — Datos del menor). Si el menor no nació en España (art. 160), debe acreditar 5 meses de permanencia. Si nació en España (art. 159), no hace falta. Tasa reducida: 10,94€ por menor. Selecciona el Anexo 02 en la herramienta de formularios.`,
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

  if (effectiveSupuestos.includes("vulnerability")) {
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
      ? "https://sede.inclusion.gob.es/es/tramites/extranjeria/solicitud-autorizacion-residencia-trabajo-solicitantes-proteccion-internacional.html"
      : "https://sede.inclusion.gob.es/es/tramites/extranjeria/solicitud-autorizacion-residencia-trabajo-extranjeros-situacion-irregular.html",
    deadlineDays: days,
    hasSimultaneousFamily,
  }
}

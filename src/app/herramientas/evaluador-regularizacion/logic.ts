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
          id: "children_birth_cert",
          label: "Partida de nacimiento de cada hijo menor",
          status: "missing",
          detail: "Una por hijo. Acredita la filiación. Si está en otro idioma, necesita apostilla + traducción jurada al español.",
          uploadable: true,
          uploadHint: "Partida de nacimiento del hijo menor. Extrae: nombre del menor, fecha de nacimiento, nombres de los padres.",
        },
        {
          id: "children_passport_ex25",
          label: "Pasaporte o documento de viaje del menor en vigor",
          status: "missing",
          detail: "Imprescindible como documento de identidad. Si está caducado, renuévalo en el consulado antes de presentar.",
          uploadable: true,
          uploadHint: "Pasaporte del menor. Extrae: nombre, apellidos, fecha de nacimiento, número de pasaporte, nacionalidad.",
        },
        {
          id: "children_empadronamiento_ex25",
          label: "Empadronamiento del menor en España (individual o familiar) — histórico si es posible",
          status: "missing",
          detail: "Prueba la residencia del menor en España. Para el art. 160 (no nacidos en España) el empadronamiento histórico es especialmente valioso para acreditar los 5 meses. Solicítalo en el ayuntamiento.",
          uploadable: true,
          uploadHint: "Certificado de empadronamiento del menor. Extrae: nombre del menor, domicilio, fecha de alta en padrón.",
        },
        {
          id: "children_schooling_ex25",
          label: "Certificado de escolarización del menor (si está escolarizado)",
          status: "info",
          detail: "Refuerza la prueba de permanencia y arraigo en España, especialmente para el art. 160. Solicítalo en el centro educativo.",
          uploadable: true,
          uploadHint: "Certificado de escolarización o matrícula escolar. Extrae: nombre del menor, nombre del centro, curso, municipio.",
        },
        {
          id: "parent_residencia",
          label: "Permiso de residencia del padre/madre en vigor",
          status: "available",
          detail: "Tu permiso de residencia acredita que cumples el requisito del titular. Debe estar vigente.",
          uploadable: true,
          uploadHint: "Tarjeta de residencia o permiso de residencia. Extrae: nombre del titular, número NIE, fecha de caducidad.",
        },
        {
          id: "children_permanence_ex25",
          label: "Prueba de permanencia de los hijos en España — 5 meses (art. 160, si no nacieron en España)",
          status: "missing",
          detail: "Si el hijo nació en España (art. 159) no se exige. Si no nació en España (art. 160), hay que acreditar 5 meses de permanencia ininterrumpida: empadronamiento, informes escolares, médicos pediátricos.",
          uploadable: true,
          uploadHint: "Documentos de permanencia del menor en España: empadronamiento, informes escolares o médicos pediátricos.",
        },
        {
          id: "fee_ex25",
          label: "Pago de tasas — Modelo 790 código 052 (10,94 € por menor)",
          status: "missing",
          detail: "Tasa reducida para menores. Genera el Modelo 790-052 en la sede electrónica y págalo. Uno por cada hijo que presentes.",
          uploadable: true,
          uploadHint: "Justificante de pago del Modelo 790 código 052 para menor. Verifica: código 052, importe 10,94€, nombre del menor.",
        },
        {
          id: "form_ex25",
          label: "Formulario EX25 cumplimentado y firmado",
          status: "missing",
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
  let score = 20

  if (effectivePathwayReady) {
    score += 30
    if (pathway === "DA21" && (
      effectiveSupuestos.includes("work_history") || effectiveSupuestos.includes("job_offer")
    )) score += 5

    // Family-strengthened case
    if (pathway === "DA21" && familyQualifies) score += 3
  }

  const noDocs = answers.permanenceDocs.includes("none")
  const docCount = noDocs ? 0 : answers.permanenceDocs.length
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

  // Passport
  checklist.push({
    id: "passport",
    label: "Pasaporte o documento de viaje en vigor",
    status: answers.passportStatus === "valid" ? "available" : answers.passportStatus === "expired" ? "warning" : "missing",
    detail: answers.passportStatus !== "valid"
      ? "Imprescindible. Renuévalo en el consulado de tu país en España antes de presentar el expediente."
      : undefined,
    uploadable: true,
    uploadHint: "Pasaporte o documento de viaje. Extrae: nombre, apellidos, fecha de nacimiento, lugar y país de nacimiento, nacionalidad, número de pasaporte, sexo.",
  })

  // Pathway-specific docs
  if (pathway === "DA20") {
    checklist.push({
      id: "pi_docs",
      label: "Documentación de tu solicitud de Protección Internacional",
      status: "info",
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
        detail: "Debes acreditar al menos uno: actividad laboral, unidad familiar con dependientes, o certificado de vulnerabilidad.",
      })
    } else {
      if (effectiveSupuestos.includes("work_history")) {
        checklist.push({
          id: "work_history",
          label: "Prueba de actividad laboral — nóminas, contratos o vida laboral TGSS",
          status: "available",
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
          detail: "Firmado por el empleador, especificando duración y condiciones. El empleador no necesita autorización previa especial.",
          uploadable: true,
          uploadHint: "Contrato de trabajo u oferta de empleo. Extrae: nombre del trabajador, nombre del empleador, duración del contrato, jornada.",
        })
      }
      if (effectiveSupuestos.includes("self_employed")) {
        checklist.push({
          id: "self_employed",
          label: "Declaración de intención de alta como autónomo o actividad por cuenta propia",
          status: "available",
          detail: "Declaración responsable de actividad económica por cuenta propia. Consulta con nuestros asesores el formato exacto.",
          uploadable: true,
          uploadHint: "Declaración de actividad por cuenta propia o documentación de autónomo.",
        })
      }
      if (effectiveSupuestos.includes("family") || familyQualifies) {
        if (hasMinorChildren) {
          checklist.push({
            id: "family_minor",
            label: "Partida de nacimiento o libro de familia del menor",
            status: "available",
            detail: "Certifica la filiación. Si está en otro idioma, necesita apostilla + traducción jurada al español.",
            uploadable: true,
            uploadHint: "Partida de nacimiento o libro de familia del hijo menor. Extrae: nombre y apellidos del menor, fecha de nacimiento, nombres de los padres.",
          })
          checklist.push({
            id: "children_passport",
            label: "Pasaporte o documento de viaje del menor en vigor",
            status: "missing",
            detail: "Imprescindible como documento de identidad del menor. Si está caducado, renuévalo en el consulado antes de presentar.",
            uploadable: true,
            uploadHint: "Pasaporte del menor. Extrae: nombre, apellidos, fecha de nacimiento, número de pasaporte, nacionalidad.",
          })
          checklist.push({
            id: "children_empadronamiento",
            label: "Empadronamiento del menor — individual o en padrón familiar",
            status: "missing",
            detail: "Acredita la residencia del menor en España. Puede constar en el mismo padrón que los padres o ser un certificado individual. Si es posible, solicita también el empadronamiento histórico en el ayuntamiento.",
            uploadable: true,
            uploadHint: "Certificado de empadronamiento del menor. Extrae: nombre del menor, domicilio, fecha de alta en padrón.",
          })
          checklist.push({
            id: "children_schooling",
            label: "Certificado de escolarización del menor (si está escolarizado)",
            status: "info",
            detail: "El certificado de matrícula del colegio o instituto refuerza la prueba de presencia y arraigo en España. No es obligatorio pero es muy valorado.",
            uploadable: true,
            uploadHint: "Certificado de escolarización o matrícula escolar del menor. Extrae: nombre del menor, nombre del centro educativo, curso, municipio.",
          })
        }
        if (hasAdultDisabled) {
          checklist.push({
            id: "family_disabled",
            label: "Certificado de discapacidad o dependencia del hijo/a mayor",
            status: "warning",
            detail: "Certificado oficial que acredite la discapacidad o la incapacidad funcional para proveerse de sus propias necesidades. Empadronamiento conjunto obligatorio.",
            uploadable: true,
            uploadHint: "Certificado de discapacidad, resolución de dependencia o informe médico de incapacidad funcional.",
          })
        }
        if (hasAscendants) {
          checklist.push({
            id: "family_ascendant",
            label: "Acreditación de convivencia con ascendientes — empadronamiento conjunto",
            status: "available",
            detail: "Certificado de empadronamiento colectivo (todos los convivientes). La relación de parentesco debe acreditarse con certificado de nacimiento del solicitante.",
            uploadable: true,
            uploadHint: "Empadronamiento colectivo o certificado de convivencia. Extrae: todos los nombres que aparezcan, domicilio completo, fecha del certificado.",
          })
        }
        if (!hasMinorChildren && !hasAdultDisabled && !hasAscendants && effectiveSupuestos.includes("family")) {
          checklist.push({
            id: "family_docs",
            label: "Documentación de unidad familiar (menores, discapacitados o ascendientes dependientes convivientes)",
            status: "available",
            detail: "Libro de familia, certificados de nacimiento y/o certificados de discapacidad/dependencia. Empadronamiento conjunto acreditando la convivencia.",
            uploadable: true,
            uploadHint: "Documentación familiar: libro de familia, certificados de nacimiento, empadronamiento colectivo.",
          })
        }
      }
      if (effectiveSupuestos.includes("vulnerability")) {
        checklist.push({
          id: "vulnerability_cert",
          label: "Certificado de Vulnerabilidad — Anexo II (entidad RECEX o Servicios Sociales)",
          status: "missing",
          detail: "Es siempre GRATUITO. Lo emite Cruz Roja, Cáritas, ACNUR, Médicos del Mundo, Servicios Sociales de tu ayuntamiento u otras entidades RECEX. Debe incluir sello y número de registro RECEX. No necesitas ser usuario habitual.",
          uploadable: true,
          uploadHint: "Certificado de vulnerabilidad (Anexo II). Verifica: nombre del solicitante, nombre de la entidad emisora, número RECEX, sello, circunstancias marcadas.",
        })
      }
    }
  }

  // Permanence proof
  const hasDocs = !noDocs && docCount > 0
  checklist.push({
    id: "permanence_proof",
    label: "Pruebas de permanencia ininterrumpida en España (5 meses inmediatamente anteriores a la solicitud)",
    status: hasDocs ? (docCount >= 2 ? "available" : "warning") : "missing",
    detail: hasDocs
      ? docCount < 2
        ? "Tienes documentos, pero refuerza el expediente. Usa el Clasificador para verificar cobertura de los 5 meses."
        : "Usa el Clasificador para confirmar que tus pruebas cubren los 5 meses sin lagunas."
      : "Reúne documentos nominativos y fechados: billetes, extractos bancarios, contratos de alquiler, recibos, empadronamiento, facturas. El Clasificador verifica la cobertura.",
    linkLabel: "Verificar permanencia con el Clasificador",
    linkHref: "/herramientas/clasificador-documentos",
    isClassificadorLink: true,
  })

  // Simultaneous family — checklist items
  if (hasSpouse) {
    checklist.push({
      id: "spouse_docs",
      label: "Certificado de matrimonio o de pareja de hecho registrada",
      status: "missing",
      detail: "Para la presentación simultánea del cónyuge/pareja (DA21 aptdo. 3). Debe estar apostillado y con traducción jurada si no está en español. El cónyuge debe también cumplir los requisitos base (presencia antes de 2026, sin permiso vigente, sin antecedentes).",
      uploadable: true,
      uploadHint: "Certificado de matrimonio o de pareja de hecho registrada. Extrae: nombres de los cónyuges, fecha del matrimonio/registro, lugar.",
    })
    checklist.push({
      id: "spouse_permanence",
      label: "Prueba de permanencia del cónyuge/pareja (5 meses en España)",
      status: "missing",
      detail: "El cónyuge que se presente simultáneamente también debe acreditar su permanencia de 5 meses en España. Aplica el mismo criterio que para el solicitante principal.",
      uploadable: true,
      uploadHint: "Documentos de permanencia del cónyuge: empadronamiento, facturas, extractos bancarios a su nombre.",
    })
  }

  if (hasMinorChildren) {
    checklist.push({
      id: "children_permanence",
      label: "Prueba de permanencia de hijos menores en España — 5 meses (art. 160)",
      status: "missing",
      detail: "Los menores no nacidos en España deben acreditar 5 meses de permanencia ininterrumpida antes de la solicitud. Los nacidos en España (art. 159) no necesitan esta prueba. Los datos del menor se incluyen en la página 2 del formulario EX31/EX32 (Anexo 02 — Datos del menor).",
      uploadable: true,
      uploadHint: "Documentos de permanencia de menores en España: empadronamiento, informes escolares, informes médicos pediátricos.",
    })
  }

  // Criminal records
  checklist.push({
    id: "criminal_spain",
    label: "Certificado de antecedentes penales de España (Registro Central de Penados)",
    status: answers.criminalStatus === "has_spain" || answers.criminalStatus === "unknown" ? "warning" : "available",
    detail: answers.criminalStatus === "has_spain"
      ? "Tienes antecedentes en España. Puede impedir la regularización. Consulta urgentemente sobre cancelación de antecedentes."
      : "Solicítalo gratis en el Ministerio de Justicia (presencial o sede electrónica). Imprescindible para todos los convivientes que soliciten.",
    uploadable: true,
    uploadHint: "Certificado de antecedentes penales de España. Verifica si hay anotaciones activas y extrae el nombre del titular.",
  })

  checklist.push({
    id: "criminal_origin",
    label: "Antecedentes penales del país de origen (y países de residencia últimos 5 años antes de llegar a España)",
    status: answers.criminalStatus === "maybe_origin" || answers.criminalStatus === "has_spain" || answers.criminalStatus === "unknown"
      ? "warning" : "available",
    detail: "Apostillado (Convenio de La Haya) + traducción jurada si no está en español. Si no lo recibes en 1 mes, puedes usar los Anexos I-1 (declaración de imposibilidad) e I-2 (solicitud diplomática).",
    uploadable: true,
    uploadHint: "Certificado de antecedentes penales del país de origen. Verifica si tiene apostilla, traducción jurada y si hay anotaciones.",
  })

  // Tasas
  checklist.push({
    id: "fee_payment",
    label: "Pago de tasas — Modelo 790 código 052 (38,28 € adulto · 10,94 € menor)",
    status: "missing",
    detail: "Genera el Modelo 790-052 en la sede electrónica del Ministerio del Interior y págalo en banco colaborador o por vía telemática. Necesitas uno por persona (incluidos menores y cónyuge si se presentan simultáneamente).",
    uploadable: true,
    uploadHint: "Justificante de pago del Modelo 790 código 052. Verifica: código 052 visible, importe (38,28€ adulto / 10,94€ menor), nombre del solicitante, sello o validación bancaria.",
  })

  // Form
  const formName = pathway === "DA20" ? "EX31" : "EX32"
  checklist.push({
    id: "form",
    label: `Formulario ${formName} cumplimentado y firmado`,
    status: "missing",
    detail: `Formulario oficial ${formName} del Ministerio. Puedes rellenarlo directamente con la herramienta de abajo o descargarlo desde la web del Ministerio.${hasMinorChildren ? ` Los datos de los menores van en el Anexo 02 (página 2) del ${formName}.` : ""}`,
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

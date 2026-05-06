export type Pathway = "DA20" | "DA21" | "ineligible" | "EX25_children"

export type PermitStatus = "has_permit" | "pending_procedure" | "none"

export type DA21Supuesto = "work_history" | "job_offer" | "self_employed" | "family" | "vulnerability"

export type FamilyMember =
  | "spouse_partner"
  | "minor_children"
  | "adult_disabled_children"
  | "cohabiting_ascendants"
  | "none"

export type PermanenceDoc =
  | "passport_stamps"
  | "transport_tickets"
  | "rental_contract"
  | "payslips"
  | "bank_statements"
  | "training_certs"
  | "empadronamiento"
  | "none"

export type CriminalStatus = "clean" | "maybe_origin" | "has_spain" | "unknown"

export type PassportStatus = "valid" | "expired" | "missing"

export interface QuizAnswers {
  forWhom: "self" | "relative" | null   // first question: for yourself or a relative?
  inSpainBefore2026: boolean | null
  permitStatus: PermitStatus | null
  hasChildrenToRegularize: boolean | null  // only asked when has_permit
  isUkrainian: boolean | null
  hasPiHistory: boolean | null
  da21Supuestos: DA21Supuesto[]
  familyMembers: FamilyMember[]
  permanenceDocs: PermanenceDoc[]
  criminalStatus: CriminalStatus | null
  passportStatus: PassportStatus | null
}

export type ChecklistStatus = "available" | "missing" | "warning" | "info"

export interface ChecklistItem {
  id: string
  label: string
  status: ChecklistStatus
  section?: string      // visual grouping key
  optional?: boolean    // if true, not required for completion button
  detail?: string
  linkLabel?: string
  linkHref?: string
  isClassificadorLink?: boolean
  uploadable?: boolean
  uploadHint?: string // context hint for the AI extractor
}

export interface EligibilityResult {
  eligible: boolean
  pathway: Pathway
  score: number
  scoreLabel: string
  ineligibleReason?: string
  checklist: ChecklistItem[]
  recommendations: string[]
  formName: string | null
  formUrl: string | null
  deadlineDays: number
  hasSimultaneousFamily: boolean
  isEX25Path?: boolean  // padre con residencia que quiere regularizar hijos/familiares
}

// ─── Personal data for form fill ─────────────────────────────────────────────

export interface PersonalData {
  nombre: string
  primerApellido: string
  segundoApellido: string
  sexo: "H" | "M" | ""
  fechaNacimiento: string   // YYYY-MM-DD
  lugarNacimiento: string
  paisNacimiento: string
  estadoCivil: "S" | "C" | "V" | "D" | "Sp" | ""
  nacionalidad: string
  nombrePadre: string
  nombreMadre: string
  pasaporte: string
  nie: string
  domicilio: string
  piso: string
  localidad: string
  provincia: string
  cp: string
  telefono: string
  email: string
  // DA20 specific
  numExpedientePi: string
  estadoPi: "pendiente" | "denegada" | "desistida" | "recurso" | ""
  // DA21 specific
  da21Supuesto: string
}

// ─── Extracted data from document analysis ───────────────────────────────────

export interface ExtractedDocData {
  nombre?: string | null
  primerApellido?: string | null
  segundoApellido?: string | null
  sexo?: "H" | "M" | null
  fechaNacimiento?: string | null  // YYYY-MM-DD
  lugarNacimiento?: string | null
  paisNacimiento?: string | null
  nacionalidad?: string | null
  pasaporte?: string | null
  nie?: string | null
  domicilio?: string | null
  piso?: string | null
  localidad?: string | null
  provincia?: string | null
  cp?: string | null
  telefono?: string | null
  email?: string | null
  numExpedientePi?: string | null
  estadoPi?: string | null
}

// ─── Document analysis ────────────────────────────────────────────────────────

export type DocStatus = "valido" | "valido_con_observaciones" | "invalido" | "no_identificado"

export interface DocAnalysisItem {
  docIndex: number
  fileName: string
  tipoDocumento: string
  estado: DocStatus
  observaciones: string[]
  sugerencias_presencial: string[]
  sugerencias_telematica: string[] | null
  descripcion: string
}

export interface AnalyzeResponse {
  results: DocAnalysisItem[]
  error?: string
}

// ─── Single-doc extract result ────────────────────────────────────────────────

export interface ExtractDocResult {
  tipoDocumento: string
  estado: DocStatus
  observaciones: string[]
  alertasValidez?: string[]       // validity/authenticity/expiry alerts
  fechaVencimiento?: string | null // YYYY-MM-DD or null
  sugerencias_presencial: string[]
  extractedData: ExtractedDocData
}

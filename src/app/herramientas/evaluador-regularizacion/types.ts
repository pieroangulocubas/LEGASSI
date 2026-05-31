export type Pathway = "DA20" | "DA21" | "ineligible" | "EX25_children"

export type PermitStatus = "has_permit" | "pending_procedure" | "none"

export type DA21Supuesto = "work_history" | "job_offer" | "self_employed" | "family" | "vulnerability"

export type FamilyType = "minor_children" | "adult_disabled" | "ascendants"

export type FamilyMemberType = "minor_children" | "adult_disabled" | "ascendants" | "spouse_partner"

export type MinorsBornInSpain = "all" | "some" | "none"

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
  forWhom: "self" | "relative" | null
  inSpainBefore2026: boolean | null
  permitStatus: PermitStatus | null
  hasChildrenToRegularize: boolean | null
  isUkrainian: boolean | null
  hasPiHistory: boolean | null
  da20IncludesFamily: boolean | null          // DA20: ¿añade familiar en presentación simultánea?
  da21Supuesto: DA21Supuesto | null           // single select (antes: da21Supuestos array)
  // ── Detalle familiar (solo cuando da21Supuesto === "family") ──
  familyType: FamilyType | null               // qué tipo de familiar
  minorCount: number | null                   // cuántos menores
  minorsBornInSpain: MinorsBornInSpain | null // todos/algunos/ninguno nacidos en España
  minorsSchooled: boolean | null              // están escolarizados
  bothParentsCohabiting: boolean | null       // ambos progenitores empadronados juntos
  otherParentInSpain: boolean | null          // si no cohabitan: el otro progenitor está en España
  familySimultaneous: boolean | null          // ¿presentan expediente simultáneo?
  familyMembers: FamilyMember[]               // mantenido para compatibilidad con tabs
  permanenceDocs: PermanenceDoc[]
  criminalStatus: CriminalStatus | null
  passportStatus: PassportStatus | null
}

export type ChecklistStatus = "available" | "missing" | "warning" | "info"

export interface ChecklistItem {
  id: string
  label: string
  status: ChecklistStatus
  section?: string
  optional?: boolean
  detail?: string
  linkLabel?: string
  linkHref?: string
  isClassificadorLink?: boolean
  uploadable?: boolean
  uploadHint?: string
  annexActions?: { id: string; label: string; hint?: string }[]
  criteria?: string[]
  sharedWithMain?: boolean  // documento ya presente en el expediente del titular
  isClasificadorResult?: boolean  // slot conectado al Clasificador via localStorage
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
  isEX25Path?: boolean
}

// ─── Perfil de familiar añadido (para "Añadir familiar" en resultados) ─────────

export interface FamilyMemberProfile {
  id: string
  type: FamilyMemberType
  label: string
  count: number
  bornInSpain?: MinorsBornInSpain
  schooled?: boolean
  bothParentsCohabiting?: boolean
  otherParentInSpain?: boolean
  checklist: ChecklistItem[]
}

// ─── Personal data for form fill ─────────────────────────────────────────────

export interface PersonalData {
  nombre: string
  primerApellido: string
  segundoApellido: string
  sexo: "H" | "M" | ""
  fechaNacimiento: string
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
  numExpedientePi: string
  estadoPi: "pendiente" | "denegada" | "desistida" | "recurso" | ""
  da21Supuesto: string
}

// ─── Extracted data from document analysis ───────────────────────────────────

export interface ExtractedDocData {
  nombre?: string | null
  primerApellido?: string | null
  segundoApellido?: string | null
  sexo?: "H" | "M" | null
  fechaNacimiento?: string | null
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
  alertasValidez?: string[]
  fechaVencimiento?: string | null
  sugerencias_presencial: string[]
  extractedData: ExtractedDocData
}

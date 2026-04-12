export type PresentationMonth = "2026-04" | "2026-05" | "2026-06"
export type DocFuerza = "fuerte" | "media" | "débil"
export type MonthStatus = "CUBIERTO" | "DÉBIL" | "VACÍO"
export type Veredicto = "CUMPLE" | "CUMPLE_PARCIALMENTE" | "NO_CUMPLE"

export interface DocumentResult {
  tipo: string
  fechas: string[] // YYYY-MM — uno o más meses cubiertos
  valido: boolean
  fuerza: DocFuerza
  motivo_rechazo: string | null
  observacion: string | null
  nombre_sugerido: string
  descripcion_breve: string
  nombre_en_doc: string | null // nombre exactamente como aparece en el documento
  evidencia_por_mes: Record<string, string> | null // YYYY-MM → texto literal que prueba ese mes
  originalName: string
  fileIndex: number
  pageRange: number[] | null  // 1-based page numbers within the original file; null = all pages
}

export interface MonthCoverage {
  yearMonth: string
  label: string
  status: MonthStatus
  docs: DocumentResult[]
  isOptional: boolean
}

export interface AnalysisResult {
  veredicto: Veredicto
  months: MonthCoverage[]
  invalidDocs: DocumentResult[]  // descartados: valido:false o fuera de la ventana temporal
  validDocs: DocumentResult[]    // valido:true y dentro de la ventana temporal
}

export interface ClasificadorFormData {
  nombre: string
  email: string
  telefono: string
  mesPresentation: PresentationMonth
}

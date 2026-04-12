export type AntecedentesStatus =
  | 'en_cola'
  | 'obteniendo_certificado'   // bot: rellena formulario → paga tasa → confirma → descarga PDF
  | 'certificado_emitido'      // PDF del certificado obtenido, iniciando apostilla
  | 'obteniendo_apostilla'     // bot: sube certificado → paga tasa apostilla → confirma
  | 'esperando_apostilla'      // enviado al gobierno, esperando 1-7 días hábiles
  | 'completado'               // apostilla lista para descargar
  | 'requiere_intervencion'    // bot bloqueado, necesita revisión manual
  | 'error'

export interface AntecedentesRequest {
  id: string
  dni: string
  nombre_completo: string
  fecha_emision_dni: string
  fecha_nacimiento: string
  nombre_madre: string
  nombre_padre: string
  email: string
  telefono: string
  status: AntecedentesStatus
  error_message: string | null
  certificado_url: string | null
  apostilla_url: string | null
  queue_position: number | null
  created_at: string
  updated_at: string
}

export interface AntecedentesLog {
  id: string
  request_id: string
  step: string
  message: string | null
  created_at: string
}

export interface AntecedentesFormData {
  nombre_completo: string
  dni: string
  fecha_emision_dni: string
  fecha_nacimiento: string
  nombre_madre: string
  nombre_padre: string
  departamento_nacimiento: string  // como figura en el DNI, ej: LAMBAYEQUE
  provincia_nacimiento: string     // ej: CHICLAYO
  distrito_nacimiento: string      // ej: CHICLAYO
  email: string
  telefono: string
}

export interface SubmitResponse {
  success: boolean
  dni?: string
  id?: string
  already_exists?: boolean
  status?: AntecedentesStatus
  error?: string
}

export interface StatusResponse {
  request: AntecedentesRequest
  logs: AntecedentesLog[]
}

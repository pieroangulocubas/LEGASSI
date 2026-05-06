"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  FileText, Download, Loader2, ChevronDown, ChevronUp,
  Info, UserPlus, Trash2, Users, Sparkles, CheckCircle2, PenLine,
  Eye, X, User, Bell, ShieldCheck,
} from "lucide-react"
import type { PersonalData, DA21Supuesto } from "../types"

// ─── Annex definitions ────────────────────────────────────────────────────────

interface AnnexDef {
  id: string
  label: string
  hint: string
}

const ANNEXES_DA20: AnnexDef[] = [
  { id: "02", label: "Datos de menor representado y firma", hint: "Si solicitas en nombre de un menor de edad" },
  { id: "03", label: "Anexo I-1 — Declaración imposibilidad antecedentes penales", hint: "Si no puedes obtener el certificado de tu país por causas justificadas" },
  { id: "04", label: "Anexo I-2 — Solicitud antecedentes penales país origen", hint: "Si solicitas el certificado directamente al Ministerio" },
]

const ANNEXES_DA21: AnnexDef[] = [
  { id: "02", label: "Datos de menor y declaración actividad por cuenta propia", hint: "Si presentas datos de menor o declaración de autónomo" },
  { id: "03", label: "Anexo I-1 — Declaración imposibilidad antecedentes penales", hint: "Si no puedes obtener el certificado de tu país por causas justificadas" },
  { id: "04", label: "Anexo I-2 — Solicitud antecedentes penales país origen", hint: "Si solicitas el certificado directamente al Ministerio" },
  { id: "05", label: "Anexo II — Acreditación de situación de vulnerabilidad", hint: "Obligatorio si tu supuesto es vulnerabilidad" },
]

// ─── Representante data ───────────────────────────────────────────────────────

interface RepresentanteData {
  nombre: string; primerApellido: string; segundoApellido: string; nif: string
  domicilio: string; piso: string; localidad: string; provincia: string; cp: string
  telefono: string; email: string
}

function emptyRepresentante(): RepresentanteData {
  return { nombre: "", primerApellido: "", segundoApellido: "", nif: "", domicilio: "", piso: "", localidad: "", provincia: "", cp: "", telefono: "", email: "" }
}

// ─── Notification address ─────────────────────────────────────────────────────

interface NotifData {
  nombre: string; nie: string
  domicilio: string; piso: string; localidad: string; provincia: string; cp: string
  telefono: string; email: string
}

function emptyNotif(): NotifData {
  return { nombre: "", nie: "", domicilio: "", piso: "", localidad: "", provincia: "", cp: "", telefono: "", email: "" }
}

// ─── Empty person ─────────────────────────────────────────────────────────────

function emptyPerson(da21Supuesto = ""): PersonalData {
  return {
    nombre: "", primerApellido: "", segundoApellido: "",
    sexo: "", fechaNacimiento: "", lugarNacimiento: "", paisNacimiento: "",
    estadoCivil: "", nacionalidad: "", nombrePadre: "", nombreMadre: "",
    pasaporte: "", nie: "", domicilio: "", piso: "",
    localidad: "", provincia: "", cp: "", telefono: "", email: "",
    numExpedientePi: "", estadoPi: "", da21Supuesto,
  }
}

// ─── Field helpers ────────────────────────────────────────────────────────────

function Field({
  label, id, value, onChange, required, type = "text", placeholder, hint, className, autoFilled, disabled,
}: {
  label: string; id: string; value: string; onChange: (v: string) => void
  required?: boolean; type?: string; placeholder?: string; hint?: string
  className?: string; autoFilled?: boolean; disabled?: boolean
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <label htmlFor={id} className="flex items-center gap-1.5 text-xs font-medium text-foreground/80">
        {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
        {autoFilled && (
          <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-1.5 py-px text-[9px] font-bold text-emerald-700 dark:text-emerald-300">
            <Sparkles className="h-2 w-2" />Auto
          </span>
        )}
      </label>
      <input
        id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} disabled={disabled}
        className={cn(
          "h-9 rounded-lg border px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors",
          disabled && "opacity-60 cursor-not-allowed",
          autoFilled ? "bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800" : "bg-input border-input",
          required && !value && !disabled && "border-amber-300 dark:border-amber-700 bg-amber-50/40 dark:bg-amber-950/10"
        )}
      />
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  )
}

function SelectField({
  label, id, value, onChange, options, required, autoFilled,
}: {
  label: string; id: string; value: string; onChange: (v: string) => void
  options: { value: string; label: string }[]; required?: boolean; autoFilled?: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="flex items-center gap-1.5 text-xs font-medium text-foreground/80">
        {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
        {autoFilled && (
          <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-1.5 py-px text-[9px] font-bold text-emerald-700 dark:text-emerald-300">
            <Sparkles className="h-2 w-2" />Auto
          </span>
        )}
      </label>
      <select
        id={id} value={value} onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-9 rounded-lg border px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors",
          autoFilled ? "bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800" : "bg-input border-input"
        )}
      >
        <option value="">Seleccionar…</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

// ─── Toggle switch ────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn("w-9 h-5 rounded-full transition-colors relative shrink-0", checked ? "bg-primary" : "bg-muted border border-border")}
    >
      <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform", checked ? "translate-x-4" : "translate-x-0.5")} />
    </button>
  )
}

// ─── Required field keys ──────────────────────────────────────────────────────

const REQUIRED_KEYS: (keyof PersonalData)[] = ["nombre", "primerApellido", "pasaporte", "nacionalidad", "domicilio", "localidad"]

// ─── Single person form ───────────────────────────────────────────────────────

function PersonForm({
  index, data, onChange, pathway, onRemove, canRemove, autoFilledKeys,
}: {
  index: number; data: PersonalData
  onChange: (key: keyof PersonalData, value: string) => void
  pathway: "DA20" | "DA21"; onRemove: () => void; canRemove: boolean
  autoFilledKeys: Set<keyof PersonalData>
}) {
  const [showExtra, setShowExtra] = useState(false)
  function set(key: keyof PersonalData) { return (v: string) => onChange(key, v) }
  function af(key: keyof PersonalData) { return autoFilledKeys.has(key) && !!data[key] }

  const autoFilledCount = (Object.keys(data) as (keyof PersonalData)[]).filter(k => af(k)).length
  const missingRequired = REQUIRED_KEYS.filter(k => !data[k])

  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-muted/40">
        <div className="flex items-center gap-2">
          <Users className="h-3.5 w-3.5 text-primary" />
          <p className="text-xs font-semibold">Persona {index + 1}</p>
        </div>
        <div className="flex items-center gap-2">
          {autoFilledCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
              <Sparkles className="h-2.5 w-2.5" />{autoFilledCount} auto
            </span>
          )}
          {missingRequired.length > 0
            ? <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                {missingRequired.length} pendiente{missingRequired.length > 1 ? "s" : ""}
              </span>
            : <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-2.5 w-2.5" />Completo
              </span>
          }
          {canRemove && (
            <button onClick={onRemove} className="p-1 rounded hover:text-rose-500 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
          )}
        </div>
      </div>

      <div className="px-4 pb-4 pt-3 flex flex-col gap-5">
        {/* Identidad */}
        <div>
          <p className="text-[10px] font-semibold text-primary uppercase tracking-widest mb-2.5">Identidad</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <Field label="Nombre(s)" id={`nombre-${index}`} value={data.nombre} onChange={set("nombre")} required placeholder="Ej: María" autoFilled={af("nombre")} />
            <Field label="Primer apellido" id={`primerApellido-${index}`} value={data.primerApellido} onChange={set("primerApellido")} required placeholder="Ej: García" autoFilled={af("primerApellido")} />
            <Field label="Segundo apellido" id={`segundoApellido-${index}`} value={data.segundoApellido} onChange={set("segundoApellido")} placeholder="Ej: López" autoFilled={af("segundoApellido")} />
            <SelectField label="Sexo" id={`sexo-${index}`} value={data.sexo} onChange={set("sexo")}
              options={[{ value: "H", label: "Hombre (H)" }, { value: "M", label: "Mujer (M)" }]}
              autoFilled={af("sexo")}
            />
            <Field label="Fecha de nacimiento" id={`fechaNacimiento-${index}`} type="date" value={data.fechaNacimiento} onChange={set("fechaNacimiento")} required autoFilled={af("fechaNacimiento")} />
            <Field label="Nº Pasaporte / Doc. viaje" id={`pasaporte-${index}`} value={data.pasaporte} onChange={set("pasaporte")} required placeholder="Ej: C12345678" autoFilled={af("pasaporte")} />
            <Field label="Nacionalidad" id={`nacionalidad-${index}`} value={data.nacionalidad} onChange={set("nacionalidad")} required placeholder="Ej: Venezolana" autoFilled={af("nacionalidad")} />
            <Field label="NIE (si dispones)" id={`nie-${index}`} value={data.nie} onChange={set("nie")} placeholder="Ej: X1234567A" autoFilled={af("nie")} />
            <Field label="Nombre del padre" id={`nombrePadre-${index}`} value={data.nombrePadre} onChange={set("nombrePadre")} placeholder="Nombre completo" autoFilled={af("nombrePadre")} />
            <Field label="Nombre de la madre" id={`nombreMadre-${index}`} value={data.nombreMadre} onChange={set("nombreMadre")} placeholder="Nombre completo" autoFilled={af("nombreMadre")} />
          </div>
        </div>

        {/* Datos complementarios */}
        <div>
          <button
            type="button"
            onClick={() => setShowExtra(!showExtra)}
            className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2.5 hover:text-foreground transition-colors"
          >
            <PenLine className="h-3 w-3" />
            Datos complementarios
            {showExtra ? <ChevronUp className="h-3 w-3 ml-auto" /> : <ChevronDown className="h-3 w-3 ml-auto" />}
          </button>
          {showExtra && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <Field label="Lugar de nacimiento" id={`lugarNacimiento-${index}`} value={data.lugarNacimiento} onChange={set("lugarNacimiento")} placeholder="Ej: Lima" autoFilled={af("lugarNacimiento")} />
              <Field label="País de nacimiento" id={`paisNacimiento-${index}`} value={data.paisNacimiento} onChange={set("paisNacimiento")} placeholder="Ej: Perú" autoFilled={af("paisNacimiento")} />
              <SelectField label="Estado civil" id={`estadoCivil-${index}`} value={data.estadoCivil} onChange={set("estadoCivil")}
                options={[
                  { value: "S", label: "Soltero/a" }, { value: "C", label: "Casado/a" },
                  { value: "V", label: "Viudo/a" }, { value: "D", label: "Divorciado/a" },
                  { value: "Sp", label: "Separado/a" },
                ]}
                autoFilled={af("estadoCivil")}
              />
              <Field label="Teléfono / WhatsApp" id={`telefono-${index}`} value={data.telefono} onChange={set("telefono")} placeholder="+34 6XX XXX XXX" autoFilled={af("telefono")} />
              <Field label="Correo electrónico" id={`email-${index}`} type="email" value={data.email} onChange={set("email")} placeholder="tu@email.com" autoFilled={af("email")} />
            </div>
          )}
        </div>

        {/* Domicilio en España */}
        <div>
          <p className="text-[10px] font-semibold text-primary uppercase tracking-widest mb-2.5">Domicilio en España</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <Field label="Calle y número" id={`domicilio-${index}`} value={data.domicilio} onChange={set("domicilio")} required placeholder="Ej: C/ Mayor 10" className="sm:col-span-2" autoFilled={af("domicilio")} />
            <Field label="Piso / puerta" id={`piso-${index}`} value={data.piso} onChange={set("piso")} placeholder="Ej: 2º A" autoFilled={af("piso")} />
            <Field label="Localidad" id={`localidad-${index}`} value={data.localidad} onChange={set("localidad")} required placeholder="Ej: Madrid" autoFilled={af("localidad")} />
            <Field label="Provincia" id={`provincia-${index}`} value={data.provincia} onChange={set("provincia")} placeholder="Ej: Madrid" autoFilled={af("provincia")} />
            <Field label="Código postal" id={`cp-${index}`} value={data.cp} onChange={set("cp")} placeholder="Ej: 28001" autoFilled={af("cp")} />
          </div>
        </div>

        {/* DA20: datos PI */}
        {pathway === "DA20" && (
          <div>
            <p className="text-[10px] font-semibold text-primary uppercase tracking-widest mb-2.5">Solicitud de Protección Internacional</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <Field label="Nº expediente PI (si lo conoces)" id={`numExpedientePi-${index}`} value={data.numExpedientePi} onChange={set("numExpedientePi")} placeholder="Ej: A-202X-XXXXX" className="sm:col-span-2" autoFilled={af("numExpedientePi")} />
              <SelectField label="Estado de la solicitud PI" id={`estadoPi-${index}`} value={data.estadoPi} onChange={set("estadoPi")}
                options={[
                  { value: "pendiente", label: "Pendiente de resolución" },
                  { value: "denegada", label: "Denegada" },
                  { value: "desistida", label: "Desistida" },
                  { value: "recurso", label: "Con recurso presentado" },
                ]}
                autoFilled={af("estadoPi")}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Representante form ───────────────────────────────────────────────────────

function RepresentanteForm({ data, onChange }: {
  data: RepresentanteData; onChange: (key: keyof RepresentanteData, value: string) => void
}) {
  function set(key: keyof RepresentanteData) { return (v: string) => onChange(key, v) }
  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 px-4 pb-4 pt-3 flex flex-col gap-3">
      <p className="text-[10px] font-semibold text-primary uppercase tracking-widest">Datos del representante</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <Field label="Nombre(s)" id="rep-nombre" value={data.nombre} onChange={set("nombre")} required placeholder="Ej: Juan" />
        <Field label="Primer apellido" id="rep-primerApellido" value={data.primerApellido} onChange={set("primerApellido")} required placeholder="Ej: Pérez" />
        <Field label="Segundo apellido" id="rep-segundoApellido" value={data.segundoApellido} onChange={set("segundoApellido")} placeholder="Ej: Ruiz" />
        <Field label="NIF / NIE / Pasaporte" id="rep-nif" value={data.nif} onChange={set("nif")} required placeholder="Ej: 12345678A" />
        <Field label="Calle y número" id="rep-domicilio" value={data.domicilio} onChange={set("domicilio")} placeholder="Ej: C/ Sol 5" className="sm:col-span-2" />
        <Field label="Piso / puerta" id="rep-piso" value={data.piso} onChange={set("piso")} placeholder="Ej: 1º B" />
        <Field label="Localidad" id="rep-localidad" value={data.localidad} onChange={set("localidad")} placeholder="Ej: Barcelona" />
        <Field label="Provincia" id="rep-provincia" value={data.provincia} onChange={set("provincia")} placeholder="Ej: Barcelona" />
        <Field label="Código postal" id="rep-cp" value={data.cp} onChange={set("cp")} placeholder="Ej: 08001" />
        <Field label="Teléfono" id="rep-telefono" value={data.telefono} onChange={set("telefono")} placeholder="+34 6XX XXX XXX" />
        <Field label="Correo electrónico" id="rep-email" type="email" value={data.email} onChange={set("email")} placeholder="rep@email.com" />
      </div>
    </div>
  )
}

// ─── PDF preview modal ────────────────────────────────────────────────────────

interface PdfPreviewModalProps {
  pdfUrl: string
  formName: string
  loading: boolean
  onClose: () => void
  onConfirm: () => void
}

function PdfPreviewModal({ pdfUrl, formName, loading, onClose, onConfirm }: PdfPreviewModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-background rounded-2xl border border-border shadow-2xl w-full max-w-3xl h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <Eye className="h-4 w-4 text-primary" />
            <p className="font-semibold text-sm">Previsualización — formulario {formName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* PDF iframe */}
        <div className="flex-1 overflow-hidden bg-muted/30">
          <iframe
            src={pdfUrl}
            className="w-full h-full border-0"
            title={`Previsualización ${formName}`}
          />
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-border/60 flex items-center justify-between shrink-0">
          <p className="text-xs text-muted-foreground">Revisa el formulario antes de confirmar la descarga</p>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Volver a editar
            </button>
            <Button onClick={onConfirm} disabled={loading} className="gap-2">
              {loading
                ? <><Loader2 className="h-4 w-4 animate-spin" />Descargando…</>
                : <><Download className="h-4 w-4" />Confirmar y descargar</>
              }
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface FormFillerProps {
  pathway: "DA20" | "DA21"
  da21Supuestos: DA21Supuesto[]
  extractedData?: Partial<PersonalData>
  onFormCompleted?: () => void
  onAnnexesChange?: (annexes: string[]) => void
}

export function FormFiller({ pathway, da21Supuestos, extractedData, onFormCompleted, onAnnexesChange }: FormFillerProps) {
  const hasExtracted = !!extractedData && Object.keys(extractedData).length > 0
  const [open, setOpen] = useState(hasExtracted)
  const [persons, setPersons] = useState<PersonalData[]>([emptyPerson(da21Supuestos.join(", "))])
  const [autoFilledKeys, setAutoFilledKeys] = useState<Set<keyof PersonalData>>(new Set())

  const lastExtracted = useRef<Partial<PersonalData> | undefined>(undefined)
  useEffect(() => {
    if (!extractedData || extractedData === lastExtracted.current) return
    lastExtracted.current = extractedData
    const keys = new Set(
      (Object.entries(extractedData) as [keyof PersonalData, string | null | undefined][])
        .filter(([, v]) => v != null && v !== "")
        .map(([k]) => k)
    )
    setAutoFilledKeys(keys)
    setPersons((ps) => ps.map((p, i) =>
      i === 0 ? { ...p, ...Object.fromEntries(Object.entries(extractedData).filter(([, v]) => v != null && v !== "")) } : p
    ))
    setOpen(true)
  }, [extractedData])

  // Sección 2 — Representante
  const [hasRepresentante, setHasRepresentante] = useState(false)
  const [representante, setRepresentante] = useState<RepresentanteData>(emptyRepresentante())

  // Sección 3 — Notificaciones
  const [notifSameAsMain, setNotifSameAsMain] = useState(true)
  const [notifData, setNotifData] = useState<NotifData>(emptyNotif())

  // Consiento
  const [consiento, setConsiento] = useState(true)

  // Anexos
  const [selectedAnnexes, setSelectedAnnexes] = useState<string[]>(
    pathway === "DA21" && da21Supuestos.includes("vulnerability") ? ["05"] : []
  )

  // Notify parent when annexes change
  const prevAnnexes = useRef<string[]>([])
  useEffect(() => {
    if (JSON.stringify(selectedAnnexes) !== JSON.stringify(prevAnnexes.current)) {
      prevAnnexes.current = selectedAnnexes
      onAnnexesChange?.(selectedAnnexes)
    }
  }, [selectedAnnexes, onAnnexesChange])

  // Preview state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [downloadLoading, setDownloadLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Revoke blob URL on unmount
  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }
  }, [previewUrl])

  const formName = pathway === "DA20" ? "EX31" : "EX32"
  const availableAnnexes = pathway === "DA20" ? ANNEXES_DA20 : ANNEXES_DA21
  const totalAutoFilled = autoFilledKeys.size

  function updatePerson(index: number, key: keyof PersonalData, value: string) {
    setPersons((ps) => ps.map((p, i) => i === index ? { ...p, [key]: value } : p))
  }

  function updateRepresentante(key: keyof RepresentanteData, value: string) {
    setRepresentante((r) => ({ ...r, [key]: value }))
  }

  function updateNotif(key: keyof NotifData, value: string) {
    setNotifData((n) => ({ ...n, [key]: value }))
  }

  function addPerson() {
    if (persons.length >= 10) return
    setPersons((ps) => [...ps, emptyPerson(da21Supuestos.join(", "))])
  }

  function removePerson(index: number) {
    setPersons((ps) => ps.filter((_, i) => i !== index))
  }

  function toggleAnnex(id: string) {
    setSelectedAnnexes((prev) => prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id])
  }

  function isPersonValid(p: PersonalData) {
    return !!(p.nombre && p.primerApellido && p.pasaporte && p.nacionalidad && p.domicilio && p.localidad)
  }

  const allValid = persons.length > 0 && persons.every(isPersonValid)
  const mainPerson = persons[0]

  // Build notification data (always sends main person's info if notifSameAsMain)
  const notifForFill: NotifData = notifSameAsMain
    ? {
        nombre: [mainPerson.nombre, mainPerson.primerApellido, mainPerson.segundoApellido].filter(Boolean).join(" "),
        nie: mainPerson.nie || mainPerson.pasaporte,
        domicilio: mainPerson.domicilio,
        piso: mainPerson.piso,
        localidad: mainPerson.localidad,
        provincia: mainPerson.provincia,
        cp: mainPerson.cp,
        telefono: mainPerson.telefono,
        email: mainPerson.email,
      }
    : notifData

  const buildPayload = useCallback(() => ({
    persons,
    pathway,
    annexes: selectedAnnexes,
    hasRepresentante,
    representante: hasRepresentante ? representante : null,
    notifData: notifForFill,
    consiento,
  }), [persons, pathway, selectedAnnexes, hasRepresentante, representante, notifForFill, consiento])

  async function handlePreview() {
    setError(null)
    setPreviewLoading(true)
    if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null) }
    try {
      const res = await fetch("/api/evaluador/fill-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      })
      if (!res.ok) {
        const j = await res.json()
        setError(j.error ?? "Error al generar la previsualización.")
        return
      }
      const blob = await res.blob()
      setPreviewUrl(URL.createObjectURL(blob))
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.")
    } finally {
      setPreviewLoading(false)
    }
  }

  async function handleDownloadConfirm() {
    if (!previewUrl) return
    setDownloadLoading(true)
    try {
      const a = document.createElement("a")
      a.href = previewUrl
      const suffix = persons.length > 1 ? `_${persons.length}personas` : ""
      a.download = `solicitud-${formName}${suffix}-legassi.pdf`
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      setPreviewUrl(null)
      onFormCompleted?.()
    } finally {
      setDownloadLoading(false)
    }
  }

  return (
    <>
      {previewUrl && (
        <PdfPreviewModal
          pdfUrl={previewUrl}
          formName={formName}
          loading={downloadLoading}
          onClose={() => { URL.revokeObjectURL(previewUrl); setPreviewUrl(null) }}
          onConfirm={handleDownloadConfirm}
        />
      )}

      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/40 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold">Rellenar formulario oficial {formName}</p>
              <p className="text-xs text-muted-foreground">
                {persons.length > 1 ? `${persons.length} personas` : "1 persona"}
                {selectedAnnexes.length > 0 ? ` · ${selectedAnnexes.length} anexo${selectedAnnexes.length > 1 ? "s" : ""}` : ""}
                {totalAutoFilled > 0 ? ` · ${totalAutoFilled} campos auto-rellenados` : ""}
              </p>
            </div>
          </div>
          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>

        {open && (
          <div className="border-t border-border/40 px-5 pb-5 pt-4 flex flex-col gap-5">

            {/* Banner */}
            {totalAutoFilled > 0 ? (
              <div className="flex gap-2.5 items-start rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-700 px-4 py-3">
                <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
                  <strong>{totalAutoFilled} campos</strong> se han rellenado automáticamente. Los campos en verde son los extraídos — revísalos antes de previsualizar.
                </p>
              </div>
            ) : (
              <div className="flex gap-2.5 items-start rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 px-4 py-3">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                  Sube documentos en el checklist de arriba para auto-rellenar. O completa manualmente si lo prefieres.
                </p>
              </div>
            )}

            {/* Person forms */}
            <div className="flex flex-col gap-3">
              {persons.map((person, i) => (
                <PersonForm
                  key={i} index={i} data={person}
                  onChange={(key, val) => updatePerson(i, key, val)}
                  pathway={pathway}
                  onRemove={() => removePerson(i)}
                  canRemove={persons.length > 1}
                  autoFilledKeys={i === 0 ? autoFilledKeys : new Set()}
                />
              ))}
            </div>

            {persons.length < 10 && (
              <button onClick={addPerson} className="flex items-center gap-2 text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
                <UserPlus className="h-3.5 w-3.5" />
                Añadir otra persona (presentación simultánea)
              </button>
            )}

            {/* Sección 2 — Representante */}
            <div className="rounded-xl border border-border/50 bg-muted/10 overflow-hidden">
              <button
                type="button"
                onClick={() => setHasRepresentante(!hasRepresentante)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  <div className="text-left">
                    <p className="text-xs font-semibold">¿Presentará otra persona la solicitud?</p>
                    <p className="text-[11px] text-muted-foreground">Sección 2 — Datos del representante</p>
                  </div>
                </div>
                <Toggle checked={hasRepresentante} onChange={setHasRepresentante} />
              </button>
              {hasRepresentante && (
                <div className="px-4 pb-4">
                  <RepresentanteForm data={representante} onChange={updateRepresentante} />
                </div>
              )}
            </div>

            {/* Sección 3 — Domicilio a efectos de notificaciones */}
            <div className="rounded-xl border border-border/50 bg-muted/10 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
                <div className="flex items-center gap-2.5">
                  <Bell className="h-3.5 w-3.5 text-muted-foreground" />
                  <div>
                    <p className="text-xs font-semibold">Domicilio a efectos de notificaciones</p>
                    <p className="text-[11px] text-muted-foreground">Sección 3 — Siempre requerido</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground">Igual al principal</span>
                  <Toggle checked={notifSameAsMain} onChange={setNotifSameAsMain} />
                </div>
              </div>
              {notifSameAsMain ? (
                <div className="px-4 py-3">
                  <p className="text-[11px] text-muted-foreground italic">
                    Nombre: <strong>{[mainPerson.nombre, mainPerson.primerApellido].filter(Boolean).join(" ") || "—"}</strong>
                    {" · "}
                    {[mainPerson.domicilio, mainPerson.piso, mainPerson.localidad, mainPerson.cp].filter(Boolean).join(", ") || "— (completa el domicilio principal)"}
                  </p>
                </div>
              ) : (
                <div className="px-4 pb-4 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <Field label="Nombre completo" id="notif-nombre" value={notifData.nombre} onChange={(v) => updateNotif("nombre", v)} placeholder="Para notificaciones" className="sm:col-span-2" />
                  <Field label="NIE / Pasaporte (acceso Dehú)" id="notif-nie" value={notifData.nie} onChange={(v) => updateNotif("nie", v)} placeholder="NIE o pasaporte" />
                  <Field label="Teléfono" id="notif-telefono" value={notifData.telefono} onChange={(v) => updateNotif("telefono", v)} placeholder="+34 6XX XXX XXX" />
                  <Field label="Calle y número" id="notif-domicilio" value={notifData.domicilio} onChange={(v) => updateNotif("domicilio", v)} placeholder="Ej: C/ Mayor 10" className="sm:col-span-2" />
                  <Field label="Piso / puerta" id="notif-piso" value={notifData.piso} onChange={(v) => updateNotif("piso", v)} placeholder="Ej: 2º A" />
                  <Field label="Localidad" id="notif-localidad" value={notifData.localidad} onChange={(v) => updateNotif("localidad", v)} placeholder="Ej: Madrid" />
                  <Field label="Provincia" id="notif-provincia" value={notifData.provincia} onChange={(v) => updateNotif("provincia", v)} placeholder="Ej: Madrid" />
                  <Field label="Código postal" id="notif-cp" value={notifData.cp} onChange={(v) => updateNotif("cp", v)} placeholder="Ej: 28001" />
                  <Field label="E-mail" id="notif-email" type="email" value={notifData.email} onChange={(v) => updateNotif("email", v)} placeholder="tu@email.com" className="sm:col-span-2" />
                </div>
              )}
            </div>

            {/* Consiento */}
            <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-border/50 bg-muted/10 px-4 py-3 hover:bg-muted/20 transition-colors">
              <input
                type="checkbox" checked={consiento} onChange={(e) => setConsiento(e.target.checked)}
                className="mt-0.5 shrink-0 accent-primary h-4 w-4"
              />
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className={cn("h-3.5 w-3.5 shrink-0", consiento ? "text-emerald-600" : "text-muted-foreground")} />
                  <p className="text-xs font-medium leading-snug">Consiento recibir notificaciones electrónicas (Dehú)</p>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">Requiere certificado digital o Cl@ve. Recomendado si dispones de NIE.</p>
              </div>
            </label>

            {/* Anexos */}
            <div>
              <p className="text-[10px] font-semibold text-primary uppercase tracking-widest mb-2">Anexos a incluir</p>
              <div className="flex flex-col gap-2">
                {availableAnnexes.map((annex) => (
                  <label
                    key={annex.id}
                    className="flex items-start gap-3 cursor-pointer rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 px-3 py-2.5 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAnnexes.includes(annex.id)}
                      onChange={() => toggleAnnex(annex.id)}
                      className="mt-0.5 shrink-0 accent-primary"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-medium leading-snug">{annex.label}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{annex.hint}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <Button
                onClick={handlePreview}
                disabled={!allValid || previewLoading}
                variant="outline"
                className="gap-2"
              >
                {previewLoading
                  ? <><Loader2 className="h-4 w-4 animate-spin" />Generando previsualización…</>
                  : <><Eye className="h-4 w-4" />Previsualizar formulario</>
                }
              </Button>
              {!allValid && (
                <p className="text-xs text-muted-foreground">Completa los campos obligatorios (*) marcados en naranja</p>
              )}
            </div>

          </div>
        )}
      </div>
    </>
  )
}

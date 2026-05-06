"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  FileText, Download, Loader2, ChevronDown, ChevronUp,
  Info, UserPlus, Trash2, Users, Sparkles, CheckCircle2, PenLine,
  Eye, X, User, MapPin, Bell, ShieldCheck,
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
  nombre: string
  primerApellido: string
  segundoApellido: string
  nif: string        // NIF/NIE/Pasaporte del representante
  domicilio: string
  piso: string
  localidad: string
  provincia: string
  cp: string
  telefono: string
  email: string
}

function emptyRepresentante(): RepresentanteData {
  return {
    nombre: "", primerApellido: "", segundoApellido: "", nif: "",
    domicilio: "", piso: "", localidad: "", provincia: "", cp: "",
    telefono: "", email: "",
  }
}

// ─── Notification address ─────────────────────────────────────────────────────

interface NotifData {
  domicilio: string
  piso: string
  localidad: string
  provincia: string
  cp: string
}

function emptyNotif(): NotifData {
  return { domicilio: "", piso: "", localidad: "", provincia: "", cp: "" }
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
            <Sparkles className="h-2 w-2" />
            Auto
          </span>
        )}
      </label>
      <input
        id={id} type={type} value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "h-9 rounded-lg border px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors",
          disabled && "opacity-60 cursor-not-allowed",
          autoFilled
            ? "bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
            : "bg-input border-input",
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
            <Sparkles className="h-2 w-2" />
            Auto
          </span>
        )}
      </label>
      <select
        id={id} value={value} onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-9 rounded-lg border px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors",
          autoFilled
            ? "bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
            : "bg-input border-input"
        )}
      >
        <option value="">Seleccionar…</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
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
  pathway: "DA20" | "DA21"
  onRemove: () => void; canRemove: boolean
  autoFilledKeys: Set<keyof PersonalData>
}) {
  const [showExtra, setShowExtra] = useState(false)

  function set(key: keyof PersonalData) { return (v: string) => onChange(key, v) }
  function af(key: keyof PersonalData) { return autoFilledKeys.has(key) && !!data[key] }

  const autoFilledCount = (Object.keys(data) as (keyof PersonalData)[]).filter(k => af(k)).length
  const missingRequired = REQUIRED_KEYS.filter(k => !data[k])

  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 overflow-hidden">
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
            <button onClick={onRemove} className="p-1 rounded hover:text-rose-500 transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
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
              <Field label="Nombre del padre" id={`nombrePadre-${index}`} value={data.nombrePadre} onChange={set("nombrePadre")} placeholder="Nombre completo" autoFilled={af("nombrePadre")} />
              <Field label="Nombre de la madre" id={`nombreMadre-${index}`} value={data.nombreMadre} onChange={set("nombreMadre")} placeholder="Nombre completo" autoFilled={af("nombreMadre")} />
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
  data: RepresentanteData
  onChange: (key: keyof RepresentanteData, value: string) => void
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

// ─── Preview modal ────────────────────────────────────────────────────────────

function PreviewRow({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <div className="flex gap-2 text-xs">
      <span className="text-muted-foreground min-w-[120px] shrink-0">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

interface PreviewModalProps {
  persons: PersonalData[]
  hasRepresentante: boolean
  representante: RepresentanteData
  notifSameAsMain: boolean
  notifData: NotifData
  consiento: boolean
  selectedAnnexes: string[]
  availableAnnexes: AnnexDef[]
  formName: string
  loading: boolean
  onClose: () => void
  onConfirm: () => void
}

function PreviewModal({
  persons, hasRepresentante, representante, notifSameAsMain, notifData, consiento,
  selectedAnnexes, availableAnnexes, formName, loading, onClose, onConfirm,
}: PreviewModalProps) {
  const mainPerson = persons[0]
  const notifAddress = notifSameAsMain
    ? { domicilio: mainPerson.domicilio, piso: mainPerson.piso, localidad: mainPerson.localidad, provincia: mainPerson.provincia, cp: mainPerson.cp }
    : notifData

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-background rounded-2xl border border-border shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <Eye className="h-4 w-4 text-primary" />
            <p className="font-semibold text-sm">Previsualización — formulario {formName}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 flex flex-col gap-5">

          {/* Sección 1 — Solicitante */}
          {persons.map((p, i) => (
            <div key={i}>
              <div className="flex items-center gap-2 mb-2.5">
                <User className="h-3.5 w-3.5 text-primary" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                  {persons.length > 1 ? `Sección 1 — Solicitante ${i + 1}` : "Sección 1 — Datos del solicitante"}
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <PreviewRow label="Nombre completo" value={[p.nombre, p.primerApellido, p.segundoApellido].filter(Boolean).join(" ")} />
                <PreviewRow label="Pasaporte / Doc." value={p.pasaporte} />
                <PreviewRow label="NIE" value={p.nie} />
                <PreviewRow label="Nacionalidad" value={p.nacionalidad} />
                <PreviewRow label="F. nacimiento" value={p.fechaNacimiento} />
                <PreviewRow label="Lugar nacimiento" value={[p.lugarNacimiento, p.paisNacimiento].filter(Boolean).join(", ")} />
                <PreviewRow label="Domicilio" value={[p.domicilio, p.piso].filter(Boolean).join(", ")} />
                <PreviewRow label="Localidad / CP" value={[p.localidad, p.cp, p.provincia].filter(Boolean).join(", ")} />
                <PreviewRow label="Teléfono" value={p.telefono} />
                <PreviewRow label="Email" value={p.email} />
                {p.numExpedientePi && <PreviewRow label="Expediente PI" value={p.numExpedientePi} />}
              </div>
            </div>
          ))}

          {/* Sección 2 — Representante */}
          {hasRepresentante && (
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <Users className="h-3.5 w-3.5 text-primary" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Sección 2 — Representante</p>
              </div>
              <div className="flex flex-col gap-1.5">
                <PreviewRow label="Nombre completo" value={[representante.nombre, representante.primerApellido, representante.segundoApellido].filter(Boolean).join(" ")} />
                <PreviewRow label="NIF / NIE / Pasaporte" value={representante.nif} />
                <PreviewRow label="Domicilio" value={[representante.domicilio, representante.piso].filter(Boolean).join(", ")} />
                <PreviewRow label="Localidad / CP" value={[representante.localidad, representante.cp, representante.provincia].filter(Boolean).join(", ")} />
                <PreviewRow label="Teléfono" value={representante.telefono} />
                <PreviewRow label="Email" value={representante.email} />
              </div>
            </div>
          )}

          {/* Sección 3 — Notificaciones */}
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Sección 3 — Domicilio a efectos de notificaciones</p>
            </div>
            {notifSameAsMain
              ? <p className="text-xs text-muted-foreground italic">Igual que domicilio principal</p>
              : (
                <div className="flex flex-col gap-1.5">
                  <PreviewRow label="Domicilio" value={[notifAddress.domicilio, notifAddress.piso].filter(Boolean).join(", ")} />
                  <PreviewRow label="Localidad / CP" value={[notifAddress.localidad, notifAddress.cp, notifAddress.provincia].filter(Boolean).join(", ")} />
                </div>
              )
            }
          </div>

          {/* Consiento */}
          <div className="flex items-start gap-2.5 rounded-lg border border-border/40 bg-muted/30 px-3 py-2.5">
            <ShieldCheck className={cn("h-4 w-4 shrink-0 mt-0.5", consiento ? "text-emerald-600" : "text-rose-500")} />
            <p className="text-xs leading-relaxed">
              <strong>Consentimiento de notificación electrónica:</strong>{" "}
              {consiento ? "Sí, consiente" : "No consiente"}
            </p>
          </div>

          {/* Anexos */}
          {selectedAnnexes.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1.5">Anexos incluidos</p>
              <ul className="flex flex-col gap-0.5">
                {selectedAnnexes.map(id => {
                  const a = availableAnnexes.find(x => x.id === id)
                  return a ? <li key={id} className="text-xs text-muted-foreground">• {a.label}</li> : null
                })}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border/60 flex items-center justify-end gap-3 shrink-0">
          <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Volver a editar
          </button>
          <Button onClick={onConfirm} disabled={loading} className="gap-2">
            {loading
              ? <><Loader2 className="h-4 w-4 animate-spin" />Generando…</>
              : <><Download className="h-4 w-4" />Confirmar y descargar</>
            }
          </Button>
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
}

export function FormFiller({ pathway, da21Supuestos, extractedData, onFormCompleted }: FormFillerProps) {
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

  // Representante (sección 2)
  const [hasRepresentante, setHasRepresentante] = useState(false)
  const [representante, setRepresentante] = useState<RepresentanteData>(emptyRepresentante())

  // Notificaciones (sección 3)
  const [notifSameAsMain, setNotifSameAsMain] = useState(true)
  const [notifData, setNotifData] = useState<NotifData>(emptyNotif())

  // Consiento
  const [consiento, setConsiento] = useState(true)

  // Annexes
  const [selectedAnnexes, setSelectedAnnexes] = useState<string[]>(
    pathway === "DA21" && da21Supuestos.includes("vulnerability") ? ["05"] : []
  )

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const formName = pathway === "DA20" ? "EX31" : "EX32"
  const availableAnnexes = pathway === "DA20" ? ANNEXES_DA20 : ANNEXES_DA21

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
    setSelectedAnnexes((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    )
  }

  function isPersonValid(p: PersonalData) {
    return !!(p.nombre && p.primerApellido && p.pasaporte && p.nacionalidad && p.domicilio && p.localidad)
  }

  const allValid = persons.length > 0 && persons.every(isPersonValid)
  const totalAutoFilled = autoFilledKeys.size

  const notifForFill: NotifData = notifSameAsMain
    ? { domicilio: persons[0].domicilio, piso: persons[0].piso, localidad: persons[0].localidad, provincia: persons[0].provincia, cp: persons[0].cp }
    : notifData

  async function handleDownload() {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/evaluador/fill-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          persons,
          pathway,
          annexes: selectedAnnexes,
          hasRepresentante,
          representante: hasRepresentante ? representante : null,
          notifData: notifForFill,
          consiento,
        }),
      })

      if (!res.ok) {
        const j = await res.json()
        setError(j.error ?? "Error al generar el PDF.")
        return
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const suffix = persons.length > 1 ? `_${persons.length}personas` : ""
      a.download = `solicitud-${formName}${suffix}-legassi.pdf`
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setShowPreview(false)
      onFormCompleted?.()
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {showPreview && (
        <PreviewModal
          persons={persons}
          hasRepresentante={hasRepresentante}
          representante={representante}
          notifSameAsMain={notifSameAsMain}
          notifData={notifData}
          consiento={consiento}
          selectedAnnexes={selectedAnnexes}
          availableAnnexes={availableAnnexes}
          formName={formName}
          loading={loading}
          onClose={() => setShowPreview(false)}
          onConfirm={handleDownload}
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

            {/* Auto-fill banner */}
            {totalAutoFilled > 0 ? (
              <div className="flex gap-2.5 items-start rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-700 px-4 py-3">
                <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
                  <strong>{totalAutoFilled} campos</strong> se han rellenado automáticamente a partir de los documentos que subiste.
                  Los campos en verde son los extraídos — revísalos antes de descargar. Completa los que falten.
                </p>
              </div>
            ) : (
              <div className="flex gap-2.5 items-start rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 px-4 py-3">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                  Sube tus documentos en el checklist de arriba para que los datos se rellenen automáticamente. O completa el formulario manualmente si lo prefieres.
                </p>
              </div>
            )}

            {/* Person forms */}
            <div className="flex flex-col gap-3">
              {persons.map((person, i) => (
                <PersonForm
                  key={i}
                  index={i}
                  data={person}
                  onChange={(key, val) => updatePerson(i, key, val)}
                  pathway={pathway}
                  onRemove={() => removePerson(i)}
                  canRemove={persons.length > 1}
                  autoFilledKeys={i === 0 ? autoFilledKeys : new Set()}
                />
              ))}
            </div>

            {/* Add person */}
            {persons.length < 10 && (
              <button
                onClick={addPerson}
                className="flex items-center gap-2 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
              >
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
                <div className={cn(
                  "w-9 h-5 rounded-full transition-colors relative",
                  hasRepresentante ? "bg-primary" : "bg-muted border border-border"
                )}>
                  <span className={cn(
                    "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
                    hasRepresentante ? "translate-x-4" : "translate-x-0.5"
                  )} />
                </div>
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
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-[11px] text-muted-foreground">Igual que domicilio principal</span>
                  <button
                    type="button"
                    onClick={() => setNotifSameAsMain(!notifSameAsMain)}
                    className={cn(
                      "w-9 h-5 rounded-full transition-colors relative shrink-0",
                      notifSameAsMain ? "bg-primary" : "bg-muted border border-border"
                    )}
                  >
                    <span className={cn(
                      "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
                      notifSameAsMain ? "translate-x-4" : "translate-x-0.5"
                    )} />
                  </button>
                </label>
              </div>
              {notifSameAsMain ? (
                <div className="px-4 py-3">
                  <p className="text-[11px] text-muted-foreground italic">
                    Se usará: {[persons[0].domicilio, persons[0].piso, persons[0].localidad, persons[0].cp].filter(Boolean).join(", ") || "— (completa el domicilio principal)"}
                  </p>
                </div>
              ) : (
                <div className="px-4 pb-4 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <Field label="Calle y número" id="notif-domicilio" value={notifData.domicilio} onChange={(v) => updateNotif("domicilio", v)} placeholder="Ej: C/ Mayor 10" className="sm:col-span-2" />
                  <Field label="Piso / puerta" id="notif-piso" value={notifData.piso} onChange={(v) => updateNotif("piso", v)} placeholder="Ej: 2º A" />
                  <Field label="Localidad" id="notif-localidad" value={notifData.localidad} onChange={(v) => updateNotif("localidad", v)} placeholder="Ej: Madrid" />
                  <Field label="Provincia" id="notif-provincia" value={notifData.provincia} onChange={(v) => updateNotif("provincia", v)} placeholder="Ej: Madrid" />
                  <Field label="Código postal" id="notif-cp" value={notifData.cp} onChange={(v) => updateNotif("cp", v)} placeholder="Ej: 28001" />
                </div>
              )}
            </div>

            {/* Consiento */}
            <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-border/50 bg-muted/10 px-4 py-3 hover:bg-muted/20 transition-colors">
              <input
                type="checkbox"
                checked={consiento}
                onChange={(e) => setConsiento(e.target.checked)}
                className="mt-0.5 shrink-0 accent-primary h-4 w-4"
              />
              <div>
                <p className="text-xs font-medium leading-snug">Consiento recibir notificaciones por medios electrónicos</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Casilla de consentimiento — marcada por defecto</p>
              </div>
            </label>

            {/* Annexes */}
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
                onClick={() => setShowPreview(true)}
                disabled={!allValid}
                variant="outline"
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                Previsualizar
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

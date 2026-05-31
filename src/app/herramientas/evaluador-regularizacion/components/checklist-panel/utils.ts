import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  FileText,
} from "lucide-react"
import type { ChecklistItem, DocStatus, ExtractedDocData } from "../../types"

export const SECTION_LABELS: Record<string, string> = {
  identity: "Documentos de Identidad",
  case: "Documentacion de la Via",
  criminal: "Antecedentes Penales",
  minors: "Documentacion de Menores",
  family: "Bloque Familiar",
  permanence: "Pruebas de Permanencia",
  admin: "Tramite Administrativo",
}

export const SECTION_ORDER = [
  "identity",
  "case",
  "criminal",
  "family",
  "minors",
  "permanence",
  "admin",
] as const

export type KnownSection = (typeof SECTION_ORDER)[number]

export const docResultCardConfig: Record<
  DocStatus,
  { bg: string; border: string; icon: React.ElementType; iconColor: string }
> = {
  valido: {
    bg: "bg-emerald-50/70 dark:bg-emerald-950/20",
    border: "border-emerald-200 dark:border-emerald-800",
    icon: CheckCircle2,
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  valido_con_observaciones: {
    bg: "bg-amber-50/70 dark:bg-amber-950/20",
    border: "border-amber-200 dark:border-amber-800",
    icon: AlertTriangle,
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  invalido: {
    bg: "bg-rose-50/70 dark:bg-rose-950/20",
    border: "border-rose-200 dark:border-rose-800",
    icon: XCircle,
    iconColor: "text-rose-600 dark:text-rose-400",
  },
  no_identificado: {
    bg: "bg-muted/30",
    border: "border-border",
    icon: FileText,
    iconColor: "text-muted-foreground/50",
  },
}

export const docStatusConfig: Record<
  DocStatus,
  { icon: React.ElementType; color: string }
> = {
  valido: { icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400" },
  valido_con_observaciones: {
    icon: AlertTriangle,
    color: "text-amber-600 dark:text-amber-400",
  },
  invalido: { icon: XCircle, color: "text-rose-600 dark:text-rose-400" },
  no_identificado: { icon: Info, color: "text-slate-500 dark:text-slate-400" },
}

export function formatDate(iso: string): string {
  const d = new Date(iso + "T12:00:00")
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })
}

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader()
    reader.onload = () => res((reader.result as string).split(",")[1])
    reader.onerror = rej
    reader.readAsDataURL(file)
  })
}

export function getMimeType(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase()
  if (ext === "pdf") return "application/pdf"
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg"
  if (ext === "png") return "image/png"
  if (ext === "webp") return "image/webp"
  return "application/octet-stream"
}

export function isInitiallyDone(item: ChecklistItem): boolean {
  return item.status === "info" || item.optional === true
}

export interface ContradictionWarning {
  itemIdA: string
  itemIdB: string
  field: "nombre" | "fechaNacimiento" | "nie"
  valueA: string
  valueB: string
}

function normalizeNameTokens(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((t) => t.length > 1)
  )
}

function buildFullName(d: ExtractedDocData): string | null {
  const parts = [d.nombre, d.primerApellido, d.segundoApellido].filter(
    (v): v is string => !!v
  )
  return parts.length > 0 ? parts.join(" ") : null
}

export function detectContradictions(
  dataMap: Map<string, ExtractedDocData>
): ContradictionWarning[] {
  const warnings: ContradictionWarning[] = []
  const entries = [...dataMap.entries()]

  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const [idA, dA] = entries[i]
      const [idB, dB] = entries[j]

      const nameA = buildFullName(dA)
      const nameB = buildFullName(dB)
      if (nameA && nameB) {
        const tokA = normalizeNameTokens(nameA)
        const tokB = normalizeNameTokens(nameB)
        const shared = [...tokA].filter((t) => tokB.has(t)).length
        if (shared === 0) {
          warnings.push({
            itemIdA: idA,
            itemIdB: idB,
            field: "nombre",
            valueA: nameA,
            valueB: nameB,
          })
        }
      }

      if (dA.fechaNacimiento && dB.fechaNacimiento && dA.fechaNacimiento !== dB.fechaNacimiento) {
        warnings.push({
          itemIdA: idA,
          itemIdB: idB,
          field: "fechaNacimiento",
          valueA: dA.fechaNacimiento,
          valueB: dB.fechaNacimiento,
        })
      }

      const nieA = dA.nie?.replace(/[\s-]/g, "").toUpperCase()
      const nieB = dB.nie?.replace(/[\s-]/g, "").toUpperCase()
      if (nieA && nieB && nieA !== nieB) {
        warnings.push({ itemIdA: idA, itemIdB: idB, field: "nie", valueA: dA.nie!, valueB: dB.nie! })
      }
    }
  }

  return warnings
}

export const FIELD_LABEL: Record<ContradictionWarning["field"], string> = {
  nombre: "nombre",
  fechaNacimiento: "fecha de nacimiento",
  nie: "numero de NIE",
}

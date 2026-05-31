"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ExternalLink,
  FileText,
  Info,
  Lock,
  Scan,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type {
  ChecklistItem,
  DocStatus,
  ExtractDocResult,
  ExtractedDocData,
  PersonalData,
} from "../types"
import { ClasificadorResultSlot } from "./checklist-panel/ClasificadorResultSlot"
import { UploadSlot } from "./checklist-panel/UploadSlot"
import {
  detectContradictions,
  docResultCardConfig,
  FIELD_LABEL,
  isInitiallyDone,
  type KnownSection,
  SECTION_LABELS,
  SECTION_ORDER,
} from "./checklist-panel/utils"

interface ChecklistPanelProps {
  items: ChecklistItem[]
  pathway: "DA20" | "DA21"
  onDataExtracted?: (data: Partial<PersonalData>) => void
  onAllRequiredDone?: (done: boolean) => void
  externalDoneIds?: string[]
  onAnnexesChanged?: (annexIds: string[]) => void
}

export function ChecklistPanel({
  items,
  pathway,
  onDataExtracted,
  onAllRequiredDone,
  externalDoneIds = [],
  onAnnexesChanged,
}: ChecklistPanelProps) {
  const [doneIds, setDoneIds] = useState<Set<string>>(() => {
    const initial = new Set<string>()
    for (const item of items) {
      if (isInitiallyDone(item)) initial.add(item.id)
    }
    return initial
  })

  const [itemResults, setItemResults] = useState<Map<string, DocStatus>>(new Map())
  const [flashingIds, setFlashingIds] = useState<Set<string>>(new Set())
  const [extractedByItem, setExtractedByItem] = useState<Map<string, ExtractedDocData>>(new Map())
  const [contradictions, setContradictions] = useState<
    ReturnType<typeof detectContradictions>
  >([])
  const [annexChoices, setAnnexChoices] = useState<Map<string, string>>(new Map())

  const onAnnexesChangedRef = useRef(onAnnexesChanged)
  onAnnexesChangedRef.current = onAnnexesChanged

  useEffect(() => {
    onAnnexesChangedRef.current?.([...annexChoices.values()])
  }, [annexChoices])

  useEffect(() => {
    if (externalDoneIds.length === 0) return
    setDoneIds((prev) => {
      const next = new Set(prev)
      for (const id of externalDoneIds) next.add(id)
      return next
    })
  }, [externalDoneIds])

  useEffect(() => {
    if (extractedByItem.size < 2) {
      setContradictions([])
      return
    }
    setContradictions(detectContradictions(extractedByItem))
  }, [extractedByItem])

  function handleAnnexChoice(itemId: string, annexId: string) {
    setAnnexChoices((prev) => new Map([...prev, [itemId, annexId]]))
    markDone(itemId)
  }

  function handleUndoAnnexChoice(itemId: string) {
    setAnnexChoices((prev) => {
      const m = new Map(prev)
      m.delete(itemId)
      return m
    })
    setDoneIds((prev) => {
      const s = new Set(prev)
      s.delete(itemId)
      return s
    })
  }

  const requiredItems = items.filter((i) => !isInitiallyDone(i))
  const allDone = requiredItems.length === 0 || requiredItems.every((i) => doneIds.has(i.id))

  const onAllRequiredDoneRef = useRef(onAllRequiredDone)
  onAllRequiredDoneRef.current = onAllRequiredDone

  useEffect(() => {
    onAllRequiredDoneRef.current?.(allDone && contradictions.length === 0)
  }, [allDone, contradictions])

  function markDone(id: string) {
    setDoneIds((prev) => new Set([...prev, id]))
  }

  const unlockedSections = useMemo(() => {
    const unlocked = new Set<string>()
    for (const section of SECTION_ORDER) {
      unlocked.add(section)
      const required = items.filter((i) => i.section === section && !isInitiallyDone(i))
      const complete = required.length === 0 || required.every((i) => doneIds.has(i.id))
      if (!complete) break
    }
    return unlocked
  }, [items, doneIds])

  function getBlockingSection(section: string): KnownSection | null {
    const idx = SECTION_ORDER.indexOf(section as KnownSection)
    if (idx <= 0) return null
    for (let i = idx - 1; i >= 0; i--) {
      const s = SECTION_ORDER[i]
      const hasRequired = items.some((it) => it.section === s && !isInitiallyDone(it))
      if (hasRequired) return s
    }
    return null
  }

  const grouped: { section: string | undefined; items: ChecklistItem[] }[] = []
  for (const item of items) {
    const last = grouped[grouped.length - 1]
    if (last && last.section === item.section) {
      last.items.push(item)
    } else {
      grouped.push({ section: item.section, items: [item] })
    }
  }

  const itemLabelMap = Object.fromEntries(items.map((i) => [i.id, i.label]))
  const contradictingIds = new Set(contradictions.flatMap((c) => [c.itemIdA, c.itemIdB]))

  function handleResult(item: ChecklistItem, result: ExtractDocResult) {
    markDone(item.id)
    setItemResults((prev) => new Map([...prev, [item.id, result.estado]]))
    setFlashingIds((prev) => new Set([...prev, item.id]))
    setTimeout(() => {
      setFlashingIds((prev) => {
        const s = new Set(prev)
        s.delete(item.id)
        return s
      })
    }, 700)

    const d = result.extractedData
    const hasIdentityData = !!(d.nombre || d.primerApellido || d.segundoApellido || d.fechaNacimiento || d.nie)
    if (hasIdentityData) {
      setExtractedByItem((prev) => new Map([...prev, [item.id, d]]))
    }

    if (item.id === "passport") {
      const fullName = [d.nombre, d.primerApellido, d.segundoApellido].filter(Boolean).join(" ")
      if (fullName) localStorage.setItem("clasificador_nombre", fullName)
    }

    if (!onDataExtracted) return
    const cleaned: Partial<PersonalData> = {}
    if (d.nombre) cleaned.nombre = d.nombre
    if (d.primerApellido) cleaned.primerApellido = d.primerApellido
    if (d.segundoApellido) cleaned.segundoApellido = d.segundoApellido
    if (d.sexo) cleaned.sexo = d.sexo
    if (d.fechaNacimiento) cleaned.fechaNacimiento = d.fechaNacimiento
    if (d.lugarNacimiento) cleaned.lugarNacimiento = d.lugarNacimiento
    if (d.paisNacimiento) cleaned.paisNacimiento = d.paisNacimiento
    if (d.nacionalidad) cleaned.nacionalidad = d.nacionalidad
    if (d.pasaporte) cleaned.pasaporte = d.pasaporte
    if (d.nie) cleaned.nie = d.nie
    if (d.domicilio) cleaned.domicilio = d.domicilio
    if (d.piso) cleaned.piso = d.piso
    if (d.localidad) cleaned.localidad = d.localidad
    if (d.provincia) cleaned.provincia = d.provincia
    if (d.cp) cleaned.cp = d.cp
    if (d.telefono) cleaned.telefono = d.telefono
    if (d.email) cleaned.email = d.email
    if (d.numExpedientePi) cleaned.numExpedientePi = d.numExpedientePi
    if (d.estadoPi) cleaned.estadoPi = d.estadoPi as PersonalData["estadoPi"]
    if (Object.keys(cleaned).length > 0) onDataExtracted(cleaned)
  }

  return (
    <>
      <style>{`
        @keyframes doccheck-pop {
          0%   { transform: scale(0.8); opacity: 0; }
          60%  { transform: scale(1.03); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes card-result-pop {
          0%   { transform: scale(0.985); }
          55%  { transform: scale(1.018); }
          100% { transform: scale(1); }
        }
        .card-result-pop {
          animation: card-result-pop 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
      `}</style>

      {contradictions.length > 0 && (
        <div className="rounded-xl border-2 border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/30 px-4 py-3.5 flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <p className="text-sm font-semibold text-rose-800 dark:text-rose-200">
              Inconsistencia entre documentos - debes resolverla antes de continuar
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            {contradictions.map((c, i) => {
              const labelA = itemLabelMap[c.itemIdA] ?? c.itemIdA
              const labelB = itemLabelMap[c.itemIdB] ?? c.itemIdB
              const fieldLabel = FIELD_LABEL[c.field]
              return (
                <div key={i} className="flex items-start gap-2 text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
                  <span className="shrink-0 mt-0.5 font-bold">·</span>
                  <span>
                    El <strong className="font-semibold">{fieldLabel}</strong> no coincide: {" "}
                    <span className="font-mono bg-rose-100 dark:bg-rose-900/40 rounded px-1">{c.valueA}</span>{" "}
                    en <em className="not-italic font-medium">{labelA.substring(0, 40)}{labelA.length > 40 ? "..." : ""}</em>{" "}
                    vs <span className="font-mono bg-rose-100 dark:bg-rose-900/40 rounded px-1">{c.valueB}</span>{" "}
                    en <em className="not-italic font-medium">{labelB.substring(0, 40)}{labelB.length > 40 ? "..." : ""}</em>.
                  </span>
                </div>
              )
            })}
          </div>
          <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
            Sustituye el documento incorrecto pulsando &quot;cambiar&quot; en su tarjeta. El formulario no estara disponible hasta que no haya conflictos.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-5">
        {grouped.map((group, gi) => {
          const isKnownSection = group.section != null && SECTION_ORDER.includes(group.section as KnownSection)
          const isLocked = isKnownSection && !unlockedSections.has(group.section!)
          const blockingSection = isLocked && group.section ? getBlockingSection(group.section) : null
          const requiredCount = group.items.filter((i) => !isInitiallyDone(i)).length

          if (isLocked) {
            return (
              <div key={group.section ?? gi} className="flex flex-col gap-2">
                <div className="flex items-center gap-2.5 pt-1">
                  <Lock className="h-3 w-3 text-muted-foreground/30 shrink-0" />
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/30 whitespace-nowrap">
                    {SECTION_LABELS[group.section!] ?? group.section}
                  </p>
                  <div className="flex-1 h-px bg-border/30" />
                </div>
                <div className="rounded-xl border border-dashed border-border/40 bg-muted/5 px-4 py-3 flex items-center gap-3">
                  <Lock className="h-4 w-4 text-muted-foreground/20 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground/40">
                      {requiredCount > 0
                        ? `${requiredCount} documento${requiredCount !== 1 ? "s" : ""} pendiente${requiredCount !== 1 ? "s" : ""}`
                        : `${group.items.length} elemento${group.items.length !== 1 ? "s" : ""}`}
                    </p>
                    {blockingSection && SECTION_LABELS[blockingSection] && (
                      <p className="text-[11px] text-muted-foreground/30 mt-0.5">
                        Completa &quot;{SECTION_LABELS[blockingSection]}&quot; para desbloquear
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          }

          return (
            <div key={group.section ?? gi} className="flex flex-col gap-2.5">
              {group.section && SECTION_LABELS[group.section] && (
                <div className="flex items-center gap-2.5 pt-1">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                    {SECTION_LABELS[group.section]}
                  </p>
                  <div className="flex-1 h-px bg-border/50" />
                </div>
              )}
              <div className="flex flex-col gap-2.5">
                {group.items.map((item) => {
                  const isDone = doneIds.has(item.id)
                  const isRequired = !isInitiallyDone(item)
                  const annexChoice = annexChoices.get(item.id)
                  const docResult = itemResults.get(item.id)
                  const isFlashing = flashingIds.has(item.id)

                  let cardBg: string
                  let cardBorder: string
                  let CardIcon: React.ElementType
                  let cardIconColor: string

                  if (item.optional) {
                    cardBg = "bg-blue-50/40 dark:bg-blue-950/20"
                    cardBorder = "border-blue-200 dark:border-blue-800"
                    CardIcon = Info
                    cardIconColor = "text-blue-600 dark:text-blue-400"
                  } else if (docResult) {
                    const rc = docResultCardConfig[docResult] ?? docResultCardConfig.no_identificado
                    cardBg = rc.bg
                    cardBorder = rc.border
                    CardIcon = rc.icon
                    cardIconColor = rc.iconColor
                  } else if (isDone && !item.uploadable) {
                    cardBg = "bg-emerald-50/60 dark:bg-emerald-950/20"
                    cardBorder = "border-emerald-200 dark:border-emerald-800"
                    CardIcon = CheckCircle2
                    cardIconColor = "text-emerald-600 dark:text-emerald-400"
                  } else {
                    cardBg = "bg-card"
                    cardBorder = "border-border"
                    CardIcon = FileText
                    cardIconColor = "text-muted-foreground/40"
                  }

                  const showStrikethrough = isDone && isRequired
                  const isConflicting = contradictingIds.has(item.id)

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "rounded-xl border p-4 transition-colors duration-300",
                        cardBg,
                        cardBorder,
                        isFlashing && "card-result-pop",
                        isConflicting && "ring-2 ring-amber-400/70 dark:ring-amber-500/50"
                      )}
                    >
                      <div className="flex gap-3">
                        <CardIcon className={cn("h-4 w-4 shrink-0 mt-0.5 transition-colors duration-300", cardIconColor)} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <p className={cn("text-sm font-medium leading-snug transition-opacity duration-200", showStrikethrough && "line-through opacity-50")}>
                              {item.label}
                            </p>
                            {item.optional && (
                              <span className="shrink-0 text-[10px] font-semibold text-blue-700 dark:text-blue-400 bg-blue-100/60 dark:bg-blue-900/30 rounded px-1.5 py-0.5">
                                Opcional
                              </span>
                            )}
                          </div>

                          {!showStrikethrough && item.detail && (
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.detail}</p>
                          )}

                          {!isDone && item.criteria && item.criteria.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {item.criteria.map((c, ci) => (
                                <span
                                  key={ci}
                                  className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/50 border border-border/50 rounded-full px-2 py-0.5 leading-none"
                                >
                                  {c}
                                </span>
                              ))}
                            </div>
                          )}

                          {!(isDone && isRequired) && item.linkHref && item.linkLabel && !item.isClasificadorResult &&
                            (item.isClassificadorLink ? (
                              <Link href={item.linkHref} className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
                                <Scan className="h-3 w-3" />
                                {item.linkLabel}
                              </Link>
                            ) : (
                              <a
                                href={item.linkHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                              >
                                <ExternalLink className="h-3 w-3" />
                                {item.linkLabel}
                              </a>
                            ))}

                          {item.isClasificadorResult ? (
                            <ClasificadorResultSlot onDone={() => markDone(item.id)} />
                          ) : item.uploadable ? (
                            <UploadSlot
                              item={item}
                              pathway={pathway}
                              onResult={(result) => handleResult(item, result)}
                              onDone={() => markDone(item.id)}
                              onUndo={() => {
                                if (isRequired) {
                                  setDoneIds((prev) => {
                                    const s = new Set(prev)
                                    s.delete(item.id)
                                    return s
                                  })
                                }
                                setItemResults((prev) => {
                                  const m = new Map(prev)
                                  m.delete(item.id)
                                  return m
                                })
                                setExtractedByItem((prev) => {
                                  const m = new Map(prev)
                                  m.delete(item.id)
                                  return m
                                })
                              }}
                            />
                          ) : null}

                          {item.annexActions && item.annexActions.length > 0 &&
                            (annexChoice ? (
                              <div className="mt-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 px-3 py-2 flex items-center gap-2">
                                <FileText className="h-3 w-3 text-blue-600 dark:text-blue-400 shrink-0" />
                                <span className="text-[11px] text-blue-700 dark:text-blue-400 flex-1 leading-snug">
                                  Usando {item.annexActions.find((a) => a.id === annexChoice)?.label ?? `Anexo ${annexChoice}`}
                                </span>
                                <button onClick={() => handleUndoAnnexChoice(item.id)} className="text-[10px] text-muted-foreground hover:text-foreground underline shrink-0">
                                  cambiar
                                </button>
                              </div>
                            ) : !isDone ? (
                              <div className="mt-2 flex flex-col gap-1.5">
                                {item.uploadable && <span className="text-[10px] text-muted-foreground font-medium">O en su defecto:</span>}
                                {item.annexActions.map((action) => (
                                  <button
                                    key={action.id}
                                    onClick={() => handleAnnexChoice(item.id, action.id)}
                                    className="inline-flex items-start gap-1.5 text-[11px] font-semibold text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-700 rounded-lg px-2.5 py-1.5 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors text-left w-fit"
                                  >
                                    <FileText className="h-3 w-3 shrink-0 mt-0.5" />
                                    <div>
                                      <span className="leading-snug">{action.label}</span>
                                      {action.hint && (
                                        <p className="text-[10px] font-normal text-blue-600/70 dark:text-blue-500/70 mt-0.5">
                                          {action.hint}
                                        </p>
                                      )}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            ) : null)}

                          {!item.uploadable && !item.isClasificadorResult && isRequired && !isDone && (
                            <button
                              onClick={() => markDone(item.id)}
                              className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700 rounded-lg px-2.5 py-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                            >
                              <Check className="h-3 w-3" />
                              Tengo este documento
                            </button>
                          )}

                          {!item.uploadable && !item.isClasificadorResult && isRequired && isDone && (
                            <div className="mt-2 flex items-center gap-2">
                              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Confirmado
                              </span>
                              <button
                                onClick={() =>
                                  setDoneIds((prev) => {
                                    const s = new Set(prev)
                                    s.delete(item.id)
                                    return s
                                  })
                                }
                                className="text-[10px] text-muted-foreground hover:text-foreground underline"
                              >
                                deshacer
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}


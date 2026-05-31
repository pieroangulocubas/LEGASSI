"use client"

import React, { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  CalendarClock,
  Flame,
  Shield,
  CheckCircle2,
  Check,
  MessageCircle,
  FileText,
  Scan,
  AlertTriangle,
  ExternalLink,
  Info,
  Loader2,
  Sparkles,
  UserPlus,
  X,
} from "lucide-react"
import { AnimatePresence } from "framer-motion"
import { evaluateEligibility, getFamilyMemberChecklist, generateFamilyChecklist } from "./logic"
import { ScoreRing } from "./components/ScoreRing"
import { ChecklistPanel } from "./components/ChecklistPanel"
import { FormFiller } from "./components/FormFiller"
import { PaywallGate } from "./components/PaywallGate"
import { CompletionPanel } from "./components/CompletionPanel"
import { DocFileAnimation } from "./components/DocFileAnimation"
import { useEvaluadorAccess } from "./hooks/useEvaluadorAccess"
import type {
  QuizAnswers, DA21Supuesto, FamilyType, MinorsBornInSpain,
  PermanenceDoc, PersonalData, ChecklistItem, FamilyMemberProfile, FamilyMemberType,
} from "./types"

// ─── Initial state ────────────────────────────────────────────────────────────

const EMPTY: QuizAnswers = {
  forWhom: null,
  inSpainBefore2026: null,
  permitStatus: null,
  hasChildrenToRegularize: null,
  isUkrainian: null,
  hasPiHistory: null,
  da20IncludesFamily: null,
  da21Supuesto: null,
  familyType: null,
  minorCount: null,
  minorsBornInSpain: null,
  minorsSchooled: null,
  bothParentsCohabiting: null,
  otherParentInSpain: null,
  familySimultaneous: null,
  familyMembers: [],
  permanenceDocs: [],
  criminalStatus: null,
  passportStatus: null,
}

// ─── Step definitions ────────────────────────────────────────────────────────

type Step =
  | "intro"
  | "for_whom"
  | "in_spain"
  | "permit_status"
  | "children_of_resident"
  | "ukrainian"
  | "pi_history"
  | "da20_family_yn"       // DA20: ¿quiere añadir familiar en presentación simultánea?
  | "da21_supuesto"
  | "family_type"          // qué tipo de familiar
  | "family_minor_info"    // cuántos, dónde nacieron, escolarizados (solo si familyType === "minor_children")
  | "family_cohabitation"  // ambos progenitores empadronados juntos (para menores y adult_disabled)
  | "family_other_parent"  // otro progenitor en España o fuera (si !bothParentsCohabiting)
  | "family_simultaneous"  // DA21: ¿quieren presentar expediente simultáneo?
  | "permanence"
  | "criminal"
  | "passport"
  | "results"

function getSteps(answers: QuizAnswers): Step[] {
  const base: Step[] = ["intro", "for_whom", "in_spain"]
  if (answers.inSpainBefore2026 === false) return [...base, "results"]
  base.push("permit_status")
  if (answers.permitStatus === "pending_procedure") return [...base, "results"]
  if (answers.permitStatus === "has_permit") {
    base.push("children_of_resident")
    return [...base, "results"]
  }
  base.push("ukrainian")
  if (answers.isUkrainian === true) return [...base, "results"]
  base.push("pi_history")
  if (answers.hasPiHistory === true) {
    // DA20: familia siempre simultánea, sin paso de elección
    base.push("da20_family_yn")
    if (answers.da20IncludesFamily === true) {
      base.push("family_type")
      if (answers.familyType === "minor_children") base.push("family_minor_info")
      if (answers.familyType === "minor_children" || answers.familyType === "adult_disabled") {
        base.push("family_cohabitation")
        if (answers.bothParentsCohabiting === false) base.push("family_other_parent")
      }
      // No family_simultaneous para DA20 — siempre es simultáneo
    }
  }
  if (answers.hasPiHistory === false) {
    base.push("da21_supuesto")
    if (answers.da21Supuesto === "family") {
      base.push("family_type")
      if (answers.familyType === "minor_children") base.push("family_minor_info")
      if (answers.familyType === "minor_children" || answers.familyType === "adult_disabled") {
        base.push("family_cohabitation")
        if (answers.bothParentsCohabiting === false) base.push("family_other_parent")
      }
      if (answers.familyType !== null) base.push("family_simultaneous")
    }
  }
  base.push("permanence", "criminal", "passport", "results")
  return base
}

// ─── Option button (single select) ───────────────────────────────────────────

function OptionButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group w-full text-left rounded-2xl border-2 px-4 py-4 text-sm font-medium transition-all duration-200",
        "flex items-start gap-3.5",
        selected
          ? "border-primary bg-gradient-to-br from-primary/8 to-primary/3 shadow-sm shadow-primary/10"
          : "border-border/60 bg-card hover:border-primary/50 hover:bg-primary/3 hover:shadow-sm",
      )}
    >
      <div className={cn(
        "mt-0.5 w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all duration-200",
        selected
          ? "border-primary bg-primary shadow-sm shadow-primary/30"
          : "border-border/50 group-hover:border-primary/50",
      )}>
        {selected && <Check className="h-3 w-3 text-primary-foreground" />}
      </div>
      <span className="flex-1 leading-snug">{children}</span>
    </button>
  )
}

// ─── Question wrapper ─────────────────────────────────────────────────────────

function QuestionCard({
  label,
  title,
  hint,
  children,
}: {
  label: string
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 bg-primary/8 border border-primary/20 rounded-full px-3 py-1">
          <span className="text-[11px] font-bold uppercase tracking-widest text-primary">{label}</span>
        </div>
        <h2 className="text-[22px] font-heading font-bold leading-snug">{title}</h2>
        {hint && (
          <div className="flex items-start gap-2 bg-muted/60 rounded-xl px-3 py-2.5 border border-border/40">
            <Info className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground leading-relaxed">{hint}</p>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2.5">{children}</div>
    </div>
  )
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100)
  return (
    <div className="w-full space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {Array.from({ length: total }, (_, i) => (
            <div
              key={i}
              className={cn(
                "rounded-full transition-all duration-300",
                i < current
                  ? "w-5 h-1.5 bg-primary"
                  : "w-1.5 h-1.5 bg-border",
              )}
            />
          ))}
        </div>
        <span className="text-xs text-muted-foreground font-semibold tabular-nums">{current} / {total}</span>
      </div>
      <div className="h-0.5 w-full rounded-full bg-border/40 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ─── Deadline badge ───────────────────────────────────────────────────────────

function DeadlineBadge({ days }: { days: number }) {
  const urgent = days <= 30
  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold border",
      urgent
        ? "bg-rose-600 border-rose-700 text-white shadow-sm shadow-rose-500/25"
        : "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400",
    )}>
      <CalendarClock className="h-3 w-3" />
      {days > 0 ? `${days} días restantes` : "Plazo cerrado"}
    </div>
  )
}

// ─── Feedback banner ──────────────────────────────────────────────────────────

function FeedbackBanner({ type, text }: { type: "ok" | "warn" | "info"; text: string }) {
  const styles = {
    ok:   { Icon: CheckCircle2, wrap: "bg-emerald-50/80 dark:bg-emerald-950/30 border-l-4 border-l-emerald-500 border-y border-r border-emerald-100 dark:border-emerald-800", text: "text-emerald-900 dark:text-emerald-300", icon: "text-emerald-600 dark:text-emerald-400" },
    warn: { Icon: AlertTriangle, wrap: "bg-amber-50/80 dark:bg-amber-950/30 border-l-4 border-l-amber-500 border-y border-r border-amber-100 dark:border-amber-800", text: "text-amber-900 dark:text-amber-300", icon: "text-amber-600 dark:text-amber-400" },
    info: { Icon: Info,          wrap: "bg-blue-50/80 dark:bg-blue-950/30 border-l-4 border-l-blue-500 border-y border-r border-blue-100 dark:border-blue-800",   text: "text-blue-900 dark:text-blue-300",   icon: "text-blue-600 dark:text-blue-400" },
  }[type]
  const { Icon } = styles
  return (
    <div className={cn("flex gap-2.5 items-start rounded-r-xl px-4 py-3", styles.wrap)}>
      <Icon className={cn("h-4 w-4 shrink-0 mt-0.5", styles.icon)} />
      <p className={cn("text-sm leading-relaxed font-medium", styles.text)}>{text}</p>
    </div>
  )
}

// ─── Step bar ─────────────────────────────────────────────────────────────────

type DashStep = "docs" | "form" | "presentation"

function StepBar({
  step, allDone, formDone, onStepClick,
}: {
  step: DashStep; allDone: boolean; formDone: boolean; onStepClick: (s: DashStep) => void
}) {
  const steps: { id: DashStep; label: string }[] = [
    { id: "docs", label: "Documentos" },
    { id: "form", label: "Formulario" },
    { id: "presentation", label: "Presentación" },
  ]
  const accessible: Record<DashStep, boolean> = { docs: true, form: allDone, presentation: formDone }
  const order: Record<DashStep, number> = { docs: 0, form: 1, presentation: 2 }
  const cur = order[step]
  return (
    <div className="flex items-center w-full">
      {steps.map((s, i) => {
        const isPast = i < cur
        const isActive = s.id === step
        const isLocked = !accessible[s.id]
        return (
          <React.Fragment key={s.id}>
            {i > 0 && <div className={cn("flex-1 h-px mx-3 transition-colors", isPast ? "bg-primary" : "bg-border/60")} />}
            <button
              disabled={isLocked}
              onClick={() => !isLocked && onStepClick(s.id)}
              className="flex flex-col items-center gap-1.5 shrink-0 group"
            >
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all",
                isPast ? "bg-primary border-primary text-primary-foreground"
                  : isActive ? "border-primary bg-primary/10 text-primary"
                    : isLocked ? "border-border/40 text-muted-foreground/40 bg-card cursor-not-allowed"
                      : "border-border text-muted-foreground bg-card hover:border-primary/50 cursor-pointer",
              )}>
                {isPast ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span className={cn(
                "text-[10px] font-semibold whitespace-nowrap transition-colors",
                isActive ? "text-primary" : isPast ? "text-foreground/70" : isLocked ? "text-muted-foreground/40" : "text-muted-foreground",
              )}>{s.label}</span>
            </button>
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ─── Confetti ─────────────────────────────────────────────────────────────────

function launchConfetti() {
  if (typeof window === "undefined") return
  const canvas = document.createElement("canvas")
  canvas.style.cssText = "position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:9999"
  document.body.appendChild(canvas)
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  const ctx = canvas.getContext("2d")!
  const COLORS = ["#1a50c8", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"]
  const particles = Array.from({ length: 130 }, () => ({
    x: Math.random() * canvas.width, y: Math.random() * -150 - 20,
    vx: (Math.random() - 0.5) * 5, vy: Math.random() * 4 + 2,
    r: Math.random() * 6 + 3, color: COLORS[Math.floor(Math.random() * COLORS.length)],
    angle: Math.random() * Math.PI * 2, omega: (Math.random() - 0.5) * 0.25,
  }))
  let frame = 0; let animId: number
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.globalAlpha = frame < 140 ? 1 : Math.max(0, 1 - (frame - 140) / 40)
    for (const p of particles) {
      p.x += p.vx; p.y += p.vy; p.vy += 0.06; p.angle += p.omega
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.angle)
      ctx.fillStyle = p.color; ctx.fillRect(-p.r / 2, -p.r * 0.3, p.r, p.r * 0.6); ctx.restore()
    }
    frame++
    if (frame < 180) { animId = requestAnimationFrame(draw) } else { cancelAnimationFrame(animId); canvas.remove() }
  }
  animId = requestAnimationFrame(draw)
}

// ─── "Añadir familiar" mini-quiz state ───────────────────────────────────────

interface FamiliarQuizState {
  step: "type" | "count" | "born" | "schooled" | "cohabitation" | "other_parent" | "done"
  type: FamilyMemberType | null
  count: number | null
  bornInSpain: MinorsBornInSpain | null
  schooled: boolean | null
  bothParentsCohabiting: boolean | null
  otherParentInSpain: boolean | null
}

const FAMILIAR_EMPTY: FamiliarQuizState = {
  step: "type", type: null, count: null, bornInSpain: null,
  schooled: null, bothParentsCohabiting: null, otherParentInSpain: null,
}

function familyTypeLabel(ft: import("./types").FamilyType | null, count?: number | null): string {
  if (!ft) return "Familiares"
  if (ft === "minor_children") return count && count > 1 ? `Hijos menores (${count})` : "Hijo/a menor"
  if (ft === "adult_disabled") return "Hijo/a con discapacidad"
  return "Ascendiente"
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function EvaluadorPage() {
  const [answers, setAnswers] = useState<QuizAnswers>(EMPTY)
  const [stepIndex, setStepIndex] = useState(0)
  const [formConfirmed, setFormConfirmed] = useState(false)
  const [checklistAnnexes, setChecklistAnnexes] = useState<string[]>([])
  const [extractedData, setExtractedData] = useState<Partial<PersonalData>>({})
  const [dashStep, setDashStep] = useState<DashStep>("docs")
  const [expandedPersons, setExpandedPersons] = useState<Record<string, boolean>>({ main: true })
  const [personDoneMap, setPersonDoneMap] = useState<Record<string, boolean>>({})
  const [showDocAnim, setShowDocAnim] = useState(false)
  const [extraFamilyMembers, setExtraFamilyMembers] = useState<FamilyMemberProfile[]>([])
  const [familiarQuiz, setFamiliarQuiz] = useState<FamiliarQuizState | null>(null)

  const { hasAccess, verifying, checkout } = useEvaluadorAccess()
  const prevAllDone = useRef(false)

  function mergeExtractedData(incoming: Partial<PersonalData>) {
    setExtractedData((prev) => ({ ...prev, ...incoming }))
  }

  const steps = getSteps(answers)
  const currentStep = steps[stepIndex]
  const isResults = currentStep === "results"
  const isIntro = currentStep === "intro"

  const questionSteps = steps.filter((s) => s !== "intro" && s !== "results") as Exclude<Step, "intro" | "results">[]
  const currentQuestionIndex = questionSteps.indexOf(currentStep as Exclude<Step, "intro" | "results">)
  const totalQuestions = questionSteps.length

  function next() { setStepIndex((i) => Math.min(i + 1, steps.length - 1)) }
  function back() { setStepIndex((i) => Math.max(i - 1, 0)) }

  function reset() {
    setAnswers(EMPTY)
    setStepIndex(0)
    setFormConfirmed(false)
    setChecklistAnnexes([])
    setExtractedData({})
    setDashStep("docs")
    setExpandedPersons({ main: true })
    setPersonDoneMap({})
    setShowDocAnim(false)
    setExtraFamilyMembers([])
    setFamiliarQuiz(null)
    prevAllDone.current = false
  }

  function toggleDoc(doc: PermanenceDoc) {
    setAnswers((a) => {
      if (doc === "none") return { ...a, permanenceDocs: ["none"] }
      const without = a.permanenceDocs.filter((d) => d !== "none")
      return {
        ...a,
        permanenceDocs: without.includes(doc) ? without.filter((d) => d !== doc) : [...without, doc],
      }
    })
  }

  // Sync familyMembers when familyType changes
  function setFamilyType(ft: FamilyType) {
    const memberMap: Record<FamilyType, QuizAnswers["familyMembers"][number]> = {
      minor_children: "minor_children",
      adult_disabled: "adult_disabled_children",
      ascendants: "cohabiting_ascendants",
    }
    setAnswers((a) => ({
      ...a,
      familyType: ft,
      familyMembers: [memberMap[ft]],
      // reset downstream answers when type changes
      minorCount: null,
      minorsBornInSpain: null,
      minorsSchooled: null,
      bothParentsCohabiting: null,
      otherParentInSpain: null,
    }))
  }

  const canProceed = (() => {
    switch (currentStep) {
      case "intro": return true
      case "for_whom": return answers.forWhom !== null
      case "in_spain": return answers.inSpainBefore2026 !== null
      case "permit_status": return answers.permitStatus !== null
      case "ukrainian": return answers.isUkrainian !== null
      case "pi_history": return answers.hasPiHistory !== null
      case "da20_family_yn": return answers.da20IncludesFamily !== null
      case "da21_supuesto": return answers.da21Supuesto !== null
      case "children_of_resident": return answers.hasChildrenToRegularize !== null
      case "family_type": return answers.familyType !== null
      case "family_minor_info": return answers.minorCount !== null && answers.minorsBornInSpain !== null && answers.minorsSchooled !== null
      case "family_cohabitation": return answers.bothParentsCohabiting !== null
      case "family_other_parent": return answers.otherParentInSpain !== null
      case "family_simultaneous": return answers.familySimultaneous !== null
      case "permanence": return answers.permanenceDocs.length > 0
      case "criminal": return answers.criminalStatus !== null
      case "passport": return answers.passportStatus !== null
      default: return true
    }
  })()

  const result = isResults ? evaluateEligibility(answers) : null
  const deadlineDays = result?.deadlineDays ?? Math.max(0, Math.ceil((new Date("2026-06-30").getTime() - Date.now()) / 86_400_000))

  const autoAnnexes: string[] = []
  if (result?.eligible) {
    if (result.pathway === "DA21" && answers.da21Supuesto === "vulnerability") autoAnnexes.push("05")
    if (answers.familyType === "minor_children" || answers.da21Supuesto === "self_employed") autoAnnexes.push("02")
  }
  const computedAnnexes = [...new Set([...autoAnnexes, ...checklistAnnexes])]

  // ── Persons for accordion ─────────────────────────────────────────────────────
  type PersonEntry = { id: string; label: string; checklist: ChecklistItem[] }
  const mainPersons: PersonEntry[] = isResults && result?.eligible
    ? [
        {
          id: "main",
          label: answers.forWhom === "relative" ? "Principal" : "Yo",
          checklist: result.checklist.filter(i => i.section !== "admin"),
        },
        // Familia simultánea: DA21 con familySimultaneous=true, o DA20 con familia incluida
        ...((answers.familySimultaneous === true || (result.pathway === "DA20" && answers.da20IncludesFamily === true)) && answers.familyType
          ? [{
              id: "family_sim",
              label: familyTypeLabel(answers.familyType, answers.minorCount),
              checklist: generateFamilyChecklist({
                type: answers.familyType as FamilyMemberType,
                count: answers.minorCount ?? 1,
                bornInSpain: answers.minorsBornInSpain ?? undefined,
                schooled: answers.minorsSchooled ?? undefined,
                bothParentsCohabiting: answers.bothParentsCohabiting ?? undefined,
                otherParentInSpain: answers.otherParentInSpain ?? undefined,
                pathway: result.pathway as "DA20" | "DA21",
              }),
            }]
          : []),
        ...(answers.familyMembers.includes("spouse_partner") && result.hasSimultaneousFamily
          ? [{ id: "spouse", label: "Cónyuge / Pareja", checklist: getFamilyMemberChecklist("spouse_partner") }]
          : []),
        ...(answers.familyMembers.includes("cohabiting_ascendants") && result.hasSimultaneousFamily
          ? [{ id: "ascendant", label: "Ascendiente", checklist: getFamilyMemberChecklist("cohabiting_ascendants") }]
          : []),
      ]
    : []

  const extraPersons: PersonEntry[] = extraFamilyMembers.map(m => ({
    id: m.id,
    label: m.label,
    checklist: m.checklist,
  }))

  const persons: PersonEntry[] = [...mainPersons, ...extraPersons]
  const allPersonsDone = persons.length > 0 && persons.every(p => personDoneMap[p.id] === true)

  useEffect(() => {
    if (allPersonsDone && !prevAllDone.current) {
      launchConfetti()
      const t = setTimeout(() => setShowDocAnim(true), 1600)
      return () => clearTimeout(t)
    }
    prevAllDone.current = allPersonsDone
  }, [allPersonsDone])

  // ── Familiar quiz logic ───────────────────────────────────────────────────────
  function familiarQuizNext() {
    if (!familiarQuiz) return
    const q = familiarQuiz

    if (q.step === "type") {
      if (q.type === "spouse_partner" || q.type === "ascendants") {
        // Go straight to done — no count/born/cohabitation questions
        completeFamiliarQuiz({ ...q, step: "done" })
        return
      }
      setFamiliarQuiz({ ...q, step: "count" })
      return
    }
    if (q.step === "count") {
      setFamiliarQuiz({ ...q, step: "born" })
      return
    }
    if (q.step === "born") {
      if (q.type === "minor_children") {
        setFamiliarQuiz({ ...q, step: "schooled" })
      } else {
        setFamiliarQuiz({ ...q, step: "cohabitation" })
      }
      return
    }
    if (q.step === "schooled") {
      setFamiliarQuiz({ ...q, step: "cohabitation" })
      return
    }
    if (q.step === "cohabitation") {
      if (q.bothParentsCohabiting === false) {
        setFamiliarQuiz({ ...q, step: "other_parent" })
      } else {
        completeFamiliarQuiz({ ...q, step: "done" })
      }
      return
    }
    if (q.step === "other_parent") {
      completeFamiliarQuiz({ ...q, step: "done" })
      return
    }
  }

  function completeFamiliarQuiz(q: FamiliarQuizState) {
    if (!q.type) return
    const pathway = (result?.pathway as "DA20" | "DA21") ?? "DA21"
    const checklist = generateFamilyChecklist({
      type: q.type,
      count: q.count ?? 1,
      bornInSpain: q.bornInSpain ?? undefined,
      schooled: q.schooled ?? undefined,
      bothParentsCohabiting: q.bothParentsCohabiting ?? undefined,
      otherParentInSpain: q.otherParentInSpain ?? undefined,
      pathway,
    })
    const typeLabels: Record<FamilyMemberType, string> = {
      minor_children: q.count && q.count > 1 ? `Hijos menores (${q.count})` : "Hijo/a menor",
      adult_disabled: "Hijo/a con discapacidad",
      ascendants: "Ascendiente",
      spouse_partner: "Cónyuge/Pareja",
    }
    const newMember: FamilyMemberProfile = {
      id: `fam_${Date.now()}`,
      type: q.type,
      label: typeLabels[q.type],
      count: q.count ?? 1,
      bornInSpain: q.bornInSpain ?? undefined,
      schooled: q.schooled ?? undefined,
      bothParentsCohabiting: q.bothParentsCohabiting ?? undefined,
      otherParentInSpain: q.otherParentInSpain ?? undefined,
      checklist,
    }
    setExtraFamilyMembers(prev => [...prev, newMember])
    setFamiliarQuiz(null)
    // Expand the newly added person's accordion section
    setExpandedPersons(prev => ({ ...prev, [newMember.id]: true }))
  }

  function familiarCanProceed() {
    if (!familiarQuiz) return false
    const q = familiarQuiz
    if (q.step === "type") return q.type !== null
    if (q.step === "count") return q.count !== null
    if (q.step === "born") return q.bornInSpain !== null
    if (q.step === "schooled") return q.schooled !== null
    if (q.step === "cohabitation") return q.bothParentsCohabiting !== null
    if (q.step === "other_parent") return q.otherParentInSpain !== null
    return false
  }

  return (
    <>
      <AnimatePresence>
        {showDocAnim && result?.eligible && result.checklist.length > 0 && (
          <DocFileAnimation
            docs={result.checklist
              .filter(i => !i.optional && i.section !== "admin")
              .map(i => ({ id: i.id, label: i.label }))}
            onComplete={() => { setShowDocAnim(false); setDashStep("form") }}
            onSkip={() => { setShowDocAnim(false); setDashStep("form") }}
          />
        )}
      </AnimatePresence>

      <Navbar />

      <main className="min-h-screen bg-background pt-20 pb-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">

          {/* Page header */}
          <div className="mb-8">
            <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-[var(--shadow-brand)]">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">HERRAMIENTA · RD 316/2026</p>
                  <h1 className="text-xl font-heading font-black leading-tight">
                    Expediente<span className="text-primary italic">IA</span>
                  </h1>
                </div>
              </div>
              <DeadlineBadge days={deadlineDays} />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Evaluación completa de elegibilidad · checklist personalizado · verificación de documentos con IA · <strong className="text-foreground">formularios EX31/EX32 autorrellenados</strong> listos para presentar.
            </p>
          </div>

          {/* Wizard card */}
          <div className="rounded-2xl border border-border/60 bg-card shadow-[var(--shadow-card)] overflow-hidden">

            {!isIntro && !isResults && (
              <div className="px-6 pt-5 pb-4 border-b border-border/40 bg-muted/20">
                <ProgressBar current={currentQuestionIndex + 1} total={totalQuestions} />
              </div>
            )}

            <div className="px-6 py-6 sm:px-8 sm:py-7">

              {/* ── Intro ─────────────────────────────────────────────────── */}
              {isIntro && (
                <div className="flex flex-col gap-7">
                  {/* Hero intro */}
                  <div className="relative rounded-2xl bg-gradient-to-br from-primary/8 via-primary/4 to-transparent border border-primary/15 p-6 overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
                    <div className="relative">
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 mb-4">
                        <Flame className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs font-bold text-primary uppercase tracking-wide">RD 316/2026 · Gratuito</span>
                      </div>
                      <h2 className="text-2xl font-heading font-black mb-2.5 leading-snug">
                        ¿Puedes regularizar<br />tu situación en España?
                      </h2>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        El <strong className="text-foreground">RD 316/2026</strong> abre un proceso excepcional para regularizar a cientos de miles de personas. En menos de 5 minutos sabes si calificas y qué necesitas. Solo hasta el <strong className="text-foreground">30 de junio de 2026</strong>.
                      </p>
                    </div>
                  </div>

                  {/* Steps */}
                  <div className="space-y-2.5">
                    {[
                      { n: "01", title: "Evaluación completa de elegibilidad", text: "Preguntas guiadas sobre tu situación: vía aplicable (DA20/DA21), puntuación de elegibilidad, checklist personalizado de documentos por persona." },
                      { n: "02", title: "Verificación de documentos con IA", text: "PermanencIA analiza cada documento del checklist: extrae tus datos, detecta huecos de cobertura mensual e inconsistencias entre documentos." },
                      { n: "03", title: "Formularios y modelo de tasa autorrellenados", text: "ExpedienteIA completa automáticamente los formularios EX31/EX32 y el modelo 790 (código 052) con tus datos extraídos. Sin errores manuales." },
                      { n: "04", title: "Expediente PDF listo para presentar", text: "Descarga el expediente completo y preséntalo presencialmente en la oficina de extranjería o con tu certificado electrónico." },
                    ].map((item) => (
                      <div key={item.n} className="flex gap-4 items-start rounded-xl border border-border/50 bg-muted/20 px-4 py-4 hover:border-primary/30 hover:bg-primary/3 transition-colors">
                        <span className="shrink-0 w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-black text-primary">{item.n}</span>
                        <div>
                          <p className="text-sm font-semibold text-foreground mb-0.5">{item.title}</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">{item.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Trust chips */}
                  <div className="flex flex-wrap gap-2">
                    {[
                      { icon: Shield, text: "Anónimo · sin registro" },
                      { icon: CheckCircle2, text: "Resultado inmediato" },
                      { icon: Info, text: "Basado en legislación oficial" },
                    ].map(({ icon: Icon, text }) => (
                      <div key={text} className="inline-flex items-center gap-1.5 rounded-full bg-muted border border-border/60 px-3 py-1.5 text-xs text-muted-foreground font-medium">
                        <Icon className="h-3 w-3 shrink-0 text-primary/60" />{text}
                      </div>
                    ))}
                  </div>

                  <Button variant="cta" size="lg" className="w-full sm:w-auto text-base font-bold" onClick={next}>
                    <Sparkles className="h-4 w-4" />
                    Comenzar evaluación gratuita
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* ── Q0: ¿Para quién? ─────────────────────────────────────── */}
              {currentStep === "for_whom" && (
                <QuestionCard label="Contexto de la solicitud" title="¿Para quién realizas esta evaluación?"
                  hint="No hay respuesta incorrecta — esto solo nos ayuda a personalizar el checklist.">
                  <OptionButton selected={answers.forWhom === "self"} onClick={() => setAnswers(a => ({ ...a, forWhom: "self" }))}>
                    <span className="font-semibold">Para mí mismo/a</span>
                    <span className="block text-xs text-muted-foreground mt-0.5 font-normal">Quiero regularizar mi propia situación en España</span>
                  </OptionButton>
                  <OptionButton selected={answers.forWhom === "relative"} onClick={() => setAnswers(a => ({ ...a, forWhom: "relative" }))}>
                    <span className="font-semibold">Para un familiar</span>
                    <span className="block text-xs text-muted-foreground mt-0.5 font-normal">Estoy tramitando la regularización de un hijo/a, cónyuge u otro familiar</span>
                  </OptionButton>
                  {answers.forWhom === "self" && <FeedbackBanner type="ok" text="Perfecto. La evaluación se centrará en tu situación personal." />}
                  {answers.forWhom === "relative" && <FeedbackBanner type="info" text="La mayoría de requisitos aplican igual que si fuera para ti. Responde pensando en esa persona." />}
                </QuestionCard>
              )}

              {/* ── Q1: En España antes del 1/1/2026 ─────────────────────── */}
              {currentStep === "in_spain" && (
                <QuestionCard label="Requisito base" title="¿Llevas en España de manera continuada desde antes del 1 de enero de 2026?"
                  hint="Si no recuerdas la fecha exacta, un empadronamiento, factura o contrato anterior al 1/1/2026 puede confirmarlo.">
                  <OptionButton selected={answers.inSpainBefore2026 === true} onClick={() => setAnswers(a => ({ ...a, inSpainBefore2026: true }))}>
                    Sí, llegué a España antes del 1 de enero de 2026
                  </OptionButton>
                  <OptionButton selected={answers.inSpainBefore2026 === false} onClick={() => setAnswers(a => ({ ...a, inSpainBefore2026: false }))}>
                    No, llegué después de esa fecha
                  </OptionButton>
                  {answers.inSpainBefore2026 === true && <FeedbackBanner type="ok" text="Cumples el primer requisito del proceso. Es un buen comienzo — continuemos." />}
                  {answers.inSpainBefore2026 === false && <FeedbackBanner type="info" text="Este proceso concreto requiere presencia previa al 1/1/2026. Al final te mostramos qué opciones existen para tu situación." />}
                </QuestionCard>
              )}

              {/* ── Q2: Permiso vigente ───────────────────────────────────── */}
              {currentStep === "permit_status" && (
                <QuestionCard label="Situación actual" title="¿Cuál es tu situación administrativa actual?"
                  hint="Si no estás seguro/a de cuál aplica, elige la que más se acerque.">
                  <OptionButton selected={answers.permitStatus === "has_permit"} onClick={() => setAnswers(a => ({ ...a, permitStatus: "has_permit" }))}>
                    Tengo un permiso de residencia o estancia vigente (TIE, visado de larga duración…)
                  </OptionButton>
                  <OptionButton selected={answers.permitStatus === "pending_procedure"} onClick={() => setAnswers(a => ({ ...a, permitStatus: "pending_procedure" }))}>
                    Tengo un procedimiento de residencia pendiente de resolución
                  </OptionButton>
                  <OptionButton selected={answers.permitStatus === "none"} onClick={() => setAnswers(a => ({ ...a, permitStatus: "none" }))}>
                    No tengo permiso vigente ni procedimiento activo — estoy en situación irregular
                  </OptionButton>
                  {answers.permitStatus === "none" && <FeedbackBanner type="ok" text="Estar sin documentación vigente es exactamente el perfil para el que se creó este proceso. Estás en el lugar correcto." />}
                  {answers.permitStatus === "pending_procedure" && <FeedbackBanner type="info" text="Mientras tengas un trámite activo, este proceso queda en pausa para no interferir. Te lo explicamos al final." />}
                  {answers.permitStatus === "has_permit" && <FeedbackBanner type="info" text="Ya tienes documentación vigente. Este proceso no aplica para ti directamente, pero puede que sí para tus hijos u otros familiares." />}
                </QuestionCard>
              )}

              {/* ── Q2b: Hijos a regularizar (padre con residencia) ──────── */}
              {currentStep === "children_of_resident" && (
                <QuestionCard label="Regularización de familiares" title="¿Tienes hijos menores u otros familiares en situación irregular que quieras regularizar?"
                  hint="Como titular de residencia vigente, la ley te permite regularizar a tus hijos con un proceso simplificado (EX25).">
                  <OptionButton selected={answers.hasChildrenToRegularize === true} onClick={() => setAnswers(a => ({ ...a, hasChildrenToRegularize: true }))}>
                    Sí, quiero regularizar la situación de mis hijos u otros familiares
                  </OptionButton>
                  <OptionButton selected={answers.hasChildrenToRegularize === false} onClick={() => setAnswers(a => ({ ...a, hasChildrenToRegularize: false }))}>
                    No, solo quería verificar mi propia situación
                  </OptionButton>
                  {answers.hasChildrenToRegularize === true && <FeedbackBanner type="ok" text="Como titular de residencia, puedes tramitar la regularización de tus hijos mediante el formulario EX25, con requisitos simplificados por el RD 316/2026." />}
                  {answers.hasChildrenToRegularize === false && <FeedbackBanner type="info" text="Entendido. Como ya tienes residencia propia, este proceso específico no aplica para ti — consulta sobre renovación u otras gestiones." />}
                </QuestionCard>
              )}

              {/* ── Q3: Protección temporal ucraniana ────────────────────── */}
              {currentStep === "ukrainian" && (
                <QuestionCard label="Protección especial" title="¿Eres beneficiario de la Protección Temporal para personas desplazadas de Ucrania?"
                  hint="Este régimen está excluido de la regularización extraordinaria del RD 316/2026.">
                  <OptionButton selected={answers.isUkrainian === true} onClick={() => setAnswers(a => ({ ...a, isUkrainian: true }))}>
                    Sí, tengo Protección Temporal Ucraniana
                  </OptionButton>
                  <OptionButton selected={answers.isUkrainian === false} onClick={() => setAnswers(a => ({ ...a, isUkrainian: false }))}>
                    No, no soy beneficiario de esa protección
                  </OptionButton>
                </QuestionCard>
              )}

              {/* ── Q4: Historial PI ─────────────────────────────────────── */}
              {currentStep === "pi_history" && (
                <QuestionCard label="Vía de regularización" title="¿Presentaste alguna solicitud de Protección Internacional (asilo) en España antes del 1 de enero de 2026?"
                  hint="Cuenta cualquier solicitud en cualquier estado: pendiente, denegada, retirada o con recurso.">
                  <OptionButton selected={answers.hasPiHistory === true} onClick={() => setAnswers(a => ({ ...a, hasPiHistory: true }))}>
                    Sí, pedí o tengo solicitud de asilo / Protección Internacional en España antes del 1/1/2026
                  </OptionButton>
                  <OptionButton selected={answers.hasPiHistory === false} onClick={() => setAnswers(a => ({ ...a, hasPiHistory: false }))}>
                    No, nunca he solicitado asilo en España
                  </OptionButton>
                  {answers.hasPiHistory === true && <FeedbackBanner type="ok" text="Haber solicitado asilo te da acceso a la vía DA20 — que no exige acreditar trabajo ni vulnerabilidad." />}
                  {answers.hasPiHistory === false && <FeedbackBanner type="ok" text="Sin historial de asilo, tu vía es la DA21. Hay varias formas de encajar en ella — te las explicamos en la siguiente pregunta." />}
                </QuestionCard>
              )}

              {/* ── DA20: ¿incluir familiar simultáneo? ──────────────────── */}
              {currentStep === "da20_family_yn" && (
                <QuestionCard
                  label="Familiares (DA20)"
                  title="¿Deseas incluir a algún familiar en tu solicitud de forma simultánea?"
                  hint="En la vía DA20, los familiares solo pueden presentar el expediente de forma simultánea contigo — no como justificante separado.">
                  <OptionButton
                    selected={answers.da20IncludesFamily === true}
                    onClick={() => setAnswers(a => ({ ...a, da20IncludesFamily: true }))}
                  >
                    Sí, quiero incluir a un familiar en mi expediente
                  </OptionButton>
                  <OptionButton
                    selected={answers.da20IncludesFamily === false}
                    onClick={() => setAnswers(a => ({
                      ...a,
                      da20IncludesFamily: false,
                      familyType: null, minorCount: null, minorsBornInSpain: null,
                      minorsSchooled: null, bothParentsCohabiting: null, otherParentInSpain: null,
                    }))}
                  >
                    No, solo presento mi propio expediente
                  </OptionButton>
                  {answers.da20IncludesFamily === true && (
                    <FeedbackBanner type="info" text="Te preguntaré qué tipo de familiar es y sus datos. Tendrán su propia sección de documentos en el expediente." />
                  )}
                  {answers.da20IncludesFamily === false && (
                    <FeedbackBanner type="ok" text="Sin familiares. Continuamos con la documentación de permanencia y antecedentes." />
                  )}
                </QuestionCard>
              )}

              {/* ── Q5: Supuesto DA21 (single select) ────────────────────── */}
              {currentStep === "da21_supuesto" && (
                <QuestionCard
                  label="Supuesto DA21 (vía ordinaria)"
                  title="¿Cuál de estos requisitos puedes acreditar?"
                  hint="Solo necesitas cumplir uno. Si no tienes trabajo ni familia a cargo, el Certificado de Vulnerabilidad es una alternativa real y gratuita."
                >
                  {([
                    { key: "work_history" as DA21Supuesto, label: "Historial laboral", text: "Tengo nóminas, contratos de trabajo o puedo obtener el informe de vida laboral de la Seguridad Social (más de 90 días/año)" },
                    { key: "job_offer" as DA21Supuesto, label: "Oferta de trabajo", text: "Tengo una oferta de trabajo (contrato de al menos 90 días/año firmado por el empleador)" },
                    { key: "self_employed" as DA21Supuesto, label: "Autónomo", text: "Quiero darme de alta como autónomo y puedo presentar una declaración de actividad económica por cuenta propia" },
                    { key: "family" as DA21Supuesto, label: "Familia a cargo", text: "Tengo hijos menores de edad o con discapacidad que viven conmigo, o ascendientes de primer grado dependientes convivientes" },
                    { key: "vulnerability" as DA21Supuesto, label: "Vulnerabilidad", text: "Ninguno de los anteriores — necesitaría el Certificado de Vulnerabilidad emitido por entidades RECEX o Servicios Sociales" },
                  ] as const).map((opt) => (
                    <OptionButton
                      key={opt.key}
                      selected={answers.da21Supuesto === opt.key}
                      onClick={() => setAnswers(a => ({
                        ...a,
                        da21Supuesto: opt.key,
                        // reset family fields when supuesto changes away from family
                        ...(opt.key !== "family" ? { familyType: null, minorCount: null, minorsBornInSpain: null, minorsSchooled: null, bothParentsCohabiting: null, otherParentInSpain: null, familyMembers: [] } : {}),
                      }))}
                    >
                      <span className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">{opt.label}</span>
                      <span className="block mt-0.5 font-normal">{opt.text}</span>
                    </OptionButton>
                  ))}
                  {answers.da21Supuesto === null && (
                    <p className="text-xs text-muted-foreground px-1">Si no cumples ninguno todavía, puedes continuar — te explicamos cómo conseguir el Certificado de Vulnerabilidad.</p>
                  )}
                  {(answers.da21Supuesto === "work_history" || answers.da21Supuesto === "job_offer") && (
                    <FeedbackBanner type="ok" text="El historial o contrato laboral es el supuesto más sólido. Tu expediente tiene muy buenas posibilidades." />
                  )}
                  {answers.da21Supuesto === "self_employed" && (
                    <FeedbackBanner type="ok" text="La actividad por cuenta propia es válida. Se presenta una declaración responsable de intención de alta como autónomo." />
                  )}
                  {answers.da21Supuesto === "family" && (
                    <FeedbackBanner type="ok" text="Tener hijos menores, familiares con discapacidad o ascendientes dependientes a cargo es un supuesto válido. A continuación te pediremos más detalles." />
                  )}
                  {answers.da21Supuesto === "vulnerability" && (
                    <FeedbackBanner type="info" text="El Certificado de Vulnerabilidad es gratuito y una vía completamente válida. Lo emiten Cruz Roja, Cáritas, ACNUR, Médicos del Mundo y Servicios Sociales." />
                  )}
                </QuestionCard>
              )}

              {/* ── Q5a: Tipo de familiar (solo si supuesto = family) ─────── */}
              {currentStep === "family_type" && (
                <QuestionCard
                  label="Familiar a cargo"
                  title="¿Qué tipo de familiar quieres incluir en el expediente?"
                  hint="Selecciona el tipo principal. Puedes añadir más familiares desde el resultado una vez finalices la evaluación."
                >
                  <OptionButton selected={answers.familyType === "minor_children"} onClick={() => setFamilyType("minor_children")}>
                    <span className="font-semibold">Hijos menores de 18 años</span>
                    <span className="block text-xs text-muted-foreground mt-0.5 font-normal">Hijos que conviven contigo y están en situación irregular en España</span>
                  </OptionButton>
                  <OptionButton selected={answers.familyType === "adult_disabled"} onClick={() => setFamilyType("adult_disabled")}>
                    <span className="font-semibold">Hijo/a mayor con discapacidad</span>
                    <span className="block text-xs text-muted-foreground mt-0.5 font-normal">Hijo o hija mayor de edad con discapacidad o incapacidad para valerse que convive contigo</span>
                  </OptionButton>
                  <OptionButton selected={answers.familyType === "ascendants"} onClick={() => setFamilyType("ascendants")}>
                    <span className="font-semibold">Padre o madre (ascendiente de primer grado)</span>
                    <span className="block text-xs text-muted-foreground mt-0.5 font-normal">Padre o madre dependiente que convive contigo en el mismo domicilio</span>
                  </OptionButton>
                  {answers.familyType === "minor_children" && (
                    <FeedbackBanner type="ok" text="Los menores se incluyen en el Anexo 02 del formulario principal. A continuación te preguntaremos algunos datos sobre ellos para personalizar el checklist." />
                  )}
                  {answers.familyType === "adult_disabled" && (
                    <FeedbackBanner type="ok" text="El hijo/a con discapacidad debe acreditar la situación con certificado oficial. A continuación te preguntaremos algunos datos adicionales." />
                  )}
                  {answers.familyType === "ascendants" && (
                    <FeedbackBanner type="ok" text="El ascendiente puede presentar la solicitud simultáneamente contigo (DA21 aptdo. 3). Necesitará sus propios documentos de permanencia e identidad." />
                  )}
                </QuestionCard>
              )}

              {/* ── Q5b: Detalles de menores ──────────────────────────────── */}
              {currentStep === "family_minor_info" && (
                <QuestionCard
                  label="Datos de los hijos menores"
                  title="Cuéntanos más sobre tus hijos menores"
                >
                  {/* Cuántos */}
                  <div>
                    <p className="text-sm font-semibold mb-2">¿Cuántos hijos menores de 18 años incluirás?</p>
                    <div className="grid grid-cols-4 gap-2">
                      {[1, 2, 3, 4].map(n => (
                        <OptionButton key={n} selected={answers.minorCount === n} onClick={() => setAnswers(a => ({ ...a, minorCount: n }))}>
                          <span className="block text-center font-bold text-base">{n}{n === 4 ? "+" : ""}</span>
                        </OptionButton>
                      ))}
                    </div>
                  </div>

                  {/* Dónde nacieron */}
                  <div>
                    <p className="text-sm font-semibold mb-2">¿Dónde nacieron?</p>
                    <div className="flex flex-col gap-2">
                      {([
                        { k: "all" as MinorsBornInSpain, t: "Todos nacieron en España" },
                        { k: "some" as MinorsBornInSpain, t: "Algunos nacieron en España y otros fuera" },
                        { k: "none" as MinorsBornInSpain, t: "Todos nacieron fuera de España" },
                      ]).map(opt => (
                        <OptionButton key={opt.k} selected={answers.minorsBornInSpain === opt.k} onClick={() => setAnswers(a => ({ ...a, minorsBornInSpain: opt.k }))}>
                          {opt.t}
                        </OptionButton>
                      ))}
                    </div>
                  </div>

                  {/* Escolarizados */}
                  <div>
                    <p className="text-sm font-semibold mb-2">¿Están escolarizados (asisten a un centro educativo en España)?</p>
                    <div className="flex flex-col gap-2">
                      <OptionButton selected={answers.minorsSchooled === true} onClick={() => setAnswers(a => ({ ...a, minorsSchooled: true }))}>
                        Sí, están escolarizados
                      </OptionButton>
                      <OptionButton selected={answers.minorsSchooled === false} onClick={() => setAnswers(a => ({ ...a, minorsSchooled: false }))}>
                        No, o no todos están escolarizados
                      </OptionButton>
                    </div>
                  </div>

                  {answers.minorsBornInSpain === "all" && answers.minorsSchooled === true && (
                    <FeedbackBanner type="ok" text="Perfecto: nacidos en España y escolarizados. Tu expediente de menores es muy sólido." />
                  )}
                  {answers.minorsBornInSpain === "none" && (
                    <FeedbackBanner type="info" text="Los menores nacidos fuera de España deberán acreditar 5 meses de permanencia ininterrumpida en España." />
                  )}
                </QuestionCard>
              )}

              {/* ── Q5c: ¿Ambos padres empadronados juntos? ──────────────── */}
              {currentStep === "family_cohabitation" && (
                <QuestionCard
                  label="Situación del otro progenitor"
                  title={answers.familyType === "adult_disabled"
                    ? "¿Ambos progenitores del hijo/a con discapacidad están empadronados en el mismo domicilio que él/ella?"
                    : "¿Ambos progenitores de los menores están empadronados en el mismo domicilio?"}
                  hint="Esto determina si se necesita autorización del otro progenitor para incluir al menor en el expediente."
                >
                  <OptionButton selected={answers.bothParentsCohabiting === true} onClick={() => setAnswers(a => ({ ...a, bothParentsCohabiting: true, otherParentInSpain: null }))}>
                    <span className="font-semibold">Sí, ambos padres vivimos juntos y estamos empadronados en el mismo domicilio</span>
                    <span className="block text-xs text-muted-foreground mt-0.5 font-normal">La autorización del otro progenitor no es necesaria en este caso</span>
                  </OptionButton>
                  <OptionButton selected={answers.bothParentsCohabiting === false} onClick={() => setAnswers(a => ({ ...a, bothParentsCohabiting: false }))}>
                    <span className="font-semibold">No, el otro progenitor no vive en el mismo domicilio</span>
                    <span className="block text-xs text-muted-foreground mt-0.5 font-normal">Será necesaria una autorización notarial del otro progenitor</span>
                  </OptionButton>
                  {answers.bothParentsCohabiting === true && (
                    <FeedbackBanner type="ok" text="Al vivir juntos y estar empadronados en el mismo domicilio, no necesitas autorización adicional del otro progenitor." />
                  )}
                  {answers.bothParentsCohabiting === false && (
                    <FeedbackBanner type="info" text="Necesitarás una autorización notarial del otro progenitor. El formato depende de si está en España o en el extranjero — te lo explicamos en el siguiente paso." />
                  )}
                </QuestionCard>
              )}

              {/* ── Q5d: Otro progenitor en España o fuera ───────────────── */}
              {currentStep === "family_other_parent" && (
                <QuestionCard
                  label="Localización del otro progenitor"
                  title="¿Dónde se encuentra actualmente el otro progenitor?"
                  hint="El tipo de autorización notarial requerida depende de si el otro progenitor está en España o en el extranjero."
                >
                  <OptionButton selected={answers.otherParentInSpain === true} onClick={() => setAnswers(a => ({ ...a, otherParentInSpain: true }))}>
                    <span className="font-semibold">Está en España</span>
                    <span className="block text-xs text-muted-foreground mt-0.5 font-normal">
                      Se requerirá autorización legalizada ante notario español (escritura notarial española)
                    </span>
                  </OptionButton>
                  <OptionButton selected={answers.otherParentInSpain === false} onClick={() => setAnswers(a => ({ ...a, otherParentInSpain: false }))}>
                    <span className="font-semibold">Está en el extranjero</span>
                    <span className="block text-xs text-muted-foreground mt-0.5 font-normal">
                      Se requerirá autorización notarial apostillada según el Convenio de La Haya + traducción jurada al español
                    </span>
                  </OptionButton>
                  {answers.otherParentInSpain === true && (
                    <FeedbackBanner type="info" text="El otro progenitor debe firmar la autorización ante un notario español. No vale una autorización simple ni firmada ante cónsul extranjero." />
                  )}
                  {answers.otherParentInSpain === false && (
                    <FeedbackBanner type="info" text="El otro progenitor debe firmar la autorización ante notario en su país, apostillarla y, si no está en español, añadir traducción jurada." />
                  )}
                </QuestionCard>
              )}

              {/* ── Q5e: ¿Expediente simultáneo? ─────────────────────────── */}
              {currentStep === "family_simultaneous" && (
                <QuestionCard
                  label="Expediente simultáneo"
                  title={`¿Quieres que ${familyTypeLabel(answers.familyType, answers.minorCount).toLowerCase()} ${answers.familyType === "minor_children" && (answers.minorCount ?? 1) > 1 ? "presenten" : "presente"} también su solicitud de forma simultánea?`}
                  hint="Si presentan simultáneamente, se generará una sección aparte en el expediente con los documentos específicos de cada uno. Cada persona necesitará sus propios documentos de identidad, permanencia y antecedentes penales."
                >
                  <OptionButton
                    selected={answers.familySimultaneous === true}
                    onClick={() => setAnswers(a => ({ ...a, familySimultaneous: true }))}
                  >
                    <span className="font-semibold">Sí, quiero incluirlos con expediente simultáneo</span>
                    <span className="block text-xs text-muted-foreground mt-0.5 font-normal">
                      Se generará una sección aparte con su checklist de documentos específico
                    </span>
                  </OptionButton>
                  <OptionButton
                    selected={answers.familySimultaneous === false}
                    onClick={() => setAnswers(a => ({ ...a, familySimultaneous: false }))}
                  >
                    <span className="font-semibold">No, solo los incluyo como justificación del supuesto familiar</span>
                    <span className="block text-xs text-muted-foreground mt-0.5 font-normal">
                      Su documentación se incorpora al expediente del titular (Anexo 02)
                    </span>
                  </OptionButton>
                  {answers.familySimultaneous === true && (
                    <FeedbackBanner type="ok" text={`En el expediente final verás una sección separada para ${familyTypeLabel(answers.familyType, answers.minorCount).toLowerCase()} con su documentación específica.`} />
                  )}
                  {answers.familySimultaneous === false && (
                    <FeedbackBanner type="info" text="Los documentos del familiar quedan en el Anexo 02 del titular. Puedes añadirlos como expediente simultáneo desde el panel de resultados si cambias de idea." />
                  )}
                </QuestionCard>
              )}

              {/* ── Q6: Permanencia ──────────────────────────────────────── */}
              {currentStep === "permanence" && (
                <QuestionCard label="Permanencia en España" title="¿Qué documentos tienes para acreditar tu estancia en España?"
                  hint="No necesitas tenerlos todos — con 2 o 3 tipos distintos ya tienes una base sólida. Lo importante es que cubran los 5 meses previos a la solicitud.">
                  {([
                    { key: "empadronamiento" as PermanenceDoc, text: "Empadronamiento o certificado del ayuntamiento" },
                    { key: "rental_contract" as PermanenceDoc, text: "Contrato de arrendamiento o recibos de alquiler" },
                    { key: "payslips" as PermanenceDoc, text: "Nóminas o contratos de trabajo" },
                    { key: "bank_statements" as PermanenceDoc, text: "Extractos bancarios de entidad española" },
                    { key: "training_certs" as PermanenceDoc, text: "Certificados de formación o estudios en España" },
                    { key: "transport_tickets" as PermanenceDoc, text: "Billetes de transporte dentro de España (tren, autobús, etc.)" },
                    { key: "passport_stamps" as PermanenceDoc, text: "Sellos o visados en pasaporte con entradas/salidas" },
                    { key: "none" as PermanenceDoc, text: "No tengo documentos o tengo muy pocos" },
                  ] as const).map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => toggleDoc(opt.key)}
                      className={cn(
                        "w-full text-left rounded-xl border px-5 py-4 text-sm font-medium transition-all duration-150 flex items-start gap-3",
                        answers.permanenceDocs.includes(opt.key)
                          ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/30"
                          : "border-border bg-card hover:border-primary/40 hover:bg-muted/50",
                      )}
                    >
                      <span className={cn(
                        "mt-0.5 shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors",
                        answers.permanenceDocs.includes(opt.key) ? "bg-primary border-primary" : "border-border",
                      )}>
                        {answers.permanenceDocs.includes(opt.key) && <Check className="h-3 w-3 text-primary-foreground" />}
                      </span>
                      <span>{opt.text}</span>
                    </button>
                  ))}
                  {answers.permanenceDocs.filter(d => d !== "none").length >= 3 && (
                    <FeedbackBanner type="ok" text="Con varios tipos de documentos tienes una base de permanencia muy sólida." />
                  )}
                  {answers.permanenceDocs.filter(d => d !== "none").length >= 1 && answers.permanenceDocs.filter(d => d !== "none").length < 3 && (
                    <FeedbackBanner type="info" text="Ya tienes documentación con la que trabajar. Si puedes, añade alguno más — cada tipo refuerza el expediente." />
                  )}
                  {answers.permanenceDocs.includes("none") && (
                    <FeedbackBanner type="warn" text="Sin documentos es más difícil, pero hay solución. El empadronamiento en el ayuntamiento es gratuito, fácil de conseguir y muy valorado." />
                  )}
                </QuestionCard>
              )}

              {/* ── Q7: Antecedentes ─────────────────────────────────────── */}
              {currentStep === "criminal" && (
                <QuestionCard label="Antecedentes penales" title="¿Tienes antecedentes penales?"
                  hint="Esta pregunta genera mucha inquietud, pero en la mayoría de casos tiene solución.">
                  {([
                    { k: "clean" as const, t: "No tengo antecedentes penales en ningún país" },
                    { k: "maybe_origin" as const, t: "No tengo en España, pero podría haber algo en mi país de origen (no estoy seguro/a)" },
                    { k: "has_spain" as const, t: "Tengo antecedentes penales o policiales en España" },
                    { k: "unknown" as const, t: "No lo sé con certeza — necesito averiguarlo" },
                  ] as const).map(opt => (
                    <OptionButton key={opt.k} selected={answers.criminalStatus === opt.k} onClick={() => setAnswers(a => ({ ...a, criminalStatus: opt.k }))}>
                      {opt.t}
                    </OptionButton>
                  ))}
                  {answers.criminalStatus === "clean" && <FeedbackBanner type="ok" text="Sin antecedentes, este punto no supone ningún obstáculo." />}
                  {answers.criminalStatus === "maybe_origin" && <FeedbackBanner type="info" text="Si el certificado del país de origen tarda o no llega, los Anexos I-1 e I-2 justifican la situación — es una alternativa prevista por la normativa." />}
                  {answers.criminalStatus === "has_spain" && <FeedbackBanner type="warn" text="Este punto requiere atención. Existen mecanismos de cancelación de antecedentes que un asesor puede valorar contigo antes de presentar." />}
                  {answers.criminalStatus === "unknown" && <FeedbackBanner type="info" text="Puedes solicitar los certificados durante la preparación del expediente — es algo que se resuelve paso a paso." />}
                </QuestionCard>
              )}

              {/* ── Q8: Pasaporte ─────────────────────────────────────────── */}
              {currentStep === "passport" && (
                <QuestionCard label="Documentación de identidad" title="¿Dispones de pasaporte o documento de viaje vigente?"
                  hint="Si tu pasaporte ha caducado o no lo tienes, hay tiempo para renovarlo antes del 30 de junio de 2026.">
                  {([
                    { k: "valid" as const, t: "Sí, tengo pasaporte o documento de viaje en vigor" },
                    { k: "expired" as const, t: "Mi pasaporte está caducado" },
                    { k: "missing" as const, t: "No tengo pasaporte o estoy en trámite de renovación" },
                  ] as const).map(opt => (
                    <OptionButton key={opt.k} selected={answers.passportStatus === opt.k} onClick={() => setAnswers(a => ({ ...a, passportStatus: opt.k }))}>
                      {opt.t}
                    </OptionButton>
                  ))}
                  {answers.passportStatus === "valid" && <FeedbackBanner type="ok" text="El pasaporte vigente es un requisito básico que ya tienes cubierto." />}
                  {answers.passportStatus === "expired" && <FeedbackBanner type="warn" text="El pasaporte caducado tiene solución: debes renovarlo en tu consulado antes de presentar la solicitud." />}
                  {answers.passportStatus === "missing" && <FeedbackBanner type="warn" text="Sin pasaporte no se puede presentar la solicitud, pero hay tiempo. Inicia los trámites en tu consulado cuanto antes." />}
                </QuestionCard>
              )}

              {/* ── Results ───────────────────────────────────────────────── */}
              {isResults && result && (
                <div className="flex flex-col gap-7">

                  {/* Score & pathway */}
                  {result.eligible ? (
                    <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                      <ScoreRing score={result.score} label={result.scoreLabel} />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border",
                            result.pathway === "DA20"
                              ? "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400"
                              : "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400",
                          )}>
                            <Shield className="h-3 w-3" />
                            {result.pathway === "DA20" ? "Vía DA20 — Solicitante PI" : "Vía DA21 — Irregular"}
                          </span>
                          {result.formName && (
                            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border border-border bg-muted/50 text-foreground">
                              <FileText className="h-3 w-3" />
                              Formulario {result.formName}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {result.pathway === "DA20"
                            ? "Cumples el perfil de solicitante de Protección Internacional (DA20 del RD 316/2026). Debes usar el formulario EX31."
                            : "Tu caso corresponde a la vía general para extranjeros en situación irregular (DA21). Debes usar el formulario EX32."}
                        </p>
                        {result.formUrl && (
                          <a href={result.formUrl} target="_blank" rel="noopener noreferrer"
                            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
                            <ExternalLink className="h-3 w-3" />
                            Acceder al formulario oficial
                          </a>
                        )}
                      </div>
                    </div>
                  ) : result.isEX25Path ? (
                    <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-5 py-5 flex flex-col gap-3">
                      <div className="flex gap-3 items-start">
                        <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-sm text-amber-800 dark:text-amber-300 mb-1">
                            Tu vía: Formulario EX25 — arts. 159/160 Reglamento de Extranjería
                          </p>
                          <p className="text-sm text-amber-700 dark:text-amber-400 leading-relaxed">
                            Como titular de residencia vigente, no solicitas regularización para ti. Para tus hijos menores u otros familiares en situación irregular, la vía es el formulario <strong>EX25</strong>, con requisitos aligerados por la <strong>Disposición Transitoria Primera del RD 316/2026</strong> hasta el 30 de junio de 2026.
                          </p>
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-2 text-xs">
                        {[
                          { art: "Art. 159", desc: "Hijos nacidos en España — sin requisito de tiempo mínimo de residencia del padre.", fee: "10,94 €" },
                          { art: "Art. 160", desc: "Hijos NO nacidos en España — solo se exigen 5 meses de permanencia del menor en España.", fee: "10,94 €" },
                        ].map((row) => (
                          <div key={row.art} className="rounded-lg bg-white dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-2.5">
                            <p className="font-bold text-amber-700 dark:text-amber-400">{row.art} — EX25</p>
                            <p className="text-foreground/70 mt-0.5">{row.desc}</p>
                            <p className="text-amber-600 dark:text-amber-500 font-semibold mt-1">Tasa: {row.fee} por menor</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 px-5 py-5">
                      <div className="flex gap-3 items-start">
                        <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-sm text-rose-800 dark:text-rose-300 mb-1">No cumples los requisitos del RD 316/2026</p>
                          <p className="text-sm text-rose-700 dark:text-rose-400 leading-relaxed">{result.ineligibleReason}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {result.recommendations.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Recomendaciones</p>
                      <div className="flex flex-col gap-2.5">
                        {result.recommendations.map((rec, i) => (
                          <div key={i} className="flex gap-3 items-start rounded-xl bg-muted/50 border border-border/40 px-4 py-3.5">
                            <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            <p className="text-sm leading-relaxed">{rec}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3-step dashboard — only when eligible */}
                  {result.eligible && (
                    <div className="flex flex-col gap-5">
                      <StepBar step={dashStep} allDone={allPersonsDone} formDone={formConfirmed} onStepClick={setDashStep} />

                      {/* ── Docs step ── */}
                      {dashStep === "docs" && (
                        <div className="flex flex-col gap-4">
                          {/* Acordeón por persona */}
                          <div className="flex flex-col gap-2">
                            {persons.map((person) => {
                              const isOpen = expandedPersons[person.id] ?? false
                              const isDone = personDoneMap[person.id] === true
                              const isMain = person.id === "main"
                              return (
                                <div
                                  key={person.id}
                                  className={cn(
                                    "rounded-xl border transition-colors overflow-hidden",
                                    isDone
                                      ? "border-emerald-200 dark:border-emerald-800"
                                      : "border-border",
                                  )}
                                >
                                  {/* Header del acordeón */}
                                  <button
                                    onClick={() => setExpandedPersons(prev => ({ ...prev, [person.id]: !prev[person.id] }))}
                                    className={cn(
                                      "w-full flex items-center justify-between px-4 py-3.5 text-left transition-colors",
                                      isDone
                                        ? "bg-emerald-50/60 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                                        : "bg-muted/30 hover:bg-muted/50",
                                    )}
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <div className={cn(
                                        "w-6 h-6 rounded-full flex items-center justify-center shrink-0",
                                        isDone
                                          ? "bg-emerald-500 text-white"
                                          : "bg-primary/10 border border-primary/20",
                                      )}>
                                        {isDone
                                          ? <Check className="h-3.5 w-3.5" />
                                          : <span className="text-[10px] font-bold text-primary">{isMain ? "T" : person.label[0]}</span>
                                        }
                                      </div>
                                      <div>
                                        <p className="text-sm font-semibold leading-tight">{person.label}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {isDone ? "Documentación completa" : `${person.checklist.filter(i => !i.optional).length} documentos requeridos`}
                                        </p>
                                      </div>
                                    </div>
                                    <span className={cn(
                                      "text-xs font-medium shrink-0 transition-transform duration-200",
                                      isOpen ? "rotate-180" : "",
                                    )}>
                                      ▾
                                    </span>
                                  </button>

                                  {/* Contenido expandible */}
                                  {isOpen && (
                                    <div className="border-t border-border/40 p-4">
                                      <ChecklistPanel
                                        key={person.id}
                                        items={person.checklist}
                                        pathway={result.pathway as "DA20" | "DA21"}
                                        onDataExtracted={isMain ? mergeExtractedData : undefined}
                                        onAllRequiredDone={(done) => {
                                          setPersonDoneMap(prev => ({ ...prev, [person.id]: done }))
                                        }}
                                        onAnnexesChanged={isMain ? setChecklistAnnexes : undefined}
                                      />
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>

                          {Object.keys(extractedData).length > 0 && (
                            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-3 py-2">
                              <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <p className="text-xs text-emerald-800 dark:text-emerald-300">Datos extraídos automáticamente — el formulario se ha pre-rellenado.</p>
                            </div>
                          )}

                          {/* ── Añadir familiar ─────────────────────────── */}
                          {!familiarQuiz && (
                            <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-4 flex items-center justify-between gap-4">
                              <div>
                                <p className="text-sm font-semibold flex items-center gap-2">
                                  <UserPlus className="h-4 w-4 text-primary" />
                                  ¿Hay más familiares que incluir?
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Añade cónyuge, ascendientes u otros familiares para generar su checklist de documentos.
                                </p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="shrink-0 border-primary/30 text-primary hover:bg-primary/10"
                                onClick={() => setFamiliarQuiz(FAMILIAR_EMPTY)}
                              >
                                Añadir familiar
                                <ArrowRight className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}

                          {/* ── Mini-quiz "Añadir familiar" ──────────────── */}
                          {familiarQuiz && familiarQuiz.step !== "done" && (
                            <div className="rounded-xl border border-primary/30 bg-primary/5 px-5 py-5 flex flex-col gap-4">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold uppercase tracking-widest text-primary">Añadir familiar</p>
                                <button onClick={() => setFamiliarQuiz(null)} className="text-muted-foreground hover:text-foreground">
                                  <X className="h-4 w-4" />
                                </button>
                              </div>

                              {familiarQuiz.step === "type" && (
                                <div className="flex flex-col gap-3">
                                  <p className="text-sm font-semibold">¿Qué tipo de familiar quieres añadir?</p>
                                  {([
                                    { k: "minor_children" as FamilyMemberType, t: "Hijo/a menor de 18 años" },
                                    { k: "adult_disabled" as FamilyMemberType, t: "Hijo/a mayor con discapacidad" },
                                    { k: "spouse_partner" as FamilyMemberType, t: "Cónyuge o pareja de hecho" },
                                    { k: "ascendants" as FamilyMemberType, t: "Padre o madre (ascendiente)" },
                                  ] as const).map(opt => (
                                    <OptionButton key={opt.k} selected={familiarQuiz.type === opt.k}
                                      onClick={() => setFamiliarQuiz(q => q ? { ...q, type: opt.k } : q)}>
                                      {opt.t}
                                    </OptionButton>
                                  ))}
                                </div>
                              )}

                              {familiarQuiz.step === "count" && (
                                <div className="flex flex-col gap-3">
                                  <p className="text-sm font-semibold">¿Cuántos hijos menores?</p>
                                  <div className="grid grid-cols-4 gap-2">
                                    {[1, 2, 3, 4].map(n => (
                                      <OptionButton key={n} selected={familiarQuiz.count === n}
                                        onClick={() => setFamiliarQuiz(q => q ? { ...q, count: n } : q)}>
                                        <span className="block text-center font-bold text-base">{n}{n === 4 ? "+" : ""}</span>
                                      </OptionButton>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {familiarQuiz.step === "born" && (
                                <div className="flex flex-col gap-3">
                                  <p className="text-sm font-semibold">¿Dónde nacieron?</p>
                                  {([
                                    { k: "all" as MinorsBornInSpain, t: "Todos nacieron en España" },
                                    { k: "some" as MinorsBornInSpain, t: "Algunos en España, otros fuera" },
                                    { k: "none" as MinorsBornInSpain, t: "Todos nacieron fuera de España" },
                                  ]).map(opt => (
                                    <OptionButton key={opt.k} selected={familiarQuiz.bornInSpain === opt.k}
                                      onClick={() => setFamiliarQuiz(q => q ? { ...q, bornInSpain: opt.k } : q)}>
                                      {opt.t}
                                    </OptionButton>
                                  ))}
                                </div>
                              )}

                              {familiarQuiz.step === "schooled" && (
                                <div className="flex flex-col gap-3">
                                  <p className="text-sm font-semibold">¿Están escolarizados en España?</p>
                                  <OptionButton selected={familiarQuiz.schooled === true}
                                    onClick={() => setFamiliarQuiz(q => q ? { ...q, schooled: true } : q)}>
                                    Sí, están escolarizados
                                  </OptionButton>
                                  <OptionButton selected={familiarQuiz.schooled === false}
                                    onClick={() => setFamiliarQuiz(q => q ? { ...q, schooled: false } : q)}>
                                    No, o no todos
                                  </OptionButton>
                                </div>
                              )}

                              {familiarQuiz.step === "cohabitation" && (
                                <div className="flex flex-col gap-3">
                                  <p className="text-sm font-semibold">¿Ambos progenitores están empadronados en el mismo domicilio?</p>
                                  <OptionButton selected={familiarQuiz.bothParentsCohabiting === true}
                                    onClick={() => setFamiliarQuiz(q => q ? { ...q, bothParentsCohabiting: true, otherParentInSpain: null } : q)}>
                                    Sí, ambos empadronados juntos
                                  </OptionButton>
                                  <OptionButton selected={familiarQuiz.bothParentsCohabiting === false}
                                    onClick={() => setFamiliarQuiz(q => q ? { ...q, bothParentsCohabiting: false } : q)}>
                                    No, el otro progenitor vive en otro lugar
                                  </OptionButton>
                                </div>
                              )}

                              {familiarQuiz.step === "other_parent" && (
                                <div className="flex flex-col gap-3">
                                  <p className="text-sm font-semibold">¿Dónde está el otro progenitor?</p>
                                  <OptionButton selected={familiarQuiz.otherParentInSpain === true}
                                    onClick={() => setFamiliarQuiz(q => q ? { ...q, otherParentInSpain: true } : q)}>
                                    <span className="font-semibold">En España</span>
                                    <span className="block text-xs text-muted-foreground mt-0.5 font-normal">Autorización legalizada ante notario español</span>
                                  </OptionButton>
                                  <OptionButton selected={familiarQuiz.otherParentInSpain === false}
                                    onClick={() => setFamiliarQuiz(q => q ? { ...q, otherParentInSpain: false } : q)}>
                                    <span className="font-semibold">En el extranjero</span>
                                    <span className="block text-xs text-muted-foreground mt-0.5 font-normal">Autorización notarial apostillada</span>
                                  </OptionButton>
                                </div>
                              )}

                              <div className="flex items-center justify-between pt-1">
                                <button
                                  onClick={() => {
                                    const stepOrder: FamiliarQuizState["step"][] = ["type", "count", "born", "schooled", "cohabitation", "other_parent"]
                                    const idx = stepOrder.indexOf(familiarQuiz.step)
                                    if (idx > 0) {
                                      setFamiliarQuiz(q => q ? { ...q, step: stepOrder[idx - 1] } : q)
                                    } else {
                                      setFamiliarQuiz(null)
                                    }
                                  }}
                                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                                >
                                  <ArrowLeft className="h-3.5 w-3.5" /> Atrás
                                </button>
                                <Button size="sm" disabled={!familiarCanProceed()} onClick={familiarQuizNext}>
                                  {familiarQuiz.step === "other_parent" || (familiarQuiz.step === "cohabitation" && familiarQuiz.bothParentsCohabiting === true)
                                    ? "Generar checklist"
                                    : "Siguiente"}
                                  <ArrowRight className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Clasificador CTA */}
                          <div className="rounded-xl border border-primary/25 bg-primary/5 px-5 py-5 flex flex-col sm:flex-row sm:items-center gap-4">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold mb-1 flex items-center gap-2">
                                <Scan className="h-4 w-4 text-primary shrink-0" />
                                Permanenc<span className="text-primary italic font-black">IA</span> — verifica tus pruebas de permanencia
                              </p>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                Sube tus documentos y la IA verifica si cubren los 5 meses ininterrumpidos exigidos, con un mapa visual por mes.
                              </p>
                            </div>
                            <Button variant="cta" size="sm" asChild className="shrink-0 whitespace-nowrap">
                              <Link href="/herramientas/permanencia">
                                Usar PermanencIA <ArrowRight className="h-3.5 w-3.5" />
                              </Link>
                            </Button>
                          </div>

                          {allPersonsDone && showDocAnim && (
                            <div className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/10 py-2.5 text-sm text-emerald-700 dark:text-emerald-400">
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Preparando tu expediente…
                            </div>
                          )}
                          {allPersonsDone && !showDocAnim && (
                            <div className="flex justify-end">
                              <Button onClick={() => setDashStep("form")} size="sm">
                                Continuar al formulario <ArrowRight className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* ── Form step ── */}
                      {dashStep === "form" && (
                        <div className="flex flex-col gap-4">
                          <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-4 py-3.5 flex items-start gap-3">
                            <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-0.5">Tasa modelo 790 código 052</p>
                              <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                                <strong>38,28 €</strong> adulto · <strong>10,94 €</strong> menor. Se abona en entidad bancaria colaboradora antes de presentar.
                              </p>
                            </div>
                          </div>
                          {verifying && (
                            <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="text-sm">Verificando pago…</span>
                            </div>
                          )}
                          {!verifying && !hasAccess && (
                            <PaywallGate formName={result.pathway === "DA20" ? "EX31" : "EX32"} onCheckout={checkout} />
                          )}
                          {!verifying && hasAccess && (
                            <FormFiller
                              pathway={result.pathway as "DA20" | "DA21"}
                              da21Supuestos={answers.da21Supuesto ? [answers.da21Supuesto] : []}
                              extractedData={Object.keys(extractedData).length > 0 ? extractedData : undefined}
                              onFormCompleted={() => setFormConfirmed(true)}
                              computedAnnexes={computedAnnexes}
                            />
                          )}
                          <div className="flex items-center justify-between gap-3 pt-1">
                            <button onClick={() => setDashStep("docs")}
                              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                              <ArrowLeft className="h-3.5 w-3.5" /> Volver a documentación
                            </button>
                            {formConfirmed && (
                              <Button onClick={() => setDashStep("presentation")} size="sm">
                                Continuar a presentación <ArrowRight className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* ── Presentation step ── */}
                      {dashStep === "presentation" && (
                        <div className="flex flex-col gap-4">
                          <CompletionPanel pathway={result.pathway as "DA20" | "DA21"} />
                          <button onClick={() => setDashStep("form")}
                            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                            <ArrowLeft className="h-3.5 w-3.5" /> Volver al formulario
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Asesor CTA */}
                  <div className="rounded-xl border border-border/50 bg-card px-5 py-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold mb-1 flex items-center gap-2">
                        <MessageCircle className="h-4 w-4 text-primary shrink-0" />
                        ¿Quieres que revisemos tu caso?
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Nuestros asesores expertos en extranjería te acompañan desde el primer documento hasta la presentación del expediente.
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild className="shrink-0 whitespace-nowrap border-primary/30 text-primary hover:bg-primary/10">
                      <a href="https://wa.me/34672297468?text=Hola,%20he%20usado%20el%20evaluador%20de%20regularización%20y%20me%20gustaría%20que%20revisaran%20mi%20caso"
                        target="_blank" rel="noopener noreferrer">
                        Hablar con asesor <ArrowRight className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground text-center leading-relaxed">
                    Esta evaluación es orientativa y no constituye asesoramiento jurídico. Los criterios se basan en el RD 316/2026 y los criterios interpretativos de la DGGM (22/04/2026).
                  </p>
                </div>
              )}

            </div>

            {/* Navigation footer */}
            {!isIntro && (
              <div className="px-6 sm:px-8 py-4 border-t border-border/40 flex items-center justify-between gap-3">
                {isResults ? (
                  <>
                    <button onClick={reset}
                      className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                      <RotateCcw className="h-3.5 w-3.5" /> Reiniciar evaluación
                    </button>
                    <span />
                  </>
                ) : (
                  <>
                    <button onClick={back}
                      className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                      <ArrowLeft className="h-3.5 w-3.5" /> Anterior
                    </button>
                    <Button onClick={next} disabled={!canProceed} size="sm">
                      {currentStep === "passport" ? "Ver resultados" : "Siguiente"}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              </div>
            )}

          </div>
        </div>
      </main>
    </>
  )
}

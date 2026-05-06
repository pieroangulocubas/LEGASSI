"use client"

import { useState, useEffect, useRef } from "react"
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
  MessageCircle,
  FileText,
  Scan,
  AlertTriangle,
  ExternalLink,
  Info,
  Loader2,
  Sparkles,
} from "lucide-react"
import { evaluateEligibility } from "./logic"
import { ScoreRing } from "./components/ScoreRing"
import { ChecklistPanel } from "./components/ChecklistPanel"
import { FormFiller } from "./components/FormFiller"
import { PaywallGate } from "./components/PaywallGate"
import { CompletionPanel } from "./components/CompletionPanel"
import { useEvaluadorAccess } from "./hooks/useEvaluadorAccess"
import type { QuizAnswers, DA21Supuesto, FamilyMember, PermanenceDoc, PersonalData } from "./types"

// ─── Initial state ────────────────────────────────────────────────────────────

const EMPTY: QuizAnswers = {
  forWhom: null,
  inSpainBefore2026: null,
  permitStatus: null,
  hasChildrenToRegularize: null,
  isUkrainian: null,
  hasPiHistory: null,
  da21Supuestos: [],
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
  | "da21_supuesto"
  | "family_situation"
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
    // Padre con residencia puede tener hijos/familiares a regularizar (EX25)
    base.push("children_of_resident")
    return [...base, "results"]
  }
  base.push("ukrainian")
  if (answers.isUkrainian === true) return [...base, "results"]
  base.push("pi_history")
  if (answers.hasPiHistory === false) base.push("da21_supuesto")
  base.push("family_situation", "permanence", "criminal", "passport", "results")
  return base
}

// ─── Option button ────────────────────────────────────────────────────────────

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
        "w-full text-left rounded-xl border px-5 py-4 text-sm font-medium transition-all duration-150",
        selected
          ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/30"
          : "border-border bg-card hover:border-primary/40 hover:bg-muted/50",
      )}
    >
      {children}
    </button>
  )
}

// ─── Multi-select option ──────────────────────────────────────────────────────

function MultiOption({
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
        "w-full text-left rounded-xl border px-5 py-4 text-sm font-medium transition-all duration-150 flex items-start gap-3",
        selected
          ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/30"
          : "border-border bg-card hover:border-primary/40 hover:bg-muted/50",
      )}
    >
      <span
        className={cn(
          "mt-0.5 shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors",
          selected ? "bg-primary border-primary" : "border-border",
        )}
      >
        {selected && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}
      </span>
      <span>{children}</span>
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
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">{label}</p>
        <h2 className="text-xl font-heading font-bold leading-snug mb-1">{title}</h2>
        {hint && <p className="text-sm text-muted-foreground leading-relaxed">{hint}</p>}
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  )
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100)
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
        <span>Paso {current} de {total}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
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
      "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border",
      urgent
        ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400"
        : "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400",
    )}>
      <CalendarClock className="h-3 w-3" />
      {days > 0 ? `${days} días para el cierre (30 jun 2026)` : "Plazo cerrado"}
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

// ─── Main page ────────────────────────────────────────────────────────────────

export default function EvaluadorPage() {
  const [answers, setAnswers] = useState<QuizAnswers>(EMPTY)
  const [stepIndex, setStepIndex] = useState(0)
  const [completionVisible, setCompletionVisible] = useState(false)
  const [allChecklistDone, setAllChecklistDone] = useState(false)
  const [formConfirmed, setFormConfirmed] = useState(false)
  const [extractedData, setExtractedData] = useState<Partial<PersonalData>>({})
  const { hasAccess, verifying, checkout } = useEvaluadorAccess()

  const prevAllDone = useRef(false)
  useEffect(() => {
    if (allChecklistDone && !prevAllDone.current) {
      launchConfetti()
    }
    prevAllDone.current = allChecklistDone
  }, [allChecklistDone])

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

  function next() {
    setStepIndex((i) => Math.min(i + 1, steps.length - 1))
  }

  function back() {
    setStepIndex((i) => Math.max(i - 1, 0))
  }

  function reset() {
    setAnswers(EMPTY)
    setStepIndex(0)
    setCompletionVisible(false)
    setAllChecklistDone(false)
    setFormConfirmed(false)
    prevAllDone.current = false
  }

  function toggleDA21(supuesto: DA21Supuesto) {
    setAnswers((a) => ({
      ...a,
      da21Supuestos: a.da21Supuestos.includes(supuesto)
        ? a.da21Supuestos.filter((s) => s !== supuesto)
        : [...a.da21Supuestos, supuesto],
    }))
  }

  function toggleFamily(member: FamilyMember) {
    setAnswers((a) => {
      if (member === "none") return { ...a, familyMembers: ["none"] }
      const without = a.familyMembers.filter((m) => m !== "none")
      return {
        ...a,
        familyMembers: without.includes(member)
          ? without.filter((m) => m !== member)
          : [...without, member],
      }
    })
  }

  function toggleDoc(doc: PermanenceDoc) {
    setAnswers((a) => {
      if (doc === "none") return { ...a, permanenceDocs: ["none"] }
      const without = a.permanenceDocs.filter((d) => d !== "none")
      return {
        ...a,
        permanenceDocs: without.includes(doc)
          ? without.filter((d) => d !== doc)
          : [...without, doc],
      }
    })
  }

  const canProceed = (() => {
    switch (currentStep) {
      case "intro": return true
      case "for_whom": return answers.forWhom !== null
      case "in_spain": return answers.inSpainBefore2026 !== null
      case "permit_status": return answers.permitStatus !== null
      case "ukrainian": return answers.isUkrainian !== null
      case "pi_history": return answers.hasPiHistory !== null
      case "da21_supuesto": return true
      case "children_of_resident": return answers.hasChildrenToRegularize !== null
      case "family_situation": return answers.familyMembers.length > 0
      case "permanence": return answers.permanenceDocs.length > 0
      case "criminal": return answers.criminalStatus !== null
      case "passport": return answers.passportStatus !== null
      default: return true
    }
  })()

  const result = isResults ? evaluateEligibility(answers) : null
  const deadlineDays = result?.deadlineDays ?? Math.max(0, Math.ceil((new Date("2026-06-30").getTime() - Date.now()) / 86_400_000))

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-background pt-20 pb-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">

          {/* Page header */}
          <div className="mb-8">
            <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/20 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Herramienta gratuita</p>
                  <h1 className="text-lg font-heading font-bold leading-tight">
                    Evaluador de Regularización 2026
                  </h1>
                </div>
              </div>
              <DeadlineBadge days={deadlineDays} />
            </div>
            <p className="text-sm text-muted-foreground">
              Basado en el RD 316/2026 (BOE 15/04/2026). Responde 7 preguntas y obtén tu puntuación de elegibilidad, vía aplicable y checklist de documentos.
            </p>
          </div>

          {/* Wizard card */}
          <div className="rounded-2xl border border-border/60 bg-card shadow-card overflow-hidden">

            {/* Progress — only during questions */}
            {!isIntro && !isResults && (
              <div className="px-6 pt-5 pb-4 border-b border-border/40">
                <ProgressBar current={currentQuestionIndex + 1} total={totalQuestions} />
              </div>
            )}

            <div className="px-6 py-6 sm:px-8 sm:py-7">

              {/* ── Intro ─────────────────────────────────────────────────── */}
              {isIntro && (
                <div className="flex flex-col gap-6">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 mb-4">
                      <Flame className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-semibold text-primary">Regularización Extraordinaria 2026</span>
                    </div>
                    <h2 className="text-2xl font-heading font-bold mb-2">
                      ¿Puedes regularizar tu situación?
                    </h2>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      El <strong>RD 316/2026</strong> abre un proceso excepcional para regularizar la situación de cientos de miles de personas en España. Solo tienes hasta el <strong>30 de junio de 2026</strong>.
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4">
                    {[
                      { n: "1", text: "Responde 7 preguntas sobre tu situación" },
                      { n: "2", text: "Recibe tu puntuación y vía aplicable (DA20 o DA21)" },
                      { n: "3", text: "Obtén tu checklist de documentos personalizado" },
                    ].map((item) => (
                      <div key={item.n} className="flex gap-3 items-start rounded-xl bg-muted/40 px-4 py-3.5">
                        <span className="shrink-0 w-6 h-6 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                          {item.n}
                        </span>
                        <p className="text-xs text-foreground/80 leading-relaxed">{item.text}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-4 py-3.5 flex gap-3 items-start">
                    <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                      Esta herramienta es orientativa y no constituye asesoramiento jurídico individualizado. Para un análisis completo de tu caso, contacta con nuestros asesores.
                    </p>
                  </div>

                  <Button variant="cta" size="lg" className="w-full sm:w-auto" onClick={next}>
                    Comenzar la evaluación
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* ── Q0: ¿Para quién es la evaluación? ────────────────────── */}
              {currentStep === "for_whom" && (
                <QuestionCard
                  label="Contexto de la solicitud"
                  title="¿Para quién realizas esta evaluación?"
                  hint="Esto nos ayuda a personalizar el checklist y el formulario que necesitarás."
                >
                  <OptionButton
                    selected={answers.forWhom === "self"}
                    onClick={() => setAnswers((a) => ({ ...a, forWhom: "self" }))}
                  >
                    <span className="font-semibold">Para mí mismo/a</span>
                    <span className="block text-xs text-muted-foreground mt-0.5 font-normal">
                      Quiero regularizar mi propia situación en España
                    </span>
                  </OptionButton>
                  <OptionButton
                    selected={answers.forWhom === "relative"}
                    onClick={() => setAnswers((a) => ({ ...a, forWhom: "relative" }))}
                  >
                    <span className="font-semibold">Para un familiar</span>
                    <span className="block text-xs text-muted-foreground mt-0.5 font-normal">
                      Estoy tramitando la regularización de un hijo/a, cónyuge u otro familiar
                    </span>
                  </OptionButton>
                </QuestionCard>
              )}

              {/* ── Q1: En España antes del 1/1/2026 ─────────────────────── */}
              {currentStep === "in_spain" && (
                <QuestionCard
                  label="Requisito base"
                  title="¿Llevas en España de manera continuada desde antes del 1 de enero de 2026?"
                  hint="Este es el primer requisito del RD 316/2026. Debes haber estado en España antes de esa fecha y haber permanecido desde entonces."
                >
                  <OptionButton
                    selected={answers.inSpainBefore2026 === true}
                    onClick={() => setAnswers((a) => ({ ...a, inSpainBefore2026: true }))}
                  >
                    Sí, llegué a España antes del 1 de enero de 2026
                  </OptionButton>
                  <OptionButton
                    selected={answers.inSpainBefore2026 === false}
                    onClick={() => setAnswers((a) => ({ ...a, inSpainBefore2026: false }))}
                  >
                    No, llegué después de esa fecha
                  </OptionButton>
                </QuestionCard>
              )}

              {/* ── Q2: Permiso vigente ───────────────────────────────────── */}
              {currentStep === "permit_status" && (
                <QuestionCard
                  label="Situación actual"
                  title="¿Cuál es tu situación administrativa actual?"
                  hint="El proceso está diseñado para personas sin documentación vigente ni procedimiento en curso."
                >
                  <OptionButton
                    selected={answers.permitStatus === "has_permit"}
                    onClick={() => setAnswers((a) => ({ ...a, permitStatus: "has_permit" }))}
                  >
                    Tengo un permiso de residencia o estancia vigente (TIE, visado de larga duración…)
                  </OptionButton>
                  <OptionButton
                    selected={answers.permitStatus === "pending_procedure"}
                    onClick={() => setAnswers((a) => ({ ...a, permitStatus: "pending_procedure" }))}
                  >
                    Tengo un procedimiento de residencia pendiente de resolución
                  </OptionButton>
                  <OptionButton
                    selected={answers.permitStatus === "none"}
                    onClick={() => setAnswers((a) => ({ ...a, permitStatus: "none" }))}
                  >
                    No tengo permiso vigente ni procedimiento activo (estoy en situación irregular)
                  </OptionButton>
                </QuestionCard>
              )}

              {/* ── Q2b: Hijos a regularizar (padre con residencia) ──────── */}
              {currentStep === "children_of_resident" && (
                <QuestionCard
                  label="Regularización de familiares"
                  title="¿Tienes hijos menores de edad u otros familiares en situación irregular que quieras regularizar?"
                  hint="Como titular de una autorización de residencia vigente, puedes solicitar la regularización de tus hijos u otros familiares a través del formulario EX25 (arts. 159 y 160 del Reglamento de Extranjería), con los requisitos aligerados por la Disposición Transitoria Primera del RD 316/2026."
                >
                  <OptionButton
                    selected={answers.hasChildrenToRegularize === true}
                    onClick={() => setAnswers((a) => ({ ...a, hasChildrenToRegularize: true }))}
                  >
                    Sí, quiero regularizar la situación de mis hijos u otros familiares
                  </OptionButton>
                  <OptionButton
                    selected={answers.hasChildrenToRegularize === false}
                    onClick={() => setAnswers((a) => ({ ...a, hasChildrenToRegularize: false }))}
                  >
                    No, solo quería verificar mi propia situación
                  </OptionButton>
                </QuestionCard>
              )}

              {/* ── Q3: Protección temporal ucraniana ────────────────────── */}
              {currentStep === "ukrainian" && (
                <QuestionCard
                  label="Protección especial"
                  title="¿Eres beneficiario de la Protección Temporal para personas desplazadas de Ucrania?"
                  hint="Este régimen de protección temporal tiene su propia normativa y está excluido de la regularización extraordinaria del RD 316/2026."
                >
                  <OptionButton
                    selected={answers.isUkrainian === true}
                    onClick={() => setAnswers((a) => ({ ...a, isUkrainian: true }))}
                  >
                    Sí, tengo Protección Temporal Ucraniana
                  </OptionButton>
                  <OptionButton
                    selected={answers.isUkrainian === false}
                    onClick={() => setAnswers((a) => ({ ...a, isUkrainian: false }))}
                  >
                    No, no soy beneficiario de esa protección
                  </OptionButton>
                </QuestionCard>
              )}

              {/* ── Q4: Historial PI ─────────────────────────────────────── */}
              {currentStep === "pi_history" && (
                <QuestionCard
                  label="Vía de regularización"
                  title="¿Presentaste alguna solicitud de Protección Internacional (asilo) en España antes del 1 de enero de 2026?"
                  hint="Esto determina qué vía del proceso aplica a tu caso: DA20 (solicitantes de asilo) o DA21 (extranjeros en situación irregular). Incluye solicitudes en cualquier estado: pendiente, denegada, retirada o con recurso."
                >
                  <OptionButton
                    selected={answers.hasPiHistory === true}
                    onClick={() => setAnswers((a) => ({ ...a, hasPiHistory: true }))}
                  >
                    Sí, pedí o tengo solicitud de asilo / Protección Internacional en España antes del 1/1/2026
                  </OptionButton>
                  <OptionButton
                    selected={answers.hasPiHistory === false}
                    onClick={() => setAnswers((a) => ({ ...a, hasPiHistory: false }))}
                  >
                    No, nunca he solicitado asilo en España
                  </OptionButton>
                </QuestionCard>
              )}

              {/* ── Q5: Supuesto DA21 ─────────────────────────────────────── */}
              {currentStep === "da21_supuesto" && (
                <QuestionCard
                  label="Supuesto DA21 (vía ordinaria)"
                  title="¿Cuál de estos requisitos puedes acreditar? Selecciona todos los que apliquen."
                  hint="Para la DA21 debes cumplir al menos uno. El trabajo es el supuesto más sólido; el certificado de vulnerabilidad es la alternativa si no tienes los otros."
                >
                  {[
                    {
                      key: "work_history" as DA21Supuesto,
                      text: "Tengo nóminas, contratos de trabajo o puedo obtener el informe de vida laboral de la Seguridad Social (más de 90 días/año)",
                    },
                    {
                      key: "job_offer" as DA21Supuesto,
                      text: "Tengo una oferta de trabajo (contrato de al menos 90 días/año firmado por el empleador)",
                    },
                    {
                      key: "self_employed" as DA21Supuesto,
                      text: "Quiero darme de alta como autónomo y puedo presentar una declaración de actividad económica por cuenta propia",
                    },
                    {
                      key: "family" as DA21Supuesto,
                      text: "Tengo hijos menores de edad o con discapacidad que viven conmigo, o ascendientes de primer grado (padres/madres) dependientes convivientes",
                    },
                    {
                      key: "vulnerability" as DA21Supuesto,
                      text: "Ninguno de los anteriores — necesitaría el Certificado de Vulnerabilidad emitido por entidades RECEX o Servicios Sociales",
                    },
                  ].map((opt) => (
                    <MultiOption
                      key={opt.key}
                      selected={answers.da21Supuestos.includes(opt.key)}
                      onClick={() => toggleDA21(opt.key)}
                    >
                      {opt.text}
                    </MultiOption>
                  ))}
                  {answers.da21Supuestos.length === 0 && (
                    <p className="text-xs text-muted-foreground px-1">
                      Si no cumples ninguno todavía, puedes continuar — te explicaremos cómo conseguir el Certificado de Vulnerabilidad.
                    </p>
                  )}
                </QuestionCard>
              )}

              {/* ── Q5b: Situación familiar ──────────────────────────────── */}
              {currentStep === "family_situation" && (
                <QuestionCard
                  label="Unidad familiar"
                  title="¿Hay familiares en España que también quieran regularizarse contigo?"
                  hint="El RD 316/2026 permite presentaciones simultáneas. Cónyuge y ascendientes no necesitan cumplir ningún supuesto propio — se acogen a tu cualificación. Los menores tienen un trámite paralelo (art. 159/160)."
                >
                  {[
                    {
                      key: "spouse_partner" as FamilyMember,
                      text: "Sí, cónyuge o pareja de hecho registrada que convive conmigo y está en situación irregular",
                    },
                    {
                      key: "minor_children" as FamilyMember,
                      text: "Sí, tengo hijos menores de 18 años en España (trámite paralelo art. 159/160 — formulario EX25)",
                    },
                    {
                      key: "adult_disabled_children" as FamilyMember,
                      text: "Sí, tengo hijo/a mayor con discapacidad o que no puede valerse por sí mismo/a",
                    },
                    {
                      key: "cohabiting_ascendants" as FamilyMember,
                      text: "Sí, tengo padres o suegros de primer grado que conviven conmigo y están en situación irregular",
                    },
                    {
                      key: "none" as FamilyMember,
                      text: "No, solo yo solicito la regularización",
                    },
                  ].map((opt) => (
                    <MultiOption
                      key={opt.key}
                      selected={answers.familyMembers.includes(opt.key)}
                      onClick={() => toggleFamily(opt.key)}
                    >
                      {opt.text}
                    </MultiOption>
                  ))}
                  {answers.familyMembers.length === 0 && (
                    <p className="text-xs text-muted-foreground px-1">
                      Selecciona al menos una opción para continuar.
                    </p>
                  )}
                </QuestionCard>
              )}

              {/* ── Q6: Permanencia ──────────────────────────────────────── */}
              {currentStep === "permanence" && (
                <QuestionCard
                  label="Permanencia en España"
                  title="¿Qué documentos tienes para acreditar tu estancia continuada en España?"
                  hint="La normativa exige 5 meses ininterrumpidos inmediatamente anteriores a la solicitud. Los documentos deben ser nominativos (con tu nombre) y estar fechados en España. Selecciona todos los que tengas."
                >
                  {[
                    { key: "empadronamiento" as PermanenceDoc, text: "Empadronamiento o certificado del ayuntamiento" },
                    { key: "rental_contract" as PermanenceDoc, text: "Contrato de arrendamiento o recibos de alquiler" },
                    { key: "payslips" as PermanenceDoc, text: "Nóminas o contratos de trabajo" },
                    { key: "bank_statements" as PermanenceDoc, text: "Extractos bancarios de entidad española" },
                    { key: "training_certs" as PermanenceDoc, text: "Certificados de formación o estudios en España" },
                    { key: "transport_tickets" as PermanenceDoc, text: "Billetes de transporte dentro de España (tren, autobús, etc.)" },
                    { key: "passport_stamps" as PermanenceDoc, text: "Sellos o visados en pasaporte con entradas/salidas" },
                    { key: "none" as PermanenceDoc, text: "No tengo documentos o tengo muy pocos" },
                  ].map((opt) => (
                    <MultiOption
                      key={opt.key}
                      selected={answers.permanenceDocs.includes(opt.key)}
                      onClick={() => toggleDoc(opt.key)}
                    >
                      {opt.text}
                    </MultiOption>
                  ))}
                </QuestionCard>
              )}

              {/* ── Q7: Antecedentes ─────────────────────────────────────── */}
              {currentStep === "criminal" && (
                <QuestionCard
                  label="Antecedentes penales"
                  title="¿Tienes antecedentes penales?"
                  hint="Se requiere certificado limpio de España y del país de origen (y de países donde hayas residido en los últimos 5 años antes de llegar a España)."
                >
                  <OptionButton
                    selected={answers.criminalStatus === "clean"}
                    onClick={() => setAnswers((a) => ({ ...a, criminalStatus: "clean" }))}
                  >
                    No tengo antecedentes en ningún país
                  </OptionButton>
                  <OptionButton
                    selected={answers.criminalStatus === "maybe_origin"}
                    onClick={() => setAnswers((a) => ({ ...a, criminalStatus: "maybe_origin" }))}
                  >
                    No en España, pero podría tener algún antecedente en mi país de origen
                  </OptionButton>
                  <OptionButton
                    selected={answers.criminalStatus === "has_spain"}
                    onClick={() => setAnswers((a) => ({ ...a, criminalStatus: "has_spain" }))}
                  >
                    Tengo antecedentes penales o policiales en España
                  </OptionButton>
                  <OptionButton
                    selected={answers.criminalStatus === "unknown"}
                    onClick={() => setAnswers((a) => ({ ...a, criminalStatus: "unknown" }))}
                  >
                    No estoy seguro
                  </OptionButton>
                </QuestionCard>
              )}

              {/* ── Q8: Pasaporte ─────────────────────────────────────────── */}
              {currentStep === "passport" && (
                <QuestionCard
                  label="Documentación de identidad"
                  title="¿Dispones de pasaporte o documento de viaje vigente?"
                  hint="El pasaporte en vigor es un requisito imprescindible para presentar la solicitud de regularización."
                >
                  <OptionButton
                    selected={answers.passportStatus === "valid"}
                    onClick={() => setAnswers((a) => ({ ...a, passportStatus: "valid" }))}
                  >
                    Sí, tengo pasaporte o documento de viaje en vigor
                  </OptionButton>
                  <OptionButton
                    selected={answers.passportStatus === "expired"}
                    onClick={() => setAnswers((a) => ({ ...a, passportStatus: "expired" }))}
                  >
                    Mi pasaporte está caducado
                  </OptionButton>
                  <OptionButton
                    selected={answers.passportStatus === "missing"}
                    onClick={() => setAnswers((a) => ({ ...a, passportStatus: "missing" }))}
                  >
                    No tengo pasaporte o estoy en trámite de renovación
                  </OptionButton>
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
                            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Acceder al formulario oficial
                          </a>
                        )}
                      </div>
                    </div>
                  ) : result.isEX25Path ? (
                    /* ── Padre con residencia — vía EX25 ── */
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
                          <p className="font-semibold text-sm text-rose-800 dark:text-rose-300 mb-1">
                            No cumples los requisitos del RD 316/2026
                          </p>
                          <p className="text-sm text-rose-700 dark:text-rose-400 leading-relaxed">
                            {result.ineligibleReason}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {result.recommendations.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
                        Recomendaciones
                      </p>
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

                  {/* Checklist */}
                  {result.eligible && result.checklist.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
                        Checklist de documentos
                      </p>
                      <ChecklistPanel
                        items={result.checklist}
                        pathway={result.pathway as "DA20" | "DA21"}
                        onDataExtracted={mergeExtractedData}
                        onAllRequiredDone={setAllChecklistDone}
                        externalDoneIds={formConfirmed ? ["form"] : []}
                      />
                      {Object.keys(extractedData).length > 0 && (
                        <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-3 py-2">
                          <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <p className="text-xs text-emerald-800 dark:text-emerald-300">
                            Datos extraídos de tus documentos — el formulario de abajo se ha pre-rellenado automáticamente.
                          </p>
                        </div>
                      )}
                      {allChecklistDone && !completionVisible && (
                        <button
                          onClick={() => setCompletionVisible(true)}
                          className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-emerald-300 dark:border-emerald-700 bg-emerald-50/40 dark:bg-emerald-950/10 py-3 text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors"
                          style={{ animation: "doccheck-pop 0.4s ease both" }}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          He reunido todos los documentos — ¿dónde presento?
                        </button>
                      )}
                    </div>
                  )}

                  {/* Clasificador CTA */}
                  {result.eligible && (
                    <div className="rounded-xl border border-primary/25 bg-primary/5 px-5 py-5 flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold mb-1 flex items-center gap-2">
                          <Scan className="h-4 w-4 text-primary shrink-0" />
                          Verifica tus pruebas de permanencia con IA
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Sube tus documentos al Clasificador y nuestra IA verifica si cubren los 5 meses ininterrumpidos exigidos. Detecta lagunas y genera un informe en PDF.
                        </p>
                      </div>
                      <Button variant="cta" size="sm" asChild className="shrink-0 whitespace-nowrap">
                        <Link href="/herramientas/clasificador-documentos">
                          Verificar documentos
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  )}

                  {/* Herramientas del expediente — paywall */}
                  {result.eligible && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
                        Herramientas del expediente
                      </p>

                      {verifying && (
                        <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Verificando pago…</span>
                        </div>
                      )}

                      {!verifying && !hasAccess && (
                        <PaywallGate
                          formName={result.pathway === "DA20" ? "EX31" : "EX32"}
                          onCheckout={checkout}
                        />
                      )}

                      {!verifying && hasAccess && (
                        <div className="flex flex-col gap-3">
                          <FormFiller
                            pathway={result.pathway as "DA20" | "DA21"}
                            da21Supuestos={answers.da21Supuestos}
                            extractedData={Object.keys(extractedData).length > 0 ? extractedData : undefined}
                            onFormCompleted={() => setFormConfirmed(true)}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Completion panel (confetti + appointment links) */}
                  {result.eligible && completionVisible && (
                    <CompletionPanel pathway={result.pathway as "DA20" | "DA21"} />
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
                      <a
                        href="https://wa.me/34672297468?text=Hola,%20he%20usado%20el%20evaluador%20de%20regularización%20y%20me%20gustaría%20que%20revisaran%20mi%20caso"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Hablar con asesor
                        <ArrowRight className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  </div>

                  {/* Legal disclaimer */}
                  <p className="text-xs text-muted-foreground text-center leading-relaxed">
                    Esta evaluación es orientativa y no constituye asesoramiento jurídico. Los criterios se basan en el RD 316/2026 y los criterios interpretativos de la DGGM (22/04/2026). Consulta siempre con un profesional para tu caso concreto.
                  </p>

                </div>
              )}

            </div>

            {/* Navigation footer */}
            {!isIntro && (
              <div className="px-6 sm:px-8 py-4 border-t border-border/40 flex items-center justify-between gap-3">
                {isResults ? (
                  <>
                    <button
                      onClick={reset}
                      className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Reiniciar evaluación
                    </button>
                    <span />
                  </>
                ) : (
                  <>
                    <button
                      onClick={back}
                      className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Anterior
                    </button>
                    <Button
                      onClick={next}
                      disabled={!canProceed}
                      size="sm"
                    >
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

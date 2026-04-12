"use client"

import { CheckCircle2, Circle, Loader2, XCircle, Download, Clock, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { AntecedentesRequest, AntecedentesLog, AntecedentesStatus } from "../types"

interface StatusTrackerProps {
  request: AntecedentesRequest
  logs: AntecedentesLog[]
}

interface Step {
  label: string
  description: string
  statusKeys: AntecedentesStatus[]
}

const STEPS: Step[] = [
  {
    label: "Solicitud recibida",
    description: "Tu solicitud ha sido registrada y está en la cola de procesamiento.",
    statusKeys: ["en_cola"],
  },
  {
    label: "Obteniendo certificado",
    description: "El sistema está rellenando el formulario oficial, realizando el pago de la tasa y descargando tu Certificado de Antecedentes Penales.",
    statusKeys: ["obteniendo_certificado"],
  },
  {
    label: "Certificado emitido",
    description: "El certificado ha sido obtenido. Iniciando el proceso de apostilla.",
    statusKeys: ["certificado_emitido"],
  },
  {
    label: "Gestionando apostilla",
    description: "Se está tramitando la Apostilla de La Haya: subida del certificado, pago de tasa y envío al Ministerio de Relaciones Exteriores.",
    statusKeys: ["obteniendo_apostilla", "esperando_apostilla"],
  },
  {
    label: "Apostilla lista",
    description: "Tu Certificado de Antecedentes Penales con Apostilla está listo para descargar.",
    statusKeys: ["completado"],
  },
]

function getStepIndex(status: AntecedentesStatus): number {
  switch (status) {
    case "en_cola":
      return 0
    case "obteniendo_certificado":
      return 1
    case "certificado_emitido":
      return 2
    case "obteniendo_apostilla":
    case "esperando_apostilla":
      return 3
    case "completado":
      return 4
    case "requiere_intervencion":
    case "error":
      return -1
    default:
      return 0
  }
}

type StepState = "completed" | "active" | "waiting" | "error"

function getStepState(stepIndex: number, currentIndex: number, isError: boolean): StepState {
  if (isError) return stepIndex <= currentIndex ? "error" : "waiting"
  if (stepIndex < currentIndex) return "completed"
  if (stepIndex === currentIndex) return "active"
  return "waiting"
}

function StepIcon({ state }: { state: StepState }) {
  switch (state) {
    case "completed":
      return <CheckCircle2 className="w-6 h-6 text-green-500 dark:text-green-400 shrink-0" />
    case "active":
      return <Loader2 className="w-6 h-6 text-blue-500 dark:text-blue-400 animate-spin shrink-0" />
    case "error":
      return <XCircle className="w-6 h-6 text-red-500 dark:text-red-400 shrink-0" />
    case "waiting":
      return <Circle className="w-6 h-6 text-muted-foreground/40 shrink-0" />
  }
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return dateStr
  }
}

export function StatusTracker({ request, logs }: StatusTrackerProps) {
  const isError = request.status === "error" || request.status === "requiere_intervencion"
  const isCompleted = request.status === "completado"
  const isWaitingApostilla = request.status === "esperando_apostilla"
  const currentStepIndex = getStepIndex(request.status)

  return (
    <div className="space-y-6">
      {/* Error / requires intervention banner */}
      {isError && (
        <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 p-5 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800 dark:text-red-300 text-sm mb-1">
              {request.status === "requiere_intervencion"
                ? "Se requiere intervención manual"
                : "Se ha producido un error"}
            </p>
            {request.error_message && (
              <p className="text-sm text-red-700 dark:text-red-400">{request.error_message}</p>
            )}
            <p className="text-xs text-red-600/80 dark:text-red-500 mt-2">
              Nuestro equipo ha sido notificado y está trabajando en ello. Puedes contactarnos si
              tienes urgencia.
            </p>
          </div>
        </div>
      )}

      {/* Waiting for apostilla info */}
      {isWaitingApostilla && (
        <div className="rounded-2xl border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/40 p-5 flex gap-3">
          <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-blue-800 dark:text-blue-300 text-sm mb-1">
              Esperando apostilla
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              El certificado ha sido enviado al proceso de apostilla. Este paso puede tardar entre{" "}
              <strong>1 y 7 días hábiles</strong> según la carga del organismo oficial.
            </p>
          </div>
        </div>
      )}

      {/* Completed — download */}
      {isCompleted && request.apostilla_url && (
        <div className="rounded-2xl border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/40 p-5 flex items-center justify-between gap-4">
          <div className="flex gap-3 items-center">
            <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400 shrink-0" />
            <div>
              <p className="font-semibold text-green-800 dark:text-green-300 text-sm">
                Tu apostilla está lista
              </p>
              <p className="text-xs text-green-700 dark:text-green-500 mt-0.5">
                Certificado de Antecedentes Penales apostillado para Perú
              </p>
            </div>
          </div>
          <Button
            asChild
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white shrink-0"
          >
            <a href={request.apostilla_url} target="_blank" rel="noopener noreferrer">
              <Download className="w-4 h-4 mr-1.5" />
              Descargar
            </a>
          </Button>
        </div>
      )}

      {/* Steps timeline */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-foreground mb-5">Estado del proceso</h3>
        <ol className="space-y-0">
          {STEPS.map((step, idx) => {
            const state = getStepState(idx, currentStepIndex, isError)
            const isLast = idx === STEPS.length - 1

            return (
              <li key={step.label} className="flex gap-4">
                {/* Icon + connector */}
                <div className="flex flex-col items-center">
                  <StepIcon state={state} />
                  {!isLast && (
                    <div
                      className={`w-0.5 flex-1 my-1 min-h-[2rem] ${
                        state === "completed"
                          ? "bg-green-400 dark:bg-green-600"
                          : "bg-border"
                      }`}
                    />
                  )}
                </div>

                {/* Content */}
                <div className={`pb-5 ${isLast ? "" : ""}`}>
                  <p
                    className={`text-sm font-medium leading-tight ${
                      state === "completed"
                        ? "text-green-700 dark:text-green-400"
                        : state === "active"
                        ? "text-blue-700 dark:text-blue-400"
                        : state === "error"
                        ? "text-red-700 dark:text-red-400"
                        : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </p>
                  {(state === "active" || state === "completed") && (
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {step.description}
                    </p>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      </div>

      {/* Logs timeline */}
      {logs.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Historial de actividad</h3>
          <ol className="space-y-3">
            {logs.map((log) => (
              <li key={log.id} className="flex gap-3 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0 mt-1.5" />
                <div className="min-w-0">
                  <p className="text-foreground font-medium capitalize">
                    {log.step.replace(/_/g, " ")}
                  </p>
                  {log.message && (
                    <p className="text-muted-foreground text-xs mt-0.5 leading-relaxed">
                      {log.message}
                    </p>
                  )}
                  <p className="text-muted-foreground/60 text-xs mt-0.5">
                    {formatDate(log.created_at)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Queue position */}
      {request.status === "en_cola" && request.queue_position !== null && (
        <p className="text-center text-sm text-muted-foreground">
          Posición en la cola:{" "}
          <span className="font-semibold text-foreground">#{request.queue_position}</span>
        </p>
      )}
    </div>
  )
}

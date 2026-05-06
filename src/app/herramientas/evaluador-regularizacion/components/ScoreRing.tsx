"use client"

import { cn } from "@/lib/utils"

interface ScoreRingProps {
  score: number
  label: string
}

export function ScoreRing({ score, label }: ScoreRingProps) {
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const color =
    score >= 85
      ? "text-emerald-500"
      : score >= 70
      ? "text-primary"
      : score >= 50
      ? "text-amber-500"
      : "text-rose-500"

  const strokeColor =
    score >= 85
      ? "#10b981"
      : score >= 70
      ? "hsl(var(--primary))"
      : score >= 50
      ? "#f59e0b"
      : "#f43f5e"

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-muted/30"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("text-3xl font-bold tabular-nums", color)}>{score}</span>
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
            / 100
          </span>
        </div>
      </div>
      <span className={cn("text-sm font-semibold", color)}>{label}</span>
    </div>
  )
}

"use client"

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from "recharts"
import type { DayCount } from "@/lib/admin-metrics"

function shortDate(date: string) {
  const [, m, d] = date.split("-")
  return `${d}/${m}`
}

interface Props {
  data: DayCount[]
  color: string
  type?: "area" | "bar"
  label: string
}

export function MetricsChart({ data, color, type = "area", label }: Props) {
  const formatted = data.map(d => ({ ...d, date: shortDate(d.date) }))

  return (
    <ResponsiveContainer width="100%" height={120}>
      {type === "bar" ? (
        <BarChart data={formatted} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)" }}
            labelStyle={{ fontWeight: 600 }}
            formatter={(v) => [`${v}`, label]}
          />
          <Bar dataKey="count" fill={color} radius={[3, 3, 0, 0]} />
        </BarChart>
      ) : (
        <AreaChart data={formatted} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
          <defs>
            <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={color} stopOpacity={0.25} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)" }}
            labelStyle={{ fontWeight: 600 }}
            formatter={(v) => [`${v}`, label]}
          />
          <Area type="monotone" dataKey="count" stroke={color} strokeWidth={2} fill={`url(#grad-${color.replace("#", "")})`} dot={false} />
        </AreaChart>
      )}
    </ResponsiveContainer>
  )
}

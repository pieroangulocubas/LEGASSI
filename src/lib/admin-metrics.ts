import { createServerClient } from "@/lib/supabase"
import Stripe from "stripe"

export interface DayCount { date: string; count: number }

export interface AdminMetrics {
  // Blog
  postsPublished: number
  postsDraft: number

  // Permanencia (clasificador_tokens)
  permanenciaRegistros: number
  permanenciaPagos: number
  permanenciaIngresos: number          // EUR cents → display as € in UI
  permanenciaByDay: DayCount[]

  // Evaluador (Stripe)
  evaluadorPagos: number
  evaluadorIngresos: number            // EUR cents
  evaluadorByDay: DayCount[]

  // Newsletter
  newsletterSuscriptores: number
  newsletterByDay: DayCount[]

  // Recent permanencia leads
  recentPermanencia: {
    email: string
    nombre: string | null
    telefono: string | null
    credits: number
    createdAt: string
  }[]
}

function toDateStr(iso: string) {
  return iso.slice(0, 10)
}

function buildByDay(rows: { created_at: string }[], days = 30): DayCount[] {
  const freq: Record<string, number> = {}
  const now = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    freq[toDateStr(d.toISOString())] = 0
  }
  for (const row of rows) {
    const d = toDateStr(row.created_at)
    if (d in freq) freq[d] = (freq[d] ?? 0) + 1
  }
  return Object.entries(freq).map(([date, count]) => ({ date, count }))
}

export async function getAdminMetrics(): Promise<AdminMetrics> {
  const supabase = createServerClient()

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  // ── Blog ──────────────────────────────────────────────────────────────────
  const [{ count: postsPublished }, { count: postsDraft }] = await Promise.all([
    supabase.from("blog_posts").select("*", { count: "exact", head: true }).eq("published", true),
    supabase.from("blog_posts").select("*", { count: "exact", head: true }).eq("published", false),
  ])

  // ── Permanencia ───────────────────────────────────────────────────────────
  const { data: tokenRows } = await supabase
    .from("clasificador_tokens")
    .select("email, nombre, telefono, credits, created_at, stripe_session_id")
    .order("created_at", { ascending: false })

  const allTokens    = tokenRows ?? []
  const paidTokens   = allTokens.filter(t => t.credits > 0)
  const permanenciaIngresos = paidTokens.length * 790 // 7,90 € cada pago

  const recent30 = allTokens.filter(t => t.created_at >= thirtyDaysAgo)
  const permanenciaByDay = buildByDay(recent30)

  const recentPermanencia = allTokens.slice(0, 20).map(t => ({
    email:     t.email,
    nombre:    t.nombre ?? null,
    telefono:  t.telefono ?? null,
    credits:   t.credits,
    createdAt: t.created_at,
  }))

  // ── Evaluador (Stripe) ────────────────────────────────────────────────────
  let evaluadorPagos = 0
  let evaluadorIngresos = 0
  const evaluadorByDayMap: Record<string, number> = {}
  const now = new Date()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i)
    evaluadorByDayMap[toDateStr(d.toISOString())] = 0
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
    const sessions = await stripe.checkout.sessions.list({
      limit: 100,
      created: { gte: Math.floor(Date.now() / 1000 - 30 * 24 * 60 * 60) },
    })
    for (const s of sessions.data) {
      if (
        s.payment_status === "paid" &&
        s.success_url?.includes("evaluador")
      ) {
        evaluadorPagos++
        evaluadorIngresos += s.amount_total ?? 990
        const d = toDateStr(new Date(s.created * 1000).toISOString())
        if (d in evaluadorByDayMap) evaluadorByDayMap[d]++
      }
    }
  } catch { /* Stripe not configured or rate-limited */ }

  const evaluadorByDay: DayCount[] = Object.entries(evaluadorByDayMap).map(([date, count]) => ({ date, count }))

  // ── Newsletter ────────────────────────────────────────────────────────────
  let newsletterSuscriptores = 0
  let newsletterByDay: DayCount[] = buildByDay([], 30)

  try {
    const { count: nsCount, data: nsRows } = await supabase
      .from("newsletter_subscribers")
      .select("created_at", { count: "exact" })
      .gte("created_at", thirtyDaysAgo)

    newsletterSuscriptores = nsCount ?? 0
    newsletterByDay = buildByDay((nsRows ?? []) as { created_at: string }[])
  } catch { /* table might not exist yet */ }

  return {
    postsPublished:         postsPublished    ?? 0,
    postsDraft:             postsDraft        ?? 0,
    permanenciaRegistros:   allTokens.length,
    permanenciaPagos:       paidTokens.length,
    permanenciaIngresos,
    permanenciaByDay,
    evaluadorPagos,
    evaluadorIngresos,
    evaluadorByDay,
    newsletterSuscriptores,
    newsletterByDay,
    recentPermanencia,
  }
}

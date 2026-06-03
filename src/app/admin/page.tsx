import Link from "next/link"
import { getAdminMetrics } from "@/lib/admin-metrics"
import { MetricsChart } from "@/components/admin/MetricsChart"
import { formatDate } from "@/lib/blog"
import Stripe from "stripe"
import { createServerClient } from "@/lib/supabase"
import {
  FileText, Users, CreditCard, Mail, TrendingUp, Euro,
  CheckCircle, Clock, Plus, Wrench, Star, ImageIcon, ArrowRight,
} from "lucide-react"

function euros(cents: number) {
  return (cents / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR" })
}

// ─── Recent clients from ALL sources ─────────────────────────────────────────
async function getRecentClients() {
  const supabase = createServerClient()

  // Permanencia
  const { data: perm } = await supabase
    .from("clasificador_tokens")
    .select("email, nombre, telefono, credits, created_at")
    .order("created_at", { ascending: false })
    .limit(5)

  // Newsletter
  let newsletter: { email: string; created_at: string }[] = []
  try {
    const { data } = await supabase
      .from("newsletter_subscribers")
      .select("email, created_at")
      .order("created_at", { ascending: false })
      .limit(5)
    newsletter = data ?? []
  } catch { /* table may not exist */ }

  // Evaluador (Stripe)
  let evaluador: { email: string; nombre: string; amount: number; created: number }[] = []
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
    const sessions = await stripe.checkout.sessions.list({ limit: 10 })
    evaluador = sessions.data
      .filter(s => s.success_url?.includes("evaluador") && s.payment_status === "paid")
      .slice(0, 5)
      .map(s => ({
        email:   s.customer_details?.email ?? s.customer_email ?? "",
        nombre:  s.metadata?.nombre ?? "",
        amount:  s.amount_total ?? 0,
        created: s.created,
      }))
  } catch { /* Stripe error */ }

  return { perm: perm ?? [], newsletter, evaluador }
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub?: string
  icon: React.ElementType; color: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 flex gap-4 items-start">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">{label}</p>
        <p className="text-2xl font-heading font-bold">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Quick access card ────────────────────────────────────────────────────────
function QuickCard({ label, href, icon: Icon, color }: {
  label: string; href: string; icon: React.ElementType; color: string
}) {
  return (
    <Link href={href} className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 hover:border-primary/40 hover:shadow-card transition-all">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <span className="text-sm font-semibold group-hover:text-primary transition-colors">{label}</span>
      <ArrowRight className="h-3.5 w-3.5 ml-auto text-muted-foreground/40 group-hover:text-primary transition-colors" />
    </Link>
  )
}

export default async function AdminDashboard() {
  const [m, clients] = await Promise.all([getAdminMetrics(), getRecentClients()])

  return (
    <div className="space-y-8">

      <div>
        <h1 className="text-xl font-heading font-bold mb-0.5">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Vista general · últimos 30 días.</p>
      </div>

      {/* ── Accesos rápidos ── */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Accesos rápidos</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <QuickCard label="Nuevo post"       href="/admin/posts/new"                  icon={Plus}      color="bg-primary/10 text-primary" />
          <QuickCard label="Artículos"        href="/admin/posts"                      icon={FileText}  color="bg-muted text-muted-foreground" />
          <QuickCard label="Permanencia"      href="/admin/herramientas/permanencia"   icon={Wrench}    color="bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400" />
          <QuickCard label="Evaluador"        href="/admin/herramientas/evaluador"     icon={CreditCard} color="bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400" />
          <QuickCard label="Reseñas"          href="/admin/cms/resenas"                icon={Star}      color="bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400" />
          <QuickCard label="Expedientes"      href="/admin/cms/expedientes"            icon={ImageIcon} color="bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" />
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Permanencia registros" value={m.permanenciaRegistros} sub={`${m.permanenciaPagos} pagados`}         icon={Users}      color="bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400" />
        <StatCard label="Evaluador pagos"       value={m.evaluadorPagos}       sub={euros(m.evaluadorIngresos)}              icon={CreditCard} color="bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400" />
        <StatCard label="Total ingresos"        value={euros(m.permanenciaIngresos + m.evaluadorIngresos)} sub="permanencia + evaluador" icon={Euro} color="bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" />
        <StatCard label="Newsletter"            value={m.newsletterSuscriptores} sub="suscriptores (30d)"                   icon={Mail}       color="bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Posts publicados"   value={m.postsPublished}  icon={CheckCircle} color="bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" />
        <StatCard label="Borradores"         value={m.postsDraft}      icon={Clock}       color="bg-muted text-muted-foreground" />
        <StatCard label="Conversión perm."   value={m.permanenciaRegistros > 0 ? `${Math.round((m.permanenciaPagos / m.permanenciaRegistros) * 100)}%` : "—"} icon={TrendingUp} color="bg-primary/10 text-primary" />
        <StatCard label="Ingresos perm."     value={euros(m.permanenciaIngresos)} sub="7,90 € / pago" icon={Euro} color="bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400" />
      </div>

      {/* ── Charts ── */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Permanencia registros · 30d</p>
          <MetricsChart data={m.permanenciaByDay} color="#8b5cf6" label="Registros" />
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Evaluador pagos · 30d</p>
          <MetricsChart data={m.evaluadorByDay} color="#3b82f6" type="bar" label="Pagos" />
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Newsletter · 30d</p>
          <MetricsChart data={m.newsletterByDay} color="#f59e0b" label="Suscriptores" />
        </div>
      </div>

      {/* ── Clientes recientes — todas las fuentes ── */}
      <div className="grid md:grid-cols-3 gap-6">

        {/* Permanencia */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Permanencia recientes</p>
            <Link href="/admin/herramientas/permanencia" className="text-[10px] font-semibold text-primary hover:underline flex items-center gap-0.5">Ver todos <ArrowRight className="h-2.5 w-2.5" /></Link>
          </div>
          <div className="divide-y divide-border">
            {clients.perm.length === 0
              ? <p className="text-xs text-muted-foreground text-center py-8">Sin registros.</p>
              : clients.perm.map((r, i) => (
                <div key={i} className="px-5 py-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{r.nombre ?? r.email}</p>
                    <p className="text-xs text-muted-foreground font-mono truncate">{r.email}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase border ${r.credits > 0 ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800" : "bg-muted text-muted-foreground border-border"}`}>
                    {r.credits > 0 ? "Pagado" : "Pendiente"}
                  </span>
                </div>
              ))
            }
          </div>
        </div>

        {/* Evaluador */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Evaluador recientes</p>
            <Link href="/admin/herramientas/evaluador" className="text-[10px] font-semibold text-primary hover:underline flex items-center gap-0.5">Ver todos <ArrowRight className="h-2.5 w-2.5" /></Link>
          </div>
          <div className="divide-y divide-border">
            {clients.evaluador.length === 0
              ? <p className="text-xs text-muted-foreground text-center py-8">Sin pagos.</p>
              : clients.evaluador.map((r, i) => (
                <div key={i} className="px-5 py-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{r.nombre || r.email}</p>
                    <p className="text-xs text-muted-foreground font-mono truncate">{r.email}</p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-emerald-600">{euros(r.amount)}</span>
                </div>
              ))
            }
          </div>
        </div>

        {/* Newsletter */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Newsletter recientes</p>
            <Link href="/admin/cms/newsletter" className="text-[10px] font-semibold text-primary hover:underline flex items-center gap-0.5">Ver todos <ArrowRight className="h-2.5 w-2.5" /></Link>
          </div>
          <div className="divide-y divide-border">
            {clients.newsletter.length === 0
              ? <p className="text-xs text-muted-foreground text-center py-8">Sin suscriptores.</p>
              : clients.newsletter.map((r, i) => (
                <div key={i} className="px-5 py-3">
                  <p className="text-sm font-mono truncate">{r.email}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(r.created_at)}</p>
                </div>
              ))
            }
          </div>
        </div>

      </div>
    </div>
  )
}

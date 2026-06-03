import Stripe from "stripe"
import { formatDate } from "@/lib/blog"
import { CreditCard, Euro, CheckCircle, Clock } from "lucide-react"

function euros(cents: number) {
  return (cents / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR" })
}

async function getEvaluadorSessions() {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
    const sessions = await stripe.checkout.sessions.list({ limit: 100 })
    return sessions.data.filter(s => s.success_url?.includes("evaluador"))
  } catch {
    return []
  }
}

export default async function EvaluadorAdminPage() {
  const sessions = await getEvaluadorSessions()
  const pagados   = sessions.filter(s => s.payment_status === "paid")
  const pendientes = sessions.filter(s => s.payment_status !== "paid")
  const ingresos   = pagados.reduce((sum, s) => sum + (s.amount_total ?? 0), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-heading font-bold mb-0.5">Evaluador de Regularización</h1>
        <p className="text-sm text-muted-foreground">Pagos registrados vía Stripe para el kit de evaluación.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total sesiones", value: sessions.length, icon: CreditCard, color: "bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400" },
          { label: "Pagados",        value: pagados.length,  icon: CheckCircle, color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" },
          { label: "Pendientes",     value: pendientes.length, icon: Clock,    color: "bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400" },
          { label: "Ingresos",       value: euros(ingresos), icon: Euro,        color: "bg-primary/10 text-primary" },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-4 flex gap-3 items-center">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${s.color}`}>
              <s.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{s.label}</p>
              <p className="text-lg font-heading font-bold">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Email", "Nombre", "Importe", "Estado pago", "Session ID", "Fecha"].map(h => (
                  <th key={h} className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sessions.length === 0 && (
                <tr><td colSpan={6} className="text-center text-sm text-muted-foreground py-12">Sin sesiones.</td></tr>
              )}
              {sessions.map(s => (
                <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs">{s.customer_details?.email ?? s.customer_email ?? "—"}</td>
                  <td className="px-4 py-3">{s.metadata?.nombre || <span className="text-muted-foreground italic">—</span>}</td>
                  <td className="px-4 py-3 font-semibold">{euros(s.amount_total ?? 0)}</td>
                  <td className="px-4 py-3">
                    {s.payment_status === "paid"
                      ? <span className="inline-flex rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 text-[10px] font-bold uppercase">Pagado</span>
                      : <span className="inline-flex rounded-full bg-muted text-muted-foreground border border-border px-2 py-0.5 text-[10px] font-bold uppercase">{s.payment_status}</span>
                    }
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground max-w-[160px] truncate">{s.id}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{formatDate(new Date(s.created * 1000).toISOString())}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

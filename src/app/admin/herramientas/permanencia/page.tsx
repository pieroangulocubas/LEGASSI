import { createServerClient } from "@/lib/supabase"
import { formatDate } from "@/lib/blog"
import { Users, CreditCard, Euro, Clock } from "lucide-react"

async function getPermanenciaData() {
  const supabase = createServerClient()
  const { data } = await supabase
    .from("clasificador_tokens")
    .select("token, email, nombre, telefono, credits, stripe_session_id, created_at, expires_at")
    .order("created_at", { ascending: false })
  return data ?? []
}

function euros(cents: number) {
  return (cents / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR" })
}

export default async function PermanenciaAdminPage() {
  const rows = await getPermanenciaData()
  const pagados  = rows.filter(r => r.credits > 0)
  const pendiente = rows.filter(r => r.credits === 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-heading font-bold mb-0.5">Permanencia IA</h1>
        <p className="text-sm text-muted-foreground">Registros de la herramienta de clasificación de documentos.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total registros", value: rows.length,      icon: Users,       color: "bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400" },
          { label: "Han pagado",      value: pagados.length,   icon: CreditCard,  color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" },
          { label: "Pendientes",      value: pendiente.length, icon: Clock,       color: "bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400" },
          { label: "Ingresos",        value: euros(pagados.length * 790), icon: Euro, color: "bg-primary/10 text-primary" },
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
                {["Email", "Nombre", "Teléfono", "Créditos", "Stripe Session", "Estado", "Fecha", "Expira"].map(h => (
                  <th key={h} className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.length === 0 && (
                <tr><td colSpan={8} className="text-center text-sm text-muted-foreground py-12">Sin registros.</td></tr>
              )}
              {rows.map(r => (
                <tr key={r.token} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs max-w-[200px] truncate">{r.email ?? "—"}</td>
                  <td className="px-4 py-3">{r.nombre ?? <span className="text-muted-foreground italic">—</span>}</td>
                  <td className="px-4 py-3 font-mono text-xs">{r.telefono ?? "—"}</td>
                  <td className="px-4 py-3 text-center font-bold">{r.credits}</td>
                  <td className="px-4 py-3 font-mono text-xs max-w-[160px] truncate text-muted-foreground">{r.stripe_session_id ?? "—"}</td>
                  <td className="px-4 py-3">
                    {r.credits > 0
                      ? <span className="inline-flex rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 text-[10px] font-bold uppercase">Pagado</span>
                      : <span className="inline-flex rounded-full bg-muted text-muted-foreground border border-border px-2 py-0.5 text-[10px] font-bold uppercase">Pendiente</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{r.created_at ? formatDate(r.created_at) : "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{r.expires_at ? formatDate(r.expires_at) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

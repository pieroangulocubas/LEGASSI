import { createServerClient } from "@/lib/supabase"
import { formatDate } from "@/lib/blog"
import { Mail } from "lucide-react"

async function getSubscribers() {
  try {
    const supabase = createServerClient()
    const { data, count } = await supabase
      .from("newsletter_subscribers")
      .select("id, email, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
    return { rows: data ?? [], total: count ?? 0 }
  } catch {
    return { rows: [], total: 0 }
  }
}

export default async function NewsletterAdminPage() {
  const { rows, total } = await getSubscribers()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-heading font-bold mb-0.5">Newsletter</h1>
        <p className="text-sm text-muted-foreground">Suscriptores del blog de LEGASSI.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 flex gap-4 items-center w-fit">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
          <Mail className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total suscriptores</p>
          <p className="text-2xl font-heading font-bold">{total}</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          Sin suscriptores todavía.
          {total === 0 && <p className="mt-2 text-xs">Asegúrate de crear la tabla <code className="bg-muted px-1 rounded">newsletter_subscribers</code> en Supabase.</p>}
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground px-4 py-3">Email</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground px-4 py-3">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map(r => (
                <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs">{r.email}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(r.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

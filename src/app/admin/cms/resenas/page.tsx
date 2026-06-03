"use client"

import { useEffect, useState } from "react"
import { Star, Trash2, Plus, Loader2, ToggleLeft, ToggleRight } from "lucide-react"

interface Resena {
  id: string
  autor: string
  cargo: string | null
  texto: string
  estrellas: number
  visible: boolean
  created_at: string
}

export default function ResenasPage() {
  const [rows, setRows]       = useState<Resena[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm]       = useState({ autor: "", cargo: "", texto: "", estrellas: 5 })
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const res = await fetch("/api/admin/cms/resenas")
    if (res.ok) setRows(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(null)
    const res = await fetch("/api/admin/cms/resenas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    if (res.ok) { setForm({ autor: "", cargo: "", texto: "", estrellas: 5 }); await load() }
    else setError("Error al guardar")
    setSaving(false)
  }

  async function toggle(id: string, visible: boolean) {
    await fetch(`/api/admin/cms/resenas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visible: !visible }),
    })
    await load()
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar reseña?")) return
    await fetch(`/api/admin/cms/resenas/${id}`, { method: "DELETE" })
    await load()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-heading font-bold mb-0.5">Reseñas</h1>
        <p className="text-sm text-muted-foreground">Testimonios que aparecen en la página principal.</p>
      </div>

      {/* Form */}
      <form onSubmit={handleCreate} className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Nueva reseña</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Autor *</label>
            <input required value={form.autor} onChange={e => setForm(f => ({ ...f, autor: e.target.value }))}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Cargo / País</label>
            <input value={form.cargo} onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Texto *</label>
          <textarea required rows={3} value={form.texto} onChange={e => setForm(f => ({ ...f, texto: e.target.value }))}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Estrellas</label>
            <div className="flex gap-1">
              {[1,2,3,4,5].map(n => (
                <button key={n} type="button" onClick={() => setForm(f => ({ ...f, estrellas: n }))}>
                  <Star className={`h-5 w-5 ${n <= form.estrellas ? "fill-amber-400 text-amber-400" : "text-border"}`} />
                </button>
              ))}
            </div>
          </div>
          <button type="submit" disabled={saving}
            className="ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Añadir reseña
          </button>
        </div>
        {error && <p className="text-sm text-rose-600">{error}</p>}
      </form>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">Sin reseñas.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Autor", "Texto", "⭐", "Visible", ""].map(h => (
                  <th key={h} className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map(r => (
                <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium whitespace-nowrap">
                    {r.autor}
                    {r.cargo && <span className="block text-xs text-muted-foreground">{r.cargo}</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground max-w-xs line-clamp-2">{r.texto}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-0.5">
                      {Array.from({ length: r.estrellas }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => toggle(r.id, r.visible)}>
                      {r.visible
                        ? <ToggleRight className="h-6 w-6 text-primary" />
                        : <ToggleLeft className="h-6 w-6 text-muted-foreground" />}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => remove(r.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

"use client"

import { useEffect, useRef, useState } from "react"
import { ImageIcon, Trash2, Plus, Loader2, ToggleLeft, ToggleRight, Upload } from "lucide-react"

interface Expediente {
  id: string
  titulo: string
  descripcion: string | null
  imagen_url: string
  visible: boolean
  orden: number
  created_at: string
}

export default function ExpedientesPage() {
  const [rows, setRows]       = useState<Expediente[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm]       = useState({ titulo: "", descripcion: "", imagen_url: "" })
  const [saving, setSaving]   = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function load() {
    setLoading(true)
    const res = await fetch("/api/admin/cms/expedientes")
    if (res.ok) setRows(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function uploadImage(file: File) {
    setUploading(true)
    const fd = new FormData(); fd.append("file", file)
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd })
    const json = await res.json()
    if (json.url) setForm(f => ({ ...f, imagen_url: json.url }))
    setUploading(false)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.imagen_url) { setError("Sube una imagen primero"); return }
    setSaving(true); setError(null)
    const res = await fetch("/api/admin/cms/expedientes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, orden: rows.length }),
    })
    if (res.ok) { setForm({ titulo: "", descripcion: "", imagen_url: "" }); await load() }
    else setError("Error al guardar")
    setSaving(false)
  }

  async function toggle(id: string, visible: boolean) {
    await fetch(`/api/admin/cms/expedientes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visible: !visible }),
    })
    await load()
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar expediente?")) return
    await fetch(`/api/admin/cms/expedientes/${id}`, { method: "DELETE" })
    await load()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-heading font-bold mb-0.5">Expedientes favorables</h1>
        <p className="text-sm text-muted-foreground">Imágenes que aparecen en la sección de casos favorables.</p>
      </div>

      {/* Form */}
      <form onSubmit={handleCreate} className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Añadir expediente</p>

        {/* Image upload */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Imagen *</label>
          <div
            onClick={() => !form.imagen_url && fileRef.current?.click()}
            className={`relative w-full h-36 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-colors cursor-pointer ${form.imagen_url ? "border-border/40" : "border-border hover:border-primary/50 bg-muted/20"}`}
          >
            {form.imagen_url ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.imagen_url} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 hover:opacity-100 gap-3">
                  <button type="button" onClick={() => fileRef.current?.click()} className="bg-white/90 text-foreground rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5">
                    <Upload className="h-3.5 w-3.5" /> Cambiar
                  </button>
                  <button type="button" onClick={() => setForm(f => ({ ...f, imagen_url: "" }))} className="bg-rose-500 text-white rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5">
                    <Trash2 className="h-3.5 w-3.5" /> Quitar
                  </button>
                </div>
              </>
            ) : uploading ? (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-xs">Subiendo…</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <ImageIcon className="h-8 w-8 opacity-40" />
                <span className="text-sm font-medium">Subir imagen</span>
                <span className="text-xs opacity-60">JPG, PNG, WebP · 16:9 recomendado</span>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f); e.target.value = "" }} />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Título *</label>
            <input required value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
              placeholder="ej: Autorización de residencia por arraigo social"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Descripción</label>
            <input value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
              placeholder="ej: Venezuela · Arraigo social · 3 años"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
        </div>

        <div className="flex items-center justify-between">
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <button type="submit" disabled={saving || uploading}
            className="ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Añadir
          </button>
        </div>
      </form>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : rows.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">Sin expedientes.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map(r => (
            <div key={r.id} className={`rounded-2xl border overflow-hidden bg-card transition-opacity ${r.visible ? "border-border opacity-100" : "border-dashed border-border/50 opacity-60"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.imagen_url} alt={r.titulo} className="w-full aspect-video object-cover" />
              <div className="p-3 flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-sm leading-snug">{r.titulo}</p>
                  {r.descripcion && <p className="text-xs text-muted-foreground mt-0.5">{r.descripcion}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button type="button" onClick={() => toggle(r.id, r.visible)}>
                    {r.visible ? <ToggleRight className="h-5 w-5 text-primary" /> : <ToggleLeft className="h-5 w-5 text-muted-foreground" />}
                  </button>
                  <button type="button" onClick={() => remove(r.id)} className="p-1 rounded text-muted-foreground hover:text-rose-600 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

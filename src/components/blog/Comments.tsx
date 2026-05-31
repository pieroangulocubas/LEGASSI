"use client"

import { useState, useEffect, useCallback } from "react"
import { MessageSquare, Send, Loader2, User } from "lucide-react"

interface Comment {
  id: string
  author_name: string
  content: string
  created_at: string
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "ahora mismo"
  if (mins < 60) return `hace ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `hace ${days}d`
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })
}

export function Comments({ slug }: { slug: string }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState("")
  const [content, setContent] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  const fetchComments = useCallback(() => {
    return fetch(`/api/blog/${slug}/comments`)
      .then(r => r.json())
      .then(d => setComments(d.comments ?? []))
      .finally(() => setLoading(false))
  }, [slug])

  useEffect(() => { fetchComments() }, [fetchComments])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !content.trim()) return
    setSubmitting(true)
    setError("")
    try {
      const res = await fetch(`/api/blog/${slug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author_name: name, content }),
      })
      if (res.ok) {
        setSubmitted(true)
        setName("")
        setContent("")
        await fetchComments()
      } else {
        const d = await res.json()
        setError(d.error ?? "Error al enviar el comentario")
      }
    } catch {
      setError("Error de conexión")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mt-14 border-t border-border/40 pt-10">
      <h2 className="flex items-center gap-2 font-heading font-bold text-lg mb-7">
        <MessageSquare className="h-5 w-5 text-primary" />
        {loading ? "Comentarios" : `${comments.length} comentario${comments.length !== 1 ? "s" : ""}`}
      </h2>

      {/* List */}
      {!loading && comments.length > 0 && (
        <div className="space-y-5 mb-8">
          {comments.map(c => (
            <div key={c.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-sm font-semibold">{c.author_name}</span>
                  <span className="text-[11px] text-muted-foreground">{timeAgo(c.created_at)}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form */}
      <div className="rounded-2xl border border-border/60 bg-card p-5">
        <p className="text-sm font-semibold mb-4">Deja un comentario</p>

        {submitted && (
          <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-3">
            ✓ Comentario publicado. ¡Gracias!
          </p>
        )}
        {error && (
          <p className="text-sm text-rose-600 dark:text-rose-400 mb-3">{error}</p>
        )}

        <form onSubmit={submit} className="space-y-3">
          <input
            type="text"
            placeholder="Tu nombre *"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
          />
          <textarea
            placeholder="Escribe tu comentario..."
            value={content}
            onChange={e => setContent(e.target.value)}
            required
            rows={4}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all resize-none"
          />
          <button
            type="submit"
            disabled={submitting || !name.trim() || !content.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 transition-opacity hover:opacity-90"
          >
            {submitting
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Send className="h-4 w-4" />}
            Enviar comentario
          </button>
        </form>
      </div>
    </section>
  )
}

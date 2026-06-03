"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"

export function BlogSidebarSearch() {
  const [q, setQ] = useState("")
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = q.trim()
    router.push(trimmed ? `/blog?q=${encodeURIComponent(trimmed)}` : "/blog")
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
        <Search className="h-4 w-4" />
        Buscar
      </h3>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="search"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Buscar artículos..."
          className="flex-1 rounded-xl border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all placeholder:text-muted-foreground/50"
        />
        <button
          type="submit"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-muted hover:bg-muted/70 transition-colors"
        >
          <Search className="h-4 w-4 text-muted-foreground" />
        </button>
      </form>
    </div>
  )
}

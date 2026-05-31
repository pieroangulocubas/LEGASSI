"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export function TogglePublishedButton({ id, published }: { id: string; published: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [current, setCurrent] = useState(published)

  const toggle = async () => {
    setLoading(true)
    setCurrent(v => !v)
    try {
      await fetch(`/api/admin/posts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !current }),
      })
      router.refresh()
    } catch {
      setCurrent(v => !v)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={current ? "Despublicar" : "Publicar"}
      className={cn(
        "inline-flex items-center gap-1 text-[11px] font-semibold rounded-full px-2 py-0.5 transition-all disabled:opacity-50 hover:opacity-75 cursor-pointer",
        current
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
          : "bg-muted text-muted-foreground"
      )}
    >
      {loading
        ? <Loader2 className="h-3 w-3 animate-spin" />
        : current ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />
      }
      {current ? "Publicado" : "Borrador"}
    </button>
  )
}

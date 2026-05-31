"use client"

import { useState, useEffect } from "react"
import { Heart } from "lucide-react"
import { cn } from "@/lib/utils"

export function LikeButton({ slug, initialCount }: { slug: string; initialCount: number }) {
  const [liked, setLiked] = useState(false)
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    try {
      const likes: string[] = JSON.parse(localStorage.getItem("blog_likes") ?? "[]")
      setLiked(likes.includes(slug))
    } catch {}
  }, [slug])

  const toggle = async () => {
    if (loading) return
    const newLiked = !liked
    setLiked(newLiked)
    setCount(c => newLiked ? c + 1 : Math.max(0, c - 1))

    try {
      const likes: string[] = JSON.parse(localStorage.getItem("blog_likes") ?? "[]")
      if (newLiked) likes.push(slug)
      else likes.splice(likes.indexOf(slug), 1)
      localStorage.setItem("blog_likes", JSON.stringify(likes))
    } catch {}

    setLoading(true)
    try {
      await fetch(`/api/blog/${slug}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unlike: !newLiked }),
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all select-none",
        liked
          ? "bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-400"
          : "bg-background border-border text-muted-foreground hover:border-rose-200 hover:text-rose-500"
      )}
    >
      <Heart className={cn("h-4 w-4 transition-all", liked && "fill-current")} />
      {count > 0 ? `${count} ` : ""}Me gusta
    </button>
  )
}

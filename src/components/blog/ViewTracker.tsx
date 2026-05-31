"use client"

import { useEffect } from "react"

export function ViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const key = `viewed_${slug}`
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, "1")
    fetch(`/api/blog/${slug}/view`, { method: "POST" })
  }, [slug])

  return null
}

"use client"

import NextImage from "next/image"
import { X } from "lucide-react"

export function DocViewerModal({
  url,
  mimeType,
  name,
  onClose,
}: {
  url: string
  mimeType: string
  name: string
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-background rounded-2xl border border-border shadow-2xl w-full max-w-2xl h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 shrink-0">
          <p className="text-sm font-semibold truncate max-w-xs">{name}</p>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors ml-2 shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="relative flex-1 overflow-hidden bg-muted/20">
          {mimeType === "application/pdf" ? (
            <iframe src={url} className="w-full h-full border-0" title={name} />
          ) : (
            <NextImage
              src={url}
              alt={name}
              fill
              unoptimized
              sizes="100vw"
              className="object-contain"
            />
          )}
        </div>
      </div>
    </div>
  )
}

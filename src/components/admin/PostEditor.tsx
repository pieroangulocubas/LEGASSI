"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import Underline from "@tiptap/extension-underline"
import { useRef, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { CATEGORIES, TAGS, type CategorySlug, type TagSlug, type BlogPostRow } from "@/lib/blog"
import { cn } from "@/lib/utils"
import {
  Bold, Italic, UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Minus,
  Link2, ImageIcon, Loader2, Save, Eye, EyeOff,
} from "lucide-react"

interface PostEditorProps {
  post?: BlogPostRow
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
}

export function PostEditor({ post }: PostEditorProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState(post?.title ?? "")
  const [slug, setSlug] = useState(post?.slug ?? "")
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "")
  const [category, setCategory] = useState<CategorySlug>((post?.category as CategorySlug) ?? "salida")
  const [tags, setTags] = useState<TagSlug[]>((post?.tags ?? []) as TagSlug[])
  const [published, setPublished] = useState(post?.published ?? false)
  const [featured, setFeatured] = useState(post?.featured ?? false)
  const [slugManual, setSlugManual] = useState(!!post?.slug)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Image.configure({ inline: false }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: "Escribe el contenido del artículo…" }),
    ],
    content: post?.content ?? "",
    editorProps: {
      attributes: {
        class: "prose-editor min-h-[400px] outline-none px-1 py-2",
      },
    },
  })

  const handleTitleChange = (value: string) => {
    setTitle(value)
    if (!slugManual) setSlug(slugify(value))
  }

  const toggleTag = (tag: TagSlug) => {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  const insertLink = useCallback(() => {
    if (!editor) return
    const url = window.prompt("URL del enlace:")
    if (!url) return
    editor.chain().focus().setLink({ href: url }).run()
  }, [editor])

  const insertImage = useCallback(async (file: File) => {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd })
      const json = await res.json()
      if (json.url) editor?.chain().focus().setImage({ src: json.url }).run()
    } finally {
      setUploading(false)
    }
  }, [editor])

  const handleSave = async () => {
    if (!title.trim() || !slug.trim()) {
      setError("El título y el slug son obligatorios.")
      return
    }
    setSaving(true)
    setError(null)
    try {
      const content = editor?.getHTML() ?? ""
      const payload = {
        title: title.trim(),
        slug: slug.trim(),
        excerpt: excerpt.trim(),
        category,
        tags,
        content,
        published,
        featured,
        published_at: published ? (post?.published_at ?? new Date().toISOString()) : null,
      }

      const url = post?.id ? `/api/admin/posts/${post.id}` : "/api/admin/posts"
      const method = post?.id ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error ?? "Error al guardar")
      }

      router.push("/admin/posts")
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Metadata */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 flex flex-col gap-4">

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Título</label>
            <input
              value={title}
              onChange={e => handleTitleChange(e.target.value)}
              placeholder="Título del artículo"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Slug (URL)</label>
            <input
              value={slug}
              onChange={e => { setSlug(e.target.value); setSlugManual(true) }}
              placeholder="slug-del-articulo"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <p className="text-[11px] text-muted-foreground mt-1">/blog/<span className="text-foreground">{slug || "slug-del-articulo"}</span></p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Extracto</label>
            <textarea
              value={excerpt}
              onChange={e => setExcerpt(e.target.value)}
              placeholder="Resumen breve del artículo (aparece en listados y SEO)"
              rows={3}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>

        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Categoría</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as CategorySlug)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {(Object.entries(CATEGORIES) as [CategorySlug, typeof CATEGORIES[CategorySlug]][]).map(([slug, cat]) => (
                <option key={slug} value={slug}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Etiquetas</label>
            <div className="flex flex-col gap-2">
              {(Object.entries(TAGS) as [TagSlug, typeof TAGS[TagSlug]][]).map(([key, tag]) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tags.includes(key)}
                    onChange={() => toggleTag(key)}
                    className="rounded border-border"
                  />
                  <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", tag.bg, tag.text, tag.border)}>
                    {tag.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2 border-t border-border/40">
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setPublished(p => !p)}
                className={cn(
                  "relative w-9 h-5 rounded-full transition-colors",
                  published ? "bg-primary" : "bg-muted"
                )}
              >
                <span className={cn(
                  "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
                  published && "translate-x-4"
                )} />
              </div>
              <span className="text-sm font-medium flex items-center gap-1.5">
                {published ? <Eye className="h-3.5 w-3.5 text-primary" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                {published ? "Publicado" : "Borrador"}
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setFeatured(f => !f)}
                className={cn(
                  "relative w-9 h-5 rounded-full transition-colors",
                  featured ? "bg-orange-500" : "bg-muted"
                )}
              >
                <span className={cn(
                  "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
                  featured && "translate-x-4"
                )} />
              </div>
              <span className="text-sm font-medium">Destacado</span>
            </label>
          </div>

        </div>
      </div>

      {/* Tiptap editor */}
      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Contenido</label>
        <div className="rounded-xl border border-border overflow-hidden">

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/30 px-2 py-1.5">
            <ToolbarBtn onClick={() => editor?.chain().focus().toggleBold().run()} active={editor?.isActive("bold")} title="Negrita">
              <Bold className="h-3.5 w-3.5" />
            </ToolbarBtn>
            <ToolbarBtn onClick={() => editor?.chain().focus().toggleItalic().run()} active={editor?.isActive("italic")} title="Cursiva">
              <Italic className="h-3.5 w-3.5" />
            </ToolbarBtn>
            <ToolbarBtn onClick={() => editor?.chain().focus().toggleUnderline().run()} active={editor?.isActive("underline")} title="Subrayado">
              <UnderlineIcon className="h-3.5 w-3.5" />
            </ToolbarBtn>
            <ToolbarBtn onClick={() => editor?.chain().focus().toggleStrike().run()} active={editor?.isActive("strike")} title="Tachado">
              <Strikethrough className="h-3.5 w-3.5" />
            </ToolbarBtn>

            <div className="w-px h-4 bg-border mx-1" />

            <ToolbarBtn onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} active={editor?.isActive("heading", { level: 1 })} title="Título 1">
              <Heading1 className="h-3.5 w-3.5" />
            </ToolbarBtn>
            <ToolbarBtn onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} active={editor?.isActive("heading", { level: 2 })} title="Título 2">
              <Heading2 className="h-3.5 w-3.5" />
            </ToolbarBtn>
            <ToolbarBtn onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} active={editor?.isActive("heading", { level: 3 })} title="Título 3">
              <Heading3 className="h-3.5 w-3.5" />
            </ToolbarBtn>

            <div className="w-px h-4 bg-border mx-1" />

            <ToolbarBtn onClick={() => editor?.chain().focus().toggleBulletList().run()} active={editor?.isActive("bulletList")} title="Lista">
              <List className="h-3.5 w-3.5" />
            </ToolbarBtn>
            <ToolbarBtn onClick={() => editor?.chain().focus().toggleOrderedList().run()} active={editor?.isActive("orderedList")} title="Lista numerada">
              <ListOrdered className="h-3.5 w-3.5" />
            </ToolbarBtn>
            <ToolbarBtn onClick={() => editor?.chain().focus().toggleBlockquote().run()} active={editor?.isActive("blockquote")} title="Cita">
              <Quote className="h-3.5 w-3.5" />
            </ToolbarBtn>
            <ToolbarBtn onClick={() => editor?.chain().focus().setHorizontalRule().run()} title="Separador">
              <Minus className="h-3.5 w-3.5" />
            </ToolbarBtn>

            <div className="w-px h-4 bg-border mx-1" />

            <ToolbarBtn onClick={insertLink} active={editor?.isActive("link")} title="Enlace">
              <Link2 className="h-3.5 w-3.5" />
            </ToolbarBtn>
            <ToolbarBtn
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              title="Insertar imagen"
            >
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
            </ToolbarBtn>
          </div>

          {/* Editor area */}
          <div className="bg-background px-4 py-3">
            <EditorContent editor={editor} />
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0]
            if (file) insertImage(file)
            e.target.value = ""
          }}
        />
      </div>

      {/* Error + Save */}
      {error && (
        <p className="text-sm text-rose-600 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-lg px-4 py-2">
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/40">
        <button
          type="button"
          onClick={() => router.push("/admin/posts")}
          className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {post?.id ? "Guardar cambios" : "Crear artículo"}
        </button>
      </div>

    </div>
  )
}

function ToolbarBtn({
  onClick, active, disabled, title, children,
}: {
  onClick?: () => void
  active?: boolean
  disabled?: boolean
  title?: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "p-1.5 rounded transition-colors",
        active
          ? "bg-primary/15 text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-muted",
        disabled && "opacity-40 cursor-not-allowed"
      )}
    >
      {children}
    </button>
  )
}

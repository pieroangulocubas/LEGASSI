"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import Underline from "@tiptap/extension-underline"
import NextImage from "next/image"
import { useRef, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { CATEGORIES, TAGS, type CategorySlug, type TagSlug, type BlogPostRow } from "@/lib/blog"
import { Tag } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Bold, Italic, UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Minus,
  Link2, ImageIcon, Loader2, Save, Eye, EyeOff, Upload, X,
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
  const coverInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState(post?.title ?? "")
  const [slug, setSlug] = useState(post?.slug ?? "")
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "")
  const [category, setCategory] = useState<CategorySlug>((post?.category as CategorySlug) ?? "situacion")
  const [visualTags, setVisualTags] = useState<TagSlug[]>(
    (post?.tags ?? []).filter(t => t in TAGS) as TagSlug[]
  )
  const [customTags, setCustomTags] = useState<string[]>(
    (post?.tags ?? []).filter(t => !(t in TAGS))
  )
  const [tagInput, setTagInput] = useState("")
  const [published, setPublished] = useState(post?.published ?? false)
  const [featured, setFeatured] = useState(post?.featured ?? false)
  const [coverImage, setCoverImage] = useState<string | null>(post?.cover_image ?? null)
  const [slugManual, setSlugManual] = useState(!!post?.slug)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [coverUploading, setCoverUploading] = useState(false)
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

  const toggleVisualTag = (tag: TagSlug) => {
    setVisualTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  const addCustomTag = () => {
    const val = tagInput.trim().toLowerCase()
    if (!val || val in TAGS || customTags.includes(val)) { setTagInput(""); return }
    setCustomTags(prev => [...prev, val])
    setTagInput("")
  }

  const removeCustomTag = (tag: string) => setCustomTags(prev => prev.filter(t => t !== tag))

  const insertLink = useCallback(() => {
    if (!editor) return
    const url = window.prompt("URL del enlace:")
    if (!url) return
    editor.chain().focus().setLink({ href: url }).run()
  }, [editor])

  const uploadFile = useCallback(async (file: File): Promise<string | null> => {
    const fd = new FormData()
    fd.append("file", file)
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd })
    const json = await res.json()
    return json.url ?? null
  }, [])

  const insertImage = useCallback(async (file: File) => {
    setUploading(true)
    try {
      const url = await uploadFile(file)
      if (url) editor?.chain().focus().setImage({ src: url }).run()
    } finally {
      setUploading(false)
    }
  }, [editor, uploadFile])

  const uploadCover = useCallback(async (file: File) => {
    setCoverUploading(true)
    try {
      const url = await uploadFile(file)
      if (url) setCoverImage(url)
    } finally {
      setCoverUploading(false)
    }
  }, [uploadFile])

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
        tags: [...visualTags, ...customTags],
        content,
        published,
        featured,
        cover_image: coverImage ?? null,
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

      {/* Cover image */}
      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Imagen de portada</label>
        <div
          onClick={() => !coverImage && coverInputRef.current?.click()}
          className={cn(
            "relative w-full rounded-xl overflow-hidden border-2 border-dashed transition-colors",
            coverImage ? "border-border/40 h-52" : "border-border hover:border-primary/50 cursor-pointer h-36 flex items-center justify-center bg-muted/20"
          )}
        >
          {coverImage ? (
            <>
              <NextImage src={coverImage} alt="Portada" fill className="object-cover" sizes="100vw" />
              <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center gap-3 opacity-0 hover:opacity-100">
                <button type="button" onClick={() => coverInputRef.current?.click()} className="bg-white/90 text-foreground rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5">
                  <Upload className="h-3.5 w-3.5" /> Cambiar
                </button>
                <button type="button" onClick={() => setCoverImage(null)} className="bg-rose-500 text-white rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5">
                  <X className="h-3.5 w-3.5" /> Quitar
                </button>
              </div>
            </>
          ) : coverUploading ? (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-xs">Subiendo imagen…</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <ImageIcon className="h-8 w-8 opacity-40" />
              <span className="text-sm font-medium">Subir imagen de portada</span>
              <span className="text-xs opacity-60">Recomendado: 1200 × 630 px</span>
            </div>
          )}
        </div>
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0]
            if (file) uploadCover(file)
            e.target.value = ""
          }}
        />
      </div>

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
            <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Etiquetas de badge</label>
            <p className="text-[11px] text-muted-foreground mb-2">Aparecen visualmente en el card del artículo.</p>
            <div className="flex flex-col gap-2">
              {(Object.entries(TAGS) as [TagSlug, typeof TAGS[TagSlug]][]).map(([key, tag]) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visualTags.includes(key)}
                    onChange={() => toggleVisualTag(key)}
                    className="rounded border-border"
                  />
                  <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", tag.bg, tag.text, tag.border)}>
                    {tag.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
              <Tag className="h-3 w-3" /> Etiquetas de metadatos
            </label>
            <p className="text-[11px] text-muted-foreground mb-2">Metadata interna y nube de etiquetas del sidebar.</p>
            <div className="flex gap-2 mb-2">
              <input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addCustomTag() } }}
                placeholder="ej: arraigo, nie, renovación…"
                className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                type="button"
                onClick={addCustomTag}
                className="px-3 py-1.5 rounded-lg bg-muted text-sm font-medium hover:bg-muted/70 transition-colors"
              >
                Añadir
              </button>
            </div>
            {customTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {customTags.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-muted border border-border px-2.5 py-0.5 text-xs font-medium">
                    {tag}
                    <button type="button" onClick={() => removeCustomTag(tag)} className="text-muted-foreground hover:text-foreground transition-colors ml-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
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

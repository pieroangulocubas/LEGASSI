import Link from "next/link"
import { adminGetAllPosts, CATEGORIES, TAGS, formatDate, type BlogPostRow, type CategorySlug, type TagSlug } from "@/lib/blog"
import { cn } from "@/lib/utils"
import { PenLine, Trash2, Eye, EyeOff, Plus } from "lucide-react"
import { DeletePostButton } from "./DeletePostButton"

const CATEGORY_COLORS: Record<CategorySlug, string> = {
  situacion:  "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  tramite:    "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400 border-violet-200 dark:border-violet-800",
  errores:    "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border-rose-200 dark:border-rose-800",
  casos:      "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  actualidad: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
}

export default async function AdminPostsPage() {
  const posts = await adminGetAllPosts()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Artículos</h1>
          <p className="text-sm text-muted-foreground">{posts.length} artículo{posts.length !== 1 ? "s" : ""} en total</p>
        </div>
        <Link
          href="/admin/posts/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          Nuevo artículo
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-dashed border-border">
          <p className="text-muted-foreground text-sm mb-4">No hay artículos todavía.</p>
          <Link href="/admin/posts/new" className="text-sm font-semibold text-primary hover:underline">
            Crear el primero →
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground px-4 py-3">Título</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground px-4 py-3 hidden sm:table-cell">Categoría</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground px-4 py-3 hidden md:table-cell">Fecha</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground px-4 py-3">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {posts.map(post => (
                <tr key={post.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-sm leading-snug line-clamp-1">{post.title || <span className="text-muted-foreground italic">Sin título</span>}</p>
                    <p className="text-[11px] text-muted-foreground font-mono mt-0.5">/blog/{post.slug}</p>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", CATEGORY_COLORS[post.category as CategorySlug])}>
                      {CATEGORIES[post.category as CategorySlug]?.label ?? post.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs text-muted-foreground">
                      {post.published_at ? formatDate(post.published_at) : formatDate(post.created_at)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "inline-flex items-center gap-1 text-[11px] font-semibold rounded-full px-2 py-0.5",
                      post.published
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                        : "bg-muted text-muted-foreground"
                    )}>
                      {post.published ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      {post.published ? "Publicado" : "Borrador"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <Link
                        href={`/admin/posts/${post.id}/edit`}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title="Editar"
                      >
                        <PenLine className="h-4 w-4" />
                      </Link>
                      <DeletePostButton id={post.id} title={post.title} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

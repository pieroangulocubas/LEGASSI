import { notFound } from "next/navigation"
import { adminGetPost } from "@/lib/blog"
import { PostEditor } from "@/components/admin/PostEditor"

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const post = await adminGetPost(id)
  if (!post) notFound()

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Editar artículo</h1>
      <PostEditor post={post} />
    </div>
  )
}

import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

const posts = [
  {
    slug: "arraigo-social-2026-guia-completa",
    title: "Arraigo social 2026: todo lo que necesitas para regularizarte",
    excerpt: "El arraigo social sigue siendo la vía más usada para regularizar la situación en España. Te explicamos los requisitos actualizados, los documentos que necesitas y los errores que más retrasos generan.",
    category: "tramite",
    tags: ["actualizado"],
    content: "<p>Contenido de prueba.</p>",
    published: true,
    featured: false,
    published_at: "2026-05-20T10:00:00Z",
  },
  {
    slug: "nie-o-tie-cual-necesitas",
    title: "NIE o TIE: cuál necesitas y cómo conseguirlo sin colas",
    excerpt: "Mucha gente confunde el NIE con el TIE y llega al consulado con la documentación equivocada. Aquí te aclaramos la diferencia, cuándo necesitas cada uno y cómo pedir cita sin esperar semanas.",
    category: "errores",
    tags: [],
    content: "<p>Contenido de prueba.</p>",
    published: true,
    featured: false,
    published_at: "2026-05-15T10:00:00Z",
  },
]

const { data, error } = await supabase.from("blog_posts").insert(posts).select("id, title")

if (error) {
  console.error("Error:", error.message)
  process.exit(1)
}

data.forEach(p => console.log(`✓ Insertado: ${p.id} — ${p.title}`))

import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

const { error } = await supabase
  .from("newsletter_subscribers")
  .select("id")
  .limit(1)

if (error?.code === "42P01") {
  console.log("La tabla no existe. Créala en Supabase con:")
  console.log(`
CREATE TABLE newsletter_subscribers (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
`)
} else if (error) {
  console.error("Error:", error.message)
} else {
  console.log("✓ La tabla newsletter_subscribers ya existe.")
}

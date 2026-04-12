import { createClient } from "@supabase/supabase-js"

// Uses the service role key — only for server-side API routes, never expose to the browser.
export function createServerClient() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.")
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  })
}

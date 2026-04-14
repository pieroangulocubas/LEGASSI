import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { inngest } from "@/inngest/client"

// POST /api/clasificador
// Receives { jobId } after the client has uploaded files directly to Supabase Storage.
// Verifies the job exists and is pending, then triggers the Inngest background function.
// File bytes never pass through Vercel — this endpoint is tiny and fast.
export async function POST(req: NextRequest) {
  let body: { jobId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Petición no válida." }, { status: 400 })
  }

  const jobId = body.jobId?.trim()
  if (!jobId) {
    return NextResponse.json({ error: "Missing jobId." }, { status: 400 })
  }

  const supabase = createServerClient()
  const { data: job, error } = await supabase
    .from("clasificador_jobs")
    .select("id, status")
    .eq("id", jobId)
    .eq("status", "pending")
    .maybeSingle()

  if (error || !job) {
    return NextResponse.json({ error: "Job no encontrado o ya procesado." }, { status: 404 })
  }

  await inngest.send({ name: "clasificador/analyze", data: { jobId } })

  return NextResponse.json({ ok: true })
}

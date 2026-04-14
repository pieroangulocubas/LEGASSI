import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export const dynamic = "force-dynamic"

// GET /api/clasificador/status?jobId=xxx
// Returns job status and (when done) the enriched results.
export async function GET(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get("jobId")
  if (!jobId) {
    return NextResponse.json({ error: "Missing jobId" }, { status: 400 })
  }

  const JOB_TIMEOUT_MS = 10 * 60 * 1000 // 10 minutes

  const supabase = createServerClient()
  const { data: job, error } = await supabase
    .from("clasificador_jobs")
    .select("status, step, result, error_msg, credits_remaining, auto_issued_token, updated_at")
    .eq("id", jobId)
    .single()

  if (error || !job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 })
  }

  // Detect stuck jobs: still "processing" but not updated in the last 10 minutes
  let status = job.status as string
  if (status === "processing" && job.updated_at) {
    const lastUpdate = new Date(job.updated_at).getTime()
    if (Date.now() - lastUpdate > JOB_TIMEOUT_MS) {
      status = "error"
      // Mark in DB so subsequent polls and onFailure agree on the final state
      await supabase
        .from("clasificador_jobs")
        .update({
          status: "error",
          error_msg: "El análisis tardó demasiado. Tu crédito no ha sido descontado.",
          updated_at: new Date().toISOString(),
        })
        .eq("id", jobId)
        .eq("status", "processing") // guard: only update if still processing
    }
  }

  return NextResponse.json(
    {
      status,
      step:             job.step,
      result:           job.result ?? null,
      error:            status === "error"
                          ? (job.error_msg ?? "El análisis no pudo completarse. Tu crédito no ha sido descontado.")
                          : null,
      creditsRemaining: job.credits_remaining ?? null,
      autoIssuedToken:  job.auto_issued_token ?? null,
    },
    { headers: { "Cache-Control": "no-store" } }
  )
}

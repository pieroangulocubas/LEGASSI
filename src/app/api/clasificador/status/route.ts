import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

// GET /api/clasificador/status?jobId=xxx
// Returns job status and (when done) the enriched results.
export async function GET(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get("jobId")
  if (!jobId) {
    return NextResponse.json({ error: "Missing jobId" }, { status: 400 })
  }

  const supabase = createServerClient()
  const { data: job, error } = await supabase
    .from("clasificador_jobs")
    .select("status, step, result, error_msg, credits_remaining, auto_issued_token, token, new_credits, credit_refunded")
    .eq("id", jobId)
    .single()

  if (error || !job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 })
  }

  return NextResponse.json({
    status:           job.status,
    step:             job.step,
    result:           job.result ?? null,
    error:            job.error_msg ?? null,
    creditsRemaining: job.credits_remaining ?? null,
    autoIssuedToken:  job.auto_issued_token ?? null,
  })
}

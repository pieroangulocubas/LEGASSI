import { GoogleGenAI } from "@google/genai"
import { inngest } from "@/inngest/client"
import { createServerClient } from "@/lib/supabase"
import { buildGeminiPrompt, enrichGeminiResults } from "@/lib/clasificador-utils"

export interface FileMeta {
  storageKey: string    // path inside the "clasificador-temp" bucket
  originalName: string  // original filename
  mimeType: string
  originalIndex: number // the FILE_INDEX:N Gemini will see for this file
}

// ─── Background analysis function ─────────────────────────────────────────────
export const analizarClasificador = inngest.createFunction(
  {
    id: "clasificador-analyze",
    retries: 4,
    // Mark job as error when all retries are exhausted.
    // No credit refund needed — credit is only deducted on successful completion.
    onFailure: async ({ event }) => {
      const { jobId } = event.data.event.data as { jobId: string }
      const supabase = createServerClient()
      const { data: job } = await supabase
        .from("clasificador_jobs")
        .select("file_meta")
        .eq("id", jobId)
        .single()

      await supabase
        .from("clasificador_jobs")
        .update({
          status: "error",
          error_msg: "El análisis no pudo completarse. Tu crédito no ha sido descontado.",
          updated_at: new Date().toISOString(),
        })
        .eq("id", jobId)

      // Clean up temp files from storage
      if (job) {
        const paths = ((job.file_meta ?? []) as { storageKey: string }[]).map((m) => m.storageKey)
        if (paths.length > 0) {
          await supabase.storage.from("clasificador-temp").remove(paths)
        }
      }
    },
    triggers: [{ event: "clasificador/analyze" }],
  },
  async ({ event, step }) => {
    const { jobId } = event.data as { jobId: string }

    // ── Step A: Download files + call Gemini (slow — up to ~90s) ─────────────
    // Isolated so Inngest retries only this step on Gemini failures,
    // and each Vercel invocation stays well under maxDuration.
    const { rawText, nombre, token, fileMeta, allFileNames, creditsRemaining } =
      await step.run("call-gemini", async () => {
        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) throw new Error("GEMINI_API_KEY not set")

        const supabase = createServerClient()

        const { data: job, error: jobErr } = await supabase
          .from("clasificador_jobs")
          .select("*")
          .eq("id", jobId)
          .single()

        if (jobErr || !job) throw new Error(`Job ${jobId} not found`)

        const fileMeta: FileMeta[] = job.file_meta ?? []
        const allFileNames: string[] = job.all_file_names ?? []

        await supabase
          .from("clasificador_jobs")
          .update({ status: "processing", step: 2, updated_at: new Date().toISOString() })
          .eq("id", jobId)

        // Download all files in parallel — significant speedup for multi-file batches
        const downloaded = await Promise.all(
          fileMeta.map(async (meta) => {
            const { data: blob, error: dlErr } = await supabase.storage
              .from("clasificador-temp")
              .download(meta.storageKey)
            if (dlErr || !blob) throw new Error(`Failed to download ${meta.storageKey}: ${dlErr?.message}`)
            const buf = Buffer.from(await blob.arrayBuffer())
            return { meta, buf }
          })
        )

        // Rebuild parts in original order so FILE_INDEX markers are correct
        downloaded.sort((a, b) => a.meta.originalIndex - b.meta.originalIndex)

        const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
          { text: buildGeminiPrompt(job.nombre ?? "") },
        ]
        for (const { meta, buf } of downloaded) {
          parts.push({ text: `FILE_INDEX:${meta.originalIndex}` })
          parts.push({ inlineData: { mimeType: meta.mimeType, data: buf.toString("base64") } })
        }

        const ai = new GoogleGenAI({ apiKey })

        // Retry with exponential backoff for transient Gemini errors (429, 503, 5xx).
        // Delays: 10s → 30s → 90s → 180s (5 attempts total).
        // Large batches (30 files / 50 MB) can take 2–4 min — generous delays reduce
        // unnecessary hammering while still recovering from transient quota spikes.
        // NOTE: if all attempts fail, the error propagates and Inngest retries this
        // entire step (up to `retries: 4` at the function level).
        let rawText = ""
        const MAX_ATTEMPTS = 5
        const BASE_DELAY_MS = 10_000

        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
          try {
            const response = await ai.models.generateContent({
              model: "gemini-3-flash-preview",
              contents: [{ role: "user", parts }],
              config: {
                temperature: 0.1,
                responseMimeType: "application/json",
              },
            })
            rawText = response.text ?? ""
            break
          } catch (err: unknown) {
            const isRetryable =
              err instanceof Error &&
              /429|503|500|rate.?limit|quota|overloaded|unavailable/i.test(err.message)

            if (!isRetryable || attempt === MAX_ATTEMPTS) throw err

            const delay = BASE_DELAY_MS * Math.pow(3, attempt - 1) // 10s, 30s, 90s, 180s
            await new Promise((resolve) => setTimeout(resolve, delay))
          }
        }

        return {
          rawText,
          nombre:          job.nombre ?? "",
          token:           job.token as string,
          fileMeta,
          allFileNames,
          creditsRemaining: job.credits_remaining as number | null,
        }
      })

    // ── Step B: Parse + enrich + save result (fast — <5s) ────────────────────
    // Separate invocation so a Vercel timeout in step A never corrupts the DB.
    await step.run("save-result", async () => {
      const supabase = createServerClient()

      // Step 3 UI progress
      await supabase
        .from("clasificador_jobs")
        .update({ step: 3, updated_at: new Date().toISOString() })
        .eq("id", jobId)

      let parsed: unknown[]
      try {
        const cleaned = rawText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim()
        parsed = JSON.parse(cleaned)
        if (!Array.isArray(parsed)) throw new Error("Not an array")
      } catch {
        throw new Error(`Failed to parse Gemini response: ${rawText.slice(0, 200)}`)
      }

      const enriched = enrichGeminiResults(parsed, nombre, allFileNames)

      // Step 4 UI progress
      await supabase
        .from("clasificador_jobs")
        .update({ step: 4, updated_at: new Date().toISOString() })
        .eq("id", jobId)

      // Deduct credit (idempotent: only if not already done).
      // Floor at 0 — the RPC may return a negative number if called concurrently.
      let creditsAfterDeduction = 0
      if (creditsRemaining === null) {
        const { data: deducted } = await supabase.rpc("use_clasificador_credit", {
          p_token: token,
        })
        creditsAfterDeduction = Math.max(0, deducted ?? 0)
      } else {
        creditsAfterDeduction = Math.max(0, creditsRemaining)
      }

      await supabase
        .from("clasificador_jobs")
        .update({
          status: "done",
          step: 5,
          result: enriched,
          credits_remaining: creditsAfterDeduction,
          updated_at: new Date().toISOString(),
        })
        .eq("id", jobId)

      // Delete temp files (non-fatal)
      const paths = fileMeta.map((m) => m.storageKey)
      if (paths.length > 0) {
        await supabase.storage.from("clasificador-temp").remove(paths)
      }
    })
  }
)

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
    retries: 1,
    // Refund credit + mark job as error when all retries are exhausted
    onFailure: async ({ event }) => {
      const { jobId } = event.data.event.data as { jobId: string }
      const supabase = createServerClient()
      const { data: job } = await supabase
        .from("clasificador_jobs")
        .select("token, new_credits, file_meta")
        .eq("id", jobId)
        .single()

      await supabase
        .from("clasificador_jobs")
        .update({
          status: "error",
          error_msg: "Error al procesar el análisis. El crédito ha sido restaurado.",
          updated_at: new Date().toISOString(),
        })
        .eq("id", jobId)

      if (job) {
        // Refund credit
        await supabase
          .from("clasificador_tokens")
          .update({ credits: (job.new_credits ?? 0) + 1 })
          .eq("token", job.token)

        // Clean up temp files from storage
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

    await step.run("analyze", async () => {
      const apiKey = process.env.GEMINI_API_KEY
      if (!apiKey) throw new Error("GEMINI_API_KEY not set")

      const supabase = createServerClient()

      // Load job record
      const { data: job, error: jobErr } = await supabase
        .from("clasificador_jobs")
        .select("*")
        .eq("id", jobId)
        .single()

      if (jobErr || !job) throw new Error(`Job ${jobId} not found`)

      const fileMeta: FileMeta[] = job.file_meta ?? []
      const allFileNames: string[] = job.all_file_names ?? []

      // ── Step 2: "Leyendo cada documento con IA"
      //   Download files from storage + call Gemini ────────────────────────────
      await supabase
        .from("clasificador_jobs")
        .update({ status: "processing", step: 2, updated_at: new Date().toISOString() })
        .eq("id", jobId)

      const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
        { text: buildGeminiPrompt(job.nombre ?? "") },
      ]

      for (const meta of fileMeta) {
        const { data: blob, error: dlErr } = await supabase.storage
          .from("clasificador-temp")
          .download(meta.storageKey)

        if (dlErr || !blob) throw new Error(`Failed to download ${meta.storageKey}: ${dlErr?.message}`)

        const buf = Buffer.from(await blob.arrayBuffer())
        parts.push({ text: `FILE_INDEX:${meta.originalIndex}` })
        parts.push({ inlineData: { mimeType: meta.mimeType, data: buf.toString("base64") } })
      }

      const ai = new GoogleGenAI({ apiKey })
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts }],
        config: {
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      })
      const rawText = response.text ?? ""

      // ── Step 3: "Clasificando meses y valor probatorio"
      //   Parse + enrich Gemini results ────────────────────────────────────────
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

      const enriched = enrichGeminiResults(parsed, job.nombre ?? "", allFileNames)

      // ── Step 4: "Generando resultado del expediente"
      //   Save result + cleanup storage ────────────────────────────────────────
      await supabase
        .from("clasificador_jobs")
        .update({ step: 4, updated_at: new Date().toISOString() })
        .eq("id", jobId)

      await supabase
        .from("clasificador_jobs")
        .update({
          status: "done",
          step: 5,
          result: enriched,
          credits_remaining: job.new_credits,
          updated_at: new Date().toISOString(),
        })
        .eq("id", jobId)

      // Delete temp files from storage (non-fatal)
      const paths = fileMeta.map((m) => m.storageKey)
      if (paths.length > 0) {
        await supabase.storage.from("clasificador-temp").remove(paths)
      }
    })
  }
)

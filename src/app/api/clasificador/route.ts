import { NextRequest, NextResponse } from "next/server"
import { createHash } from "crypto"
import { createServerClient } from "@/lib/supabase"
import { inngest } from "@/inngest/client"
import { getMimeType, isValidEmail, normalizeEmail, isSamePerson } from "@/lib/clasificador-utils"
import type { FileMeta } from "@/inngest/functions/clasificador"

// ─── Server-side limits (mirrors client-side UI limits) ──────────────────────
const MAX_FILES_SERVER  = 30
const MAX_FILE_BYTES    = 10 * 1024 * 1024   // 10 MB per file
const MAX_TOTAL_BYTES   = 50 * 1024 * 1024   // 50 MB total
const ALLOWED_MIMES     = new Set(["application/pdf", "image/jpeg", "image/png"])

// ─── IP rate limit: max freemium token creations per IP per hour ──────────────
// Requires table: clasificador_rate_limits(ip text, created_at timestamptz default now())
// Run in Supabase SQL editor:
//   create table if not exists clasificador_rate_limits (
//     ip text not null, created_at timestamptz not null default now()
//   );
//   create index if not exists idx_rl_ip_time
//     on clasificador_rate_limits (ip, created_at);
const RATE_LIMIT_MAX    = 5    // max freemium analyses per IP
const RATE_LIMIT_WINDOW = 3600 // seconds (1 hour)

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  )
}

// POST /api/clasificador
// Validates token, uploads files to Supabase Storage, creates job record, triggers Inngest.
// Returns { jobId, creditsRemaining, autoIssuedToken? } immediately.
export async function POST(req: NextRequest) {
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: "Error al leer los datos del formulario." }, { status: 400 })
  }

  const nombre          = (formData.get("nombre")          as string | null)?.trim() ?? ""
  let   token           = (formData.get("token")           as string | null)?.trim() ?? ""
  const email           = (formData.get("email")           as string | null)?.trim() || null
  const telefono        = (formData.get("telefono")        as string | null)?.trim() || null
  const mesPresentation = (formData.get("mesPresentation") as string | null)?.trim() ?? ""

  const supabase = createServerClient()
  let autoIssuedToken: string | null = null

  // ── Credit validation ─────────────────────────────────────────────────────
  if (!token) {
    if (!nombre) {
      return NextResponse.json({ error: "PAYMENT_REQUIRED", creditsRemaining: 0 }, { status: 402 })
    }

    // Email is required for freemium — without it we can't deduplicate across sessions
    if (!email) {
      return NextResponse.json(
        { error: "PAYMENT_REQUIRED", creditsRemaining: 0, reason: "email_required" },
        { status: 402 }
      )
    }

    // Reject obviously fake email formats
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "PAYMENT_REQUIRED", creditsRemaining: 0, reason: "email_invalid" },
        { status: 402 }
      )
    }

    const normalizedEmail = normalizeEmail(email)
    let existing: { token: string; credits: number } | null = null

    // 1. Exact email match
    const { data: byEmail } = await supabase
      .from("clasificador_tokens")
      .select("token, credits")
      .eq("email", normalizedEmail)
      .eq("is_freemium", true)
      .maybeSingle()
    if (byEmail) existing = byEmail

    // 2. Exact name match (case-insensitive)
    if (!existing) {
      const { data: byName } = await supabase
        .from("clasificador_tokens")
        .select("token, credits")
        .ilike("nombre", nombre)
        .eq("is_freemium", true)
        .maybeSingle()
      if (byName) existing = byName
    }

    // 3. Fuzzy name match — catches "JHONNY" vs "JHONY" with a different email
    if (!existing) {
      const { data: allFreemium } = await supabase
        .from("clasificador_tokens")
        .select("token, credits, nombre")
        .eq("is_freemium", true)
      if (allFreemium) {
        const match = allFreemium.find(
          (row) => row.nombre && isSamePerson(nombre, row.nombre)
        )
        if (match) existing = match
      }
    }

    if (existing) {
      if ((existing.credits ?? 0) <= 0) {
        return NextResponse.json(
          { error: "PAYMENT_REQUIRED", creditsRemaining: 0, reason: "freemium_exhausted" },
          { status: 402 }
        )
      }
      token = existing.token
    } else {
      // ── IP rate limit: block abusive freemium signups ────────────────────────
      const ip = getClientIp(req)
      if (ip !== "unknown") {
        try {
          const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW * 1000).toISOString()
          const { count } = await supabase
            .from("clasificador_rate_limits")
            .select("*", { count: "exact", head: true })
            .eq("ip", ip)
            .gte("created_at", windowStart)

          if ((count ?? 0) >= RATE_LIMIT_MAX) {
            return NextResponse.json(
              { error: "PAYMENT_REQUIRED", creditsRemaining: 0, reason: "rate_limited" },
              { status: 429 }
            )
          }

          // Record this attempt (non-fatal if table missing)
          await supabase.from("clasificador_rate_limits").insert({ ip })
        } catch {
          // Table not yet created — skip rate limit gracefully
        }
      }

      const newTok = crypto.randomUUID()
      const { error: insertError } = await supabase.from("clasificador_tokens").insert({
        token:       newTok,
        nombre,
        email:       normalizedEmail,
        telefono,
        credits:     1,
        is_freemium: true,
        expires_at:  new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      })
      if (insertError) {
        console.error("[freemium] insert error:", insertError)
        return NextResponse.json({ error: "PAYMENT_REQUIRED", creditsRemaining: 0 }, { status: 402 })
      }
      token = newTok
      autoIssuedToken = newTok
    }
  }

  // Validate credit exists — do NOT deduct yet.
  // Deduction happens only on successful Inngest completion (inside the function).
  // For auto-issued freemium tokens we just inserted credits:1, so they always pass.
  if (!autoIssuedToken) {
    const { data: tokenRow } = await supabase
      .from("clasificador_tokens")
      .select("credits")
      .eq("token", token)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle()

    if (!tokenRow || tokenRow.credits <= 0) {
      return NextResponse.json({ error: "PAYMENT_REQUIRED", creditsRemaining: 0 }, { status: 402 })
    }
  }

  // ── Validate files (server-side — mirrors client limits, cannot be bypassed) ─
  const fileEntries = formData.getAll("files") as File[]
  if (!fileEntries || fileEntries.length === 0) {
    return NextResponse.json({ error: "No se recibieron archivos." }, { status: 400 })
  }
  if (fileEntries.length > MAX_FILES_SERVER) {
    return NextResponse.json(
      { error: `Máximo ${MAX_FILES_SERVER} archivos por análisis.` },
      { status: 400 }
    )
  }

  let totalBytes = 0
  for (const file of fileEntries) {
    const mime = file.type || getMimeType(file.name)
    if (!ALLOWED_MIMES.has(mime)) {
      return NextResponse.json(
        { error: `Tipo de archivo no permitido: ${file.name}. Solo PDF, JPG y PNG.` },
        { status: 400 }
      )
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: `El archivo «${file.name}» supera el límite de 10 MB.` },
        { status: 400 }
      )
    }
    totalBytes += file.size
  }
  if (totalBytes > MAX_TOTAL_BYTES) {
    return NextResponse.json(
      { error: "El total de archivos supera 50 MB." },
      { status: 400 }
    )
  }

  // ── Deduplicate by content hash, upload unique files to Supabase Storage ──
  const jobId = crypto.randomUUID()
  const seen = new Set<string>()
  const fileMeta: FileMeta[] = []
  const allFileNames: string[] = fileEntries.map((f) => f.name)

  for (let i = 0; i < fileEntries.length; i++) {
    const file = fileEntries[i]
    const buf  = Buffer.from(await file.arrayBuffer())
    const hash = createHash("sha256").update(buf).digest("hex")

    if (!seen.has(hash)) {
      seen.add(hash)
      const safeName = file.name
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")  // quitar tildes
        .replace(/[^a-zA-Z0-9._-]/g, "_")                  // espacios y especiales → _
      const storageKey = `jobs/${jobId}/${i}-${safeName}`
      const { error: uploadErr } = await supabase.storage
        .from("clasificador-temp")
        .upload(storageKey, buf, {
          contentType: getMimeType(file.name),
          upsert: false,
        })

      if (uploadErr) {
        console.error("[upload] failed:", uploadErr)
        // No refund needed — credit was never deducted
        return NextResponse.json(
          { error: "Error al subir archivos. Inténtalo de nuevo." },
          { status: 500 }
        )
      }

      fileMeta.push({
        storageKey,
        originalName: file.name,
        mimeType: getMimeType(file.name),
        originalIndex: i,
      })
    }
  }

  // ── Create job record ─────────────────────────────────────────────────────
  const { error: jobInsertErr } = await supabase.from("clasificador_jobs").insert({
    id:               jobId,
    status:           "pending",
    step:             1,
    token,
    nombre,
    email,
    telefono,
    mes_presentation: mesPresentation,
    auto_issued_token: autoIssuedToken,
    file_meta:        fileMeta,
    all_file_names:   allFileNames,
    // new_credits is intentionally null — set by Inngest only on successful completion
  })

  if (jobInsertErr) {
    console.error("[job] insert error:", jobInsertErr)
    // No refund needed — credit was never deducted. Just clean up storage.
    await supabase.storage.from("clasificador-temp").remove(fileMeta.map((m) => m.storageKey))
    return NextResponse.json({ error: "Error interno. Inténtalo de nuevo." }, { status: 500 })
  }

  // ── Trigger Inngest ───────────────────────────────────────────────────────
  await inngest.send({ name: "clasificador/analyze", data: { jobId } })

  return NextResponse.json({
    jobId,
    ...(autoIssuedToken ? { autoIssuedToken } : {}),
  })
}

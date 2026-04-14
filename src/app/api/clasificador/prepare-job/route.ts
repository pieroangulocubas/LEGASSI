import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { isValidEmail, normalizeEmail, isSamePerson } from "@/lib/clasificador-utils"

// ─── Limits (same as before — validated here without needing file bytes) ─────
const MAX_FILES_SERVER = 30
const MAX_FILE_BYTES   = 10 * 1024 * 1024  // 10 MB per file
const MAX_TOTAL_BYTES  = 50 * 1024 * 1024  // 50 MB total
const ALLOWED_MIMES    = new Set(["application/pdf", "image/jpeg", "image/png"])

const RATE_LIMIT_MAX    = 5
const RATE_LIMIT_WINDOW = 3600 // seconds

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  )
}

interface FileMeta {
  storageKey:    string
  originalName:  string
  mimeType:      string
  originalIndex: number
}

// POST /api/clasificador/prepare-job
// Validates token + file metadata, creates job record, returns Supabase signed
// upload URLs so the client can upload files directly (bypassing Vercel's 4.5 MB limit).
// No file bytes are sent to this endpoint.
export async function POST(req: NextRequest) {
  let body: {
    nombre?: string
    email?: string
    telefono?: string
    mesPresentation?: string
    token?: string
    files?: Array<{ name: string; size: number; mimeType: string }>
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Petición no válida." }, { status: 400 })
  }

  const nombre          = (body.nombre ?? "").trim()
  let   token           = (body.token  ?? "").trim()
  const email           = body.email?.trim()   || null
  const telefono        = body.telefono?.trim() || null
  const mesPresentation = (body.mesPresentation ?? "").trim()
  const filesMeta       = body.files ?? []

  const supabase = createServerClient()
  let autoIssuedToken: string | null = null

  // ── Credit validation (same logic as before) ─────────────────────────────
  if (!token) {
    if (!nombre) {
      return NextResponse.json({ error: "PAYMENT_REQUIRED", creditsRemaining: 0 }, { status: 402 })
    }
    if (!email) {
      return NextResponse.json(
        { error: "PAYMENT_REQUIRED", creditsRemaining: 0, reason: "email_required" },
        { status: 402 }
      )
    }
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "PAYMENT_REQUIRED", creditsRemaining: 0, reason: "email_invalid" },
        { status: 402 }
      )
    }

    const normalizedEmail = normalizeEmail(email)
    let existing: { token: string; credits: number } | null = null

    const { data: byEmail } = await supabase
      .from("clasificador_tokens")
      .select("token, credits")
      .eq("email", normalizedEmail)
      .eq("is_freemium", true)
      .maybeSingle()
    if (byEmail) existing = byEmail

    if (!existing) {
      const { data: byName } = await supabase
        .from("clasificador_tokens")
        .select("token, credits")
        .ilike("nombre", nombre)
        .eq("is_freemium", true)
        .maybeSingle()
      if (byName) existing = byName
    }

    if (!existing) {
      const { data: allFreemium } = await supabase
        .from("clasificador_tokens")
        .select("token, credits, nombre")
        .eq("is_freemium", true)
      if (allFreemium) {
        const match = allFreemium.find((row) => row.nombre && isSamePerson(nombre, row.nombre))
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
          await supabase.from("clasificador_rate_limits").insert({ ip })
        } catch { /* table missing — skip gracefully */ }
      }

      const newTok = crypto.randomUUID()
      const { error: insertError } = await supabase.from("clasificador_tokens").insert({
        token:       newTok,
        nombre,
        email:       normalizeEmail(email),
        telefono,
        credits:     1,
        is_freemium: true,
        expires_at:  new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      })
      if (insertError) {
        return NextResponse.json({ error: "PAYMENT_REQUIRED", creditsRemaining: 0 }, { status: 402 })
      }
      token = newTok
      autoIssuedToken = newTok
    }
  }

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

  // ── Validate file metadata (no bytes needed) ──────────────────────────────
  if (filesMeta.length === 0) {
    return NextResponse.json({ error: "No se recibieron archivos." }, { status: 400 })
  }
  if (filesMeta.length > MAX_FILES_SERVER) {
    return NextResponse.json(
      { error: `Máximo ${MAX_FILES_SERVER} archivos por análisis.` },
      { status: 400 }
    )
  }

  let totalBytes = 0
  for (const f of filesMeta) {
    if (!ALLOWED_MIMES.has(f.mimeType)) {
      return NextResponse.json(
        { error: `Tipo de archivo no permitido: ${f.name}. Solo PDF, JPG y PNG.` },
        { status: 400 }
      )
    }
    if (f.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: `El archivo «${f.name}» supera el límite de 10 MB.` },
        { status: 400 }
      )
    }
    totalBytes += f.size
  }
  if (totalBytes > MAX_TOTAL_BYTES) {
    return NextResponse.json(
      { error: "El total de archivos supera 50 MB." },
      { status: 400 }
    )
  }

  // ── Create job + signed upload URLs ──────────────────────────────────────
  const jobId       = crypto.randomUUID()
  const allFileNames = filesMeta.map((f) => f.name)

  // Assign storage keys upfront — one per file (no dedup by content hash since
  // we never receive file bytes here; client uploads directly to Supabase).
  const fileMeta: FileMeta[] = filesMeta.map((f, i) => {
    const safeName = f.name
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]/g, "_")
    return {
      storageKey:    `jobs/${jobId}/${i}-${safeName}`,
      originalName:  f.name,
      mimeType:      f.mimeType,
      originalIndex: i,
    }
  })

  // Generate signed upload URLs (client will PUT directly to Supabase)
  const uploadSlots: Array<{ index: number; storageKey: string; signedUrl: string }> = []
  for (let i = 0; i < fileMeta.length; i++) {
    const { data, error } = await supabase.storage
      .from("clasificador-temp")
      .createSignedUploadUrl(fileMeta[i].storageKey)

    if (error || !data?.signedUrl) {
      return NextResponse.json(
        { error: "No se pudieron preparar los archivos. Inténtalo de nuevo." },
        { status: 500 }
      )
    }
    uploadSlots.push({ index: i, storageKey: fileMeta[i].storageKey, signedUrl: data.signedUrl })
  }

  // Create job record (status: "pending" — Inngest triggered separately after upload)
  const { error: jobInsertErr } = await supabase.from("clasificador_jobs").insert({
    id:                jobId,
    status:            "pending",
    step:              1,
    token,
    nombre,
    email,
    telefono,
    mes_presentation:  mesPresentation,
    auto_issued_token: autoIssuedToken,
    file_meta:         fileMeta,
    all_file_names:    allFileNames,
  })

  if (jobInsertErr) {
    console.error("[prepare-job] insert error:", jobInsertErr)
    return NextResponse.json({ error: "Error interno. Inténtalo de nuevo." }, { status: 500 })
  }

  return NextResponse.json({
    jobId,
    uploadSlots,
    ...(autoIssuedToken ? { autoIssuedToken } : {}),
  })
}

import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb, PageSizes } from "pdf-lib"
import QRCode from "qrcode"
import type { AnalysisResult, DocumentResult, MonthCoverage } from "./types"

// ─── Text safety ──────────────────────────────────────────────────────────────
// pdf-lib standard fonts use WinAnsi — keep Latin-1 range, strip the rest
function safe(text: string): string {
  return (text ?? "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2026/g, "...")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, "?")
}

// ─── Text wrapping ────────────────────────────────────────────────────────────
// Splits text into lines that fit within maxWidth. Never truncates — all words
// appear on some line. Single words wider than maxWidth are character-broken.
function wrapText(text: string, font: PDFFont, maxWidth: number, size: number): string[] {
  const input = safe(text)
  if (!input.trim()) return [""]

  const words = input.split(" ")
  const lines: string[] = []
  let current = ""

  for (const word of words) {
    if (!word) continue
    const test = current ? `${current} ${word}` : word
    if (font.widthOfTextAtSize(test, size) <= maxWidth) {
      current = test
    } else {
      if (current) lines.push(current)
      if (font.widthOfTextAtSize(word, size) > maxWidth) {
        // Force-break a single oversized word character by character
        let part = ""
        for (const ch of word) {
          if (font.widthOfTextAtSize(part + ch, size) <= maxWidth) {
            part += ch
          } else {
            if (part) lines.push(part)
            part = ch
          }
        }
        current = part
      } else {
        current = word
      }
    }
  }
  if (current) lines.push(current)
  return lines.length ? lines : [""]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayLabel(): string {
  return new Date().toLocaleDateString("es-ES", {
    day: "numeric", month: "long", year: "numeric",
  })
}

// Detect file format from magic bytes
function detectImageType(bytes: Uint8Array): "png" | "jpg" | "pdf" | "unknown" {
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "png"
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg"
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) return "pdf"
  return "unknown"
}

// Extract extension from original filename (lowercase, with dot)
function getExt(filename: string): string {
  const idx = filename.lastIndexOf(".")
  return idx >= 0 ? filename.slice(idx).toLowerCase() : ".pdf"
}

// Build a human-readable file label from nombre_sugerido + original extension
function buildFileLabel(doc: DocumentResult): string {
  const ext = getExt(doc.originalName)
  return safe(`${doc.nombre_sugerido}${ext}`)
}

// Generate QR code PNG bytes (browser context)
async function generateQRBytes(url: string): Promise<Uint8Array | null> {
  try {
    const dataUrl: string = await QRCode.toDataURL(url, {
      width: 160, margin: 1,
      color: { dark: "#1a1a2e", light: "#ffffff" },
    })
    const base64 = dataUrl.split(",")[1]
    return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
  } catch (err) {
    console.error("[pdf-utils] generateQRBytes failed:", err)
    return null
  }
}

// Fetch the logo PNG from the public folder (browser context)
async function fetchLogo(): Promise<Uint8Array | null> {
  try {
    const res = await fetch("/legassi_despacho_online.png")
    if (!res.ok) return null
    const buf = await res.arrayBuffer()
    return new Uint8Array(buf)
  } catch { return null }
}

// ─── Cover page ───────────────────────────────────────────────────────────────
async function addCoverPage(
  doc: PDFDocument,
  nombre: string,
  logoBytes: Uint8Array | null,
  qrBytes: Uint8Array | null,
) {
  const page = doc.addPage(PageSizes.A4)
  const { width, height } = page.getSize()
  const margin = 64

  const timesRomanBold = await doc.embedFont(StandardFonts.TimesRomanBold)
  const timesRoman     = await doc.embedFont(StandardFonts.TimesRoman)
  const helveticaBold  = await doc.embedFont(StandardFonts.HelveticaBold)
  const helvetica      = await doc.embedFont(StandardFonts.Helvetica)

  // ── Logo ──
  const logoAreaH = 90
  const logoMaxW = 200
  const logoMaxH = 72
  if (logoBytes) {
    try {
      const logoImg = await doc.embedPng(logoBytes)
      const { width: lW, height: lH } = logoImg.size()
      const scale = Math.min(logoMaxW / lW, logoMaxH / lH)
      const dW = lW * scale
      const dH = lH * scale
      page.drawImage(logoImg, { x: (width - dW) / 2, y: height - margin - dH, width: dW, height: dH })
    } catch {
      const txt = "LEGASSI"
      page.drawText(txt, {
        x: (width - helveticaBold.widthOfTextAtSize(txt, 22)) / 2,
        y: height - margin - 28, size: 22, font: helveticaBold, color: rgb(0.72, 0.58, 0.12),
      })
    }
  } else {
    const txt = "LEGASSI"
    page.drawText(txt, {
      x: (width - helveticaBold.widthOfTextAtSize(txt, 22)) / 2,
      y: height - margin - 28, size: 22, font: helveticaBold, color: rgb(0.72, 0.58, 0.12),
    })
  }

  // ── Rule below logo ──
  page.drawLine({
    start: { x: margin, y: height - margin - logoAreaH - 6 },
    end:   { x: width - margin, y: height - margin - logoAreaH - 6 },
    thickness: 0.5, color: rgb(0.78, 0.71, 0.42),
  })

  // ── Title block ──
  const titleY    = height - margin - logoAreaH - 90
  const titleSize = 24
  const line1     = safe("Documentacion acreditativa")
  const line2     = safe("de permanencia ininterrumpida")
  page.drawText(line1, {
    x: (width - timesRomanBold.widthOfTextAtSize(line1, titleSize)) / 2,
    y: titleY, size: titleSize, font: timesRomanBold, color: rgb(0.1, 0.1, 0.1),
  })
  page.drawText(line2, {
    x: (width - timesRomanBold.widthOfTextAtSize(line2, titleSize)) / 2,
    y: titleY - 32, size: titleSize, font: timesRomanBold, color: rgb(0.1, 0.1, 0.1),
  })
  const sub  = safe("de los 5 meses anteriores a la solicitud")
  const subW = timesRoman.widthOfTextAtSize(sub, 12)
  page.drawText(sub, {
    x: (width - subW) / 2, y: titleY - 60, size: 12, font: timesRoman, color: rgb(0.45, 0.45, 0.45),
  })

  // ── Central divider ──
  const divY = height / 2 + 20
  page.drawLine({
    start: { x: margin, y: divY }, end: { x: width - margin, y: divY },
    thickness: 0.75, color: rgb(0.82, 0.82, 0.82),
  })

  // ── Applicant ──
  page.drawText("Solicitante", { x: margin, y: divY - 36, size: 8, font: helvetica, color: rgb(0.55, 0.55, 0.55) })
  page.drawText(safe(nombre),  { x: margin, y: divY - 52, size: 15, font: helveticaBold, color: rgb(0.1, 0.1, 0.1) })
  page.drawText(safe(`Generado el ${todayLabel()}`), {
    x: margin, y: divY - 76, size: 9, font: helvetica, color: rgb(0.55, 0.55, 0.55),
  })

  // ── QR ──
  if (qrBytes) {
    try {
      const qrImg  = await doc.embedPng(qrBytes)
      const qrSize = 90
      const qrX    = width - margin - qrSize
      const qrY    = margin + 32
      page.drawImage(qrImg, { x: qrX, y: qrY, width: qrSize, height: qrSize })
      const qrCaption = safe("Escanea para ver el expediente digital")
      page.drawText(qrCaption, {
        x: qrX - helvetica.widthOfTextAtSize(qrCaption, 7) + qrSize,
        y: qrY - 10, size: 7, font: helvetica, color: rgb(0.55, 0.55, 0.55),
      })
    } catch { /* skip */ }
  }

  // ── Footer ──
  page.drawLine({
    start: { x: margin, y: margin + 22 }, end: { x: width - margin, y: margin + 22 },
    thickness: 0.3, color: rgb(0.85, 0.85, 0.85),
  })
  page.drawText(
    safe("Documento generado automaticamente con fines de organizacion. No tiene valor juridico por si mismo."),
    { x: margin, y: margin + 8, size: 7, font: helvetica, color: rgb(0.72, 0.72, 0.72), maxWidth: width - margin * 2 },
  )
}

// ─── Document ordering ────────────────────────────────────────────────────────

const STRENGTH_ORDER: Record<string, number> = { fuerte: 0, media: 1, débil: 2 }

function getDocKey(doc: DocumentResult): string {
  return doc.pageRange && doc.pageRange.length > 0
    ? `${doc.fileIndex}_p${doc.pageRange[0]}`
    : `${doc.fileIndex}`
}

function getUniqueDocsOrdered(
  months: MonthCoverage[],
): Array<{ docResult: DocumentResult; coveredMonths: MonthCoverage[] }> {
  const docToMonths = new Map<string, MonthCoverage[]>()
  const docByKey    = new Map<string, DocumentResult>()

  for (const month of months) {
    for (const d of month.docs) {
      const key = getDocKey(d)
      if (!docToMonths.has(key)) { docToMonths.set(key, []); docByKey.set(key, d) }
      docToMonths.get(key)!.push(month)
    }
  }

  return [...docToMonths.entries()]
    .sort(([kA, mA], [kB, mB]) => {
      const firstA = mA[0]?.yearMonth ?? ""
      const firstB = mB[0]?.yearMonth ?? ""
      if (firstA !== firstB) return firstA.localeCompare(firstB)
      const dA = docByKey.get(kA)!
      const dB = docByKey.get(kB)!
      return (STRENGTH_ORDER[dA.fuerza] ?? 3) - (STRENGTH_ORDER[dB.fuerza] ?? 3)
    })
    .map(([key, coveredMonths]) => ({ docResult: docByKey.get(key)!, coveredMonths }))
}

// ─── Coverage index page(s) ───────────────────────────────────────────────────
// Page 2+: month-by-month status table, then full document list.
// Overflows to additional pages as needed.

async function addCoverageIndexPages(
  doc: PDFDocument,
  result: AnalysisResult,
  uniqueDocs: Array<{ docResult: DocumentResult; coveredMonths: MonthCoverage[] }>,
) {
  const { width } = { width: PageSizes.A4[0] }
  const margin    = 64
  const colW      = width - margin * 2  // 467 pts

  const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold)
  const helvetica     = await doc.embedFont(StandardFonts.Helvetica)

  // ── Helper: start a new page and return cursor Y ──
  function newPage(): { page: PDFPage; y: number } {
    const p = doc.addPage(PageSizes.A4)
    return { page: p, y: PageSizes.A4[1] - margin }
  }

  let { page, y } = newPage()

  // ── Section title helper ──
  function sectionTitle(text: string) {
    page.drawText(safe(text), {
      x: margin, y, size: 18, font: helveticaBold, color: rgb(0.08, 0.08, 0.08),
    })
    y -= 10
    page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.5, color: rgb(0.78, 0.71, 0.42) })
    y -= 20
  }

  // ═══════════════════════════════════════════════════════
  // SECTION A — Month status table
  // ═══════════════════════════════════════════════════════
  sectionTitle("Indice de cobertura")

  const STATUS_CFG: Record<string, { label: string; r: number; g: number; b: number }> = {
    CUBIERTO: { label: "Cubierto",        r: 0.18, g: 0.60, b: 0.30 },
    DÉBIL:    { label: "Cobertura debil", r: 0.80, g: 0.50, b: 0.10 },
    VACÍO:    { label: "Sin documentos",  r: 0.75, g: 0.18, b: 0.18 },
  }

  // Column starts
  const cMes    = margin               // 64
  const cEstado = margin + 112         // 176
  const cDocs   = margin + 222         // 286
  const docsColW = width - cDocs - margin  // 245 pts

  // Column headers
  page.drawText("MES",          { x: cMes,    y, size: 7, font: helveticaBold, color: rgb(0.55, 0.55, 0.55) })
  page.drawText("ESTADO",       { x: cEstado, y, size: 7, font: helveticaBold, color: rgb(0.55, 0.55, 0.55) })
  page.drawText("DOCUMENTOS",   { x: cDocs,   y, size: 7, font: helveticaBold, color: rgb(0.55, 0.55, 0.55) })
  y -= 5
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.25, color: rgb(0.85, 0.85, 0.85) })
  y -= 14

  for (const month of result.months) {
    const st       = STATUS_CFG[month.status] ?? STATUS_CFG["VACÍO"]
    const docNames = month.docs.map((d) => d.descripcion_breve).join("  ·  ")
    const docsText = docNames || "—"
    const docsLines = wrapText(docsText, helvetica, docsColW, 7.5)
    const rowH  = Math.max(docsLines.length * 10.5, 12)

    page.drawText(safe(month.label),  { x: cMes,    y, size: 8.5, font: helveticaBold, color: rgb(0.1, 0.1, 0.1) })
    page.drawText(safe(st.label),     { x: cEstado, y, size: 7.5, font: helvetica,     color: rgb(st.r, st.g, st.b) })

    // Draw each wrapped line of docs column
    docsLines.forEach((line, li) => {
      page.drawText(line, { x: cDocs, y: y - li * 10.5, size: 7.5, font: helvetica, color: rgb(0.35, 0.35, 0.35) })
    })

    y -= rowH + 4
    page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.15, color: rgb(0.93, 0.93, 0.93) })
    y -= 8
  }

  // ═══════════════════════════════════════════════════════
  // SECTION B — Document list
  // ═══════════════════════════════════════════════════════
  y -= 16
  if (y < margin + 80) { ;({ page, y } = newPage()) }

  page.drawText(
    safe(`Documentos del expediente (${uniqueDocs.length} ${uniqueDocs.length === 1 ? "archivo" : "archivos"})`),
    { x: margin, y, size: 11, font: helveticaBold, color: rgb(0.08, 0.08, 0.08) },
  )
  y -= 7
  page.drawText(
    safe("Los documentos que acreditan varios meses aparecen una sola vez en el expediente."),
    { x: margin, y, size: 7.5, font: helvetica, color: rgb(0.55, 0.55, 0.55) },
  )
  y -= 6
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.5, color: rgb(0.78, 0.71, 0.42) })
  y -= 18

  // ── Stacked document cards ──
  // Layout per card:
  //   [N]  descripcion_breve   (bold 9pt, full width wrapping)
  //        Archivo: nombre_sugerido.ext  (7.5pt grey)
  //        Meses: label  (7.5pt, muted)
  //   ─ separator ─

  const numCol      = margin           // number glyph
  const textCol     = margin + 22      // card content starts here
  const textColW    = colW - 22        // 445 pts — plenty of room

  for (let i = 0; i < uniqueDocs.length; i++) {
    const { docResult: d, coveredMonths } = uniqueDocs[i]

    const descLines    = wrapText(d.descripcion_breve, helveticaBold, textColW, 9)
    const descH        = descLines.length * 12.5
    const fileLabel    = buildFileLabel(d)
    const monthsLabel  = coveredMonths.length === 1
      ? coveredMonths[0].label
      : coveredMonths.length === 2
        ? `${coveredMonths[0].label}  ·  ${coveredMonths[1].label}`
        : `${coveredMonths[0].label} - ${coveredMonths[coveredMonths.length - 1].label} (${coveredMonths.length} meses)`

    const cardH = descH + 12 + 12 + 14  // desc + file line + month line + gap

    // Overflow to new page
    if (y - cardH < margin + 20) {
      ;({ page, y } = newPage())
    }

    // Number
    page.drawText(`${i + 1}.`, {
      x: numCol, y, size: 8.5, font: helveticaBold, color: rgb(0.55, 0.55, 0.55),
    })

    // Description (wrapping)
    descLines.forEach((line, li) => {
      page.drawText(line, { x: textCol, y: y - li * 12.5, size: 9, font: helveticaBold, color: rgb(0.10, 0.10, 0.10) })
    })
    const afterDesc = y - descH

    // Suggested filename
    page.drawText(safe(`Archivo: ${fileLabel}`), {
      x: textCol, y: afterDesc, size: 7.5, font: helvetica, color: rgb(0.42, 0.42, 0.42),
    })

    // Months covered
    page.drawText(safe(`Meses: ${monthsLabel}`), {
      x: textCol, y: afterDesc - 11, size: 7.5, font: helvetica, color: rgb(0.35, 0.35, 0.55),
    })

    // Strength badge inline
    const fuerzaColor: Record<string, [number, number, number]> = {
      fuerte: [0.12, 0.55, 0.28],
      media:  [0.70, 0.45, 0.05],
      débil:  [0.62, 0.22, 0.22],
    }
    const fc = fuerzaColor[d.fuerza] ?? [0.5, 0.5, 0.5]
    const fuerzaLabel = `Valor: ${d.fuerza}`
    const fuerzaW     = helvetica.widthOfTextAtSize(fuerzaLabel, 7)
    page.drawText(safe(fuerzaLabel), {
      x: textCol + textColW - fuerzaW, y: afterDesc - 11,
      size: 7, font: helvetica, color: rgb(...fc),
    })

    y = afterDesc - 11 - 12  // move cursor below card content

    page.drawLine({
      start: { x: margin, y }, end: { x: width - margin, y },
      thickness: 0.2, color: rgb(0.90, 0.90, 0.90),
    })
    y -= 10
  }
}

// ─── Embed image file ─────────────────────────────────────────────────────────
async function embedImageFile(doc: PDFDocument, bytes: Uint8Array, fileName: string): Promise<void> {
  const fmt = detectImageType(bytes)
  let image
  try {
    image = fmt === "png" ? await doc.embedPng(bytes) : await doc.embedJpg(bytes)
  } catch {
    // Unreadable image — add a placeholder page instead of crashing the whole PDF
    const page      = doc.addPage(PageSizes.A4)
    const helvetica = await doc.embedFont(StandardFonts.Helvetica)
    page.drawText(safe(`No se pudo incrustar la imagen: ${fileName}`), {
      x: 72, y: PageSizes.A4[1] / 2, size: 11, font: helvetica, color: rgb(0.7, 0.3, 0.3),
    })
    return
  }

  const { width: imgW, height: imgH } = image.size()
  const [pageW, pageH] = PageSizes.A4
  const marg = 36
  const scale = Math.min((pageW - marg * 2) / imgW, (pageH - marg * 2) / imgH, 1)

  const page = doc.addPage(PageSizes.A4)
  page.drawImage(image, {
    x: (pageW - imgW * scale) / 2,
    y: (pageH - imgH * scale) / 2,
    width:  imgW * scale,
    height: imgH * scale,
  })
}

// ─── pdfjs-dist fallback: render pages to canvas → embed as PNG ──────────────
// Used when pdf-lib can't traverse the page tree (non-standard XRef, broken refs).
// pdfjs is the same engine Chrome uses — handles any displayable PDF.
async function embedPdfViaCanvas(
  doc: PDFDocument,
  bytes: Uint8Array,
  pageRange?: number[] | null,
): Promise<boolean> {
  try {
    const pdfjs = await import("pdfjs-dist")
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url,
    ).href

    const loadingTask = pdfjs.getDocument({ data: bytes })
    const pdfDoc      = await loadingTask.promise
    const total       = pdfDoc.numPages

    // 1-based page numbers to embed
    const pages = pageRange && pageRange.length > 0
      ? pageRange.map((p) => Math.min(Math.max(p, 1), total))
      : Array.from({ length: total }, (_, i) => i + 1)

    for (const pageNum of pages) {
      const page     = await pdfDoc.getPage(pageNum)
      const viewport = page.getViewport({ scale: 2.0 }) // 2× for quality

      const canvas    = document.createElement("canvas")
      canvas.width    = viewport.width
      canvas.height   = viewport.height
      const ctx       = canvas.getContext("2d")!

      await page.render({ canvasContext: ctx, viewport, canvas }).promise

      // Embed the canvas as a PNG page in the destination PDF
      const dataUrl  = canvas.toDataURL("image/png")
      const base64   = dataUrl.split(",")[1]
      const pngBytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))

      const img     = await doc.embedPng(pngBytes)
      // Scale back to 1× (we rendered at 2× for sharpness)
      const [w, h]  = [viewport.width / 2, viewport.height / 2]
      const pdfPage = doc.addPage([w, h])
      pdfPage.drawImage(img, { x: 0, y: 0, width: w, height: h })
    }

    return true
  } catch (err) {
    console.error("[pdf-utils] pdfjs fallback failed:", err)
    return false
  }
}

// ─── Embed PDF file ───────────────────────────────────────────────────────────
// pageRange: 1-based page numbers to embed; null/empty = embed all pages
//
// Strategy:
//   Pass 1 — pdf-lib fast path (standards-compliant PDFs).
//   Pass 2 — pdfjs-dist fallback (any PDF the browser can display — handles
//             broken XRef tables, object streams, encrypted government PDFs, etc.)
async function embedPdfFile(doc: PDFDocument, bytes: Uint8Array, fileName: string, pageRange?: number[] | null): Promise<void> {
  async function placeholder(label: string) {
    const page      = doc.addPage(PageSizes.A4)
    const helvetica = await doc.embedFont(StandardFonts.Helvetica)
    page.drawText(safe(label), { x: 72, y: PageSizes.A4[1] / 2, size: 11, font: helvetica, color: rgb(0.7, 0.3, 0.3) })
  }

  // ── Pass 1: pdf-lib (fast, lossless) ──────────────────────────────────────
  let pdfLibOk = false
  try {
    const sourceDoc  = await PDFDocument.load(bytes, { ignoreEncryption: true, throwOnInvalidObject: false })
    const totalPages = sourceDoc.getPageCount()
    const indices    = pageRange && pageRange.length > 0
      ? pageRange.map((p) => Math.min(p - 1, totalPages - 1))
      : Array.from({ length: totalPages }, (_, i) => i)
    const copied = await doc.copyPages(sourceDoc, indices)
    for (const p of copied) doc.addPage(p)
    pdfLibOk = true
  } catch {
    // pdf-lib couldn't handle this PDF — try pdfjs fallback
  }

  if (pdfLibOk) return

  // ── Pass 2: pdfjs-dist (canvas render → PNG embed) ───────────────────────
  const canvasOk = await embedPdfViaCanvas(doc, bytes, pageRange)
  if (!canvasOk) {
    await placeholder(`No se pudo incrustar: ${fileName}`)
  }
}

// ─── Compact doc divider (used when < 4 unique docs) ─────────────────────────
// Simple full-page header: document name large, months covered, filename.
async function addCompactDocDivider(
  doc: PDFDocument,
  docResult: DocumentResult,
  coveredMonths: MonthCoverage[],
  docNumber: number,
  totalDocs: number,
): Promise<void> {
  const [helveticaBold, helvetica] = await Promise.all([
    doc.embedFont(StandardFonts.HelveticaBold),
    doc.embedFont(StandardFonts.Helvetica),
  ])

  const page = doc.addPage(PageSizes.A4)
  const { width, height } = page.getSize()
  const margin = 64
  const innerW = width - margin * 2

  // Dark band (~32% of page)
  const bandH = height * 0.32
  page.drawRectangle({ x: 0, y: height - bandH, width, height: bandH, color: rgb(0.08, 0.12, 0.32) })
  page.drawRectangle({ x: 0, y: height - bandH - 4, width, height: 4, color: rgb(0.78, 0.71, 0.42) })

  // Counter top-right
  const counter  = safe(`${docNumber} / ${totalDocs}`)
  const counterW = helvetica.widthOfTextAtSize(counter, 8)
  page.drawText(counter, {
    x: width - margin - counterW, y: height - 22,
    size: 8, font: helvetica, color: rgb(0.55, 0.60, 0.80),
  })

  // Document description (large, white, centered vertically in band)
  const descSize  = 26
  const descLines = wrapText(docResult.descripcion_breve, helveticaBold, innerW, descSize)
  const descH     = descLines.length * descSize * 1.3
  const descY     = height - (bandH - descH) / 2 - descSize
  descLines.forEach((line, li) => {
    page.drawText(line, {
      x: margin, y: descY - li * descSize * 1.3,
      size: descSize, font: helveticaBold, color: rgb(1, 1, 1),
    })
  })

  // Tipo + fuerza (below description, still in band)
  page.drawText(safe(`${docResult.tipo}  ·  Valor: ${docResult.fuerza}`), {
    x: margin, y: height - bandH + 18,
    size: 8.5, font: helvetica, color: rgb(0.65, 0.70, 0.90),
  })

  // Months covered (below band)
  let y = height - bandH - 44
  page.drawText(safe("Meses acreditados:"), {
    x: margin, y, size: 10, font: helveticaBold, color: rgb(0.10, 0.10, 0.10),
  })
  y -= 20

  for (const month of coveredMonths) {
    page.drawRectangle({ x: margin, y: y + 2, width: 5, height: 5, color: rgb(0.78, 0.71, 0.42) })
    page.drawText(safe(month.label), {
      x: margin + 14, y,
      size: 9.5, font: helvetica, color: rgb(0.10, 0.10, 0.10),
    })
    y -= 16
  }

  // Filename (bottom)
  page.drawLine({
    start: { x: margin, y: margin + 28 }, end: { x: width - margin, y: margin + 28 },
    thickness: 0.4, color: rgb(0.85, 0.85, 0.85),
  })
  page.drawText(safe(`Archivo: ${buildFileLabel(docResult)}`), {
    x: margin, y: margin + 12,
    size: 7.5, font: helvetica, color: rgb(0.50, 0.50, 0.50),
  })
}

// ─── Month divider page ───────────────────────────────────────────────────────
// One big page per month: dark header with large month name + list of docs below.
// docAlreadyShownIn: map from doc key → label of the first month where it was embedded.
// When a doc appears in multiple months but is only embedded once, a note is shown.
async function addMonthDividerPage(
  doc: PDFDocument,
  month: MonthCoverage,
  docAlreadyShownIn: Map<string, string> = new Map(),
): Promise<void> {
  const [helveticaBold, helvetica] = await Promise.all([
    doc.embedFont(StandardFonts.HelveticaBold),
    doc.embedFont(StandardFonts.Helvetica),
  ])

  const page = doc.addPage(PageSizes.A4)
  const { width, height } = page.getSize()
  const margin = 64
  const innerW = width - margin * 2

  // ── Dark band (~38% of page height) ──
  const bandH = height * 0.38
  page.drawRectangle({ x: 0, y: height - bandH, width, height: bandH, color: rgb(0.08, 0.12, 0.32) })
  page.drawRectangle({ x: 0, y: height - bandH - 4, width, height: 4, color: rgb(0.78, 0.71, 0.42) })

  // ── Large month name (white, centered in band) ──
  const monthSize = 42
  const monthText = safe(month.label)
  const monthW    = helveticaBold.widthOfTextAtSize(monthText, monthSize)
  const monthY    = height - bandH / 2 - monthSize * 0.3
  page.drawText(monthText, {
    x: (width - monthW) / 2,
    y: monthY,
    size: monthSize, font: helveticaBold, color: rgb(1, 1, 1),
  })

  // ── Status (colored, centered just below month name) ──
  const STATUS_CFG: Record<string, { label: string; r: number; g: number; b: number }> = {
    CUBIERTO: { label: "Cubierto",        r: 0.25, g: 0.78, b: 0.45 },
    DÉBIL:    { label: "Cobertura debil", r: 0.95, g: 0.65, b: 0.15 },
    VACÍO:    { label: "Sin documentos",  r: 0.90, g: 0.35, b: 0.35 },
  }
  const st     = STATUS_CFG[month.status] ?? STATUS_CFG["VACÍO"]
  const stText = safe(st.label)
  const stW    = helvetica.widthOfTextAtSize(stText, 11)
  page.drawText(stText, {
    x: (width - stW) / 2,
    y: monthY - 28,
    size: 11, font: helvetica, color: rgb(st.r, st.g, st.b),
  })

  // ── Optional month badge ──
  if (month.isOptional) {
    const optText = safe("Mes opcional")
    const optW    = helvetica.widthOfTextAtSize(optText, 8)
    page.drawText(optText, {
      x: (width - optW) / 2,
      y: monthY - 44,
      size: 8, font: helvetica, color: rgb(0.65, 0.70, 0.90),
    })
  }

  // ── Document list below band ──
  let y = height - bandH - 44

  const docsHeader = safe(`Documentos que acreditan este mes (${month.docs.length}):`)
  page.drawText(docsHeader, { x: margin, y, size: 10, font: helveticaBold, color: rgb(0.10, 0.10, 0.10) })
  y -= 22

  for (const d of month.docs) {
    if (y < margin + 30) break

    const alreadyIn = docAlreadyShownIn.get(getDocKey(d)) ?? null

    // Bullet square
    page.drawRectangle({ x: margin, y: y + 2, width: 5, height: 5, color: rgb(0.78, 0.71, 0.42) })

    // Description (bold, wrapping)
    const descLines = wrapText(d.descripcion_breve, helveticaBold, innerW - 16, 10)
    descLines.forEach((line, li) => {
      page.drawText(line, {
        x: margin + 14, y: y - li * 14,
        size: 10, font: helveticaBold, color: rgb(0.10, 0.10, 0.10),
      })
    })
    const descH = descLines.length * 14

    // Filename (grey)
    page.drawText(safe(`Archivo: ${buildFileLabel(d)}`), {
      x: margin + 14, y: y - descH,
      size: 7.5, font: helvetica, color: rgb(0.48, 0.48, 0.48),
    })

    // Strength (right-aligned)
    const fuerzaColor: Record<string, [number, number, number]> = {
      fuerte: [0.12, 0.55, 0.28],
      media:  [0.70, 0.45, 0.05],
      débil:  [0.62, 0.22, 0.22],
    }
    const fc         = fuerzaColor[d.fuerza] ?? [0.5, 0.5, 0.5]
    const fuerzaText = safe(`Valor: ${d.fuerza}`)
    const fuerzaW    = helvetica.widthOfTextAtSize(fuerzaText, 7.5)
    page.drawText(fuerzaText, {
      x: width - margin - fuerzaW, y: y - descH,
      size: 7.5, font: helvetica, color: rgb(...fc),
    })

    // Cross-month note: document is physically embedded in a different section
    let extraH = 0
    if (alreadyIn) {
      const noteText = safe(`-> Documento incluido en la seccion de ${alreadyIn}`)
      page.drawText(noteText, {
        x: margin + 14, y: y - descH - 12,
        size: 7.5, font: helvetica, color: rgb(0.35, 0.45, 0.75),
      })
      extraH = 14
    }

    y -= descH + 12 + 12 + extraH

    page.drawLine({
      start: { x: margin, y }, end: { x: width - margin, y },
      thickness: 0.2, color: rgb(0.90, 0.90, 0.90),
    })
    y -= 10
  }
}

// ─── Post-process: inject QR onto the cover page (page index 0) ──────────────
// Called at download time with the final URL so the QR always matches the
// actual uploaded file — regardless of which pages were removed in the preview.
export async function addQRToFirstPage(pdfBytes: Uint8Array, publicUrl: string): Promise<Uint8Array> {
  console.log("[pdf-utils] addQRToFirstPage called with url:", publicUrl)
  const qrBytes = await generateQRBytes(publicUrl)
  if (!qrBytes) {
    console.warn("[pdf-utils] QR generation returned null — skipping QR")
    return pdfBytes
  }

  try {
    const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true })
    const pages = doc.getPages()
    if (pages.length === 0) return pdfBytes

    const page = pages[0]
    const { width } = page.getSize()
    const margin  = 64
    const qrSize  = 90
    const qrX     = width - margin - qrSize
    const qrY     = margin + 32

    const helvetica = await doc.embedFont(StandardFonts.Helvetica)
    const qrImg     = await doc.embedPng(qrBytes)
    page.drawImage(qrImg, { x: qrX, y: qrY, width: qrSize, height: qrSize })

    const caption = safe("Escanea para ver el expediente digital")
    page.drawText(caption, {
      x: qrX - helvetica.widthOfTextAtSize(caption, 7) + qrSize,
      y: qrY - 10,
      size: 7,
      font: helvetica,
      color: rgb(0.55, 0.55, 0.55),
    })

    return new Uint8Array(await doc.save())
  } catch (err) {
    console.error("[pdf-utils] addQRToFirstPage failed:", err)
    return pdfBytes
  }
}

// ─── Post-process: stamp "N / Total" at the bottom-centre of every page ───────
// Called after page removal so numbers always match the final page count.
export async function addPageNumbers(pdfBytes: Uint8Array): Promise<Uint8Array> {
  const doc       = await PDFDocument.load(pdfBytes, { ignoreEncryption: true })
  const helvetica = await doc.embedFont(StandardFonts.Helvetica)
  const pages     = doc.getPages()
  const total     = pages.length

  for (let i = 0; i < total; i++) {
    const page  = pages[i]
    const { width } = page.getSize()
    const label = safe(`${i + 1} / ${total}`)
    const textW = helvetica.widthOfTextAtSize(label, 9)
    page.drawText(label, {
      x: (width - textW) / 2,
      y: 22,
      size: 9,
      font: helvetica,
      color: rgb(0.35, 0.35, 0.35),
    })
  }

  return new Uint8Array(await doc.save())
}

// ─── Public export ────────────────────────────────────────────────────────────
export async function generatePDF(
  result: AnalysisResult,
  files: File[],
  formData: { nombre: string; mesPresentation: string },
): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  doc.setTitle(safe("Documentacion acreditativa de permanencia ininterrumpida"))
  doc.setAuthor(safe(formData.nombre))
  doc.setCreationDate(new Date())

  const logoBytes = await fetchLogo()

  // 1. Cover (QR is injected later at download time via addQRToFirstPage)
  await addCoverPage(doc, formData.nombre, logoBytes, null)

  // 2. Coverage index (month table + unique document list)
  const uniqueDocs = getUniqueDocsOrdered(result.months)
  await addCoverageIndexPages(doc, result, uniqueDocs)

  // 3. Document section — two layouts depending on number of unique documents:
  //
  //   COMPACT  (< 4 unique docs): each document gets one divider page listing all
  //   the months it covers, then its pages. Simple and clean for cases like
  //   2 medical histories each covering all 5 required months.
  //
  //   FULL (≥ 4 unique docs): month-grouped — each month gets a divider page listing
  //   all documents that cover it. Each document is embedded only ONCE (in the section
  //   of the first month it appears), so multi-month documents are never repeated.

  async function embedDoc(docResult: DocumentResult) {
    const file = files[docResult.fileIndex]
    if (!file) return
    let bytes: Uint8Array
    try {
      bytes = new Uint8Array(await file.arrayBuffer())
    } catch {
      // File handle no longer accessible (e.g. removed USB, browser security context change)
      const page      = doc.addPage(PageSizes.A4)
      const helvetica = await doc.embedFont(StandardFonts.Helvetica)
      page.drawText(safe(`No se pudo leer: ${file.name}`), {
        x: 72, y: PageSizes.A4[1] / 2, size: 11, font: helvetica, color: rgb(0.7, 0.3, 0.3),
      })
      return
    }
    const fmt = detectImageType(bytes)
    if (fmt === "pdf") {
      await embedPdfFile(doc, bytes, file.name, docResult.pageRange)
    } else {
      await embedImageFile(doc, bytes, file.name)
    }
  }

  if (uniqueDocs.length < 4) {
    // ── Compact layout ──
    for (let i = 0; i < uniqueDocs.length; i++) {
      const { docResult, coveredMonths } = uniqueDocs[i]
      await addCompactDocDivider(doc, docResult, coveredMonths, i + 1, uniqueDocs.length)
      await embedDoc(docResult)
    }
  } else {
    // ── Full month-grouped layout ──
    // Pre-compute which month label each doc is first embedded in, so subsequent
    // month divider pages can show a cross-reference note instead of re-embedding.
    const keyToFirstMonthLabel = new Map<string, string>()
    for (const month of result.months) {
      for (const docResult of month.docs) {
        const key = getDocKey(docResult)
        if (!keyToFirstMonthLabel.has(key)) {
          keyToFirstMonthLabel.set(key, month.label)
        }
      }
    }

    const embeddedKeys = new Set<string>()
    for (const month of result.months) {
      if (month.docs.length === 0) continue

      // Build the cross-reference map for this month's divider page:
      // for each doc that was already embedded in a prior month, include its first-month label.
      const alreadyShownIn = new Map<string, string>()
      for (const docResult of month.docs) {
        const key = getDocKey(docResult)
        const firstMonth = keyToFirstMonthLabel.get(key)
        if (firstMonth && firstMonth !== month.label) {
          alreadyShownIn.set(key, firstMonth)
        }
      }

      await addMonthDividerPage(doc, month, alreadyShownIn)
      for (const docResult of month.docs) {
        const key = getDocKey(docResult)
        if (embeddedKeys.has(key)) continue
        embeddedKeys.add(key)
        await embedDoc(docResult)
      }
    }
  }

  return doc.save()
}

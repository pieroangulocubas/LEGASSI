import { PDFDocument } from "pdf-lib"
import { readFile, existsSync } from "node:fs"
import { promisify } from "node:util"
import path from "node:path"
import { fileURLToPath } from "node:url"

const readFileAsync = promisify(readFile)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, "..")

async function listFields(filePath) {
  const bytes = await readFileAsync(filePath)
  const doc = await PDFDocument.load(bytes)
  const form = doc.getForm()
  const fields = form.getFields()
  fields.forEach(f => {
    const name = f.getName()
    const type = f.constructor.name
    console.log(type.padEnd(25), JSON.stringify(name))
  })
}

const candidates = [
  path.join(root, "public", "forms", "DA21", "EX32_01_Solicitud_Datos_Personales_y_Tipo_Autorizacion.pdf"),
  path.join(root, "public", "forms", "EX32", "EX32_01_Solicitud_Datos_Personales_y_Tipo_Autorizacion.pdf"),
]

let found = false
for (const p of candidates) {
  try {
    if (!existsSync(p)) continue
    console.log("=== " + p + " ===")
    await listFields(p)
    found = true
    break
  } catch {
    // try next candidate
  }
}
if (!found) console.error("No PDF found in", candidates)

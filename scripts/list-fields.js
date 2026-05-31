const path = require("path")
const fs = require("fs")

async function main() {
  const { PDFDocument } = await import("pdf-lib")
  const root = path.join(__dirname, "..")

  const candidates = [
    path.join(root, "public","forms","DA21","EX32_01_Solicitud_Datos_Personales_y_Tipo_Autorizacion.pdf"),
    path.join(root, "public","forms","EX32","EX32_01_Solicitud_Datos_Personales_y_Tipo_Autorizacion.pdf"),
  ]

  for (const p of candidates) {
    if (!fs.existsSync(p)) continue
    console.log("=== " + p + " ===\n")
    const bytes = fs.readFileSync(p)
    const doc = await PDFDocument.load(bytes)
    const form = doc.getForm()
    form.getFields().forEach(f => {
      console.log(f.constructor.name.padEnd(25), JSON.stringify(f.getName()))
    })
    return
  }
  console.error("No EX32 PDF found")
}

main().catch(e => console.error(e.message))

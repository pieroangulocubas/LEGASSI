const path = require("path")
const fs = require("fs")

async function main() {
  const { PDFDocument } = await import("pdf-lib")
  const root = path.join(__dirname, "..")
  const src = path.join(root, "public","forms","DA21","EX32_01_Solicitud_Datos_Personales_y_Tipo_Autorizacion.pdf")
  const bytes = fs.readFileSync(src)
  const doc = await PDFDocument.load(bytes)
  const form = doc.getForm()
  form.getFields().forEach(f => {
    const name = f.getName()
    try { form.getTextField(name).setText(name) } catch { /* checkbox */ }
  })
  const out = path.join(root, "scripts", "EX32_labeled.pdf")
  fs.writeFileSync(out, await doc.save())
  console.log("Written:", out)
}

main().catch(e => console.error(e.message))

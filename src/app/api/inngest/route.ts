import { serve } from "inngest/next"
import { inngest } from "@/inngest/client"
import { analizarClasificador } from "@/inngest/functions/clasificador"

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [analizarClasificador],
})

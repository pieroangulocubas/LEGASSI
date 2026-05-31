import type { ChecklistItem } from "../types"

export function buildDa20CaseChecklist(): ChecklistItem[] {
  return [
    {
      id: "pi_docs",
      label: "Documentacion de tu solicitud de Proteccion Internacional",
      status: "missing",
      section: "case",
      detail:
        "Resguardo de solicitud de asilo, tarjeta roja de solicitante, resolucion, o acuse de recurso. Cualquiera es valido. Debe mostrar fecha anterior al 01/01/2026.",
      uploadable: true,
      uploadHint:
        "Documento de Proteccion Internacional. Extrae: nombre del solicitante, numero de expediente PI, fecha de solicitud, estado de la solicitud.",
      criteria: [
        "N de expediente PI visible",
        "Fecha de solicitud anterior al 01/01/2026",
        "Sello o membrete oficial",
        "Estado(s) del expediente indicado con fechas",
      ],
    },
  ]
}

export function FuerzaLegend() {
  return (
    <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 space-y-2">
      <p className="text-xs font-semibold text-foreground">Valor probatorio de los documentos</p>
      <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:gap-x-5">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
          <span><strong className="text-foreground">fuerte</strong>: Padrón, nómina, contrato — prueba directa de presencia</span>
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
          <span><strong className="text-foreground">media</strong>: Extracto bancario, facturas de servicios, recibo de alquiler</span>
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
          <span><strong className="text-foreground">débil</strong>: Ticket, captura de pantalla, documento sin fecha visible</span>
        </span>
      </div>
    </div>
  )
}

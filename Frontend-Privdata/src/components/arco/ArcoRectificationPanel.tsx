import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, FileEdit, CheckCircle2, AlertTriangle } from "lucide-react"
import { personsApi, arcoApi } from "@/lib/api"
import { parseRectification, getPersonFieldValue } from "@/lib/rectification"

interface Props {
  arcoRequestId: string
  dataSubjectId: string
  organizationId: string
  description: string
  onApplied: (resolutionText: string) => void
}

export default function ArcoRectificationPanel({ arcoRequestId, dataSubjectId, organizationId, description, onApplied }: Props) {
  const qc = useQueryClient()
  const details = parseRectification(description)

  const { data: personData, isLoading } = useQuery({
    queryKey: ["person", organizationId, dataSubjectId],
    queryFn: () => personsApi.getById(organizationId, dataSubjectId).then(r => r.data),
    enabled: !!details,
  })
  const person = personData?.data

  const applyMutation = useMutation({
    mutationFn: async () => {
      if (!details) throw new Error("Datos de la solicitud no disponibles")
      const observations = `Se corrigió el campo "${details.fieldLabel}": de "${details.currentValue || "—"}" a "${details.proposedValue}".`
      const res = await arcoApi.respondRectification(arcoRequestId, observations)
      if (!res.data.success) throw new Error(res.data.message)
      return observations
    },
    onSuccess: (observations) => {
      qc.invalidateQueries({ queryKey: ["person", organizationId, dataSubjectId] })
      qc.invalidateQueries({ queryKey: ["persons", organizationId] })
      onApplied(`Informe de Rectificación — Art. 11 Ley 21.719\n\n${observations}`)
    },
  })

  if (!details) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Solicitud de rectificación</p>
        <p className="whitespace-pre-line">{description}</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Cargando datos del titular…
      </div>
    )
  }

  const currentLive = person ? getPersonFieldValue(person, details.field) : ""
  const alreadyApplied = currentLive === details.proposedValue

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3 text-sm">
      <div className="flex items-center gap-2 font-semibold text-foreground">
        <FileEdit className="w-4 h-4 text-primary" />
        Solicitud de rectificación
      </div>

      <div className="rounded-lg bg-background border border-border px-3 py-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        <div className="col-span-2">
          <span className="text-muted-foreground">Campo:</span>{" "}
          <span className="font-medium text-foreground">{details.fieldLabel}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Valor actual:</span>{" "}
          <span className="font-medium text-foreground">{currentLive || "—"}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Valor propuesto:</span>{" "}
          <span className="font-medium text-foreground">{details.proposedValue}</span>
        </div>
        <div className="col-span-2">
          <span className="text-muted-foreground">Motivo indicado por el titular:</span>{" "}
          <span className="text-foreground">{details.reason}</span>
        </div>
      </div>

      {alreadyApplied ? (
        <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "hsl(var(--success))" }}>
          <CheckCircle2 className="w-3.5 h-3.5" />
          La corrección ya fue aplicada en los datos del titular.
        </div>
      ) : (
        <>
          {applyMutation.isError && (
            <p className="text-xs text-destructive">{(applyMutation.error as Error).message}</p>
          )}
          <button
            type="button"
            onClick={() => applyMutation.mutate()}
            disabled={applyMutation.isPending}
            className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5"
            style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
          >
            {applyMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Aplicar corrección
          </button>
          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            Esto actualizará el dato del titular en el sistema de inmediato. Verifica la solicitud antes de aplicar.
          </p>
        </>
      )}
    </div>
  )
}

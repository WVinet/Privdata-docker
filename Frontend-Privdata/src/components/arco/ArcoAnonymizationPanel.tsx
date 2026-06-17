import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, UserX, CheckCircle2, AlertTriangle } from "lucide-react"
import { personsApi } from "@/lib/api"
import { parseAnonymization } from "@/lib/anonymization"

interface Props {
  dataSubjectId: string
  organizationId: string
  description: string
  onApplied: (resolutionText: string) => void
}

export default function ArcoAnonymizationPanel({ dataSubjectId, organizationId, description, onApplied }: Props) {
  const qc = useQueryClient()
  const details = parseAnonymization(description)
  const [confirming, setConfirming] = useState(false)

  const { data: personData, isLoading: loadingPerson } = useQuery({
    queryKey: ["person", organizationId, dataSubjectId],
    queryFn: () => personsApi.getById(organizationId, dataSubjectId).then(r => r.data),
    enabled: !!details,
  })
  const person = personData?.data

  const applyMutation = useMutation({
    mutationFn: async () => {
      const res = await personsApi.anonymize(organizationId, dataSubjectId)
      if (!res.data.success) throw new Error(res.data.message)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["person", organizationId, dataSubjectId] })
      qc.invalidateQueries({ queryKey: ["persons", organizationId] })
      setConfirming(false)
      onApplied(
        `Informe de Anonimización — Art. 8° Ley 21.719\n\n` +
        `Se reemplazaron los datos identificativos del titular (nombre, RUT, correo, teléfono, cargo) por valores no atribuibles. ` +
        `A diferencia de la Supresión, el registro no se elimina, conservándose para fines de trazabilidad.` +
        `\n\nMotivo indicado por el titular: ${details!.reason}`
      )
    },
  })

  if (!details) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Solicitud de anonimización</p>
        <p className="whitespace-pre-line">{description}</p>
      </div>
    )
  }

  if (loadingPerson) {
    return (
      <div className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Cargando datos del titular…
      </div>
    )
  }

  const alreadyApplied = person?.firstName === "ANONYMIZED" || person?.lastName === "ANONYMIZED"

  return (
    <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 space-y-3 text-sm">
      <div className="flex items-center gap-2 font-semibold text-foreground">
        <UserX className="w-4 h-4 text-destructive" />
        Solicitud de anonimización
      </div>

      <div className="rounded-lg bg-background border border-border px-3 py-2 space-y-1.5 text-xs">
        <div>
          <span className="text-muted-foreground">Datos identificativos actuales:</span>{" "}
          <span className="font-medium text-foreground">{person?.fullName ?? "—"}</span>
          {person?.rut && <span className="text-foreground"> · {person.rut}</span>}
          {person?.email && <span className="text-foreground"> · {person.email}</span>}
          {person?.phone && <span className="text-foreground"> · {person.phone}</span>}
        </div>
        <div>
          <span className="text-muted-foreground">Motivo indicado por el titular:</span>{" "}
          <span className="text-foreground">{details.reason}</span>
        </div>
      </div>

      {alreadyApplied ? (
        <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "hsl(var(--success))" }}>
          <CheckCircle2 className="w-3.5 h-3.5" />
          La anonimización ya fue aplicada: los datos identificativos del titular fueron reemplazados.
        </div>
      ) : confirming ? (
        <div className="rounded-lg border border-destructive/40 bg-background p-3 space-y-2">
          <p className="flex items-start gap-1.5 text-xs font-medium text-destructive">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            Esta acción reemplazará los datos identificativos del titular (nombre, RUT, correo, teléfono, cargo) por
            valores no atribuibles y desactivará su cuenta, conservando el registro (sin eliminarlo) para fines de
            trazabilidad. No se puede deshacer fácilmente. ¿Confirmas que deseas continuar?
          </p>
          {applyMutation.isError && (
            <p className="text-xs text-destructive">{(applyMutation.error as Error).message}</p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => applyMutation.mutate()}
              disabled={applyMutation.isPending}
              className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5"
              style={{ background: "hsl(var(--destructive))", color: "hsl(var(--destructive-foreground))" }}
            >
              {applyMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Sí, aplicar anonimización
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={applyMutation.isPending}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border border-border transition-colors hover:bg-muted"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5"
            style={{ background: "hsl(var(--destructive))", color: "hsl(var(--destructive-foreground))" }}
          >
            Aplicar anonimización
          </button>
          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            Esto anonimizará los datos identificativos del titular y desactivará su cuenta de inmediato. A diferencia
            de la Supresión, el registro no se elimina y queda disponible para trazabilidad. Verifica la solicitud antes de aplicar.
          </p>
        </>
      )}
    </div>
  )
}

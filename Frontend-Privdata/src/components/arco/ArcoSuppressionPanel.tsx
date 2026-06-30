import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, Trash2, CheckCircle2, XCircle, AlertTriangle } from "lucide-react"
import { personsApi, arcoApi } from "@/lib/api"
import { parseSuppression, SUPPRESSION_CAUSE_LABELS } from "@/lib/suppression"
import type { SuppressionCause } from "@/types/arco"

interface Props {
  arcoRequestId: string
  dataSubjectId: string
  organizationId: string
  description: string
  onApplied: (resolutionText: string) => void
}

const CAUSE_ASSESSMENT: Record<SuppressionCause, { field: "dataStillNecessary" | "anotherLegalBasisExists" | "retentionPeriodStillValid"; label: string }> = {
  DATA_NOT_NECESSARY: { field: "dataStillNecessary", label: "Los datos siguen siendo necesarios para la finalidad declarada" },
  CONSENT_REVOKED: { field: "anotherLegalBasisExists", label: "Existe otro fundamento legal que autoriza el tratamiento" },
  DATA_EXPIRED: { field: "retentionPeriodStillValid", label: "Los datos aún se encuentran dentro del plazo de conservación" },
}

export default function ArcoSuppressionPanel({ arcoRequestId, dataSubjectId, organizationId, description, onApplied }: Props) {
  const qc = useQueryClient()
  const details = parseSuppression(description)
  const [mode, setMode] = useState<"idle" | "approve" | "reject">("idle")
  const [assessmentChecked, setAssessmentChecked] = useState(false)
  const [exceptionApplies, setExceptionApplies] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [observations, setObservations] = useState("")
  const [anonymizeInsteadOfDelete, setAnonymizeInsteadOfDelete] = useState(false)

  const { data: personData, isLoading: loadingPerson } = useQuery({
    queryKey: ["person", organizationId, dataSubjectId],
    queryFn: () => personsApi.getById(organizationId, dataSubjectId).then(r => r.data),
    enabled: !!details,
  })
  const person = personData?.data

  const respondMutation = useMutation({
    mutationFn: async (approved: boolean) => {
      const assessment = details ? CAUSE_ASSESSMENT[details.cause] : null
      const res = await arcoApi.respondSuppression(arcoRequestId, {
        approved,
        observations: approved ? observations.trim() || undefined : undefined,
        rejectionReason: !approved ? rejectionReason.trim() || undefined : undefined,
        exceptionApplies: !approved ? exceptionApplies : undefined,
        ...(assessment && !approved ? { [assessment.field]: assessmentChecked } : {}),
        anonymizeInsteadOfDelete: approved ? anonymizeInsteadOfDelete : undefined,
      })
      if (!res.data.success) throw new Error(res.data.message)
      return { approved, data: res.data.data }
    },
    onSuccess: ({ approved, data }) => {
      qc.invalidateQueries({ queryKey: ["person", organizationId, dataSubjectId] })
      qc.invalidateQueries({ queryKey: ["persons", organizationId] })
      setMode("idle")
      onApplied(
        approved
          ? `Informe de Supresión — Art. 11 Ley 21.719\n\nSolicitud aprobada. ${anonymizeInsteadOfDelete ? "Los datos identificativos del titular fueron anonimizados" : "Los datos del titular fueron marcados para eliminación"} y su cuenta fue desactivada.` +
            (observations.trim() ? `\n\n${observations.trim()}` : "")
          : `Informe de Supresión — Art. 11 Ley 21.719\n\nSolicitud rechazada.\n\n${data?.resolutionSummary ?? rejectionReason.trim()}`
      )
    },
  })

  if (!details) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Solicitud de supresión</p>
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

  const alreadyApplied = person?.isActive === false
  const assessment = CAUSE_ASSESSMENT[details.cause]

  return (
    <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 space-y-3 text-sm">
      <div className="flex items-center gap-2 font-semibold text-foreground">
        <Trash2 className="w-4 h-4 text-destructive" />
        Solicitud de supresión
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
          <span className="text-muted-foreground">Causal invocada:</span>{" "}
          <span className="font-medium text-foreground">{SUPPRESSION_CAUSE_LABELS[details.cause]}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Motivo indicado por el titular:</span>{" "}
          <span className="text-foreground">{details.reason}</span>
        </div>
      </div>

      {alreadyApplied ? (
        <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "hsl(var(--success))" }}>
          <CheckCircle2 className="w-3.5 h-3.5" />
          La solicitud ya fue resuelta: los datos del titular fueron marcados para eliminación y su cuenta está desactivada.
        </div>
      ) : mode === "approve" ? (
        <div className="rounded-lg border border-destructive/40 bg-background p-3 space-y-2">
          <p className="flex items-start gap-1.5 text-xs font-medium text-destructive">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            Esta acción marcará los datos del titular para eliminación y desactivará su cuenta de inmediato. No se puede deshacer fácilmente.
          </p>
          <label className="flex items-start gap-2 text-xs">
            <input
              type="checkbox"
              checked={anonymizeInsteadOfDelete}
              onChange={(e) => setAnonymizeInsteadOfDelete(e.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 rounded"
            />
            Anonimizar en lugar de eliminar los datos
          </label>
          <textarea
            rows={2}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Observaciones para el titular (opcional)…"
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
          />
          {respondMutation.isError && (
            <p className="text-xs text-destructive">{(respondMutation.error as Error).message}</p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => respondMutation.mutate(true)}
              disabled={respondMutation.isPending}
              className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5"
              style={{ background: "hsl(var(--destructive))", color: "hsl(var(--destructive-foreground))" }}
            >
              {respondMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {anonymizeInsteadOfDelete ? "Sí, aprobar y anonimizar" : "Sí, aprobar y suprimir"}
            </button>
            <button
              type="button"
              onClick={() => setMode("idle")}
              disabled={respondMutation.isPending}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border border-border transition-colors hover:bg-muted"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : mode === "reject" ? (
        <div className="rounded-lg border border-border bg-background p-3 space-y-2">
          <label className="flex items-start gap-2 text-xs">
            <input
              type="checkbox"
              checked={assessmentChecked}
              onChange={(e) => setAssessmentChecked(e.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 rounded"
            />
            {assessment.label}
          </label>
          <label className="flex items-start gap-2 text-xs">
            <input
              type="checkbox"
              checked={exceptionApplies}
              onChange={(e) => setExceptionApplies(e.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 rounded"
            />
            Aplica una excepción legal que impide la supresión
          </label>
          <textarea
            rows={2}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Motivo del rechazo (opcional — si se deja vacío se usa un texto estándar según la evaluación marcada)…"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
          {respondMutation.isError && (
            <p className="text-xs text-destructive">{(respondMutation.error as Error).message}</p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => respondMutation.mutate(false)}
              disabled={respondMutation.isPending}
              className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5"
              style={{ background: "hsl(var(--destructive))", color: "hsl(var(--destructive-foreground))" }}
            >
              {respondMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Confirmar rechazo
            </button>
            <button
              type="button"
              onClick={() => setMode("idle")}
              disabled={respondMutation.isPending}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border border-border transition-colors hover:bg-muted"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMode("approve")}
            className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5"
            style={{ background: "hsl(var(--destructive))", color: "hsl(var(--destructive-foreground))" }}
          >
            Aprobar y suprimir
          </button>
          <button
            type="button"
            onClick={() => setMode("reject")}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-border transition-colors hover:bg-muted inline-flex items-center gap-1.5"
          >
            <XCircle className="w-3.5 h-3.5" />
            Rechazar
          </button>
        </div>
      )}
    </div>
  )
}

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, Lock, CheckCircle2, XCircle, AlertTriangle } from "lucide-react"
import { personsApi, arcoApi } from "@/lib/api"
import { parseBlocking, BLOCKING_CAUSE_LABELS } from "@/lib/blocking"

interface Props {
  arcoRequestId: string
  dataSubjectId: string
  organizationId: string
  description: string
  onApplied: (resolutionText: string) => void
}

export default function ArcoBlockingPanel({ arcoRequestId, dataSubjectId, organizationId, description, onApplied }: Props) {
  const qc = useQueryClient()
  const details = parseBlocking(description)
  const [mode, setMode] = useState<"idle" | "approve" | "reject">("idle")
  const [legalObligationApplies, setLegalObligationApplies] = useState(false)
  const [exceptionApplies, setExceptionApplies] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [observations, setObservations] = useState("")

  const { data: personData, isLoading: loadingPerson } = useQuery({
    queryKey: ["person", organizationId, dataSubjectId],
    queryFn: () => personsApi.getById(organizationId, dataSubjectId).then(r => r.data),
    enabled: !!details,
  })
  const person = personData?.data

  const respondMutation = useMutation({
    mutationFn: async (approved: boolean) => {
      const res = await arcoApi.respondBlocking(arcoRequestId, {
        approved,
        observations: approved ? observations.trim() || undefined : undefined,
        rejectionReason: !approved ? rejectionReason.trim() || undefined : undefined,
        legalObligationApplies: !approved ? legalObligationApplies : undefined,
        exceptionApplies: !approved ? exceptionApplies : undefined,
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
          ? `Bloqueo aplicado — Art. 8 ter Ley 21.719\n\nSe suspendió temporalmente el tratamiento de los datos del titular. La cuenta quedó inactiva mientras dure el bloqueo.` +
            (observations.trim() ? `\n\n${observations.trim()}` : "")
          : `Bloqueo rechazado — Art. 8 ter Ley 21.719\n\n${data?.resolutionSummary ?? rejectionReason.trim()}`
      )
    },
  })

  if (!details) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Solicitud de bloqueo</p>
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

  return (
    <div className="rounded-xl border p-4 space-y-3 text-sm" style={{ borderColor: "hsl(var(--warning) / 0.3)", background: "hsl(var(--warning) / 0.05)" }}>
      <div className="flex items-center gap-2 font-semibold text-foreground">
        <Lock className="w-4 h-4" style={{ color: "hsl(36 70% 32%)" }} />
        Solicitud de bloqueo
      </div>

      <div className="rounded-lg bg-background border border-border px-3 py-2 space-y-1.5 text-xs">
        <div>
          <span className="text-muted-foreground">Titular:</span>{" "}
          <span className="font-medium text-foreground">{person?.fullName ?? "—"}</span>
          {person?.rut && <span className="text-foreground"> · {person.rut}</span>}
          {person?.email && <span className="text-foreground"> · {person.email}</span>}
        </div>
        <div>
          <span className="text-muted-foreground">Causal invocada:</span>{" "}
          <span className="font-medium text-foreground">{BLOCKING_CAUSE_LABELS[details.cause]}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Motivo indicado por el titular:</span>{" "}
          <span className="text-foreground">{details.reason}</span>
        </div>
      </div>

      {alreadyApplied ? (
        <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "hsl(var(--success))" }}>
          <CheckCircle2 className="w-3.5 h-3.5" />
          El bloqueo ya fue aplicado: la cuenta del titular se encuentra suspendida.
        </div>
      ) : mode === "approve" ? (
        <div className="rounded-lg border border-primary/40 bg-background p-3 space-y-2">
          <p className="flex items-start gap-1.5 text-xs font-medium text-primary">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            Esta acción suspenderá temporalmente la cuenta del titular (no podrá iniciar sesión) sin eliminar sus datos.
          </p>
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
              style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
            >
              {respondMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Sí, aplicar bloqueo
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
              checked={legalObligationApplies}
              onChange={(e) => setLegalObligationApplies(e.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 rounded"
            />
            Existe una obligación legal que exige continuar el tratamiento sin bloqueo
          </label>
          <label className="flex items-start gap-2 text-xs">
            <input
              type="checkbox"
              checked={exceptionApplies}
              onChange={(e) => setExceptionApplies(e.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 rounded"
            />
            Aplica otra excepción legal
          </label>
          <textarea
            rows={2}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Motivo del rechazo (opcional — si se deja vacío se usa un texto estándar)…"
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
            style={{ background: "hsl(36 70% 32%)", color: "white" }}
          >
            <Lock className="w-3.5 h-3.5" />
            Aplicar bloqueo
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

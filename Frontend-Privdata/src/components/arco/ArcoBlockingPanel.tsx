import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, Lock, Unlock, AlertTriangle, CheckCircle2 } from "lucide-react"
import { personsApi, arcoApi } from "@/lib/api"
import { parseBlocking, BLOCKING_RELATED_TYPES } from "@/lib/blocking"

const RELATED_TYPE_LABEL: Record<string, string> = Object.fromEntries(
  BLOCKING_RELATED_TYPES.map(t => [t.key, t.label])
)

const STATUS_LABEL: Record<string, string> = {
  RECIBIDA: "Recibida",
  EN_REVISION: "En revisión",
  EN_GESTION: "En gestión",
  RESPONDIDA: "Respondida",
  RECHAZADA: "Rechazada",
  CERRADA: "Cerrada",
}

interface Props {
  dataSubjectId: string
  organizationId: string
  description: string
  onApplied: (resolutionText: string) => void
}

export default function ArcoBlockingPanel({ dataSubjectId, organizationId, description, onApplied }: Props) {
  const qc = useQueryClient()
  const details = parseBlocking(description)
  const [confirming, setConfirming] = useState(false)

  const { data: personData, isLoading: loadingPerson } = useQuery({
    queryKey: ["person", organizationId, dataSubjectId],
    queryFn: () => personsApi.getById(organizationId, dataSubjectId).then(r => r.data),
    enabled: !!details,
  })
  const person = personData?.data

  const { data: relatedData, isLoading: loadingRelated } = useQuery({
    queryKey: ["arco-request", details?.relatedRequestId],
    queryFn: () => arcoApi.getById(details!.relatedRequestId!).then(r => r.data),
    enabled: !!details?.relatedRequestId,
  })
  const relatedRequest = relatedData?.data

  const blockMutation = useMutation({
    mutationFn: async (nextActive: boolean) => {
      const res = await personsApi.updateStatus(organizationId, dataSubjectId, nextActive)
      if (!res.data.success) throw new Error(res.data.message)
      return nextActive
    },
    onSuccess: (nextActive) => {
      qc.invalidateQueries({ queryKey: ["person", organizationId, dataSubjectId] })
      qc.invalidateQueries({ queryKey: ["persons", organizationId] })
      setConfirming(false)
      if (nextActive === false) {
        onApplied(
          `Bloqueo aplicado — Art. 8 ter Ley 21.719\n\n` +
          `Se suspendió temporalmente el tratamiento de tus datos mientras se resuelve: ${RELATED_TYPE_LABEL[details!.relatedType] ?? details!.relatedType}` +
          (details!.relatedRequestId ? ` (solicitud ${details!.relatedRequestId}).` : `.`) +
          `\n\nTus datos no fueron eliminados, solo se suspendió su uso activo. Te notificaremos cuando el bloqueo sea levantado.` +
          `\n\nMotivo indicado por el titular: ${details!.reason}`
        )
      } else {
        onApplied(
          `Bloqueo levantado — Art. 8 ter Ley 21.719\n\n` +
          `Se reanudó el tratamiento normal de tus datos personales.`
        )
      }
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

  if (loadingPerson || loadingRelated) {
    return (
      <div className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Cargando datos del titular…
      </div>
    )
  }

  const isBlocked = person?.isActive === false

  return (
    <div className="rounded-xl border p-4 space-y-3 text-sm" style={{ borderColor: "hsl(var(--warning) / 0.3)", background: "hsl(var(--warning) / 0.05)" }}>
      <div className="flex items-center gap-2 font-semibold text-foreground">
        <Lock className="w-4 h-4" style={{ color: "hsl(36 70% 32%)" }} />
        Solicitud de bloqueo
      </div>

      <div className="rounded-lg bg-background border border-border px-3 py-2 space-y-1.5 text-xs">
        <div>
          <span className="text-muted-foreground">Solicitud relacionada:</span>{" "}
          <span className="font-medium text-foreground">{RELATED_TYPE_LABEL[details.relatedType] ?? details.relatedType}</span>
        </div>
        {details.relatedRequestId && (
          <div>
            <span className="text-muted-foreground">ID de la solicitud:</span>{" "}
            <span className="font-mono text-foreground">{details.relatedRequestId}</span>
            {relatedRequest && (
              <span className="ml-1.5 text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: "hsl(var(--secondary))", color: "hsl(var(--primary))" }}>
                {STATUS_LABEL[relatedRequest.status] ?? relatedRequest.status}
              </span>
            )}
            {!relatedRequest && (
              <span className="ml-1.5 text-muted-foreground">(no encontrada)</span>
            )}
          </div>
        )}
        <div>
          <span className="text-muted-foreground">Estado de la cuenta:</span>{" "}
          {isBlocked ? (
            <span className="font-semibold" style={{ color: "hsl(var(--destructive))" }}>Suspendida</span>
          ) : (
            <span className="font-semibold" style={{ color: "hsl(var(--success))" }}>Activa</span>
          )}
        </div>
        <div>
          <span className="text-muted-foreground">Motivo indicado por el titular:</span>{" "}
          <span className="text-foreground">{details.reason}</span>
        </div>
      </div>

      {isBlocked ? (
        <>
          <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "hsl(var(--success))" }}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            El bloqueo ya está aplicado: la cuenta del titular se encuentra suspendida.
          </div>
          {blockMutation.isError && (
            <p className="text-xs text-destructive">{(blockMutation.error as Error).message}</p>
          )}
          <button
            type="button"
            onClick={() => blockMutation.mutate(true)}
            disabled={blockMutation.isPending}
            className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5"
            style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
          >
            {blockMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <Unlock className="w-3.5 h-3.5" />
            Levantar bloqueo
          </button>
          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            Si la cuenta está desactivada por una Supresión previa, levantar el bloqueo no restaurará los datos anonimizados.
          </p>
        </>
      ) : confirming ? (
        <div className="rounded-lg border p-3 space-y-2" style={{ borderColor: "hsl(var(--warning) / 0.4)" }}>
          <p className="flex items-start gap-1.5 text-xs font-medium" style={{ color: "hsl(36 70% 32%)" }}>
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            Esto suspenderá temporalmente la cuenta del titular (no podrá iniciar sesión) sin eliminar sus datos. ¿Confirmas que deseas continuar?
          </p>
          {blockMutation.isError && (
            <p className="text-xs text-destructive">{(blockMutation.error as Error).message}</p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => blockMutation.mutate(false)}
              disabled={blockMutation.isPending}
              className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5"
              style={{ background: "hsl(36 70% 32%)", color: "white" }}
            >
              {blockMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Sí, aplicar bloqueo
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={blockMutation.isPending}
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
            style={{ background: "hsl(36 70% 32%)", color: "white" }}
          >
            <Lock className="w-3.5 h-3.5" />
            Aplicar bloqueo
          </button>
          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            Esto suspenderá la cuenta del titular de inmediato (sin eliminar sus datos) hasta que se resuelva la solicitud relacionada.
          </p>
        </>
      )}
    </div>
  )
}

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, Trash2, CheckCircle2, AlertTriangle } from "lucide-react"
import { personsApi, complianceApi } from "@/lib/api"
import { parseSuppression } from "@/lib/suppression"
import type { UpdatePersonRequest } from "@/types/person"
import type { Consent } from "@/types/compliance"

interface Props {
  dataSubjectId: string
  organizationId: string
  description: string
  onApplied: (resolutionText: string) => void
}

export default function ArcoSuppressionPanel({ dataSubjectId, organizationId, description, onApplied }: Props) {
  const qc = useQueryClient()
  const details = parseSuppression(description)
  const [confirming, setConfirming] = useState(false)

  const { data: personData, isLoading: loadingPerson } = useQuery({
    queryKey: ["person", organizationId, dataSubjectId],
    queryFn: () => personsApi.getById(organizationId, dataSubjectId).then(r => r.data),
    enabled: !!details,
  })
  const person = personData?.data

  const { data: consentsData, isLoading: loadingConsents } = useQuery({
    queryKey: ["consents-subject", dataSubjectId],
    queryFn: () => complianceApi.getConsentsBySubject(dataSubjectId).then(r => r.data),
    enabled: !!details,
  })
  const consents: Consent[] = consentsData ?? []
  const activeConsents = consents.filter(c => c.status === "ACTIVE")

  const applyMutation = useMutation({
    mutationFn: async () => {
      if (!person) throw new Error("Datos del titular no disponibles")

      const body: UpdatePersonRequest = {
        firstName: "Titular",
        lastName: "(anonimizado)",
        rut: undefined,
        email: undefined,
        phone: undefined,
        position: undefined,
        departmentId: person.departmentId ?? undefined,
      }
      const updateRes = await personsApi.update(organizationId, dataSubjectId, body)
      if (!updateRes.data.success) throw new Error(updateRes.data.message)

      const statusRes = await personsApi.updateStatus(organizationId, dataSubjectId, false)
      if (!statusRes.data.success) throw new Error(statusRes.data.message)

      for (const consent of activeConsents) {
        const revokeRes = await complianceApi.revokeConsent(consent.id)
        if (!revokeRes.data.success) throw new Error(revokeRes.data.message)
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["person", organizationId, dataSubjectId] })
      qc.invalidateQueries({ queryKey: ["persons", organizationId] })
      qc.invalidateQueries({ queryKey: ["consents-subject", dataSubjectId] })
      setConfirming(false)
      onApplied(
        `Informe de Supresión — Art. 11 Ley 21.719\n\n` +
        `Se anonimizaron los datos identificativos del titular, su cuenta fue desactivada` +
        (activeConsents.length > 0
          ? ` y se revocaron ${activeConsents.length} consentimiento(s) activo(s).`
          : `.`) +
        `\n\nMotivo indicado por el titular: ${details!.reason}`
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

  if (loadingPerson || loadingConsents) {
    return (
      <div className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Cargando datos del titular…
      </div>
    )
  }

  const alreadyApplied = person?.isActive === false

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
          <span className="text-muted-foreground">Consentimientos activos:</span>{" "}
          <span className="font-medium text-foreground">{activeConsents.length}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Motivo indicado por el titular:</span>{" "}
          <span className="text-foreground">{details.reason}</span>
        </div>
      </div>

      {alreadyApplied ? (
        <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "hsl(var(--success))" }}>
          <CheckCircle2 className="w-3.5 h-3.5" />
          La supresión ya fue aplicada: los datos del titular fueron anonimizados y su cuenta está desactivada.
        </div>
      ) : confirming ? (
        <div className="rounded-lg border border-destructive/40 bg-background p-3 space-y-2">
          <p className="flex items-start gap-1.5 text-xs font-medium text-destructive">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            Esta acción anonimizará los datos del titular, desactivará su cuenta
            {activeConsents.length > 0 && ` y revocará ${activeConsents.length} consentimiento(s) activo(s)`}.
            No se puede deshacer fácilmente. ¿Confirmas que deseas continuar?
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
              Sí, aplicar supresión
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
            Aplicar supresión
          </button>
          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            Esto anonimizará los datos del titular, desactivará su cuenta y revocará sus consentimientos activos de inmediato. Verifica la solicitud antes de aplicar.
          </p>
        </>
      )}
    </div>
  )
}

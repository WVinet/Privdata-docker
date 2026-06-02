import { useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Loader2, ShieldCheck, ShieldOff, Clock, AlertCircle, Lock, Bell,
} from "lucide-react"
import { toast } from "sonner"
import { complianceApi } from "@/lib/api"
import type { Consent, ConsentDefinition, ConsentStatus } from "@/types/compliance"

interface Props {
  dataSubjectId: string
  organizationId: string
}

const statusConfig: Record<ConsentStatus, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  ACTIVE:    { label: "Activo",     icon: <ShieldCheck className="w-3.5 h-3.5" />, color: "hsl(142 71% 35%)",             bg: "hsl(142 71% 35% / 0.1)" },
  REVOKED:   { label: "Revocado",   icon: <ShieldOff   className="w-3.5 h-3.5" />, color: "hsl(var(--destructive))",      bg: "hsl(var(--destructive) / 0.08)" },
  EXPIRED:   { label: "Expirado",   icon: <Clock       className="w-3.5 h-3.5" />, color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))" },
  SUSPENDED: { label: "Suspendido", icon: <AlertCircle className="w-3.5 h-3.5" />, color: "hsl(36 70% 40%)",             bg: "hsl(36 70% 40% / 0.1)" },
}

const LEGAL_BASIS_LABEL: Record<string, string> = {
  CONSENTIMIENTO:   "Art. 12 — Consentimiento",
  CONTRATO:         "Art. 13 — Contrato",
  OBLIGACION_LEGAL: "Art. 13 — Obligación legal",
  INTERES_LEGITIMO: "Art. 13 — Interés legítimo",
  INTERES_VITAL:    "Art. 13 — Interés vital",
  FUNCION_PUBLICA:  "Art. 20 — Función pública",
}

function formatDate(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" })
}

export default function TitularConsentimientos({ dataSubjectId, organizationId }: Props) {
  const queryClient = useQueryClient()
  const [pendingRevoke, setPendingRevoke] = useState<Consent | null>(null)
  const [pendingGrant,  setPendingGrant]  = useState<Consent | null>(null)

  const { data: consentsData, isLoading: loadingConsents } = useQuery({
    queryKey: ["consents", dataSubjectId],
    queryFn: () => complianceApi.getConsentsBySubject(dataSubjectId).then((r) => r.data),
    enabled: !!dataSubjectId,
  })

  const { data: definitionsData, isLoading: loadingDefs } = useQuery({
    queryKey: ["consent-definitions", organizationId],
    queryFn: () => complianceApi.getConsentDefinitions(organizationId).then((r) => r.data ?? []),
    enabled: !!organizationId,
  })

  const { data: pendingData } = useQuery({
    queryKey: ["consents-pending", organizationId, dataSubjectId],
    queryFn: () => complianceApi.getPendingConsents(organizationId, dataSubjectId).then((r) => r.data ?? []),
    enabled: !!organizationId && !!dataSubjectId,
  })

  const defMap = new Map<string, ConsentDefinition>(
    (definitionsData ?? []).map((d) => [d.id, d])
  )

  const revokeMutation = useMutation({
    mutationFn: (consentId: string) => complianceApi.revokeConsent(consentId),
    onSuccess: () => {
      toast.success("Consentimiento revocado.")
      queryClient.invalidateQueries({ queryKey: ["consents", dataSubjectId] })
      queryClient.invalidateQueries({ queryKey: ["consents-pending", organizationId, dataSubjectId] })
      setPendingRevoke(null)
    },
    onError: () => {
      toast.error("Error al revocar. Intenta más tarde.")
      setPendingRevoke(null)
    },
  })

  const grantMutation = useMutation({
    mutationFn: (consentId: string) => complianceApi.grantConsent(consentId),
    onSuccess: () => {
      toast.success("Consentimiento re-activado.")
      queryClient.invalidateQueries({ queryKey: ["consents", dataSubjectId] })
      queryClient.invalidateQueries({ queryKey: ["consents-pending", organizationId, dataSubjectId] })
      setPendingGrant(null)
    },
    onError: () => {
      toast.error("Error al activar. Intenta más tarde.")
      setPendingGrant(null)
    },
  })

  const acceptPendingMutation = useMutation({
    mutationFn: (definitionId: string) =>
      complianceApi.createConsent({
        organizationId,
        dataSubjectId,
        definitionId,
        collectionMethod: "WEB_PORTAL",
      }),
    onSuccess: () => {
      toast.success("Consentimiento aceptado.")
      queryClient.invalidateQueries({ queryKey: ["consents", dataSubjectId] })
      queryClient.invalidateQueries({ queryKey: ["consents-pending", organizationId, dataSubjectId] })
    },
    onError: () => toast.error("Error al aceptar. Intenta más tarde."),
  })

  const consents    = consentsData?.data ?? []
  const pending     = pendingData ?? []
  const active      = consents.filter((c) => c.status === "ACTIVE")
  const historical  = consents.filter((c) => c.status !== "ACTIVE")

  const isLoading = loadingConsents || loadingDefs

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground">Mis Consentimientos</h2>
        <p className="text-sm mt-0.5 text-muted-foreground">
          Gestiona los consentimientos que has otorgado para el tratamiento de tus datos personales.
        </p>
      </div>

      {/* Pendientes de respuesta */}
      {pending.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-red-500" />
            <h3 className="text-xs font-semibold uppercase tracking-wide text-red-500">
              Pendientes de respuesta ({pending.length})
            </h3>
          </div>
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-3">
            <p className="text-xs text-red-700">
              La organización ha publicado nuevos consentimientos que requieren tu respuesta.
            </p>
            {pending.map((def) => (
              <PendingDefinitionCard
                key={def.id}
                definition={def}
                onAccept={() => acceptPendingMutation.mutate(def.id)}
                isLoading={acceptPendingMutation.isPending}
              />
            ))}
          </div>
        </section>
      )}

      {/* Vacío */}
      {consents.length === 0 && pending.length === 0 && (
        <div className="rounded-2xl border p-8 text-center border-border">
          <ShieldCheck className="w-8 h-8 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-sm font-medium text-foreground">Sin consentimientos registrados</p>
          <p className="text-xs mt-1 text-muted-foreground">
            No tienes consentimientos asociados a tu cuenta en este momento.
          </p>
        </div>
      )}

      {/* Activos */}
      {active.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Activos ({active.length})
          </h3>
          {active.map((c) => {
            const def = c.definitionId ? defMap.get(c.definitionId) : undefined
            return (
              <ConsentCard
                key={c.id}
                consent={c}
                definition={def}
                onRevoke={def?.required ? undefined : () => setPendingRevoke(c)}
              />
            )
          })}
        </section>
      )}

      {/* Histórico */}
      {historical.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Histórico ({historical.length})
          </h3>
          {historical.map((c) => {
            const def = c.definitionId ? defMap.get(c.definitionId) : undefined
            return (
              <ConsentCard
                key={c.id}
                consent={c}
                definition={def}
                onGrant={def?.required ? undefined : () => setPendingGrant(c)}
              />
            )
          })}
        </section>
      )}

      {/* Dialog: confirmar revocación */}
      <ConfirmDialog
        open={!!pendingRevoke}
        onClose={() => setPendingRevoke(null)}
        onConfirm={() => pendingRevoke && revokeMutation.mutate(pendingRevoke.id)}
        isLoading={revokeMutation.isPending}
        title="Revocar consentimiento"
        description={`¿Deseas revocar el consentimiento "${pendingRevoke?.definitionId ? (defMap.get(pendingRevoke.definitionId)?.title ?? "seleccionado") : "seleccionado"}"? Esta acción puede limitar el tratamiento de tus datos.`}
        confirmLabel="Revocar"
        confirmStyle={{ background: "hsl(var(--destructive))", color: "hsl(var(--destructive-foreground))" }}
        icon={<ShieldOff className="w-5 h-5" style={{ color: "hsl(var(--destructive))" }} />}
        iconBg="hsl(var(--destructive) / 0.1)"
      />

      {/* Dialog: confirmar re-activación */}
      <ConfirmDialog
        open={!!pendingGrant}
        onClose={() => setPendingGrant(null)}
        onConfirm={() => pendingGrant && grantMutation.mutate(pendingGrant.id)}
        isLoading={grantMutation.isPending}
        title="Re-activar consentimiento"
        description={`¿Deseas volver a otorgar el consentimiento "${pendingGrant?.definitionId ? (defMap.get(pendingGrant.definitionId)?.title ?? "seleccionado") : "seleccionado"}"?`}
        confirmLabel="Re-activar"
        confirmStyle={{ background: "hsl(142 71% 35%)", color: "white" }}
        icon={<ShieldCheck className="w-5 h-5" style={{ color: "hsl(142 71% 35%)" }} />}
        iconBg="hsl(142 71% 35% / 0.1)"
      />
    </div>
  )
}

function PendingDefinitionCard({
  definition, onAccept, isLoading,
}: { definition: ConsentDefinition; onAccept: () => void; isLoading: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg bg-white border border-red-100 p-3">
      <div className="space-y-0.5 min-w-0">
        <p className="text-sm font-medium text-foreground">{definition.title}</p>
        {definition.description && (
          <p className="text-xs text-muted-foreground">{definition.description}</p>
        )}
        <p className="text-xs text-muted-foreground/70">
          {LEGAL_BASIS_LABEL[definition.legalBasis] ?? definition.legalBasis}
        </p>
      </div>
      <button
        onClick={onAccept}
        disabled={isLoading}
        className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Aceptar"}
      </button>
    </div>
  )
}

function ConsentCard({
  consent, definition, onRevoke, onGrant,
}: {
  consent: Consent
  definition?: ConsentDefinition
  onRevoke?: () => void
  onGrant?: () => void
}) {
  const cfg      = statusConfig[consent.status]
  const isLocked = definition?.required === true

  return (
    <div className="rounded-2xl border bg-white overflow-hidden border-border">
      {/* Top bar */}
      <div className="px-5 py-3 flex items-center gap-3 border-b bg-muted/50 border-border">
        <span
          className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{ background: cfg.bg, color: cfg.color }}
        >
          {cfg.icon}
          {cfg.label}
        </span>
        {isLocked && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Lock className="w-3 h-3" />
            Requerido
          </span>
        )}
        <span className="text-xs font-mono ml-auto text-muted-foreground">
          {formatDate(consent.grantedAt)}
        </span>
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-2">
        <p className="text-sm font-medium text-foreground">
          {definition?.title ?? "Consentimiento"}
        </p>
        {definition?.description && (
          <p className="text-xs text-muted-foreground">{definition.description}</p>
        )}
        <p className="text-xs text-muted-foreground/70">
          {definition
            ? (LEGAL_BASIS_LABEL[definition.legalBasis] ?? definition.legalBasis)
            : "—"}
        </p>
        {consent.revokedAt && (
          <p className="text-xs text-muted-foreground">
            Revocado: {formatDate(consent.revokedAt)}
          </p>
        )}
        {isLocked && consent.status === "ACTIVE" && (
          <p className="text-xs text-muted-foreground italic">
            Este consentimiento es obligatorio para acceder al sistema y no puede ser revocado.
          </p>
        )}
      </div>

      {/* Footer */}
      {(onRevoke || onGrant) && (
        <div className="px-5 py-3 border-t border-border flex justify-end">
          {onRevoke && consent.status === "ACTIVE" && (
            <button
              onClick={onRevoke}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: "hsl(var(--destructive))", background: "hsl(var(--destructive) / 0.08)" }}
            >
              Revocar
            </button>
          )}
          {onGrant && consent.status === "REVOKED" && (
            <button
              onClick={onGrant}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: "hsl(142 71% 35%)", background: "hsl(142 71% 35% / 0.1)" }}
            >
              Re-activar
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function ConfirmDialog({
  open, onClose, onConfirm, isLoading,
  title, description, confirmLabel, confirmStyle, icon, iconBg,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  isLoading: boolean
  title: string
  description: string
  confirmLabel: string
  confirmStyle: React.CSSProperties
  icon: React.ReactNode
  iconBg: string
}) {
  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm focus:outline-none border border-border"
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
            style={{ background: iconBg }}>
            {icon}
          </div>
          <Dialog.Title className="text-sm font-bold mb-1 text-foreground">{title}</Dialog.Title>
          <Dialog.Description className="text-xs mb-5 leading-relaxed text-muted-foreground">
            {description}
          </Dialog.Description>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 text-xs rounded-lg border font-medium transition-colors hover:bg-muted border-border text-muted-foreground"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 px-4 py-2 text-xs rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors"
              style={confirmStyle}
            >
              {isLoading && <Loader2 className="w-3 h-3 animate-spin" />}
              {confirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

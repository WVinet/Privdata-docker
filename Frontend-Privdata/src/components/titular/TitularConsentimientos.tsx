import { useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, ShieldCheck, ShieldOff, Clock, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { complianceApi } from "@/lib/api"
import type { Consent, ConsentStatus, DataCategory } from "@/types/compliance"

interface Props {
  dataSubjectId: string
  organizationId: string
}

const statusConfig: Record<ConsentStatus, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  ACTIVE:    { label: "Activo",    icon: <ShieldCheck className="w-3.5 h-3.5" />, color: "hsl(142 71% 35%)",  bg: "hsl(142 71% 35% / 0.1)" },
  REVOKED:   { label: "Revocado", icon: <ShieldOff  className="w-3.5 h-3.5" />, color: "hsl(var(--destructive))", bg: "hsl(var(--destructive) / 0.08)" },
  EXPIRED:   { label: "Expirado", icon: <Clock      className="w-3.5 h-3.5" />, color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))" },
  SUSPENDED: { label: "Suspendido", icon: <AlertCircle className="w-3.5 h-3.5" />, color: "hsl(36 70% 40%)", bg: "hsl(36 70% 40% / 0.1)" },
}

const collectionLabels: Record<string, string> = {
  WEB_PORTAL:  "Portal web",
  ADMIN_PANEL: "Panel admin",
  EMAIL:       "Correo electrónico",
  PHONE:       "Teléfono",
  IN_PERSON:   "Presencial",
}

function formatDate(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" })
}

function shortId(id: string) {
  return id.slice(0, 8).toUpperCase()
}

export default function TitularConsentimientos({ dataSubjectId, organizationId }: Props) {
  const queryClient = useQueryClient()
  const [pendingRevoke, setPendingRevoke] = useState<Consent | null>(null)

  const { data: consentsData, isLoading: loadingConsents } = useQuery({
    queryKey: ["consents", dataSubjectId],
    queryFn: () => complianceApi.getConsentsBySubject(dataSubjectId).then((r) => r.data),
    enabled: !!dataSubjectId,
  })

  const { data: categoriesData } = useQuery({
    queryKey: ["data-categories"],
    queryFn: () => complianceApi.getDataCategories().then((r) => r.data),
  })

  const categoryMap = new Map<string, DataCategory>(
    (categoriesData?.data ?? []).map((c) => [c.id, c])
  )

  const revokeMutation = useMutation({
    mutationFn: (consentId: string) => complianceApi.revokeConsent(consentId),
    onSuccess: (res) => {
      if (res.data?.success === false) {
        toast.error(res.data.message ?? "No se pudo revocar el consentimiento.")
        return
      }
      toast.success("Consentimiento revocado correctamente.")
      queryClient.invalidateQueries({ queryKey: ["consents", dataSubjectId] })
      setPendingRevoke(null)
    },
    onError: () => {
      toast.error("Error al conectar con el servicio. Intenta más tarde.")
      setPendingRevoke(null)
    },
  })

  const consents = consentsData?.data ?? []
  const active    = consents.filter((c) => c.status === "ACTIVE")
  const inactive  = consents.filter((c) => c.status !== "ACTIVE")

  if (loadingConsents) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold" style={{ color: "hsl(var(--foreground))" }}>
          Mis Consentimientos
        </h2>
        <p className="text-sm mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
          Gestiona los consentimientos que has otorgado para el tratamiento de tus datos personales.
        </p>
      </div>

      {consents.length === 0 && (
        <div
          className="rounded-2xl border p-8 text-center"
          style={{ borderColor: "hsl(var(--border))" }}
        >
          <ShieldCheck className="w-8 h-8 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>
            Sin consentimientos registrados
          </p>
          <p className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
            No tienes consentimientos asociados a tu cuenta en este momento.
          </p>
        </div>
      )}

      {/* Activos */}
      {active.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "hsl(var(--muted-foreground))" }}>
            Activos ({active.length})
          </h3>
          {active.map((c) => (
            <ConsentCard
              key={c.id}
              consent={c}
              categoryMap={categoryMap}
              onRevoke={() => setPendingRevoke(c)}
            />
          ))}
        </section>
      )}

      {/* Inactivos */}
      {inactive.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "hsl(var(--muted-foreground))" }}>
            Histórico ({inactive.length})
          </h3>
          {inactive.map((c) => (
            <ConsentCard
              key={c.id}
              consent={c}
              categoryMap={categoryMap}
            />
          ))}
        </section>
      )}

      {/* Revoke confirmation dialog */}
      <Dialog.Root open={!!pendingRevoke} onOpenChange={(open) => { if (!open) setPendingRevoke(null) }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm" />
          <Dialog.Content
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm focus:outline-none border"
            style={{ borderColor: "hsl(var(--border))" }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
              style={{ background: "hsl(var(--destructive) / 0.1)" }}
            >
              <ShieldOff className="w-5 h-5" style={{ color: "hsl(var(--destructive))" }} />
            </div>
            <Dialog.Title className="text-sm font-bold mb-1" style={{ color: "hsl(var(--foreground))" }}>
              Revocar consentimiento
            </Dialog.Title>
            <Dialog.Description className="text-xs mb-5 leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
              ¿Deseas revocar el consentimiento <strong>#{pendingRevoke ? shortId(pendingRevoke.id) : ""}</strong>?
              Esta acción puede limitar el tratamiento de tus datos por parte de la organización.
            </Dialog.Description>
            <div className="flex gap-2">
              <button
                onClick={() => setPendingRevoke(null)}
                disabled={revokeMutation.isPending}
                className="flex-1 px-4 py-2 text-xs rounded-lg border font-medium transition-colors hover:bg-muted"
                style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}
              >
                Cancelar
              </button>
              <button
                onClick={() => pendingRevoke && revokeMutation.mutate(pendingRevoke.id)}
                disabled={revokeMutation.isPending}
                className="flex-1 px-4 py-2 text-xs rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors"
                style={{ background: "hsl(var(--destructive))", color: "hsl(var(--destructive-foreground))" }}
              >
                {revokeMutation.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                Revocar
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}

function ConsentCard({
  consent,
  categoryMap,
  onRevoke,
}: {
  consent: Consent
  categoryMap: Map<string, DataCategory>
  onRevoke?: () => void
}) {
  const cfg = statusConfig[consent.status]
  const categories = consent.categoryIds
    .map((id) => categoryMap.get(id))
    .filter(Boolean) as DataCategory[]

  return (
    <div
      className="rounded-2xl border bg-white overflow-hidden"
      style={{ borderColor: "hsl(var(--border))" }}
    >
      {/* Top bar */}
      <div
        className="px-5 py-3 flex items-center gap-3 border-b"
        style={{ background: "hsl(var(--muted) / 0.5)", borderColor: "hsl(var(--border))" }}
      >
        <span
          className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{ background: cfg.bg, color: cfg.color }}
        >
          {cfg.icon}
          {cfg.label}
        </span>
        <span className="text-xs font-mono ml-auto" style={{ color: "hsl(var(--muted-foreground))" }}>
          #{shortId(consent.id)}
        </span>
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-3">
        {consent.notes && (
          <p className="text-sm" style={{ color: "hsl(var(--foreground))" }}>{consent.notes}</p>
        )}

        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
          <div>
            <span className="font-medium">Otorgado</span>
            <span className="block">{formatDate(consent.grantedAt)}</span>
          </div>
          {consent.expiresAt && (
            <div>
              <span className="font-medium">Vence</span>
              <span className="block">{formatDate(consent.expiresAt)}</span>
            </div>
          )}
          {consent.revokedAt && (
            <div>
              <span className="font-medium">Revocado</span>
              <span className="block">{formatDate(consent.revokedAt)}</span>
            </div>
          )}
          <div>
            <span className="font-medium">Canal</span>
            <span className="block">{collectionLabels[consent.collectionMethod] ?? consent.collectionMethod}</span>
          </div>
        </div>

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {categories.map((cat) => (
              <span
                key={cat.id}
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={
                  cat.sensitive
                    ? { background: "hsl(var(--destructive) / 0.08)", color: "hsl(var(--destructive))" }
                    : { background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }
                }
              >
                {cat.sensitive ? "⚠ " : ""}{cat.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer — only for ACTIVE */}
      {consent.status === "ACTIVE" && onRevoke && (
        <div
          className="px-5 py-3 border-t flex justify-end"
          style={{ borderColor: "hsl(var(--border))" }}
        >
          <button
            onClick={onRevoke}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: "hsl(var(--destructive))", background: "hsl(var(--destructive) / 0.08)" }}
          >
            Revocar consentimiento
          </button>
        </div>
      )}
    </div>
  )
}

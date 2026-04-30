import { useState } from "react"
import * as Switch from "@radix-ui/react-switch"
import * as Dialog from "@radix-ui/react-dialog"
import { toast } from "sonner"
import { type TitularPortalConsent } from "@/lib/mock-data"

interface Props {
  consents: TitularPortalConsent[]
}

// Paleta cálida — completamente distinta al HTML del profesor (azul/morado)
const categoryConfig: Record<
  TitularPortalConsent["category"],
  { label: string; bg: string; text: string }
> = {
  necesario:  { label: "Necesario",      bg: "hsl(var(--primary) / 0.1)",     text: "hsl(var(--primary))" },
  opcional:   { label: "Opcional",       bg: "hsl(var(--muted))",              text: "hsl(var(--muted-foreground))" },
  marketing:  { label: "Marketing",      bg: "hsl(var(--accent) / 0.15)",      text: "hsl(36 70% 32%)" },
  salud:      { label: "Datos de salud", bg: "hsl(var(--destructive) / 0.1)",  text: "hsl(var(--destructive))" },
  terceros:   { label: "Terceros",       bg: "hsl(var(--info) / 0.12)",        text: "hsl(var(--info))" },
}

function groupByGroup(consents: TitularPortalConsent[]) {
  const map: Record<string, TitularPortalConsent[]> = {}
  for (const c of consents) {
    if (!map[c.group]) map[c.group] = []
    map[c.group].push(c)
  }
  return map
}

export default function TitularConsentimientos({ consents }: Props) {
  const [localConsents, setLocalConsents] = useState(consents)
  const [pendingToggle, setPendingToggle] = useState<{
    id: string
    newValue: boolean
    label: string
  } | null>(null)

  const groups = groupByGroup(localConsents)

  function handleToggleClick(consent: TitularPortalConsent, newValue: boolean) {
    setPendingToggle({ id: consent.id, newValue, label: consent.purpose })
  }

  function confirmToggle() {
    if (!pendingToggle) return
    setLocalConsents((prev) =>
      prev.map((c) =>
        c.id === pendingToggle.id
          ? {
              ...c,
              enabled: pendingToggle.newValue,
              grantedAt: pendingToggle.newValue
                ? new Date().toISOString().slice(0, 10)
                : c.grantedAt,
            }
          : c
      )
    )
    toast(
      pendingToggle.newValue
        ? `Consentimiento otorgado: "${pendingToggle.label}"`
        : `Consentimiento revocado: "${pendingToggle.label}"`
    )
    setPendingToggle(null)
  }

  function cancelToggle() {
    setPendingToggle(null)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold" style={{ color: "hsl(var(--foreground))" }}>
            Mis Consentimientos
          </h2>
          <p className="text-sm mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
            Administra los permisos que has otorgado para el tratamiento de tus datos personales.
          </p>
        </div>
        <button
          className="shrink-0 text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors hover:bg-muted"
          style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}
          onClick={() => toast("Descargando historial de consentimientos...")}
        >
          ⬇ Historial
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {Object.entries(groups).map(([groupName, items]) => (
        <div
          key={groupName}
          className="bg-white rounded-2xl shadow-sm overflow-hidden border"
          style={{ borderColor: "hsl(var(--border))" }}
        >
          {/* Group header */}
          <div
            className="px-5 py-3 flex items-center gap-2.5 border-b"
            style={{ background: "hsl(var(--muted))", borderColor: "hsl(var(--border))" }}
          >
            <span className="text-lg">{items[0].groupIcon}</span>
            <span className="font-semibold text-sm" style={{ color: "hsl(var(--foreground))" }}>
              {groupName}
            </span>
            <span
              className="ml-auto text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}
            >
              {items.filter((i) => i.enabled).length}/{items.length} activos
            </span>
          </div>

          {/* Consent items */}
          <div className="divide-y" style={{ borderColor: "hsl(var(--border))" }}>
            {items.map((c) => {
              const cat = categoryConfig[c.category]
              return (
                <div key={c.id} className="px-5 py-4 flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span
                        className="font-semibold text-sm"
                        style={{ color: "hsl(var(--foreground))" }}
                      >
                        {c.purpose}
                      </span>
                    </div>
                    <p className="text-xs mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>
                      {c.description}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: cat.bg, color: cat.text }}
                      >
                        {cat.label}
                      </span>
                      {c.required && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            background: "hsl(var(--primary) / 0.1)",
                            color: "hsl(var(--primary))",
                          }}
                        >
                          No revocable
                        </span>
                      )}
                      <span
                        className="text-xs"
                        style={{ color: "hsl(var(--muted-foreground))" }}
                      >
                        {c.enabled && c.grantedAt ? `Desde ${c.grantedAt}` : "Sin otorgar"}
                      </span>
                    </div>
                  </div>

                  {/* Toggle */}
                  <div className="pt-0.5 shrink-0">
                    <Switch.Root
                      checked={c.enabled}
                      disabled={c.required}
                      onCheckedChange={(val) => handleToggleClick(c, val)}
                      className="relative inline-flex items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2"
                      style={{
                        width: 44,
                        height: 24,
                        background: c.required
                          ? "hsl(var(--muted-foreground) / 0.3)"
                          : c.enabled
                          ? "hsl(var(--primary))"
                          : "hsl(var(--border))",
                        cursor: c.required ? "not-allowed" : "pointer",
                        flexShrink: 0,
                      }}
                    >
                      <Switch.Thumb
                        className="block rounded-full bg-white shadow transition-transform"
                        style={{
                          width: 18,
                          height: 18,
                          transform: c.enabled ? "translateX(22px)" : "translateX(3px)",
                        }}
                      />
                    </Switch.Root>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
      </div>

      {/* Confirmation modal */}
      <Dialog.Root
        open={!!pendingToggle}
        onOpenChange={(open) => {
          if (!open) cancelToggle()
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm focus:outline-none border" style={{ borderColor: "hsl(var(--border))" }}>
            {/* Indicador de tipo de acción */}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-4"
              style={{
                background: pendingToggle?.newValue
                  ? "hsl(var(--success) / 0.12)"
                  : "hsl(var(--destructive) / 0.1)",
              }}
            >
              {pendingToggle?.newValue ? "✅" : "⚠️"}
            </div>
            <Dialog.Title
              className="text-sm font-bold mb-1"
              style={{ color: "hsl(var(--foreground))" }}
            >
              {pendingToggle?.newValue ? "Otorgar consentimiento" : "Revocar consentimiento"}
            </Dialog.Title>
            <Dialog.Description
              className="text-xs mb-5 leading-relaxed"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              {pendingToggle?.newValue
                ? `¿Deseas otorgar tu consentimiento para "${pendingToggle?.label}"? Podrás revocarlo en cualquier momento.`
                : `¿Deseas revocar tu consentimiento para "${pendingToggle?.label}"? Esta acción puede limitar algunas funcionalidades.`}
            </Dialog.Description>
            <div className="flex gap-2">
              <button
                onClick={cancelToggle}
                className="flex-1 px-4 py-2 text-xs rounded-lg border font-medium transition-colors hover:bg-muted"
                style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}
              >
                Cancelar
              </button>
              <button
                onClick={confirmToggle}
                className="flex-1 px-4 py-2 text-xs rounded-lg font-semibold transition-colors"
                style={
                  pendingToggle?.newValue
                    ? {
                        background: "hsl(var(--success))",
                        color: "hsl(var(--success-foreground))",
                      }
                    : {
                        background: "hsl(var(--destructive))",
                        color: "hsl(var(--destructive-foreground))",
                      }
                }
              >
                Confirmar
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}

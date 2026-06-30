import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Search, ShieldCheck, ShieldOff, Clock, AlertCircle, Loader2,
  ChevronLeft, ChevronRight, Plus, Lock, Unlock, FileText,
  ChevronDown, Send,
} from "lucide-react"
import { toast } from "sonner"
import * as Dialog from "@radix-ui/react-dialog"
import { complianceApi, personsApi } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import type { Consent, ConsentStatus, ConsentDefinition, DataCategory, LegalBasis } from "@/types/compliance"
import type { Person } from "@/types/person"

// ── helpers ───────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: ConsentStatus | ""; label: string }[] = [
  { value: "",          label: "Todos los estados" },
  { value: "ACTIVE",    label: "Activo" },
  { value: "REVOKED",   label: "Revocado" },
  { value: "EXPIRED",   label: "Expirado" },
  { value: "SUSPENDED", label: "Suspendido" },
]

const LEGAL_BASIS_OPTIONS: { value: LegalBasis; label: string }[] = [
  { value: "CONSENTIMIENTO",   label: "Art. 12 — Consentimiento" },
  { value: "CONTRATO",         label: "Art. 13 — Contrato" },
  { value: "OBLIGACION_LEGAL", label: "Art. 13 — Obligación legal" },
  { value: "INTERES_LEGITIMO", label: "Art. 13 — Interés legítimo" },
  { value: "INTERES_VITAL",    label: "Art. 13 — Interés vital" },
  { value: "FUNCION_PUBLICA",  label: "Art. 20 — Función pública" },
]

const statusCfg: Record<ConsentStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  ACTIVE:    { label: "Activo",     color: "hsl(142 71% 35%)",             bg: "hsl(142 71% 35% / 0.1)", icon: <ShieldCheck className="w-3 h-3" /> },
  REVOKED:   { label: "Revocado",   color: "hsl(var(--destructive))",      bg: "hsl(var(--destructive) / 0.08)", icon: <ShieldOff  className="w-3 h-3" /> },
  EXPIRED:   { label: "Expirado",   color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))",       icon: <Clock       className="w-3 h-3" /> },
  SUSPENDED: { label: "Suspendido", color: "hsl(36 70% 40%)",              bg: "hsl(36 70% 40% / 0.1)",  icon: <AlertCircle className="w-3 h-3" /> },
}

const collectionLabels: Record<string, string> = {
  WEB_PORTAL:  "Portal web",
  ADMIN_PANEL: "Panel admin",
  EMAIL:       "Correo",
  PHONE:       "Teléfono",
  IN_PERSON:   "Presencial",
}

function fmt(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" })
}
function shortId(id: string) { return id.slice(0, 8).toUpperCase() }

// ── main component ────────────────────────────────────────────────────────────

type Tab = "registros" | "definiciones"

export default function ConsentsPage() {
  const { getUser }    = useAuth()
  const orgId          = getUser()?.organizationId ?? ""
  const [tab, setTab]  = useState<Tab>("registros")

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-y-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Consentimientos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gestión de definiciones y registros de consentimientos (Ley 21.719)
          </p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-border">
        {([
          { id: "registros",    label: "Registros",    icon: <ShieldCheck className="w-4 h-4" /> },
          { id: "definiciones", label: "Definiciones", icon: <FileText    className="w-4 h-4" /> },
        ] as { id: Tab; label: string; icon: React.ReactNode }[]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px"
            style={{
              borderColor: tab === t.id ? "hsl(var(--primary))" : "transparent",
              color: tab === t.id ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
            }}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {tab === "registros"    && <RegistrosTab orgId={orgId} />}
      {tab === "definiciones" && <DefinicionesTab orgId={orgId} />}
    </div>
  )
}

// ── tab: registros (accordion agrupado por titular) ───────────────────────────

function RegistrosTab({ orgId }: { orgId: string }) {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<ConsentStatus | "">("")
  const [search,       setSearch]       = useState("")
  const [page,         setPage]         = useState(0)
  const [pendingRevoke, setPendingRevoke] = useState<Consent | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const PAGE_SIZE = 50

  const { data: consentsPage, isLoading } = useQuery({
    queryKey: ["admin-consents", statusFilter, page],
    queryFn: () => complianceApi.listConsents({ status: statusFilter || undefined, page, size: PAGE_SIZE }).then((r) => r.data),
  })

  const { data: personsData } = useQuery({
    queryKey: ["persons", orgId],
    queryFn: () => personsApi.list(orgId).then((r) => r.data),
    enabled: !!orgId,
  })

  const { data: categoriesData } = useQuery({
    queryKey: ["data-categories"],
    queryFn: () => complianceApi.getDataCategories().then((r) => r.data),
  })

  const { data: definitionsData } = useQuery({
    queryKey: ["consent-definitions", orgId],
    queryFn: () => complianceApi.getConsentDefinitions(orgId).then((r) => r.data ?? []),
    enabled: !!orgId,
  })

  const personMap   = new Map<string, Person>((personsData?.data ?? []).map((p) => [p.id, p]))
  const categoryMap = new Map(
    (categoriesData ?? []).map((c: DataCategory) => [c.id, c]))
  const defMap      = new Map<string, ConsentDefinition>((definitionsData ?? []).map((d) => [d.id, d]))

  const revokeMutation = useMutation({
    mutationFn: (id: string) => complianceApi.revokeConsent(id),
    onSuccess: (res) => {
      if ((res.data as { success?: boolean })?.success === false) {
        toast.error("No se pudo revocar.")
        return
      }
      toast.success("Consentimiento revocado.")
      queryClient.invalidateQueries({ queryKey: ["admin-consents"] })
      setPendingRevoke(null)
    },
    onError: () => { toast.error("Error al conectar."); setPendingRevoke(null) },
  })

  const consents      = consentsPage?.content ?? []
  const totalPages    = consentsPage?.totalPages ?? 1
  const totalElements = consentsPage?.totalElements ?? 0

  const filtered = consents.filter((c) => {
    if (search) {
      const person = personMap.get(c.dataSubjectId)
      const term   = search.toLowerCase()
      if (
        !(person?.fullName?.toLowerCase() ?? "").includes(term) &&
        !(person?.email?.toLowerCase()    ?? "").includes(term) &&
        !c.dataSubjectId.toLowerCase().includes(term) &&
        !(c.notes ?? "").toLowerCase().includes(term)
      ) return false
    }
    return true
  })

  // Group by dataSubjectId, sort each group newest first
  const grouped = new Map<string, Consent[]>()
  filtered.forEach((c) => {
    const arr = grouped.get(c.dataSubjectId) ?? []
    arr.push(c)
    grouped.set(c.dataSubjectId, arr)
  })
  grouped.forEach((arr, key) => {
    grouped.set(key, [...arr].sort((a, b) =>
      new Date(b.grantedAt ?? 0).getTime() - new Date(a.grantedAt ?? 0).getTime()
    ))
  })

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const active  = consents.filter((c) => c.status === "ACTIVE").length
  const revoked = consents.filter((c) => c.status === "REVOKED").length
  const expired = consents.filter((c) => c.status === "EXPIRED").length

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Activos",   count: active,  cfg: statusCfg.ACTIVE },
          { label: "Revocados", count: revoked, cfg: statusCfg.REVOKED },
          { label: "Expirados", count: expired, cfg: statusCfg.EXPIRED },
        ].map(({ label, count, cfg }) => (
          <div key={label} className="rounded-xl border p-4 flex items-center gap-3 border-border">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: cfg.bg, color: cfg.color }}>
              {cfg.icon}
            </div>
            <div>
              <p className="text-2xl font-bold leading-none" style={{ color: cfg.color }}>{count}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por titular, email o notas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as ConsentStatus | ""); setPage(0) }}
              className="text-sm border rounded-md px-3 py-2 bg-background text-foreground border-border"
            >
              {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : grouped.size === 0 ? (
            <p className="text-center text-muted-foreground py-10 text-sm">
              No se encontraron consentimientos.
            </p>
          ) : (
            <>
              <div className="space-y-2">
                {Array.from(grouped.entries()).map(([subjectId, subjectConsents]) => {
                  const person  = personMap.get(subjectId)
                  const latest  = subjectConsents[0]
                  const isOpen  = expanded.has(subjectId)
                  const latestCfg = statusCfg[latest.status]

                  return (
                    <div key={subjectId} className="rounded-xl border border-border overflow-hidden">
                      {/* Accordion header */}
                      <button
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors"
                        onClick={() => toggleExpanded(subjectId)}
                      >
                        <ChevronDown
                          className="w-4 h-4 shrink-0 text-muted-foreground transition-transform"
                          style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {person?.fullName ?? shortId(subjectId)}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {person?.rut ?? person?.email ?? subjectId}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs text-muted-foreground hidden sm:inline">
                            {subjectConsents.length} registro{subjectConsents.length !== 1 ? "s" : ""}
                          </span>
                          <span
                            className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: latestCfg.bg, color: latestCfg.color }}
                          >
                            {latestCfg.icon}
                            {latestCfg.label}
                          </span>
                          <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:inline">
                            {fmt(latest.grantedAt)}
                          </span>
                        </div>
                      </button>

                      {/* Accordion body */}
                      {isOpen && (
                        <div className="border-t border-border bg-muted/20">
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-border">
                                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-2 uppercase tracking-wide">Estado</th>
                                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-2 uppercase tracking-wide">Descripción</th>
                                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-2 uppercase tracking-wide">Canal</th>
                                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-2 uppercase tracking-wide">Fecha</th>
                                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-2 uppercase tracking-wide">Categorías</th>
                                  <th className="px-4 py-2" />
                                </tr>
                              </thead>
                              <tbody>
                                {subjectConsents.map((c) => {
                                  const def  = c.definitionId ? defMap.get(c.definitionId) : undefined
                                  const cfg  = statusCfg[c.status]
                                  const cats = c.categoryIds
                                    .map((id) => categoryMap.get(id))
                                    .filter(Boolean) as DataCategory[]

                                  return (
                                    <tr key={c.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                                      <td className="px-4 py-2.5">
                                        <span
                                          className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                                          style={{ background: cfg.bg, color: cfg.color }}
                                        >
                                          {cfg.icon}{cfg.label}
                                        </span>
                                      </td>
                                      <td className="px-4 py-2.5 max-w-xs">
                                        {def ? (
                                          <div className="flex items-center gap-1.5">
                                            {def.required && <Lock className="w-3 h-3 text-muted-foreground shrink-0" />}
                                            <span className="text-sm text-foreground truncate">{def.title}</span>
                                          </div>
                                        ) : (
                                          <span className="font-mono text-xs text-muted-foreground">#{shortId(c.id)}</span>
                                        )}
                                        {def?.description && (
                                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{def.description}</p>
                                        )}
                                      </td>
                                      <td className="px-4 py-2.5 text-sm text-muted-foreground whitespace-nowrap">
                                        {collectionLabels[c.collectionMethod] ?? c.collectionMethod}
                                      </td>
                                      <td className="px-4 py-2.5 text-sm text-muted-foreground whitespace-nowrap">
                                        {fmt(c.grantedAt)}
                                      </td>
                                      <td className="px-4 py-2.5">
                                        {cats.length === 0 ? (
                                          <span className="text-xs text-muted-foreground">—</span>
                                        ) : (
                                          <div className="flex flex-wrap gap-1">
                                            {cats.slice(0, 2).map((cat) => (
                                              <span key={cat.id} className="text-xs px-1.5 py-0.5 rounded-full"
                                                style={cat.sensitive
                                                  ? { background: "hsl(var(--destructive) / 0.08)", color: "hsl(var(--destructive))" }
                                                  : { background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }
                                                }>
                                                {cat.sensitive ? "⚠ " : ""}{cat.name}
                                              </span>
                                            ))}
                                            {cats.length > 2 && (
                                              <span className="text-xs text-muted-foreground">+{cats.length - 2}</span>
                                            )}
                                          </div>
                                        )}
                                      </td>
                                      <td className="px-4 py-2.5 text-right">
                                        {c.status === "ACTIVE" && (
                                          <button
                                            onClick={() => setPendingRevoke(c)}
                                            className="text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors"
                                            style={{ color: "hsl(var(--destructive))", background: "hsl(var(--destructive) / 0.08)" }}
                                          >
                                            Revocar
                                          </button>
                                        )}
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 mt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    {totalElements} consentimiento{totalElements !== 1 ? "s" : ""}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-xs px-2">Pág. {page + 1} / {totalPages}</span>
                    <Button variant="ghost" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Revoke dialog */}
      <Dialog.Root open={!!pendingRevoke} onOpenChange={(o) => { if (!o) setPendingRevoke(null) }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-border focus:outline-none">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-destructive/10">
              <ShieldOff className="w-5 h-5 text-destructive" />
            </div>
            <Dialog.Title className="text-sm font-bold mb-1">Revocar consentimiento</Dialog.Title>
            <Dialog.Description className="text-xs mb-5 leading-relaxed text-muted-foreground">
              ¿Confirmas la revocación?{" "}
              {pendingRevoke && personMap.get(pendingRevoke.dataSubjectId) && (
                <>Titular: <strong>{personMap.get(pendingRevoke.dataSubjectId)!.fullName}</strong>.</>
              )}{" "}
              Esta acción quedará registrada en el historial de eventos.
            </Dialog.Description>
            <div className="flex gap-2">
              <button onClick={() => setPendingRevoke(null)} disabled={revokeMutation.isPending}
                className="flex-1 px-4 py-2 text-xs rounded-lg border font-medium hover:bg-muted transition-colors border-border text-muted-foreground">
                Cancelar
              </button>
              <button onClick={() => pendingRevoke && revokeMutation.mutate(pendingRevoke.id)}
                disabled={revokeMutation.isPending}
                className="flex-1 px-4 py-2 text-xs rounded-lg font-semibold flex items-center justify-center gap-1.5 bg-destructive text-destructive-foreground">
                {revokeMutation.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                Confirmar
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}

// ── tab: definiciones ─────────────────────────────────────────────────────────

function DefinicionesTab({ orgId }: { orgId: string }) {
  const queryClient   = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [pendingPublish, setPendingPublish] = useState<ConsentDefinition | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["consent-definitions", orgId],
    queryFn: () => complianceApi.getConsentDefinitions(orgId).then((r) => r.data ?? []),
    enabled: !!orgId,
  })

  const definitions = data ?? []

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      complianceApi.setConsentDefinitionActive(id, active),
    onSuccess: (_, vars) => {
      toast.success(vars.active ? "Definición publicada. Los titulares la verán como pendiente." : "Definición desactivada.")
      queryClient.invalidateQueries({ queryKey: ["consent-definitions", orgId] })
      setPendingPublish(null)
    },
    onError: () => toast.error("Error al actualizar."),
  })

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Define qué consentimientos solicita la organización. Publícalos para que los titulares los vean como pendientes.
        </p>
        <Button onClick={() => setShowForm(true)} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          Nueva definición
        </Button>
      </div>

      <Card>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : definitions.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <FileText className="w-8 h-8 mx-auto text-muted-foreground opacity-40" />
              <p className="text-sm font-medium text-foreground">Sin definiciones</p>
              <p className="text-xs text-muted-foreground">
                Crea la primera definición para que aparezca en el perfil de los titulares.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {definitions.map((def) => (
                <DefinicionRow
                  key={def.id}
                  definition={def}
                  onPublish={() => setPendingPublish(def)}
                  onDeactivate={() => toggleMutation.mutate({ id: def.id, active: false })}
                  isUpdating={toggleMutation.isPending}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogo: publicar definición */}
      <Dialog.Root open={!!pendingPublish} onOpenChange={(o) => { if (!o) setPendingPublish(null) }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-border focus:outline-none">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-primary/10">
              <Send className="w-5 h-5 text-primary" />
            </div>
            <Dialog.Title className="text-sm font-bold mb-1">Publicar a titulares</Dialog.Title>
            <Dialog.Description className="text-xs mb-4 leading-relaxed text-muted-foreground">
              La definición <strong>"{pendingPublish?.title}"</strong> será visible para todos los titulares que aún no la hayan aceptado. Aparecerá como pendiente de respuesta en su portal.
            </Dialog.Description>
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 mb-5">
              <p className="text-xs text-amber-700">
                Los titulares verán un badge de notificación hasta que respondan este consentimiento.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPendingPublish(null)}
                disabled={toggleMutation.isPending}
                className="flex-1 px-4 py-2 text-xs rounded-lg border font-medium hover:bg-muted transition-colors border-border text-muted-foreground"
              >
                Cancelar
              </button>
              <button
                onClick={() => pendingPublish && toggleMutation.mutate({ id: pendingPublish.id, active: true })}
                disabled={toggleMutation.isPending}
                className="flex-1 px-4 py-2 text-xs rounded-lg font-semibold flex items-center justify-center gap-1.5 bg-primary text-primary-foreground"
              >
                {toggleMutation.isPending
                  ? <Loader2 className="w-3 h-3 animate-spin" />
                  : <Send className="w-3 h-3" />
                }
                Publicar
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <NewDefinicionDialog
        open={showForm}
        onClose={() => setShowForm(false)}
        orgId={orgId}
        onCreated={() => queryClient.invalidateQueries({ queryKey: ["consent-definitions", orgId] })}
      />
    </>
  )
}

function DefinicionRow({
  definition, onPublish, onDeactivate, isUpdating,
}: {
  definition: ConsentDefinition
  onPublish: () => void
  onDeactivate: () => void
  isUpdating: boolean
}) {
  return (
    <div className={`rounded-xl border p-4 flex items-start gap-4 transition-opacity ${!definition.active ? "opacity-70" : ""} border-border`}>
      <div className="mt-0.5 shrink-0">
        {definition.required
          ? <Lock   className="w-4 h-4 text-muted-foreground" />
          : <Unlock className="w-4 h-4 text-muted-foreground" />
        }
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-foreground">{definition.title}</p>
          {definition.required && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
              Requerido
            </span>
          )}
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            definition.active
              ? "bg-green-100 text-green-700"
              : "bg-muted text-muted-foreground"
          }`}>
            {definition.active ? "Publicada" : "Inactiva"}
          </span>
        </div>
        {definition.description && (
          <p className="text-xs text-muted-foreground">{definition.description}</p>
        )}
        <p className="text-xs text-muted-foreground/70">
          {LEGAL_BASIS_OPTIONS.find((o) => o.value === definition.legalBasis)?.label ?? definition.legalBasis}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {!definition.active ? (
          <button
            onClick={onPublish}
            disabled={isUpdating}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Send className="w-3 h-3" />
            Publicar
          </button>
        ) : (
          <button
            onClick={onDeactivate}
            disabled={isUpdating}
            className="text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors hover:bg-muted disabled:opacity-50 border-border text-muted-foreground"
          >
            Retirar
          </button>
        )}
      </div>
    </div>
  )
}

function NewDefinicionDialog({
  open, onClose, orgId, onCreated,
}: { open: boolean; onClose: () => void; orgId: string; onCreated: () => void }) {
  const [title,       setTitle]       = useState("")
  const [description, setDescription] = useState("")
  const [required,    setRequired]    = useState(false)
  const [legalBasis,  setLegalBasis]  = useState<LegalBasis>("CONSENTIMIENTO")
  const [error,       setError]       = useState("")

  const mutation = useMutation({
    mutationFn: () =>
      complianceApi.createConsentDefinition({
        organizationId: orgId,
        title:          title.trim(),
        description:    description.trim() || undefined,
        required,
        legalBasis,
      }),
    onSuccess: () => {
      toast.success("Definición creada correctamente.")
      onCreated()
      handleClose()
    },
    onError: () => setError("Error al crear la definición. Intenta de nuevo."),
  })

  function handleClose() {
    setTitle(""); setDescription(""); setRequired(false)
    setLegalBasis("CONSENTIMIENTO"); setError("")
    onClose()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!title.trim()) { setError("El título es obligatorio."); return }
    mutation.mutate()
  }

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border border-border focus:outline-none">
          <Dialog.Title className="text-base font-bold mb-1 text-foreground">
            Nueva definición de consentimiento
          </Dialog.Title>
          <Dialog.Description className="text-xs text-muted-foreground mb-5">
            Los titulares verán este consentimiento cuando sea publicado. Usa "Publicar" para activarlo.
          </Dialog.Description>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="def-title">Título *</Label>
              <Input
                id="def-title"
                placeholder="Ej: Política de privacidad y términos de uso"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={mutation.isPending}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="def-desc">Descripción</Label>
              <textarea
                id="def-desc"
                placeholder="Describe brevemente el propósito de este consentimiento..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={mutation.isPending}
                rows={3}
                className="w-full text-sm rounded-md border border-border px-3 py-2 bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="def-basis">Base legal *</Label>
              <select
                id="def-basis"
                value={legalBasis}
                onChange={(e) => setLegalBasis(e.target.value as LegalBasis)}
                disabled={mutation.isPending}
                className="w-full text-sm border rounded-md px-3 py-2 bg-background text-foreground border-border"
              >
                {LEGAL_BASIS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer border-border hover:bg-muted/30 transition-colors">
              <input
                type="checkbox"
                checked={required}
                onChange={(e) => setRequired(e.target.checked)}
                disabled={mutation.isPending}
                className="mt-0.5 w-4 h-4 accent-primary"
              />
              <div>
                <p className="text-sm font-medium text-foreground">Requerido</p>
                <p className="text-xs text-muted-foreground">
                  El titular no puede desmarcar este consentimiento. Úsalo solo para elementos esenciales del servicio.
                </p>
              </div>
            </label>

            {error && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button type="button" onClick={handleClose} disabled={mutation.isPending}
                className="flex-1 px-4 py-2 text-xs rounded-lg border font-medium hover:bg-muted transition-colors border-border text-muted-foreground">
                Cancelar
              </button>
              <button type="submit" disabled={mutation.isPending || !title.trim()}
                className="flex-1 px-4 py-2 text-xs rounded-lg font-semibold flex items-center justify-center gap-1.5 bg-primary text-primary-foreground disabled:opacity-50 transition-colors">
                {mutation.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                Crear definición
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

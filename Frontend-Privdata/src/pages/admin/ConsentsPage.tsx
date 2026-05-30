import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Search, ShieldCheck, ShieldOff, Clock, AlertCircle, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import * as Dialog from "@radix-ui/react-dialog"
import { complianceApi, personsApi } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Consent, ConsentStatus, DataCategory } from "@/types/compliance"
import type { Person } from "@/types/person"

// ── helpers ───────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: ConsentStatus | ""; label: string }[] = [
  { value: "",          label: "Todos los estados" },
  { value: "ACTIVE",    label: "Activo" },
  { value: "REVOKED",   label: "Revocado" },
  { value: "EXPIRED",   label: "Expirado" },
  { value: "SUSPENDED", label: "Suspendido" },
]

const statusCfg: Record<ConsentStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  ACTIVE:    { label: "Activo",     color: "hsl(142 71% 35%)",            bg: "hsl(142 71% 35% / 0.1)", icon: <ShieldCheck className="w-3 h-3" /> },
  REVOKED:   { label: "Revocado",   color: "hsl(var(--destructive))",     bg: "hsl(var(--destructive) / 0.08)", icon: <ShieldOff  className="w-3 h-3" /> },
  EXPIRED:   { label: "Expirado",   color: "hsl(var(--muted-foreground))",bg: "hsl(var(--muted))",       icon: <Clock       className="w-3 h-3" /> },
  SUSPENDED: { label: "Suspendido", color: "hsl(36 70% 40%)",             bg: "hsl(36 70% 40% / 0.1)",  icon: <AlertCircle className="w-3 h-3" /> },
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

// ── component ─────────────────────────────────────────────────────────────────

export default function ConsentsPage() {
  const { getUser } = useAuth()
  const queryClient = useQueryClient()
  const orgId = getUser()?.organizationId ?? ""

  const [statusFilter, setStatusFilter] = useState<ConsentStatus | "">("")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const [pendingRevoke, setPendingRevoke] = useState<Consent | null>(null)

  const PAGE_SIZE = 20

  const { data: consentsPage, isLoading } = useQuery({
    queryKey: ["admin-consents", statusFilter, page],
    queryFn: () =>
      complianceApi
        .listConsents({ status: statusFilter || undefined, page, size: PAGE_SIZE })
        .then((r) => r.data),
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

  const personMap = new Map<string, Person>(
    (personsData?.data ?? []).map((p) => [p.id, p])
  )
  const categoryMap = new Map<string, DataCategory>(
    (categoriesData?.data ?? []).map((c) => [c.id, c])
  )

  const revokeMutation = useMutation({
    mutationFn: (id: string) => complianceApi.revokeConsent(id),
    onSuccess: (res) => {
      if (res.data?.success === false) {
        toast.error(res.data.message ?? "No se pudo revocar.")
        return
      }
      toast.success("Consentimiento revocado.")
      queryClient.invalidateQueries({ queryKey: ["admin-consents"] })
      setPendingRevoke(null)
    },
    onError: () => {
      toast.error("Error al conectar con Compliance-service.")
      setPendingRevoke(null)
    },
  })

  const consents = consentsPage?.content ?? []
  const totalPages = consentsPage?.totalPages ?? 1
  const totalElements = consentsPage?.totalElements ?? 0

  // client-side search within the current page
  const filtered = consents.filter((c) => {
    if (!search) return true
    const person = personMap.get(c.dataSubjectId)
    const name = person?.fullName?.toLowerCase() ?? ""
    const email = person?.email?.toLowerCase() ?? ""
    const id = c.dataSubjectId.toLowerCase()
    const term = search.toLowerCase()
    return name.includes(term) || email.includes(term) || id.includes(term) || (c.notes ?? "").toLowerCase().includes(term)
  })

  // stats
  const active    = consents.filter((c) => c.status === "ACTIVE").length
  const revoked   = consents.filter((c) => c.status === "REVOKED").length
  const expired   = consents.filter((c) => c.status === "EXPIRED").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-y-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Consentimientos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Registro de consentimientos de tratamiento de datos personales
          </p>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Activos",   count: active,  cfg: statusCfg.ACTIVE },
          { label: "Revocados", count: revoked, cfg: statusCfg.REVOKED },
          { label: "Expirados", count: expired, cfg: statusCfg.EXPIRED },
        ].map(({ label, count, cfg }) => (
          <div
            key={label}
            className="rounded-xl border p-4 flex items-center gap-3"
            style={{ borderColor: "hsl(var(--border))" }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: cfg.bg, color: cfg.color }}
            >
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
            {/* Search */}
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por titular, email o notas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as ConsentStatus | ""); setPage(0) }}
              className="text-sm border rounded-md px-3 py-2 bg-background text-foreground"
              style={{ borderColor: "hsl(var(--border))" }}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Titular</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Canal</TableHead>
                      <TableHead>Notas / Finalidad</TableHead>
                      <TableHead>Otorgado</TableHead>
                      <TableHead>Vence</TableHead>
                      <TableHead>Categorías</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-muted-foreground py-10">
                          No se encontraron consentimientos.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((c) => {
                        const person = personMap.get(c.dataSubjectId)
                        const cfg = statusCfg[c.status]
                        const cats = c.categoryIds
                          .map((id) => categoryMap.get(id))
                          .filter(Boolean) as DataCategory[]

                        return (
                          <TableRow key={c.id}>
                            {/* ID */}
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              #{shortId(c.id)}
                            </TableCell>

                            {/* Titular */}
                            <TableCell>
                              {person ? (
                                <div>
                                  <p className="text-sm font-medium">{person.fullName}</p>
                                  <p className="text-xs text-muted-foreground">{person.rut}</p>
                                </div>
                              ) : (
                                <span className="font-mono text-xs text-muted-foreground">
                                  {shortId(c.dataSubjectId)}
                                </span>
                              )}
                            </TableCell>

                            {/* Estado */}
                            <TableCell>
                              <span
                                className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                                style={{ background: cfg.bg, color: cfg.color }}
                              >
                                {cfg.icon}
                                {cfg.label}
                              </span>
                            </TableCell>

                            {/* Canal */}
                            <TableCell className="text-sm text-muted-foreground">
                              {collectionLabels[c.collectionMethod] ?? c.collectionMethod}
                            </TableCell>

                            {/* Notas */}
                            <TableCell className="text-sm max-w-[200px] truncate" title={c.notes ?? ""}>
                              {c.notes ?? <span className="text-muted-foreground">—</span>}
                            </TableCell>

                            {/* Otorgado */}
                            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                              {fmt(c.grantedAt)}
                            </TableCell>

                            {/* Vence */}
                            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                              {fmt(c.expiresAt)}
                            </TableCell>

                            {/* Categorías */}
                            <TableCell>
                              {cats.length === 0 ? (
                                <span className="text-xs text-muted-foreground">—</span>
                              ) : (
                                <div className="flex flex-wrap gap-1">
                                  {cats.slice(0, 2).map((cat) => (
                                    <span
                                      key={cat.id}
                                      className="text-xs px-1.5 py-0.5 rounded-full"
                                      style={
                                        cat.sensitive
                                          ? { background: "hsl(var(--destructive) / 0.08)", color: "hsl(var(--destructive))" }
                                          : { background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }
                                      }
                                    >
                                      {cat.sensitive ? "⚠ " : ""}{cat.name}
                                    </span>
                                  ))}
                                  {cats.length > 2 && (
                                    <span className="text-xs text-muted-foreground">+{cats.length - 2}</span>
                                  )}
                                </div>
                              )}
                            </TableCell>

                            {/* Acciones */}
                            <TableCell>
                              {c.status === "ACTIVE" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs h-7 px-2"
                                  onClick={() => setPendingRevoke(c)}
                                >
                                  Revocar
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: "hsl(var(--border))" }}>
                  <p className="text-xs text-muted-foreground">
                    {totalElements} consentimiento{totalElements !== 1 ? "s" : ""} en total
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={page === 0}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-xs px-2">
                      Pág. {page + 1} / {totalPages}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Revoke confirmation */}
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
            <Dialog.Title className="text-sm font-bold mb-1">Revocar consentimiento</Dialog.Title>
            <Dialog.Description className="text-xs mb-5 leading-relaxed text-muted-foreground">
              ¿Confirmas la revocación del consentimiento{" "}
              <strong>#{pendingRevoke ? shortId(pendingRevoke.id) : ""}</strong>?
              {pendingRevoke && personMap.get(pendingRevoke.dataSubjectId) && (
                <> Titular: <strong>{personMap.get(pendingRevoke.dataSubjectId)!.fullName}</strong>.</>
              )}
              {" "}Esta acción quedará registrada en el historial de eventos.
            </Dialog.Description>
            <div className="flex gap-2">
              <button
                onClick={() => setPendingRevoke(null)}
                disabled={revokeMutation.isPending}
                className="flex-1 px-4 py-2 text-xs rounded-lg border font-medium hover:bg-muted transition-colors"
                style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}
              >
                Cancelar
              </button>
              <button
                onClick={() => pendingRevoke && revokeMutation.mutate(pendingRevoke.id)}
                disabled={revokeMutation.isPending}
                className="flex-1 px-4 py-2 text-xs rounded-lg font-semibold flex items-center justify-center gap-1.5"
                style={{ background: "hsl(var(--destructive))", color: "hsl(var(--destructive-foreground))" }}
              >
                {revokeMutation.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                Confirmar revocación
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}

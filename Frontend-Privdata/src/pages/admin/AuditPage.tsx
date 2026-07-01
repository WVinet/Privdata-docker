import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Search, Loader2, ChevronLeft, ChevronRight, X } from "lucide-react"
import { auditApi, arcoApi, personsApi, usersApi } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { AuditLog } from "@/types/audit"

const ACTION_CONFIG: Record<string, { label: string; className: string }> = {
  LOGIN:    { label: "Login",      className: "border-primary/30 bg-primary/15 text-primary" },
  CREATE:   { label: "Crear",      className: "border-green-300 bg-green-50 text-green-700" },
  UPDATE:   { label: "Actualizar", className: "border-blue-300 bg-blue-50 text-blue-700" },
  REVOCAR:  { label: "Revocar",    className: "border-destructive/30 bg-destructive/15 text-destructive" },
  RESOLVER: { label: "Resolver",   className: "border-green-300 bg-green-50 text-green-700" },
  INVITAR:  { label: "Invitar",    className: "border-purple-300 bg-purple-50 text-purple-700" },
  PUBLICAR: { label: "Publicar",   className: "border-amber-300 bg-amber-50 text-amber-700" },
  RETIRAR:  { label: "Retirar",    className: "border-orange-300 bg-orange-50 text-orange-700" },
}

// Tipos de entidad emitidos hoy por el BFF (ver AuditClient.log en cada XxxBffService)
const ENTITY_LABELS = [
  "Solicitud ARSO",
  "Reclamo ante la Agencia",
  "Consentimiento",
  "Definición de Consentimiento",
  "Actividad de Tratamiento",
  "Titular",
  "Usuario",
]

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i

const ACTOR_ROLE_CONFIG: Record<"TITULAR" | "AUDITOR_AGENCIA" | "RESPONSABLE", { label: string; className: string }> = {
  TITULAR:         { label: "Titular",        className: "border-secondary bg-secondary text-secondary-foreground" },
  AUDITOR_AGENCIA: { label: "Auditor Agencia", className: "border-purple-300 bg-purple-50 text-purple-700" },
  RESPONSABLE:     { label: "Responsable",    className: "border-primary/30 bg-primary/10 text-primary" },
}

function splitDetail(detail: string): { text: string; uuid: string | null } {
  const uuid = detail.match(UUID_RE)?.[0] ?? null
  const text = uuid ? detail.replace(uuid, "").trim() : detail
  return { text, uuid }
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("es-CL", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

export default function AuditPage() {
  const { getUser }  = useAuth()
  const orgId        = getUser()?.organizationId ?? ""
  const [search, setSearch]         = useState("")
  const [filterAction, setFilterAction] = useState("")
  const [filterEntity, setFilterEntity] = useState("")
  const [filterDate, setFilterDate]     = useState("")
  const [page, setPage]             = useState(0)
  const PAGE_SIZE = 10

  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs", orgId, page, search],
    queryFn: () => auditApi.list(orgId, page, PAGE_SIZE, search || undefined).then((r) => r.data),
    enabled: !!orgId,
    refetchInterval: 30_000,
  })

  // Datos auxiliares para resolver "a quién" se refiere cada evento (titular afectado)
  const { data: arcoData } = useQuery({
    queryKey: ["arco", orgId],
    queryFn: () => arcoApi.list(orgId).then((r) => r.data),
    enabled: !!orgId,
  })

  const { data: personsData } = useQuery({
    queryKey: ["persons", orgId],
    queryFn: () => personsApi.list(orgId).then((r) => r.data),
    enabled: !!orgId,
  })

  // Roles por correo, para distinguir si quien gestionó el evento es titular o responsable interno
  const { data: usersData } = useQuery({
    queryKey: ["users"],
    queryFn: () => usersApi.list().then((r) => r.data),
  })

  const logs: AuditLog[] = data?.data?.content ?? []
  const totalPages        = data?.data?.totalPages ?? 1
  const totalElements     = data?.data?.totalElements ?? 0

  const arcoRequests = arcoData?.data ?? []
  const persons       = personsData?.data ?? []
  const users         = usersData?.data ?? []
  const arcoById            = Object.fromEntries(arcoRequests.map((r) => [r.id, r]))
  const arcoByAgencyClaimId = Object.fromEntries(
    arcoRequests.filter((r) => r.agencyClaimId).map((r) => [r.agencyClaimId as string, r])
  )
  const personsById = Object.fromEntries(persons.map((p) => [p.id, p]))
  const rolesByEmail = Object.fromEntries(users.map((u) => [u.email.toLowerCase(), u.roles ?? []]))

  // Determina si quien ejecutó el evento es el titular, un auditor de la Agencia o un responsable interno
  function resolveActorRole(email: string | null): keyof typeof ACTOR_ROLE_CONFIG | null {
    if (!email) return null
    const roles = rolesByEmail[email.toLowerCase()]
    if (!roles) return null
    if (roles.includes("END_USER")) return "TITULAR"
    if (roles.includes("AGENCY_AUDITOR")) return "AUDITOR_AGENCIA"
    return "RESPONSABLE"
  }

  // Resuelve el solicitante (titular afectado o actor si es titular)
  function resolveSolicitante(event: AuditLog): string | null {
    const uuid = event.detail.match(UUID_RE)?.[0]

    if (uuid) {
      if (event.entityType === "Solicitud ARSO") {
        const request = arcoById[uuid]
        if (request) return personsById[request.dataSubjectId]?.fullName ?? null
      }
      if (event.entityType === "Reclamo ante la Agencia") {
        const request = arcoByAgencyClaimId[uuid]
        if (request) return personsById[request.dataSubjectId]?.fullName ?? null
      }
      if (event.entityType === "Consentimiento") {
        const byPerson = personsById[uuid]?.fullName
        if (byPerson) return byPerson
      }
    }

    // Si el actor es un titular, él mismo es el solicitante
    if (event.performedByEmail) {
      const actorUser = users.find((u) => u.email.toLowerCase() === event.performedByEmail!.toLowerCase())
      if (actorUser?.roles?.includes("END_USER") && actorUser.personId) {
        return personsById[actorUser.personId]?.fullName ?? null
      }
    }

    return null
  }

  const hasActiveFilters = !!(search || filterAction || filterEntity || filterDate)

  const clearFilters = () => {
    setSearch("")
    setFilterAction("")
    setFilterEntity("")
    setFilterDate("")
    setPage(0)
  }

  const filtered = logs.filter((e) => {
    const matchAction = !filterAction || e.action === filterAction
    const matchEntity = !filterEntity || e.entityType === filterEntity
    const matchDate   = !filterDate || e.createdAt.slice(0, 10) === filterDate
    return matchAction && matchEntity && matchDate
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Auditoría</h1>
        <p className="text-muted-foreground text-sm mt-1">Registro inmutable de eventos del sistema</p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por acción, entidad, gestionado por, solicitante o detalle…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0) }}
                className="pl-9"
              />
            </div>
            <select
              className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={filterAction}
              onChange={(e) => { setFilterAction(e.target.value); setPage(0) }}
            >
              <option value="">Todas las acciones</option>
              {Object.entries(ACTION_CONFIG).map(([v, c]) => (
                <option key={v} value={v}>{c.label}</option>
              ))}
            </select>
            <select
              className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={filterEntity}
              onChange={(e) => { setFilterEntity(e.target.value); setPage(0) }}
            >
              <option value="">Todas las entidades</option>
              {ENTITY_LABELS.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <Input
                type="date"
                value={filterDate}
                onChange={(e) => { setFilterDate(e.target.value); setPage(0) }}
                className="text-muted-foreground flex-1"
              />
              {hasActiveFilters && (
                <Button variant="outline" size="icon" onClick={clearFilters} title="Limpiar filtros">
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
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
                      <TableHead>Acción</TableHead>
                      <TableHead>Entidad</TableHead>
                      <TableHead>Detalle</TableHead>
                      <TableHead>Gestionado por</TableHead>
                      <TableHead>Solicitante</TableHead>
                      <TableHead>Fecha / Hora</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                          {logs.length === 0
                            ? "No hay eventos registrados aún."
                            : "No se encontraron eventos con ese criterio."}
                        </TableCell>
                      </TableRow>
                    ) : filtered.map((event) => {
                      const cfg = ACTION_CONFIG[event.action] ?? { label: event.action, className: "" }
                      const solicitante = resolveSolicitante(event)
                      const actorRole   = resolveActorRole(event.performedByEmail)
                      return (
                        <TableRow key={event.id}>
                          <TableCell>
                            <Badge variant="outline" className={cfg.className}>
                              {cfg.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {event.entityType}
                          </TableCell>
                          <TableCell className="text-sm max-w-xs">
                            {(() => {
                              const { text, uuid } = splitDetail(event.detail)
                              return (
                                <div className="space-y-0.5">
                                  <p className="truncate" title={text}>{text}</p>
                                  {uuid && (
                                    <p className="text-xs text-muted-foreground font-mono truncate" title={uuid}>
                                      uuid: {uuid}
                                    </p>
                                  )}
                                </div>
                              )
                            })()}
                          </TableCell>
                          <TableCell className="text-sm">
                            {(actorRole === "RESPONSABLE" || actorRole === "AUDITOR_AGENCIA") && event.performedByEmail ? (
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">{event.performedByEmail}</span>
                                {actorRole && (
                                  <Badge variant="outline" className={ACTOR_ROLE_CONFIG[actorRole].className}>
                                    {ACTOR_ROLE_CONFIG[actorRole].label}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {solicitante ?? <span className="text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm font-mono whitespace-nowrap">
                            {fmtDate(event.createdAt)}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {totalElements > 0 && (
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    {totalElements} evento{totalElements !== 1 ? "s" : ""} registrado{totalElements !== 1 ? "s" : ""}
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
    </div>
  )
}

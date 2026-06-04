import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Search, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { auditApi } from "@/lib/api"
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

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("es-CL", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

export default function AuditPage() {
  const { getUser }  = useAuth()
  const orgId        = getUser()?.organizationId ?? ""
  const [search, setSearch] = useState("")
  const [page, setPage]     = useState(0)
  const PAGE_SIZE = 50

  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs", orgId, page],
    queryFn: () => auditApi.list(orgId, page, PAGE_SIZE).then((r) => r.data),
    enabled: !!orgId,
    refetchInterval: 30_000,
  })

  const logs: AuditLog[] = data?.data?.content ?? []
  const totalPages        = data?.data?.totalPages ?? 1
  const totalElements     = data?.data?.totalElements ?? 0

  const filtered = logs.filter((e) => {
    if (!search) return true
    const term = search.toLowerCase()
    return (
      e.action.toLowerCase().includes(term)       ||
      e.entityType.toLowerCase().includes(term)   ||
      e.detail.toLowerCase().includes(term)       ||
      (e.performedByEmail?.toLowerCase() ?? "").includes(term)
    )
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Auditoría</h1>
        <p className="text-muted-foreground text-sm mt-1">Registro inmutable de eventos del sistema</p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por acción, entidad, usuario o detalle..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0) }}
              className="pl-9"
            />
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
                      <TableHead>Usuario</TableHead>
                      <TableHead>Fecha / Hora</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                          {logs.length === 0
                            ? "No hay eventos registrados aún."
                            : "No se encontraron eventos con ese criterio."}
                        </TableCell>
                      </TableRow>
                    ) : filtered.map((event) => {
                      const cfg = ACTION_CONFIG[event.action] ?? { label: event.action, className: "" }
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
                          <TableCell className="text-sm max-w-xs truncate">
                            {event.detail}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {event.performedByEmail ?? "—"}
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

              {totalPages > 1 && (
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

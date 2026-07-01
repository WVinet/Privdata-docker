import { useState } from "react"
import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Search, Loader2, UserX, ArrowLeft } from "lucide-react"
import { arcoApi, personsApi } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { DataStatus } from "@/types/person"
import type { ArcoRequestType } from "@/types/arco"

const DATA_STATUS_LABEL: Record<DataStatus, string> = {
  ACTIVE:                "Activo",
  BLOCKED:               "Bloqueado",
  DELETION_REQUESTED:    "Eliminación solicitada",
  PROCESSING_RESTRICTED: "Tratamiento restringido",
  ANONYMIZED:            "Anonimizado",
}

const DATA_STATUS_VARIANT: Record<DataStatus, "default" | "secondary" | "destructive" | "outline"> = {
  ACTIVE:                "default",
  BLOCKED:               "destructive",
  DELETION_REQUESTED:    "destructive",
  PROCESSING_RESTRICTED: "outline",
  ANONYMIZED:            "secondary",
}

const DATA_STATUS_REQUEST_TYPE: Record<DataStatus, ArcoRequestType | null> = {
  ACTIVE:                null,
  BLOCKED:               "OPOSICION",
  DELETION_REQUESTED:    "SUPRESION",
  PROCESSING_RESTRICTED: "OPOSICION",
  ANONYMIZED:            "SUPRESION",
}

export default function DeactivatedAccountsPage() {
  const { getUser } = useAuth()
  const orgId = getUser()?.organizationId ?? ""
  const [search, setSearch] = useState("")

  const { data: personsRes, isLoading: lp } = useQuery({
    queryKey: ["persons", orgId],
    queryFn:  () => personsApi.list(orgId).then((r) => r.data),
    enabled:  !!orgId,
  })

  const { data: arcoRes, isLoading: la } = useQuery({
    queryKey: ["arco", orgId],
    queryFn:  () => arcoApi.list(orgId).then((r) => r.data),
    enabled:  !!orgId,
  })

  const persons = (personsRes?.data ?? []).filter((p) => p.dataStatus !== "ACTIVE")
  const arcoRequests = arcoRes?.data ?? []

  const filtered = persons.filter((p) => {
    if (!search) return true
    const term = search.toLowerCase()
    return (
      p.fullName.toLowerCase().includes(term) ||
      (p.rut?.toLowerCase() ?? "").includes(term) ||
      (p.email?.toLowerCase() ?? "").includes(term)
    )
  })

  function originatingRequest(personId: string, dataStatus: DataStatus) {
    const requestType = DATA_STATUS_REQUEST_TYPE[dataStatus]
    if (!requestType) return null
    const matches = arcoRequests
      .filter((r) => r.dataSubjectId === personId && r.requestType === requestType && (r.status === "RESPONDIDA" || r.status === "CERRADA"))
      .sort((a, b) => new Date(b.resolvedAt ?? b.submittedAt).getTime() - new Date(a.resolvedAt ?? a.submittedAt).getTime())
    return matches[0] ?? null
  }

  const isLoading = lp || la

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/titulares"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Cuentas desactivadas</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Titulares cuyos datos fueron bloqueados, anonimizados o marcados para eliminación tras resolverse una solicitud ARSOP.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, RUT o correo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[22%]">Nombre</TableHead>
                    <TableHead className="w-[14%]">RUT</TableHead>
                    <TableHead className="w-[26%]">Correo</TableHead>
                    <TableHead className="w-[18%]">Estado de datos</TableHead>
                    <TableHead className="w-[12%]">Solicitud ARSOP</TableHead>
                    <TableHead className="w-[8%]">Resuelta</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                        {search ? "No se encontraron cuentas con ese criterio." : (
                          <span className="flex flex-col items-center gap-1.5">
                            <UserX className="w-6 h-6 text-muted-foreground/50" />
                            No hay cuentas desactivadas registradas.
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : filtered.map((p) => {
                    const request = originatingRequest(p.id, p.dataStatus)
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium max-w-0">
                            <p className="truncate" title={p.fullName}>{p.fullName}</p>
                          </TableCell>
                        <TableCell className="text-muted-foreground text-sm whitespace-nowrap">{p.rut ?? "—"}</TableCell>
                        <TableCell className="text-muted-foreground text-sm max-w-0">
                            <p className="truncate" title={p.email ?? ""}>{p.email ?? "—"}</p>
                          </TableCell>
                        <TableCell>
                          <Badge variant={DATA_STATUS_VARIANT[p.dataStatus]}>
                            {DATA_STATUS_LABEL[p.dataStatus]}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground" title={request?.id}>
                          {request ? request.id.substring(0, 8) + "…" : "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {request?.resolvedAt ? new Date(request.resolvedAt).toLocaleDateString("es-CL") : "—"}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Loader2, Inbox, ListChecks, Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Toaster } from "sonner"
import { agencyApi } from "@/lib/api"
import { RespondModal } from "@/components/RespondModal"
import type { AgencyClaim } from "@/types/agencyClaim"

const STATUS_LABELS: Record<string, string> = {
  RECIBIDA: "Recibida", EN_REVISION: "En revisión", EN_GESTION: "En gestión",
  RESPONDIDA: "Respondida", RECHAZADA: "Rechazada", CERRADA: "Cerrada",
}

const TYPE_LABELS: Record<string, string> = {
  ACCESO: "Acceso", RECTIFICACION: "Rectificación", SUPRESION: "Supresión",
  OPOSICION: "Oposición", PORTABILIDAD: "Portabilidad", BLOQUEO_TEMPORAL: "Bloqueo temporal",
  ANONIMIZACION: "Anonimización",
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export default function ReclamosPage() {
  const [selected, setSelected] = useState<AgencyClaim | null>(null)
  const [searchOverview, setSearchOverview] = useState("")
  const [searchClaims, setSearchClaims] = useState("")

  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ["arco-overview"],
    queryFn: () => agencyApi.arcoOverview(),
  })

  const { data: claimsRes, isLoading: loadingClaims } = useQuery({
    queryKey: ["agency-claims", "PENDIENTE"],
    queryFn: () => agencyApi.list("PENDIENTE", 0, 50),
  })

  const pendingClaims = claimsRes?.data.data?.content ?? []

  // Las solicitudes con reclamo o disconformidad se muestran primero — son las relevantes para el auditor
  const sortedOverview = [...(overview ?? [])].sort((a, b) => {
    const score = (r: typeof a) => (r.agencyClaimId ? 2 : r.titularDisconforme ? 1 : 0)
    const diff = score(b) - score(a)
    return diff !== 0 ? diff : new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  })

  const filteredOverview = sortedOverview.filter((req) => {
    if (!searchOverview) return true
    const term = searchOverview.toLowerCase()
    return req.id.toLowerCase().includes(term) || req.dataSubjectId.toLowerCase().includes(term)
  })

  const filteredClaims = pendingClaims.filter((claim) => {
    if (!searchClaims) return true
    const term = searchClaims.toLowerCase()
    return (
      claim.id.toLowerCase().includes(term) ||
      claim.arcoRequestId.toLowerCase().includes(term) ||
      claim.dataSubjectName.toLowerCase().includes(term) ||
      claim.dataSubjectEmail.toLowerCase().includes(term) ||
      (claim.originalResolvedByEmail?.toLowerCase() ?? "").includes(term)
    )
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Reclamos</h1>
        <p className="text-sm text-muted-foreground">
          Panel de transparencia de solicitudes ARCO y reclamos pendientes de resolución.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Panel izquierdo — todas las solicitudes ARCO (transparencia, solo lectura) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ListChecks className="w-4 h-4" /> Solicitudes ARCO (PrivData)
            </CardTitle>
            <CardDescription>
              Panel de transparencia — solo lectura. Las marcadas con reclamo o disconformidad aparecen primero.
            </CardDescription>
            <div className="relative pt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por UUID de solicitud o titular..."
                value={searchOverview}
                onChange={(e) => setSearchOverview(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {loadingOverview ? (
              <div className="flex justify-center py-8 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : filteredOverview.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                {sortedOverview.length === 0 ? "No hay solicitudes registradas." : "No hay solicitudes que coincidan con la búsqueda."}
              </p>
            ) : (
              <div className="max-h-[32rem] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Recibida</TableHead>
                      <TableHead>Marca</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOverview.map((req) => (
                      <TableRow key={req.id}>
                        <TableCell className="font-medium text-sm">
                          {TYPE_LABELS[req.requestType] ?? req.requestType}
                          <p className="text-xs text-muted-foreground font-mono mt-0.5">{req.id}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{STATUS_LABELS[req.status] ?? req.status}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatDate(req.submittedAt)}
                        </TableCell>
                        <TableCell>
                          {req.agencyClaimId ? (
                            <Badge className="border-transparent bg-primary/15 text-primary">Con reclamo</Badge>
                          ) : req.titularDisconforme ? (
                            <Badge variant="secondary">Disconforme</Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Panel derecho — reclamos pendientes de responder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Inbox className="w-4 h-4" /> Reclamos pendientes
            </CardTitle>
            <CardDescription>Reclamos escalados por titulares disconformes con la respuesta de la organización.</CardDescription>
            <div className="relative pt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por UUID, titular o responsable..."
                value={searchClaims}
                onChange={(e) => setSearchClaims(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {loadingClaims ? (
              <div className="flex justify-center py-8 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : filteredClaims.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                {pendingClaims.length === 0 ? "No hay reclamos pendientes." : "No hay reclamos que coincidan con la búsqueda."}
              </p>
            ) : (
              <div className="max-h-[32rem] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Quién reclama</TableHead>
                      <TableHead>Solicitud</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Motivo del reclamo</TableHead>
                      <TableHead>Gestionado por</TableHead>
                      <TableHead>Recibido</TableHead>
                      <TableHead className="text-right">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClaims.map((claim) => (
                      <TableRow key={claim.id}>
                        <TableCell>
                          <p className="font-medium text-sm text-foreground">{claim.dataSubjectName}</p>
                          <p className="text-xs text-muted-foreground">{claim.dataSubjectEmail}</p>
                          {claim.dataSubjectRut && (
                            <p className="text-xs text-muted-foreground">{claim.dataSubjectRut}</p>
                          )}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">
                          {claim.arcoRequestId}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{TYPE_LABELS[claim.requestType] ?? claim.requestType}</Badge>
                        </TableCell>
                        <TableCell className="text-sm max-w-xs">
                          <p className="line-clamp-2" title={claim.claimReason}>{claim.claimReason}</p>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {claim.originalResolvedByEmail ?? "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatDate(claim.submittedAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" onClick={() => setSelected(claim)}>
                            Responder
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {selected && <RespondModal claim={selected} onClose={() => setSelected(null)} />}
      <Toaster position="bottom-right" />
    </div>
  )
}

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Loader2, Inbox, Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Toaster } from "sonner"
import { agencyApi } from "@/lib/api"
import { RespondModal } from "@/components/RespondModal"
import type { AgencyClaim } from "@/types/agencyClaim"

const TYPE_LABELS: Record<string, string> = {
  ACCESO: "Acceso", RECTIFICACION: "Rectificación", SUPRESION: "Supresión",
  OPOSICION: "Oposición", PORTABILIDAD: "Portabilidad",
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export default function ReclamosPage() {
  const [selected, setSelected] = useState<AgencyClaim | null>(null)
  const [search, setSearch] = useState("")

  const { data: claimsRes, isLoading } = useQuery({
    queryKey: ["agency-claims", "PENDIENTE"],
    queryFn: () => agencyApi.list("PENDIENTE", 0, 50),
  })

  const pendingClaims = [...(claimsRes?.data.data?.content ?? [])].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  )

  const filtered = pendingClaims.filter((claim) => {
    if (!search) return true
    const term = search.toLowerCase()
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
        <h1 className="text-xl font-semibold text-foreground">Reclamos pendientes</h1>
        <p className="text-sm text-muted-foreground">
          Reclamos escalados por titulares disconformes con la respuesta de la organización.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Inbox className="w-4 h-4" /> Reclamos pendientes de resolución
          </CardTitle>
          <CardDescription>
            Los reclamos más recientes aparecen primero. Respóndelos para cerrar el proceso.
          </CardDescription>
          <div className="relative pt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por UUID, titular o responsable..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="flex justify-center py-8 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              {pendingClaims.length === 0 ? "No hay reclamos pendientes." : "No hay reclamos que coincidan con la búsqueda."}
            </p>
          ) : (
            <div className="max-h-[calc(100vh-20rem)] overflow-y-auto">
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
                  {filtered.map((claim) => (
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

      {selected && <RespondModal claim={selected} onClose={() => setSelected(null)} />}
      <Toaster position="bottom-right" />
    </div>
  )
}

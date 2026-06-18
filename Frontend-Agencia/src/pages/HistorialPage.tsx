import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Loader2, History, Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { agencyApi } from "@/lib/api"

const TYPE_LABELS: Record<string, string> = {
  ACCESO: "Acceso", RECTIFICACION: "Rectificación", SUPRESION: "Supresión",
  OPOSICION: "Oposición", PORTABILIDAD: "Portabilidad", BLOQUEO_TEMPORAL: "Bloqueo temporal",
  ANONIMIZACION: "Anonimización",
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export default function HistorialPage() {
  const [search, setSearch] = useState("")

  const { data: claimsRes, isLoading } = useQuery({
    queryKey: ["agency-claims", "RESPONDIDO"],
    queryFn: () => agencyApi.list("RESPONDIDO", 0, 50),
  })

  const claims = claimsRes?.data.data?.content ?? []

  const filtered = claims.filter((claim) => {
    if (!search) return true
    const term = search.toLowerCase()
    return (
      claim.id.toLowerCase().includes(term) ||
      claim.arcoRequestId.toLowerCase().includes(term) ||
      claim.dataSubjectName.toLowerCase().includes(term) ||
      claim.dataSubjectEmail.toLowerCase().includes(term) ||
      (claim.originalResolvedByEmail?.toLowerCase() ?? "").includes(term) ||
      (claim.respondedByEmail?.toLowerCase() ?? "").includes(term)
    )
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Historial</h1>
        <p className="text-sm text-muted-foreground">Reclamos ya resueltos por la Agencia.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="w-4 h-4" /> Reclamos respondidos
          </CardTitle>
          <CardDescription>Histórico de resoluciones enviadas a los titulares.</CardDescription>
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
              {claims.length === 0 ? "No hay reclamos respondidos todavía." : "No hay reclamos que coincidan con la búsqueda."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quién reclama</TableHead>
                  <TableHead>Solicitud</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Motivo del reclamo</TableHead>
                  <TableHead>Respuesta de la Agencia</TableHead>
                  <TableHead>Resuelto por (PrivData)</TableHead>
                  <TableHead>Respondido por (Agencia)</TableHead>
                  <TableHead>Fecha respuesta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((claim) => (
                  <TableRow key={claim.id}>
                    <TableCell>
                      <p className="font-medium text-sm text-foreground">{claim.dataSubjectName}</p>
                      <p className="text-xs text-muted-foreground">{claim.dataSubjectEmail}</p>
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
                    <TableCell className="text-sm max-w-xs">
                      <p className="line-clamp-2" title={claim.agencyResponse ?? ""}>{claim.agencyResponse}</p>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {claim.originalResolvedByEmail ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {claim.respondedByEmail ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {claim.respondedAt ? formatDate(claim.respondedAt) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Loader2, ListChecks, Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { agencyApi } from "@/lib/api"

const STATUS_LABELS: Record<string, string> = {
  RECIBIDA: "Recibida", EN_REVISION: "En revisión", EN_GESTION: "En gestión",
  RESPONDIDA: "Respondida", RECHAZADA: "Rechazada", CERRADA: "Cerrada",
}

const TYPE_LABELS: Record<string, string> = {
  ACCESO: "Acceso", RECTIFICACION: "Rectificación", SUPRESION: "Supresión",
  OPOSICION: "Oposición", PORTABILIDAD: "Portabilidad",
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export default function SolicitudesPage() {
  const [search, setSearch] = useState("")

  const { data: overview, isLoading } = useQuery({
    queryKey: ["arco-overview"],
    queryFn: () => agencyApi.arcoOverview(),
  })

  const sorted = [...(overview ?? [])].sort((a, b) => {
    const score = (r: typeof a) => (r.agencyClaimId ? 2 : r.titularDisconforme ? 1 : 0)
    const diff = score(b) - score(a)
    return diff !== 0 ? diff : new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  })

  const filtered = sorted.filter((req) => {
    if (!search) return true
    const term = search.toLowerCase()
    return req.id.toLowerCase().includes(term) || req.dataSubjectId.toLowerCase().includes(term)
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Solicitudes ARSOP</h1>
        <p className="text-sm text-muted-foreground">
          Panel de transparencia — solo lectura. Las marcadas con reclamo o disconformidad aparecen primero.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ListChecks className="w-4 h-4" /> Solicitudes ARSOP (PrivData)
          </CardTitle>
          <CardDescription>
            Todas las solicitudes registradas en la organización, ordenadas por relevancia para la Agencia.
          </CardDescription>
          <div className="relative pt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por UUID de solicitud o titular..."
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
              {sorted.length === 0 ? "No hay solicitudes registradas." : "No hay solicitudes que coincidan con la búsqueda."}
            </p>
          ) : (
            <div className="max-h-[calc(100vh-20rem)] overflow-y-auto">
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
                  {filtered.map((req) => (
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
    </div>
  )
}

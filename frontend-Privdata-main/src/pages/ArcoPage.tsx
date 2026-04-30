import { useState } from "react"
import { Search, PlusCircle } from "lucide-react"
import { mockArcoRequests } from "@/lib/mock-data"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/StatusBadge"

const typeLabels: Record<string, string> = {
  access:        "Acceso",
  rectification: "Rectificación",
  suppression:   "Supresión",
  opposition:    "Oposición",
  portability:   "Portabilidad",
  blocking:      "Bloqueo",
}

export default function ArcoPage() {
  const [search, setSearch] = useState("")

  const filtered = mockArcoRequests.filter(
    (r) =>
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.titularName.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-y-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Solicitudes ARCO</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Acceso, Rectificación, Supresión, Oposición, Portabilidad y Bloqueo
          </p>
        </div>
        <Button>
          <PlusCircle className="w-4 h-4" />
          Registrar Solicitud
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por ID o titular..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Titular</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Responsable</TableHead>
                <TableHead>Creación</TableHead>
                <TableHead>Vencimiento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No se encontraron solicitudes.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-sm">{r.id}</TableCell>
                    <TableCell className="font-medium">{r.titularName}</TableCell>
                    <TableCell>{typeLabels[r.type] ?? r.type}</TableCell>
                    <TableCell><StatusBadge status={r.status} /></TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.assignee ?? <span className="italic text-muted-foreground/60">Sin asignar</span>}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{r.createdAt}</TableCell>
                    <TableCell className="text-muted-foreground">{r.deadline}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

import { useState } from "react"
import { Search } from "lucide-react"
import { mockAuditEvents } from "@/lib/mock-data"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const actionConfig: Record<string, { label: string; className: string }> = {
  CREATE:  { label: "Crear",    className: "border-success/30 bg-success/15 text-success" },
  UPDATE:  { label: "Actualizar", className: "border-info/30 bg-info/15 text-info" },
  REVOKE:  { label: "Revocar",  className: "border-destructive/30 bg-destructive/15 text-destructive" },
  LOGIN:   { label: "Login",    className: "border-primary/30 bg-primary/15 text-primary" },
  RESOLVE: { label: "Resolver", className: "border-success/30 bg-success/15 text-success" },
}

export default function AuditPage() {
  const [search, setSearch] = useState("")

  const filtered = mockAuditEvents.filter(
    (e) =>
      e.details.toLowerCase().includes(search.toLowerCase()) ||
      e.userName.toLowerCase().includes(search.toLowerCase()) ||
      e.action.toLowerCase().includes(search.toLowerCase())
  )

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
              placeholder="Buscar por acción, usuario o detalle..."
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
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No se encontraron eventos.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((event) => {
                  const config = actionConfig[event.action] ?? { label: event.action, className: "" }
                  return (
                    <TableRow key={event.id}>
                      <TableCell>
                        <Badge variant="outline" className={config.className}>
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{event.entity}</TableCell>
                      <TableCell className="max-w-xs truncate text-sm">{event.details}</TableCell>
                      <TableCell className="text-muted-foreground">{event.userName}</TableCell>
                      <TableCell className="text-muted-foreground text-sm font-mono">
                        {event.timestamp.replace("T", " ")}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

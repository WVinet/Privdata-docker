import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Loader2, X, ToggleLeft, ToggleRight } from "lucide-react"
import { jobPositionsApi } from "@/lib/api"
import type { JobPositionCreateRequest } from "@/types/organization"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

function AddCargoModal({ orgId, onClose }: { orgId: string; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState<JobPositionCreateRequest>({ name: "", description: "" })
  const [error, setError] = useState("")
  const mutation = useMutation({
    mutationFn: () => jobPositionsApi.create(orgId, form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["job-positions", orgId] }); onClose() },
    onError: (e: unknown) =>
      setError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Error al crear"),
  })
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-sm space-y-4 p-6">
        <div className="flex items-start justify-between">
          <p className="font-semibold text-foreground">Nuevo cargo</p>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Nombre *</Label>
            <Input placeholder="ej. Analista de Cumplimiento" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Descripción</Label>
            <Input placeholder="ej. Gestiona el RAT y solicitudes ARSOP" value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
          <Button size="sm" onClick={() => mutation.mutate()} disabled={!form.name.trim() || mutation.isPending}>
            {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Agregar
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function CargosPage() {
  const { getUser } = useAuth()
  const orgId = getUser()?.organizationId ?? ""
  const qc = useQueryClient()
  const [adding, setAdding] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ["job-positions", orgId],
    queryFn:  () => jobPositionsApi.list(orgId).then((r) => r.data),
    enabled:  !!orgId,
  })

  const toggle = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      jobPositionsApi.updateStatus(orgId, id, isActive),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["job-positions", orgId] }),
  })

  const cargos = data?.data ?? []

  return (
    <>
      {adding && <AddCargoModal orgId={orgId} onClose={() => setAdding(false)} />}
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cargos</h1>
          <p className="text-muted-foreground text-sm mt-1">Puestos de trabajo asociados a personas dentro de la organización</p>
        </div>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Cargos</CardTitle>
              <Button size="sm" onClick={() => setAdding(true)}>
                <Plus className="w-4 h-4 mr-1.5" />Agregar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cargos.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No hay cargos registrados.</TableCell></TableRow>
                    ) : cargos.map((cargo) => (
                      <TableRow key={cargo.id}>
                        <TableCell className="font-medium">{cargo.name}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{cargo.description ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant={cargo.isActive ? "default" : "secondary"}>{cargo.isActive ? "Activo" : "Inactivo"}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => toggle.mutate({ id: cargo.id, isActive: !cargo.isActive })} disabled={toggle.isPending} title={cargo.isActive ? "Desactivar" : "Activar"}>
                            {cargo.isActive ? <ToggleRight className="w-4 h-4 text-success" /> : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
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
    </>
  )
}

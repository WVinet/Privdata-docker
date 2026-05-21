import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Building2, Plus, Search, Pencil, ToggleLeft, ToggleRight, X, Loader2 } from "lucide-react"
import { organizationsApi, type Organization, type OrganizationCreateRequest } from "@/lib/api"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// ── Form ──────────────────────────────────────────────────────────────────────
interface OrgFormProps {
  initial?: Organization
  onClose: () => void
}

function OrgForm({ initial, onClose }: OrgFormProps) {
  const qc = useQueryClient()
  const isEdit = !!initial

  const [form, setForm] = useState<OrganizationCreateRequest>({
    name:         initial?.name         ?? "",
    legalName:    initial?.legalName    ?? "",
    rut:          initial?.rut          ?? "",
    businessType: initial?.businessType ?? "",
    email:        initial?.email        ?? "",
    phone:        initial?.phone        ?? "",
    address:      initial?.address      ?? "",
  })
  const [error, setError] = useState("")

  const set = (k: keyof OrganizationCreateRequest) =>
    (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const createMutation = useMutation({
    mutationFn: () => organizationsApi.create(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["organizations"] }); onClose() },
    onError: (e: unknown) =>
      setError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Error al crear organización"),
  })

  const updateMutation = useMutation({
    mutationFn: () => organizationsApi.update(initial!.id, form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["organizations"] }); onClose() },
    onError: (e: unknown) =>
      setError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Error al actualizar organización"),
  })

  const isPending = createMutation.isPending || updateMutation.isPending
  const canSubmit = form.name.trim() && form.legalName.trim() && form.rut.trim()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg space-y-4 p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold text-foreground">{isEdit ? "Editar organización" : "Nueva organización"}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Los campos con * son obligatorios</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nombre *</Label>
            <Input id="name" value={form.name} onChange={set("name")} placeholder="ej. PrivData SpA" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="legalName">Razón social *</Label>
            <Input id="legalName" value={form.legalName} onChange={set("legalName")} placeholder="ej. PrivData SpA" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rut">RUT *</Label>
            <Input id="rut" value={form.rut} onChange={set("rut")} placeholder="ej. 76.543.210-K" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="businessType">Tipo de empresa</Label>
            <Input id="businessType" value={form.businessType ?? ""} onChange={set("businessType")} placeholder="ej. SpA, S.A., Ltda." />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Correo</Label>
            <Input id="email" type="email" value={form.email ?? ""} onChange={set("email")} placeholder="contacto@empresa.cl" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Teléfono</Label>
            <Input id="phone" value={form.phone ?? ""} onChange={set("phone")} placeholder="+56 2 2345 6789" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="address">Dirección</Label>
            <Input id="address" value={form.address ?? ""} onChange={set("address")} placeholder="Av. Ejemplo 123, Santiago" />
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isPending}>Cancelar</Button>
          <Button
            size="sm"
            disabled={!canSubmit || isPending}
            onClick={() => isEdit ? updateMutation.mutate() : createMutation.mutate()}
          >
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEdit ? "Guardar cambios" : "Crear organización"}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function OrganizacionesPage() {
  const qc = useQueryClient()
  const [search, setSearch]     = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState<Organization | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ["organizations"],
    queryFn: () => organizationsApi.list().then((r) => r.data),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      organizationsApi.updateStatus(id, isActive),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["organizations"] }),
  })

  const orgs: Organization[] = (data?.data ?? []).filter(
    (o) =>
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.rut.toLowerCase().includes(search.toLowerCase()) ||
      (o.legalName ?? "").toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      {(showForm || editing) && (
        <OrgForm
          initial={editing ?? undefined}
          onClose={() => { setShowForm(false); setEditing(null) }}
        />
      )}

      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-y-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Organizaciones</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Gestión de organizaciones responsables del tratamiento de datos
            </p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />Nueva organización
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, razón social o RUT..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            {isLoading && (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {error && (
              <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                <Building2 className="w-8 h-8 opacity-40" />
                <p className="text-sm">No se pudo conectar con el servicio de organizaciones.</p>
                <p className="text-xs">Verifica que el backend esté disponible.</p>
              </div>
            )}

            {!isLoading && !error && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Razón social</TableHead>
                      <TableHead>RUT</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orgs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                          {search ? "No se encontraron organizaciones." : "Aún no hay organizaciones registradas."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      orgs.map((org) => (
                        <TableRow key={org.id}>
                          <TableCell className="font-medium">{org.name}</TableCell>
                          <TableCell className="text-muted-foreground">{org.legalName}</TableCell>
                          <TableCell className="font-mono text-sm">{org.rut}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {org.businessType ?? "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {org.email ?? "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={org.isActive ? "default" : "secondary"}>
                              {org.isActive ? "Activa" : "Inactiva"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditing(org)}
                                title="Editar"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => statusMutation.mutate({ id: org.id, isActive: !org.isActive })}
                                title={org.isActive ? "Desactivar" : "Activar"}
                                disabled={statusMutation.isPending}
                              >
                                {org.isActive
                                  ? <ToggleRight className="w-4 h-4 text-success" />
                                  : <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                                }
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
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

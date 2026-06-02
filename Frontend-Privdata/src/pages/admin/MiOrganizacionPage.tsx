import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Building2, Pencil, Plus, ToggleLeft, ToggleRight,
  Loader2, X, MapPin, Phone, Mail, Hash, Briefcase,
  Users, Copy, Check, UserPlus,
} from "lucide-react"
import { organizationsApi, departmentsApi, personsApi } from "@/lib/api"
import type { Organization, OrganizationUpdateRequest, Department, DepartmentCreateRequest } from "@/types/organization"
import type { InvitePersonRequest } from "@/types/person"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const ROLES = [
  { value: "END_USER",  label: "Titular (END_USER)" },
  { value: "ANALYST",   label: "Analista (ANALYST)" },
  { value: "AUDITOR",   label: "Auditor (AUDITOR)" },
  { value: "ORG_ADMIN", label: "Administrador (ORG_ADMIN)" },
]

// ── Modal editar organización ──────────────────────────────────────────────────
function EditOrgModal({ org, onClose }: { org: Organization; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState<OrganizationUpdateRequest>({
    name:         org.name,
    legalName:    org.legalName,
    rut:          org.rut,
    businessType: org.businessType ?? "",
    email:        org.email        ?? "",
    phone:        org.phone        ?? "",
    address:      org.address      ?? "",
  })
  const [error, setError] = useState("")

  const set = (k: keyof OrganizationUpdateRequest) =>
    (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const mutation = useMutation({
    mutationFn: () => organizationsApi.update(org.id, form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-org", org.id] }); onClose() },
    onError: (e: unknown) =>
      setError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Error al guardar"),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg space-y-4 p-6">
        <div className="flex items-start justify-between">
          <p className="font-semibold text-foreground">Editar organización</p>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Nombre *</Label>
            <Input value={form.name} onChange={set("name")} />
          </div>
          <div className="space-y-1.5">
            <Label>Razón social *</Label>
            <Input value={form.legalName} onChange={set("legalName")} />
          </div>
          <div className="space-y-1.5">
            <Label>RUT *</Label>
            <Input value={form.rut} onChange={set("rut")} />
          </div>
          <div className="space-y-1.5">
            <Label>Tipo de empresa</Label>
            <Input value={form.businessType ?? ""} onChange={set("businessType")} placeholder="SpA, S.A., Ltda." />
          </div>
          <div className="space-y-1.5">
            <Label>Correo</Label>
            <Input type="email" value={form.email ?? ""} onChange={set("email")} />
          </div>
          <div className="space-y-1.5">
            <Label>Teléfono</Label>
            <Input value={form.phone ?? ""} onChange={set("phone")} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Dirección</Label>
            <Input value={form.address ?? ""} onChange={set("address")} />
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
          <Button size="sm" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Guardar cambios
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Modal agregar departamento ─────────────────────────────────────────────────
function AddDeptModal({ orgId, onClose }: { orgId: string; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState<DepartmentCreateRequest>({ name: "", description: "" })
  const [error, setError] = useState("")

  const mutation = useMutation({
    mutationFn: () => departmentsApi.create(orgId, form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["departments", orgId] }); onClose() },
    onError: (e: unknown) =>
      setError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Error al crear"),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-sm space-y-4 p-6">
        <div className="flex items-start justify-between">
          <p className="font-semibold text-foreground">Nuevo departamento</p>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Nombre *</Label>
            <Input
              placeholder="ej. Recursos Humanos"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Descripción</Label>
            <Input
              placeholder="ej. Gestión de personal"
              value={form.description ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
          <Button
            size="sm"
            onClick={() => mutation.mutate()}
            disabled={!form.name.trim() || mutation.isPending}
          >
            {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Agregar
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Modal invitar persona ──────────────────────────────────────────────────────
function InvitePersonModal({
  orgId,
  departments,
  onClose,
}: {
  orgId: string
  departments: Department[]
  onClose: () => void
}) {
  const qc = useQueryClient()
  const [form, setForm] = useState<InvitePersonRequest>({
    firstName: "",
    lastName: "",
    email: "",
    position: "",
    departmentId: "",
    roleName: "END_USER",
  })
  const [error, setError] = useState("")
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const set = (k: keyof InvitePersonRequest) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }))

  const mutation = useMutation({
    mutationFn: () => {
      const body: InvitePersonRequest = {
        ...form,
        departmentId: form.departmentId || undefined,
        position: form.position || undefined,
      }
      return personsApi.invite(orgId, body)
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["persons", orgId] })
      const pwd = res.data.data?.user?.data?.temporaryPassword
      setTempPassword(pwd ?? null)
    },
    onError: (e: unknown) =>
      setError(
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Error al invitar a la persona"
      ),
  })

  const copyPassword = () => {
    if (!tempPassword) return
    navigator.clipboard.writeText(tempPassword)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg space-y-4 p-6">
        <div className="flex items-start justify-between">
          <p className="font-semibold text-foreground">Invitar persona</p>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {tempPassword ? (
          // ── Estado: éxito ──
          <div className="space-y-4">
            <div className="rounded-lg bg-primary/10 border border-primary/20 p-4 space-y-2 text-center">
              <p className="text-sm font-medium text-foreground">
                ¡Persona invitada correctamente!
              </p>
              <p className="text-xs text-muted-foreground">
                Comparte esta contraseña temporal con{" "}
                <span className="font-medium text-foreground">{form.firstName}</span>. Deberá usarla
                en su primer inicio de sesión.
              </p>
              <div className="flex items-center justify-center gap-2 mt-3">
                <code className="px-3 py-1.5 rounded-md bg-muted font-mono text-sm tracking-wider">
                  {tempPassword}
                </code>
                <Button variant="outline" size="sm" onClick={copyPassword}>
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <div className="flex justify-end">
              <Button size="sm" onClick={onClose}>Cerrar</Button>
            </div>
          </div>
        ) : (
          // ── Formulario ──
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nombre *</Label>
                <Input placeholder="Juan" value={form.firstName} onChange={set("firstName")} />
              </div>
              <div className="space-y-1.5">
                <Label>Apellido *</Label>
                <Input placeholder="Pérez" value={form.lastName} onChange={set("lastName")} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Correo electrónico *</Label>
                <Input
                  type="email"
                  placeholder="juan.perez@empresa.cl"
                  value={form.email}
                  onChange={set("email")}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Cargo</Label>
                <Input placeholder="ej. Analista de datos" value={form.position ?? ""} onChange={set("position")} />
              </div>
              <div className="space-y-1.5">
                <Label>Departamento</Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  value={form.departmentId ?? ""}
                  onChange={set("departmentId")}
                >
                  <option value="">Sin departamento</option>
                  {departments.filter((d) => d.isActive).map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Rol en el sistema *</Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  value={form.roleName}
                  onChange={set("roleName")}
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
              <Button
                size="sm"
                onClick={() => mutation.mutate()}
                disabled={!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || mutation.isPending}
              >
                {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <UserPlus className="w-4 h-4 mr-1.5" />
                Invitar
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Info field ─────────────────────────────────────────────────────────────────
function InfoField({ icon: Icon, label, value }: {
  icon: React.ElementType
  label: string
  value: string | null | undefined
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 p-1.5 rounded-md bg-primary/10">
        <Icon className="w-3.5 h-3.5 text-primary" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value || "—"}</p>
      </div>
    </div>
  )
}

// ── Página principal ───────────────────────────────────────────────────────────
export default function MiOrganizacionPage() {
  const { getUser } = useAuth()
  const user = getUser()
  const orgId = user?.organizationId ?? ""
  const qc = useQueryClient()

  const [editingOrg, setEditingOrg]     = useState(false)
  const [addingDept, setAddingDept]     = useState(false)
  const [invitingPerson, setInviting]   = useState(false)

  const { data: orgData, isLoading: loadingOrg } = useQuery({
    queryKey: ["my-org", orgId],
    queryFn:  () => organizationsApi.getById(orgId).then((r) => r.data),
    enabled:  !!orgId,
  })

  const { data: deptData, isLoading: loadingDepts } = useQuery({
    queryKey: ["departments", orgId],
    queryFn:  () => departmentsApi.list(orgId).then((r) => r.data),
    enabled:  !!orgId,
  })

  const { data: personsData, isLoading: loadingPersons } = useQuery({
    queryKey: ["persons", orgId],
    queryFn:  () => personsApi.list(orgId).then((r) => r.data),
    enabled:  !!orgId,
  })

  const toggleDept = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      departmentsApi.updateStatus(orgId, id, isActive),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["departments", orgId] }),
  })

  const togglePerson = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      personsApi.updateStatus(orgId, id, isActive),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["persons", orgId] }),
  })

  const org     = orgData?.data
  const depts   = deptData?.data   ?? []
  const persons = personsData?.data ?? []

  return (
    <>
      {editingOrg && org && (
        <EditOrgModal org={org} onClose={() => setEditingOrg(false)} />
      )}
      {addingDept && (
        <AddDeptModal orgId={orgId} onClose={() => setAddingDept(false)} />
      )}
      {invitingPerson && (
        <InvitePersonModal
          orgId={orgId}
          departments={depts}
          onClose={() => setInviting(false)}
        />
      )}

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mi Organización</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Información, estructura y personas de la organización responsable del tratamiento de datos
          </p>
        </div>

        {/* ── Card organización ── */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  {loadingOrg ? (
                    <div className="h-5 w-40 bg-muted animate-pulse rounded" />
                  ) : (
                    <CardTitle className="text-base">{org?.name ?? "—"}</CardTitle>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {org?.businessType ?? "Organización"}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setEditingOrg(true)} disabled={!org}>
                <Pencil className="w-3.5 h-3.5 mr-1.5" />Editar
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            {loadingOrg ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-10 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : org ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <InfoField icon={Hash}      label="RUT"          value={org.rut} />
                <InfoField icon={Briefcase} label="Razón social" value={org.legalName} />
                <InfoField icon={Mail}      label="Correo"       value={org.email} />
                <InfoField icon={Phone}     label="Teléfono"     value={org.phone} />
                <InfoField icon={MapPin}    label="Dirección"    value={org.address} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">
                No se pudo cargar la información de la organización.
              </p>
            )}
          </CardContent>
        </Card>

        {/* ── Card departamentos ── */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Departamentos</CardTitle>
              <Button size="sm" onClick={() => setAddingDept(true)}>
                <Plus className="w-4 h-4 mr-1.5" />Agregar
              </Button>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            {loadingDepts ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
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
                    {depts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          No hay departamentos registrados. Agrega el primero.
                        </TableCell>
                      </TableRow>
                    ) : (
                      depts.map((dept) => (
                        <TableRow key={dept.id}>
                          <TableCell className="font-medium">{dept.name}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {dept.description ?? "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={dept.isActive ? "default" : "secondary"}>
                              {dept.isActive ? "Activo" : "Inactivo"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleDept.mutate({ id: dept.id, isActive: !dept.isActive })}
                              disabled={toggleDept.isPending}
                              title={dept.isActive ? "Desactivar" : "Activar"}
                            >
                              {dept.isActive
                                ? <ToggleRight className="w-4 h-4 text-success" />
                                : <ToggleLeft  className="w-4 h-4 text-muted-foreground" />
                              }
                            </Button>
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

        {/* ── Card personas ── */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <CardTitle className="text-base">Personas</CardTitle>
                {!loadingPersons && (
                  <Badge variant="secondary" className="text-xs">{persons.length}</Badge>
                )}
              </div>
              <Button size="sm" onClick={() => setInviting(true)}>
                <UserPlus className="w-4 h-4 mr-1.5" />Invitar persona
              </Button>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            {loadingPersons ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Correo</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Departamento</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {persons.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No hay personas registradas. Invita a la primera persona.
                        </TableCell>
                      </TableRow>
                    ) : (
                      persons.map((person) => (
                        <TableRow key={person.id}>
                          <TableCell className="font-medium">{person.fullName}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {person.email ?? "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {person.position ?? "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {person.departmentName ?? "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={person.isActive ? "default" : "secondary"}>
                              {person.isActive ? "Activa" : "Inactiva"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => togglePerson.mutate({ id: person.id, isActive: !person.isActive })}
                              disabled={togglePerson.isPending}
                              title={person.isActive ? "Desactivar" : "Activar"}
                            >
                              {person.isActive
                                ? <ToggleRight className="w-4 h-4 text-success" />
                                : <ToggleLeft  className="w-4 h-4 text-muted-foreground" />
                              }
                            </Button>
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

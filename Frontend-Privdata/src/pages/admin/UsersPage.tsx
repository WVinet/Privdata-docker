import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Search, UserPlus, Pencil, Loader2, X, Copy, Check } from "lucide-react"
import { usersApi, authApi, departmentsApi, personsApi, jobPositionsApi } from "@/lib/api"
import type { InvitePersonRequest, UpdatePersonRequest } from "@/types/person"
import type { Person } from "@/types/person"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RequirePermission } from "@/components/RequirePermission"
import type { AuthUser } from "@/types/auth"

const STATUS_LABEL: Record<string, string> = {
  ACTIVE:   "Activo",
  PENDING:  "Pendiente",
  INACTIVE: "Inactivo",
  BLOCKED:  "Bloqueado",
  INACTVE:  "Inactivo",
}
const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ACTIVE:   "default",
  PENDING:  "outline",
  INACTIVE: "secondary",
  BLOCKED:  "destructive",
  INACTVE:  "secondary",
}

const ROLES = [
  { value: "AUDITOR",         label: "Auditor" },
  { value: "AUDITOR_AGENCIA", label: "Auditor Agencia" },
]
const ROLE_LABEL: Record<string, string> = Object.fromEntries(ROLES.map((r) => [r.value, r.label]))

// ── Modal: invitar usuario ────────────────────────────────────────────────────
function InviteUserModal({ orgId, onClose }: { orgId: string; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState<InvitePersonRequest>({
    rut: "", firstName: "", secondName: "", lastName: "", maternalLastName: "",
    email: "", position: "", departmentId: "", roleName: "AUDITOR",
  })
  const [error, setError]           = useState("")
  const [tempPassword, setTempPass] = useState<string | null>(null)
  const [copied, setCopied]         = useState(false)

  const { data: deptRes } = useQuery({
    queryKey: ["departments", orgId],
    queryFn:  () => departmentsApi.list(orgId).then((r) => r.data),
    enabled:  !!orgId,
  })
  const departments = deptRes?.data ?? []

  const { data: posRes } = useQuery({
    queryKey: ["jobPositions", orgId],
    queryFn:  () => jobPositionsApi.list(orgId).then((r) => r.data),
    enabled:  !!orgId,
  })
  const jobPositions = posRes?.data ?? []

  const set = (k: keyof InvitePersonRequest) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }))

  const mutation = useMutation({
    mutationFn: () => personsApi.invite(orgId, {
      ...form,
      departmentId: form.departmentId || undefined,
      position:     form.position     || undefined,
    }),
    onSuccess: (res) => {
      if (!res.data.success) {
        setError(res.data.message ?? "Error al crear el usuario")
        return
      }
      qc.invalidateQueries({ queryKey: ["users"] })
      qc.invalidateQueries({ queryKey: ["persons", orgId] })
      const pwd = res.data.data?.user?.data?.temporaryPassword
      setTempPass(pwd ?? null)
    },
    onError: (e: unknown) =>
      setError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Error al crear el usuario"),
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
          <p className="font-semibold text-foreground">Invitar nuevo usuario</p>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>

        {tempPassword ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-primary/10 border border-primary/20 p-4 space-y-2 text-center">
              <p className="text-sm font-medium text-foreground">¡Usuario creado correctamente!</p>
              <p className="text-xs text-muted-foreground">
                Comparte esta contraseña temporal con <span className="font-medium text-foreground">{form.firstName}</span>.
              </p>
              <div className="flex items-center justify-center gap-2 mt-3">
                <code className="px-3 py-1.5 rounded-md bg-muted font-mono text-sm tracking-wider">{tempPassword}</code>
                <Button variant="outline" size="sm" onClick={copyPassword}>
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <div className="flex justify-end"><Button size="sm" onClick={onClose}>Cerrar</Button></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>RUT</Label>
                <Input placeholder="12.345.678-9" value={form.rut} onChange={set("rut")} />
              </div>
              <div className="space-y-1.5">
                <Label>Primer nombre *</Label>
                <Input placeholder="Juan" value={form.firstName} onChange={set("firstName")} />
              </div>
              <div className="space-y-1.5">
                <Label>Segundo nombre</Label>
                <Input placeholder="Carlos" value={form.secondName ?? ""} onChange={set("secondName")} />
              </div>
              <div className="space-y-1.5">
                <Label>Apellido paterno *</Label>
                <Input placeholder="Pérez" value={form.lastName} onChange={set("lastName")} />
              </div>
              <div className="space-y-1.5">
                <Label>Apellido materno</Label>
                <Input placeholder="González" value={form.maternalLastName ?? ""} onChange={set("maternalLastName")} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Correo electrónico *</Label>
                <Input type="email" placeholder="juan.perez@empresa.cl" value={form.email} onChange={set("email")} />
              </div>
              <div className="space-y-1.5">
                <Label>Cargo</Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={form.position ?? ""} onChange={set("position")}
                >
                  <option value="">Sin cargo</option>
                  {jobPositions.filter((p) => p.isActive).map((p) => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Departamento</Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={form.departmentId ?? ""} onChange={set("departmentId")}
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
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={form.roleName} onChange={set("roleName")}
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
                size="sm" onClick={() => mutation.mutate()}
                disabled={!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || mutation.isPending}
              >
                {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <UserPlus className="w-4 h-4 mr-1.5" />Invitar
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Modal: editar perfil ──────────────────────────────────────────────────────
function EditUserModal({
  user, person, orgId, onClose,
}: { user: AuthUser; person: Person | undefined; orgId: string; onClose: () => void }) {
  const qc = useQueryClient()

  const [form, setForm] = useState<UpdatePersonRequest>({
    firstName:        person?.firstName        ?? "",
    secondName:       person?.secondName       ?? "",
    lastName:         person?.lastName         ?? "",
    maternalLastName: person?.maternalLastName ?? "",
    email:            person?.email            ?? user.email,
    rut:              person?.rut              ?? "",
    phone:            person?.phone            ?? "",
    position:         person?.position         ?? "",
    departmentId:     person?.departmentId     ?? "",
  })
  const [role, setRole] = useState(user.roles?.find((r) => r !== "END_USER") ?? "")
  const [error, setError] = useState("")

  const { data: deptRes } = useQuery({
    queryKey: ["departments", orgId],
    queryFn:  () => departmentsApi.list(orgId).then((r) => r.data),
    enabled:  !!orgId,
  })
  const departments = deptRes?.data ?? []

  const { data: posRes } = useQuery({
    queryKey: ["jobPositions", orgId],
    queryFn:  () => jobPositionsApi.list(orgId).then((r) => r.data),
    enabled:  !!orgId,
  })
  const jobPositions = posRes?.data ?? []

  const set = (k: keyof UpdatePersonRequest) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }))

  const personMutation = useMutation({
    mutationFn: () => personsApi.update(orgId, person!.id, form),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["persons", orgId] }),
  })

  const roleMutation = useMutation({
    mutationFn: () => authApi.assignRole(user.id, { roleName: role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  })

  const handleSave = async () => {
    setError("")
    try {
      if (person) await personMutation.mutateAsync()
      if (role && role !== (user.roles?.find((r) => r !== "END_USER") ?? "")) {
        await roleMutation.mutateAsync()
      }
      onClose()
    } catch (e: unknown) {
      setError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Error al guardar")
    }
  }

  const isPending = personMutation.isPending || roleMutation.isPending

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg space-y-4 p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold text-foreground">Editar usuario</p>
            <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Primer nombre *</Label>
            <Input value={form.firstName} onChange={set("firstName")} />
          </div>
          <div className="space-y-1.5">
            <Label>Segundo nombre</Label>
            <Input placeholder="Opcional" value={form.secondName ?? ""} onChange={set("secondName")} />
          </div>
          <div className="space-y-1.5">
            <Label>Apellido paterno *</Label>
            <Input value={form.lastName} onChange={set("lastName")} />
          </div>
          <div className="space-y-1.5">
            <Label>Apellido materno</Label>
            <Input placeholder="Opcional" value={form.maternalLastName ?? ""} onChange={set("maternalLastName")} />
          </div>
          <div className="space-y-1.5">
            <Label>RUT</Label>
            <Input placeholder="12.345.678-9" value={form.rut ?? ""} onChange={set("rut")} />
          </div>
          <div className="space-y-1.5">
            <Label>Teléfono</Label>
            <Input placeholder="+56 9 1234 5678" value={form.phone ?? ""} onChange={set("phone")} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Correo electrónico</Label>
            <Input type="email" value={form.email ?? ""} onChange={set("email")} />
          </div>
          <div className="space-y-1.5">
            <Label>Cargo</Label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={form.position ?? ""} onChange={set("position")}
            >
              <option value="">Sin cargo</option>
              {jobPositions.filter((p) => p.isActive).map((p) => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Departamento</Label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={form.departmentId ?? ""} onChange={set("departmentId")}
            >
              <option value="">Sin departamento</option>
              {departments.filter((d) => d.isActive).map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Rol en el sistema</Label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={role} onChange={(e) => setRole(e.target.value)}
            >
              <option value="">Sin cambios</option>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
          <Button size="sm" onClick={handleSave} disabled={isPending || !form.firstName.trim() || !form.lastName.trim()}>
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Guardar cambios
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Página principal ───────────────────────────────────────────────────────────
export default function UsersPage() {
  const { getUser } = useAuth()
  const orgId       = getUser()?.organizationId ?? ""
  const [search, setSearch]     = useState("")
  const [inviting, setInviting] = useState(false)
  const [editing, setEditing]   = useState<AuthUser | null>(null)

  const { data: usersRes, isLoading: lu, error: usersErr } = useQuery({
    queryKey: ["users"],
    queryFn:  () => usersApi.list().then((r) => r.data),
  })

  const { data: personsRes } = useQuery({
    queryKey: ["persons", orgId],
    queryFn:  () => personsApi.list(orgId).then((r) => r.data),
    enabled:  !!orgId,
  })

  const allPersons: Person[] = personsRes?.data ?? []
  const personMap = new Map(allPersons.map((p) => [p.id, p]))

  const users: AuthUser[] = (usersRes?.data ?? []).filter(
    (u) => !u.roles?.includes("END_USER") &&
      u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      {inviting && <InviteUserModal orgId={orgId} onClose={() => setInviting(false)} />}
      {editing && (
        <EditUserModal
          user={editing}
          person={editing.personId ? personMap.get(editing.personId) : undefined}
          orgId={orgId}
          onClose={() => setEditing(null)}
        />
      )}

      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-y-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Usuarios del sistema</h1>
            <p className="text-muted-foreground text-sm mt-1">Gestión de usuarios internos (analistas, auditores y administradores)</p>
          </div>
          <RequirePermission permission="USER_CREATE">
            <Button onClick={() => setInviting(true)}>
              <UserPlus className="w-4 h-4 mr-2" />Crear usuario
            </Button>
          </RequirePermission>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por correo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {lu && <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>}
            {usersErr && <p className="text-center text-sm text-muted-foreground py-8">No se pudieron cargar los usuarios.</p>}
            {!lu && !usersErr && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[22%]">Nombre</TableHead>
                      <TableHead className="w-[26%]">Correo</TableHead>
                      <TableHead className="w-[12%]">Rol</TableHead>
                      <TableHead className="w-[12%]">Estado</TableHead>
                      <TableHead className="w-[14%]">Departamento</TableHead>
                      <TableHead className="w-[10%]">Creado</TableHead>
                      <TableHead className="w-[4%] text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">No se encontraron usuarios.</TableCell>
                      </TableRow>
                    ) : users.map((u) => {
                      const person = u.personId ? personMap.get(u.personId) : undefined
                      const roleName = u.roles?.find((r) => r !== "END_USER") ?? ""
                      return (
                        <TableRow key={u.id}>
                          <TableCell className="max-w-0">
                            <p className="font-medium truncate" title={person?.fullName ?? "—"}>{person?.fullName ?? "—"}</p>
                            {person?.rut && <p className="text-xs text-muted-foreground">rut: {person.rut}</p>}
                            {person?.phone && <p className="text-xs text-muted-foreground">teléfono: {person.phone}</p>}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm max-w-0">
                            <p className="truncate" title={u.email}>{u.email}</p>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                            {ROLE_LABEL[roleName] ?? roleName ?? "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={STATUS_VARIANT[u.status] ?? "secondary"}>
                              {STATUS_LABEL[u.status] ?? u.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm max-w-0">
                            <p className="truncate" title={person?.departmentName ?? "—"}>{person?.departmentName ?? "—"}</p>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                            {new Date(u.createdAt).toLocaleDateString("es-CL")}
                          </TableCell>
                          <TableCell className="text-right">
                            <RequirePermission permission="USER_UPDATE">
                              <Button variant="ghost" size="sm" onClick={() => setEditing(u)} title="Editar perfil">
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                            </RequirePermission>
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
    </>
  )
}

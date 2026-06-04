import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Search, UserPlus, ShieldCheck, Loader2, X, Copy, Check } from "lucide-react"
import { usersApi, rolesApi, authApi, departmentsApi, personsApi } from "@/lib/api"
import type { InvitePersonRequest } from "@/types/person"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RequirePermission } from "@/components/RequirePermission"
import type { AuthUser, Role } from "@/types/auth"

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
  { value: "ANALYST",   label: "Analista (ANALYST)" },
  { value: "AUDITOR",   label: "Auditor (AUDITOR)" },
  { value: "ORG_ADMIN", label: "Administrador (ORG_ADMIN)" },
]

// ── Modal: invitar persona/usuario ────────────────────────────────────────────
function InviteUserModal({ orgId, onClose }: { orgId: string; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState<InvitePersonRequest>({
    firstName: "", lastName: "", email: "",
    position: "", departmentId: "", roleName: "ANALYST",
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

  const set = (k: keyof InvitePersonRequest) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }))

  const mutation = useMutation({
    mutationFn: () => {
      const body: InvitePersonRequest = {
        ...form,
        departmentId: form.departmentId || undefined,
        position:     form.position     || undefined,
      }
      return personsApi.invite(orgId, body)
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["users"] })
      qc.invalidateQueries({ queryKey: ["persons", orgId] })
      const pwd = res.data.data?.user?.data?.temporaryPassword
      setTempPass(pwd ?? null)
    },
    onError: (e: unknown) =>
      setError(
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Error al crear el usuario"
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
          <p className="font-semibold text-foreground">Invitar nuevo usuario</p>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {tempPassword ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-primary/10 border border-primary/20 p-4 space-y-2 text-center">
              <p className="text-sm font-medium text-foreground">¡Usuario creado correctamente!</p>
              <p className="text-xs text-muted-foreground">
                Comparte esta contraseña temporal con{" "}
                <span className="font-medium text-foreground">{form.firstName}</span>. La usará en su primer inicio de sesión.
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
                <Input type="email" placeholder="juan.perez@empresa.cl" value={form.email} onChange={set("email")} />
              </div>
              <div className="space-y-1.5">
                <Label>Cargo</Label>
                <Input placeholder="ej. Analista de datos" value={form.position ?? ""} onChange={set("position")} />
              </div>
              <div className="space-y-1.5">
                <Label>Departamento</Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
                disabled={
                  !form.firstName.trim() || !form.lastName.trim() ||
                  !form.email.trim() || mutation.isPending
                }
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

// ── Modal: asignar rol ─────────────────────────────────────────────────────────
function AssignRoleModal({ user, roles, onClose }: { user: AuthUser; roles: Role[]; onClose: () => void }) {
  const [selected, setSelected] = useState("")
  const [error, setError]       = useState("")
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => authApi.assignRole(user.id, { roleName: selected }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); onClose() },
    onError: (e: unknown) =>
      setError(
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Error al asignar el rol"
      ),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-sm mx-4 p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold text-foreground">Asignar rol</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1.5">
          <Label>Rol</Label>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Selecciona un rol...</option>
            {roles.filter((r) => r.isActive).map((r) => (
              <option key={r.id} value={r.name}>{r.name} — {r.description}</option>
            ))}
          </select>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
          <Button size="sm" onClick={() => mutation.mutate()} disabled={!selected || mutation.isPending}>
            {mutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
            Asignar
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Página principal ───────────────────────────────────────────────────────────
export default function UsersPage() {
  const { getUser }   = useAuth()
  const orgId         = getUser()?.organizationId ?? ""
  const [search, setSearch]         = useState("")
  const [inviting, setInviting]     = useState(false)
  const [targetUser, setTargetUser] = useState<AuthUser | null>(null)

  const { data: usersRes, isLoading: lu, error: usersErr } = useQuery({
    queryKey: ["users"],
    queryFn: () => usersApi.list().then((r) => r.data),
  })
  const { data: rolesRes } = useQuery({
    queryKey: ["roles"],
    queryFn: () => rolesApi.list().then((r) => r.data),
  })

  const users: AuthUser[] = (usersRes?.data ?? []).filter(
    (u) =>
      !u.roles?.includes("END_USER") &&
      u.email.toLowerCase().includes(search.toLowerCase())
  )
  const roles: Role[] = rolesRes?.data ?? []

  return (
    <>
      {inviting && <InviteUserModal orgId={orgId} onClose={() => setInviting(false)} />}
      {targetUser && (
        <AssignRoleModal user={targetUser} roles={roles} onClose={() => setTargetUser(null)} />
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
            {lu && (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            )}
            {usersErr && (
              <p className="text-center text-sm text-muted-foreground py-8">
                No se pudieron cargar los usuarios. Verifica que el backend esté disponible.
              </p>
            )}
            {!lu && !usersErr && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Correo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead>Organización</TableHead>
                      <TableHead>Creado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No se encontraron usuarios.
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">{u.email}</TableCell>
                          <TableCell>
                            <Badge variant={STATUS_VARIANT[u.status] ?? "secondary"}>
                              {STATUS_LABEL[u.status] ?? u.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {u.roles?.join(", ") || "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs font-mono">
                            {u.organizationId?.slice(0, 8)}…
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(u.createdAt).toLocaleDateString("es-CL")}
                          </TableCell>
                          <TableCell className="text-right">
                            <RequirePermission permission="ROLE_ASSIGN">
                              <Button variant="outline" size="sm" onClick={() => setTargetUser(u)}>
                                <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
                                Asignar rol
                              </Button>
                            </RequirePermission>
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

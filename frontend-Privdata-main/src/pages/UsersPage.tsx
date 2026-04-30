import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Search, UserPlus, ShieldCheck, Loader2, X, AlertCircle } from "lucide-react"
import { usersApi, rolesApi, authApi } from "@/lib/api"
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
  INACTIVE: "Inactivo",
  LOCKED:   "Bloqueado",
}
const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  ACTIVE:   "default",
  INACTIVE: "secondary",
  LOCKED:   "destructive",
}

// ── Modal: asignar rol ────────────────────────────────────────────────────────
function AssignRoleModal({
  user, roles, onClose,
}: { user: AuthUser; roles: Role[]; onClose: () => void }) {
  const [selected, setSelected] = useState("")
  const [error, setError]       = useState("")
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => authApi.assignRole(user.id, { roleName: selected }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); onClose() },
    onError: (e: unknown) => {
      setError(
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? "Error al asignar el rol"
      )
    },
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
          <Label htmlFor="role-sel">Rol</Label>
          <select
            id="role-sel"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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

// ── Página principal ──────────────────────────────────────────────────────────
export default function UsersPage() {
  const [search, setSearch]         = useState("")
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
      u.email.toLowerCase().includes(search.toLowerCase())
  )
  const roles: Role[] = rolesRes?.data ?? []

  return (
    <>
      {targetUser && (
        <AssignRoleModal
          user={targetUser}
          roles={roles}
          onClose={() => setTargetUser(null)}
        />
      )}

      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-y-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Usuarios</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Gestión de usuarios internos del sistema
            </p>
          </div>
          <RequirePermission permission="USER_CREATE">
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />Crear usuario
            </Button>
          </RequirePermission>
        </div>

        {/* Banner pendiente de backend */}
        <div className="flex gap-2 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-4 py-3">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Requiere <strong>GET /auth/users</strong> en AuthService para listar usuarios.
            La asignación de rol (<strong>POST /auth/users/{"{id}"}/roles</strong>) ya está disponible.
          </p>
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
                      <TableHead>Organización</TableHead>
                      <TableHead>Creado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
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
                          <TableCell className="text-muted-foreground text-xs font-mono">
                            {u.organizationId.slice(0, 8)}…
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(u.createdAt).toLocaleDateString("es-CL")}
                          </TableCell>
                          <TableCell className="text-right">
                            <RequirePermission permission="ROLE_ASSIGN">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setTargetUser(u)}
                              >
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
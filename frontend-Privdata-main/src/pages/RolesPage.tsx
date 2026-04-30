import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Plus, Shield, ChevronDown, ChevronUp,
  Loader2, CheckCircle2, Circle, AlertCircle,
} from "lucide-react"
import { rolesApi, permissionsApi } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { RequirePermission } from "@/components/RequirePermission"
import type { Role, Permission } from "@/types/auth"

function groupByModule(permissions: Permission[]) {
  return permissions.reduce<Record<string, Permission[]>>((acc, p) => {
    if (!acc[p.module]) acc[p.module] = []
    acc[p.module].push(p)
    return acc
  }, {})
}

function CreateRoleForm({ onSuccess }: { onSuccess: () => void }) {
  const [name, setName]   = useState("")
  const [desc, setDesc]   = useState("")
  const [error, setError] = useState("")
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: () =>
      rolesApi.create({ name: name.trim().toUpperCase().replace(/\s+/g, "_"), description: desc.trim() }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["roles"] }); setName(""); setDesc(""); onSuccess() },
    onError: (e: unknown) => {
      setError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Error al crear el rol")
    },
  })

  return (
    <Card className="border-dashed">
      <CardContent className="pt-5 space-y-3">
        <p className="text-sm font-medium">Nuevo rol</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="rn">Nombre</Label>
            <Input id="rn" placeholder="ej. AUDITOR" value={name} onChange={(e) => setName(e.target.value)} />
            <p className="text-xs text-muted-foreground">Se guarda en mayúsculas automáticamente</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rd">Descripción</Label>
            <Input id="rd" placeholder="ej. Solo lectura en auditoría" value={desc} onChange={(e) => setDesc(e.target.value)} />
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end">
          <Button size="sm" onClick={() => mutation.mutate()} disabled={!name.trim() || mutation.isPending}>
            {mutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
            Crear rol
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function RoleRow({ role, allPermissions }: { role: Role; allPermissions: Permission[] }) {
  const [open, setOpen]         = useState(false)
  const [assigned, setAssigned] = useState<Set<string>>(new Set())
  const qc = useQueryClient()

  const assignMutation = useMutation({
    mutationFn: (permissionId: string) => rolesApi.assignPermission(role.id, permissionId),
    onSuccess: (_d, permissionId) => {
      setAssigned((prev) => new Set([...prev, permissionId]))
      qc.invalidateQueries({ queryKey: ["roles"] })
    },
  })

  const removeMutation = useMutation({
    mutationFn: (permissionId: string) => rolesApi.removePermission(role.id, permissionId),
    onSuccess: (_d, permissionId) => {
      setAssigned((prev) => { const s = new Set(prev); s.delete(permissionId); return s })
      qc.invalidateQueries({ queryKey: ["roles"] })
    },
  })

  const toggle = (permissionId: string) => {
    if (assigned.has(permissionId)) removeMutation.mutate(permissionId)
    else assignMutation.mutate(permissionId)
  }

  const grouped = groupByModule(allPermissions)
  const busy    = assignMutation.isPending || removeMutation.isPending

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 bg-card hover:bg-muted/50 transition-colors text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <Shield className="w-4 h-4 text-primary shrink-0" />
          <div>
            <p className="text-sm font-medium">{role.name}</p>
            <p className="text-xs text-muted-foreground">{role.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={role.isActive ? "default" : "secondary"}>
            {role.isActive ? "Activo" : "Inactivo"}
          </Badge>
          <span className="text-xs text-muted-foreground">{assigned.size} permisos</span>
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-border bg-muted/20 p-4 space-y-4">
          <p className="text-xs text-muted-foreground">
            Activa o desactiva permisos para este rol. Los cambios se aplican inmediatamente.
          </p>
          {Object.entries(grouped).map(([module, perms]) => (
            <div key={module}>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">{module}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {perms.map((perm) => {
                  const isOn = assigned.has(perm.id)
                  return (
                    <button
                      key={perm.id}
                      onClick={() => toggle(perm.id)}
                      disabled={busy}
                      className="flex items-start gap-2 p-2 rounded-md border text-left transition-colors hover:bg-muted/60 disabled:opacity-50"
                      style={{ borderColor: isOn ? "hsl(var(--primary))" : "hsl(var(--border))" }}
                    >
                      {isOn
                        ? <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        : <Circle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                      }
                      <div>
                        <p className="text-xs font-medium">{perm.action}</p>
                        <p className="text-xs text-muted-foreground">{perm.description}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function RolesPage() {
  const [showForm, setShowForm] = useState(false)

  const { data: rolesRes,  isLoading: lr, error: rolesErr } = useQuery({
    queryKey: ["roles"],
    queryFn: () => rolesApi.list().then((r) => r.data),
  })
  const { data: permsRes, isLoading: lp } = useQuery({
    queryKey: ["permissions"],
    queryFn: () => permissionsApi.list().then((r) => r.data),
  })

  const roles: Role[]             = rolesRes?.data ?? []
  const permissions: Permission[] = permsRes?.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-y-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Roles y permisos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Define los roles del sistema y los permisos que otorga cada uno
          </p>
        </div>
        <RequirePermission permission="ROLE_ASSIGN">
          <Button onClick={() => setShowForm((v) => !v)}>
            <Plus className="w-4 h-4 mr-2" />Nuevo rol
          </Button>
        </RequirePermission>
      </div>

      {showForm && (
        <RequirePermission permission="ROLE_ASSIGN">
          <CreateRoleForm onSuccess={() => setShowForm(false)} />
        </RequirePermission>
      )}

      {/* Banner pendiente de backend */}
      <div className="flex gap-2 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-4 py-3">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-medium text-amber-800 dark:text-amber-300">Endpoints pendientes en AuthService</p>
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
            GET /auth/roles · GET /auth/permissions · POST /auth/roles ·
            POST /auth/roles/{"{id}"}/permissions · DELETE /auth/roles/{"{id}"}/permissions/{"{permId}"}
          </p>
        </div>
      </div>

      {(lr || lp) && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {rolesErr && (
        <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">
          No se pudieron cargar los roles. Verifica que el backend esté disponible.
        </CardContent></Card>
      )}

      {!lr && !lp && roles.length === 0 && !rolesErr && (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">
          No hay roles creados aún.
        </CardContent></Card>
      )}

      <div className="space-y-3">
        {roles.map((role) => (
          <RoleRow key={role.id} role={role} allPermissions={permissions} />
        ))}
      </div>
    </div>
  )
}
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Building2, Pencil, Loader2, X, MapPin, Phone, Mail, Briefcase, CalendarDays } from "lucide-react"
import { organizationsApi } from "@/lib/api"
import type { Organization, OrganizationUpdateRequest } from "@/types/organization"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

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
    description:  org.description  ?? "",
  })
  const [error, setError] = useState("")
  const set = (k: keyof OrganizationUpdateRequest) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }))
  const mutation = useMutation({
    mutationFn: () => organizationsApi.update(org.id, form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-org", org.id] }); onClose() },
    onError: (e: unknown) =>
      setError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Error al guardar"),
  })
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg space-y-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between">
          <p className="font-semibold text-foreground">Editar organización</p>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>Nombre *</Label><Input value={form.name} onChange={set("name")} /></div>
          <div className="space-y-1.5"><Label>Razón social *</Label><Input value={form.legalName} onChange={set("legalName")} /></div>
          <div className="space-y-1.5"><Label>RUT *</Label><Input value={form.rut} onChange={set("rut")} /></div>
          <div className="space-y-1.5"><Label>Tipo de empresa</Label><Input value={form.businessType ?? ""} onChange={set("businessType")} placeholder="SpA, S.A., Ltda." /></div>
          <div className="space-y-1.5"><Label>Correo</Label><Input type="email" value={form.email ?? ""} onChange={set("email")} /></div>
          <div className="space-y-1.5"><Label>Teléfono</Label><Input value={form.phone ?? ""} onChange={set("phone")} /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label>Dirección</Label><Input value={form.address ?? ""} onChange={set("address")} /></div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Descripción</Label>
            <textarea
              value={form.description ?? ""}
              onChange={set("description")}
              placeholder="Breve descripción de la organización, misión o actividad principal..."
              rows={3}
              className="w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
          <Button size="sm" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Guardar cambios
          </Button>
        </div>
      </div>
    </div>
  )
}

function ContactField({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 p-2 rounded-lg bg-muted shrink-0">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground truncate">{value || "—"}</p>
      </div>
    </div>
  )
}

export default function OrganizacionPage() {
  const { getUser } = useAuth()
  const orgId = getUser()?.organizationId ?? ""
  const [editing, setEditing] = useState(false)

  const { data: orgData, isLoading } = useQuery({
    queryKey: ["my-org", orgId],
    queryFn:  () => organizationsApi.getById(orgId).then((r) => r.data),
    enabled:  !!orgId,
  })
  const org = orgData?.data

  const createdYear = org?.createdAt
    ? new Date(org.createdAt).getFullYear()
    : null

  return (
    <>
      {editing && org && <EditOrgModal org={org} onClose={() => setEditing(false)} />}
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Organización</h1>
          <p className="text-muted-foreground text-sm mt-1">Perfil de la organización responsable del tratamiento de datos</p>
        </div>

        {/* Profile card */}
        <Card className="overflow-hidden">
          {/* Banner */}
          <div className="h-28 bg-gradient-to-br from-primary/30 via-primary/15 to-primary/5 relative" />

          <CardContent className="px-6 pb-6 pt-0">
            {/* Avatar row */}
            <div className="flex items-end justify-between -mt-10 mb-5">
              <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground text-2xl font-black shadow-lg border-4 border-background shrink-0 select-none">
                {isLoading
                  ? <Building2 className="w-8 h-8 opacity-60" />
                  : org
                  ? getInitials(org.name)
                  : <Building2 className="w-8 h-8" />
                }
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(true)}
                disabled={!org}
                className="shrink-0"
              >
                <Pencil className="w-3.5 h-3.5 mr-1.5" />Editar
              </Button>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                <div className="h-7 w-52 bg-muted animate-pulse rounded" />
                <div className="h-4 w-36 bg-muted animate-pulse rounded" />
                <div className="h-4 w-80 bg-muted animate-pulse rounded mt-3" />
              </div>
            ) : org ? (
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground leading-tight">{org.name}</h2>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  {org.businessType && (
                    <span className="text-sm text-muted-foreground">{org.businessType}</span>
                  )}
                  {org.businessType && org.rut && (
                    <span className="text-muted-foreground/40 text-sm">·</span>
                  )}
                  <span className="text-sm text-muted-foreground font-mono">{org.rut}</span>
                  {createdYear && (
                    <>
                      <span className="text-muted-foreground/40 text-sm">·</span>
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <CalendarDays className="w-3.5 h-3.5" />
                        Desde {createdYear}
                      </span>
                    </>
                  )}
                </div>
                {org.description ? (
                  <p className="text-sm text-foreground/80 leading-relaxed max-w-2xl pt-1">
                    {org.description}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground/60 italic pt-1">
                    Sin descripción — agrega una para presentar tu organización.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No se pudo cargar la información.</p>
            )}
          </CardContent>
        </Card>

        {/* Contact info */}
        {!isLoading && org && (
          <Card>
            <CardHeader className="pb-0">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Información de contacto
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <ContactField icon={Briefcase} label="Razón social" value={org.legalName} />
                <ContactField icon={Mail}      label="Correo"       value={org.email} />
                <ContactField icon={Phone}     label="Teléfono"     value={org.phone} />
                <ContactField icon={MapPin}    label="Dirección"    value={org.address} />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}

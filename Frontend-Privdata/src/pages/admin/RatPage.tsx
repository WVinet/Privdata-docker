import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Loader2, FileSpreadsheet, Pencil, Search, Eye } from "lucide-react"
import { toast } from "sonner"
import * as Dialog from "@radix-ui/react-dialog"
import { complianceApi, terceroApi } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { RequirePermission } from "@/components/RequirePermission"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type {
  TreatmentActivity, TreatmentActivityStatus, LegalBasis, DataCategory,
  TreatmentActivityCreateRequest, TreatmentActivityUpdateRequest,
  Tercero,
} from "@/types/compliance"
import { TERCERO_TIPO_LABELS } from "@/types/compliance"

// ── helpers ───────────────────────────────────────────────────────────────────

const LEGAL_BASIS_OPTIONS: { value: LegalBasis; label: string }[] = [
  { value: "CONSENTIMIENTO",   label: "Art. 12 — Consentimiento" },
  { value: "CONTRATO",         label: "Art. 13 — Contrato" },
  { value: "OBLIGACION_LEGAL", label: "Art. 13 — Obligación legal" },
  { value: "INTERES_LEGITIMO", label: "Art. 13 — Interés legítimo" },
  { value: "INTERES_VITAL",    label: "Art. 13 — Interés vital" },
]

const STATUS_FILTER_OPTIONS: { value: TreatmentActivityStatus | ""; label: string }[] = [
  { value: "",             label: "Todos los estados" },
  { value: "ACTIVE",       label: "Activa" },
  { value: "INACTIVE",     label: "Inactiva" },
  { value: "UNDER_REVIEW", label: "En revisión" },
]

const STATUS_LABEL: Record<TreatmentActivityStatus, string> = {
  ACTIVE:       "Activa",
  INACTIVE:     "Inactiva",
  UNDER_REVIEW: "En revisión",
}

const STATUS_VARIANT: Record<TreatmentActivityStatus, "default" | "secondary" | "outline"> = {
  ACTIVE:       "default",
  INACTIVE:     "secondary",
  UNDER_REVIEW: "outline",
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" })
}

// ── main page ────────────────────────────────────────────────────────────────

export default function RatPage() {
  const { getUser } = useAuth()
  const orgId = getUser()?.organizationId ?? ""
  const queryClient = useQueryClient()

  const userRole = getUser()?.authorities?.find((a: string) => a.startsWith("ROLE_"))?.replace("ROLE_", "")
  const isAuditor = userRole === "AUDITOR" || userRole === "AUDITOR_AGENCIA"
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<TreatmentActivityStatus | "">("")
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<TreatmentActivity | null>(null)
  const [viewing, setViewing] = useState<TreatmentActivity | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["rat", orgId],
    queryFn: () => complianceApi.getRat(orgId).then((r) => r.data),
    enabled: !!orgId,
  })

  const activities = Array.isArray(data) ? data : []

  const filtered = activities.filter((a) => {
    if (statusFilter && a.status !== statusFilter) return false
    if (!search) return true
    const term = search.toLowerCase()
    return a.name.toLowerCase().includes(term) || a.purpose.toLowerCase().includes(term)
  })

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["rat", orgId] })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-y-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Registro de Actividades de Tratamiento</h1>
          <p className="text-muted-foreground text-sm mt-1">
            RAT — finalidades de tratamiento de datos personales (Art. 14 ter y 49 Ley 21.719)
          </p>
        </div>
        <RequirePermission permission="RAT_CREATE">
          <Button onClick={() => setShowForm(true)} className="gap-2 shrink-0">
            <Plus className="w-4 h-4" />
            Nueva actividad
          </Button>
        </RequirePermission>
      </div>

      <Card>
        <CardContent className="pt-4 space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o finalidad..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TreatmentActivityStatus | "")}
              className="text-sm border rounded-md px-3 py-2 bg-background text-foreground border-border"
            >
              {STATUS_FILTER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <FileSpreadsheet className="w-8 h-8 mx-auto text-muted-foreground opacity-40" />
              <p className="text-sm font-medium text-foreground">Sin actividades de tratamiento</p>
              <p className="text-xs text-muted-foreground">
                {activities.length === 0
                  ? "Crea la primera actividad para comenzar el registro."
                  : "No hay actividades que coincidan con el filtro."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Finalidad</TableHead>
                    <TableHead>Base legal</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Datos sensibles</TableHead>
                    <TableHead>Actualizada</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell className="font-medium">{activity.name}</TableCell>
                      <TableCell className="text-muted-foreground max-w-xs truncate">{activity.purpose}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {LEGAL_BASIS_OPTIONS.find((o) => o.value === activity.legalBasis)?.label ?? activity.legalBasis}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[activity.status]}>{STATUS_LABEL[activity.status]}</Badge>
                      </TableCell>
                      <TableCell>
                        {activity.containsSensitiveData
                          ? <Badge variant="destructive">Sensibles</Badge>
                          : <span className="text-xs text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{fmt(activity.updatedAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isAuditor && (
                            <button
                              onClick={() => setViewing(activity)}
                              className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border font-medium hover:bg-muted transition-colors border-border text-muted-foreground"
                            >
                              <Eye className="w-3 h-3" />
                              Ver detalle
                            </button>
                          )}
                          <RequirePermission permission="RAT_UPDATE">
                            <button
                              onClick={() => setEditing(activity)}
                              className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border font-medium hover:bg-muted transition-colors border-border text-muted-foreground"
                            >
                              <Pencil className="w-3 h-3" />
                              Editar
                            </button>
                          </RequirePermission>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ActivityFormDialog
        key={editing?.id ?? (showForm ? "new" : "idle")}
        open={showForm || !!editing}
        orgId={orgId}
        activity={editing}
        onClose={() => { setShowForm(false); setEditing(null) }}
        onSaved={invalidate}
      />

      <ActivityDetailDialog
        activity={viewing}
        onClose={() => setViewing(null)}
      />
    </div>
  )
}

// ── create/edit dialog ──────────────────────────────────────────────────────

type FormState = {
  name: string
  description: string
  purpose: string
  legalBasis: LegalBasis
  dataSubjectCategories: string
  retentionPeriodDays: string
  dataSystems: string
  securityMeasures: string
  dataCategoryIds: string[]
  terceroIds: string[]
  status: TreatmentActivityStatus
}

function emptyForm(): FormState {
  return {
    name: "", description: "", purpose: "", legalBasis: "CONSENTIMIENTO",
    dataSubjectCategories: "", retentionPeriodDays: "",
    dataSystems: "", securityMeasures: "",
    dataCategoryIds: [], terceroIds: [], status: "ACTIVE",
  }
}

function activityToForm(activity: TreatmentActivity): FormState {
  return {
    name: activity.name,
    description: activity.description ?? "",
    purpose: activity.purpose,
    legalBasis: activity.legalBasis,
    dataSubjectCategories: activity.dataSubjectCategories ?? "",
    retentionPeriodDays: activity.retentionPeriodDays?.toString() ?? "",
    dataSystems: activity.dataSystems ?? "",
    securityMeasures: activity.securityMeasures ?? "",
    dataCategoryIds: activity.dataCategories.map((c) => c.id),
    terceroIds: (activity.terceros ?? []).map((t) => t.id),
    status: activity.status,
  }
}

function ActivityFormDialog({
  open, orgId, activity, onClose, onSaved,
}: {
  open: boolean
  orgId: string
  activity: TreatmentActivity | null
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = !!activity
  const [form, setForm] = useState<FormState>(() => activity ? activityToForm(activity) : emptyForm())
  const [error, setError] = useState("")

  const { data: categoriesData } = useQuery({
    queryKey: ["data-categories"],
    queryFn: () => complianceApi.getDataCategories().then((r) => Array.isArray(r.data) ? r.data : []),
    enabled: open,
  })
  const categories: DataCategory[] = Array.isArray(categoriesData) ? categoriesData : []

  const { data: tercerosData } = useQuery({
    queryKey: ["terceros", orgId],
    queryFn: () => terceroApi.list(orgId, true).then((r) => Array.isArray(r.data) ? r.data : []),
    enabled: open && !!orgId,
  })
  const tercerosCatalog: Tercero[] = Array.isArray(tercerosData) ? tercerosData : []

  const mutation = useMutation({
    mutationFn: () => {
      const base = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        purpose: form.purpose.trim(),
        legalBasis: form.legalBasis,
        dataSubjectCategories: form.dataSubjectCategories.trim() || undefined,
        retentionPeriodDays: form.retentionPeriodDays ? Number(form.retentionPeriodDays) : undefined,
        dataSystems: form.dataSystems.trim() || undefined,
        securityMeasures: form.securityMeasures.trim() || undefined,
        dataCategoryIds: form.dataCategoryIds,
        terceroIds: form.terceroIds,
      }
      return isEdit
        ? complianceApi.updateRat(activity!.id, { ...base, status: form.status } satisfies TreatmentActivityUpdateRequest)
        : complianceApi.createRat({ ...base, organizationId: orgId } satisfies TreatmentActivityCreateRequest)
    },
    onSuccess: () => {
      toast.success(isEdit ? "Actividad actualizada correctamente." : "Actividad creada correctamente.")
      onSaved()
      onClose()
    },
    onError: () => setError(`Error al ${isEdit ? "actualizar" : "crear"} la actividad. Intenta de nuevo.`),
  })

  function toggleCategory(id: string) {
    setForm((f) => ({
      ...f,
      dataCategoryIds: f.dataCategoryIds.includes(id)
        ? f.dataCategoryIds.filter((c) => c !== id)
        : [...f.dataCategoryIds, id],
    }))
  }

  function toggleTercero(id: string) {
    setForm((f) => ({
      ...f,
      terceroIds: f.terceroIds.includes(id)
        ? f.terceroIds.filter((t) => t !== id)
        : [...f.terceroIds, id],
    }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!form.name.trim()) { setError("El nombre es obligatorio."); return }
    if (!form.purpose.trim()) { setError("La finalidad es obligatoria."); return }
    mutation.mutate()
  }

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg border border-border focus:outline-none max-h-[90vh] overflow-y-auto">
          <Dialog.Title className="text-base font-bold mb-1 text-foreground">
            {isEdit ? "Editar actividad de tratamiento" : "Nueva actividad de tratamiento"}
          </Dialog.Title>
          <Dialog.Description className="text-xs text-muted-foreground mb-5">
            Describe una finalidad de tratamiento de datos personales (Art. 14 ter y 49 Ley 21.719).
          </Dialog.Description>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="ta-name">Nombre *</Label>
              <Input
                id="ta-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                disabled={mutation.isPending}
                placeholder="Ej: Gestión de relación con clientes"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ta-purpose">Finalidad *</Label>
              <textarea
                id="ta-purpose"
                rows={2}
                value={form.purpose}
                onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))}
                disabled={mutation.isPending}
                className="w-full text-sm rounded-md border border-border px-3 py-2 bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Para qué se tratan estos datos..."
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ta-desc">Descripción</Label>
              <textarea
                id="ta-desc"
                rows={2}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                disabled={mutation.isPending}
                className="w-full text-sm rounded-md border border-border px-3 py-2 bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Detalle opcional..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ta-basis">Base legal *</Label>
                <select
                  id="ta-basis"
                  value={form.legalBasis}
                  onChange={(e) => setForm((f) => ({ ...f, legalBasis: e.target.value as LegalBasis }))}
                  disabled={mutation.isPending}
                  className="w-full text-sm border rounded-md px-3 py-2 bg-background text-foreground border-border"
                >
                  {LEGAL_BASIS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              {isEdit && (
                <div className="space-y-1.5">
                  <Label htmlFor="ta-status">Estado</Label>
                  <select
                    id="ta-status"
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as TreatmentActivityStatus }))}
                    disabled={mutation.isPending}
                    className="w-full text-sm border rounded-md px-3 py-2 bg-background text-foreground border-border"
                  >
                    {(Object.keys(STATUS_LABEL) as TreatmentActivityStatus[]).map((s) => (
                      <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ta-subjects">Categorías de titulares</Label>
              <Input
                id="ta-subjects"
                value={form.dataSubjectCategories}
                onChange={(e) => setForm((f) => ({ ...f, dataSubjectCategories: e.target.value }))}
                disabled={mutation.isPending}
                placeholder="Ej: clientes, empleados, proveedores"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ta-retention">Retención (días)</Label>
              <Input
                id="ta-retention"
                type="number"
                min="0"
                value={form.retentionPeriodDays}
                onChange={(e) => setForm((f) => ({ ...f, retentionPeriodDays: e.target.value }))}
                disabled={mutation.isPending}
                placeholder="Ej: 365"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Terceros destinatarios</Label>
              {tercerosCatalog.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No hay terceros en el catálogo. Agrégalos en <strong>Terceros</strong> del menú.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto border border-border rounded-md p-2">
                  {tercerosCatalog.map((t) => (
                    <label key={t.id} className="flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.terceroIds.includes(t.id)}
                        onChange={() => toggleTercero(t.id)}
                        disabled={mutation.isPending}
                        className="w-3.5 h-3.5 accent-primary"
                      />
                      <span className="text-foreground font-medium">{t.nombre}</span>
                      <span className="text-muted-foreground">— {TERCERO_TIPO_LABELS[t.tipo]}</span>
                      {t.pais !== "Chile" && (
                        <span className="text-amber-600">({t.pais})</span>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ta-security">Medidas de seguridad</Label>
              <textarea
                id="ta-security"
                rows={2}
                value={form.securityMeasures}
                onChange={(e) => setForm((f) => ({ ...f, securityMeasures: e.target.value }))}
                disabled={mutation.isPending}
                className="w-full text-sm rounded-md border border-border px-3 py-2 bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Medidas técnicas y organizativas aplicadas..."
              />
            </div>

            <div className="space-y-1.5">
              <Label>Categorías de datos tratadas</Label>
              {categories.length === 0 ? (
                <p className="text-xs text-muted-foreground">No hay categorías de datos configuradas.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-border rounded-md p-2">
                  {categories.map((cat) => (
                    <label key={cat.id} className="flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.dataCategoryIds.includes(cat.id)}
                        onChange={() => toggleCategory(cat.id)}
                        disabled={mutation.isPending}
                        className="w-3.5 h-3.5 accent-primary"
                      />
                      <span className={cat.sensitive ? "text-destructive font-medium" : "text-foreground"}>
                        {cat.name}{cat.sensitive ? " (sensible)" : ""}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={mutation.isPending}
                className="flex-1 px-4 py-2 text-xs rounded-lg border font-medium hover:bg-muted transition-colors border-border text-muted-foreground"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={mutation.isPending || !form.name.trim() || !form.purpose.trim()}
                className="flex-1 px-4 py-2 text-xs rounded-lg font-semibold flex items-center justify-center gap-1.5 bg-primary text-primary-foreground disabled:opacity-50 transition-colors"
              >
                {mutation.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                {isEdit ? "Guardar cambios" : "Crear actividad"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// ── read-only detail dialog (AUDITOR) ────────────────────────────────────────

function ActivityDetailDialog({
  activity, onClose,
}: { activity: TreatmentActivity | null; onClose: () => void }) {
  function formatRetention(days?: number | null): string {
    if (!days) return "—"
    if (days >= 365) { const y = Math.round(days / 365); return y === 1 ? "1 año" : `${y} años` }
    if (days >= 30)  { const m = Math.round(days / 30);  return m === 1 ? "1 mes" : `${m} meses` }
    return days === 1 ? "1 día" : `${days} días`
  }

  return (
    <Dialog.Root open={!!activity} onOpenChange={(o) => { if (!o) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg border border-border focus:outline-none max-h-[90vh] overflow-y-auto">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10 shrink-0">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
            </div>
            <div>
              <Dialog.Title className="text-base font-bold text-foreground">Detalle de actividad</Dialog.Title>
              <Dialog.Description className="text-xs text-muted-foreground">Vista de solo lectura</Dialog.Description>
            </div>
          </div>

          {activity && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <div className="col-span-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Nombre</p>
                  <p className="text-foreground font-medium">{activity.name}</p>
                </div>
                {activity.description && (
                  <div className="col-span-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Descripción</p>
                    <p className="text-foreground">{activity.description}</p>
                  </div>
                )}
                <div className="col-span-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Finalidad</p>
                  <p className="text-foreground">{activity.purpose}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Base legal</p>
                  <p className="text-foreground text-xs">
                    {LEGAL_BASIS_OPTIONS.find((o) => o.value === activity.legalBasis)?.label ?? activity.legalBasis}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Estado</p>
                  <Badge variant={STATUS_VARIANT[activity.status]}>{STATUS_LABEL[activity.status]}</Badge>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Retención</p>
                  <p className="text-foreground">{formatRetention(activity.retentionPeriodDays)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Datos sensibles</p>
                  <p className="text-foreground">{activity.containsSensitiveData ? "Sí" : "No"}</p>
                </div>
                {activity.dataSubjectCategories && (
                  <div className="col-span-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Categorías de titulares</p>
                    <p className="text-foreground">{activity.dataSubjectCategories}</p>
                  </div>
                )}
                {activity.securityMeasures && (
                  <div className="col-span-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Medidas de seguridad</p>
                    <p className="text-foreground">{activity.securityMeasures}</p>
                  </div>
                )}
              </div>

              {activity.dataCategories.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Categorías de datos</p>
                  <div className="flex flex-wrap gap-1.5">
                    {activity.dataCategories.map((cat) => (
                      <span key={cat.id} className="text-xs px-2 py-0.5 rounded-full"
                        style={cat.sensitive
                          ? { background: "hsl(var(--destructive) / 0.08)", color: "hsl(var(--destructive))" }
                          : { background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }
                        }
                      >
                        {cat.sensitive ? "⚠ " : ""}{cat.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(activity.terceros ?? []).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Terceros destinatarios</p>
                  <div className="space-y-1.5">
                    {(activity.terceros ?? []).map((t) => (
                      <div key={t.id} className="flex items-center gap-2 text-xs p-2.5 rounded-lg border border-border bg-muted/20">
                        <span className="font-medium text-foreground">{t.nombre}</span>
                        <span className="text-muted-foreground">—</span>
                        <span className="text-muted-foreground">{TERCERO_TIPO_LABELS[t.tipo]}</span>
                        {t.pais !== "Chile" && (
                          <span className="ml-auto text-amber-600 font-medium">{t.pais}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-5">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 text-xs rounded-lg border font-medium hover:bg-muted transition-colors border-border text-muted-foreground"
            >
              Cerrar
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

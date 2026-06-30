import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Loader2, FileSpreadsheet, Pencil, Search } from "lucide-react"
import { toast } from "sonner"
import * as Dialog from "@radix-ui/react-dialog"
import { complianceApi } from "@/lib/api"
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
} from "@/types/compliance"

// ── helpers ───────────────────────────────────────────────────────────────────

const LEGAL_BASIS_OPTIONS: { value: LegalBasis; label: string }[] = [
  { value: "CONSENTIMIENTO",   label: "Art. 12 — Consentimiento" },
  { value: "CONTRATO",         label: "Art. 13 — Contrato" },
  { value: "OBLIGACION_LEGAL", label: "Art. 13 — Obligación legal" },
  { value: "INTERES_LEGITIMO", label: "Art. 13 — Interés legítimo" },
  { value: "INTERES_VITAL",    label: "Art. 13 — Interés vital" },
  { value: "FUNCION_PUBLICA",  label: "Art. 20 — Función pública" },
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

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<TreatmentActivityStatus | "">("")
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<TreatmentActivity | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["rat", orgId],
    queryFn: () => complianceApi.getRat(orgId).then((r) => r.data),
    enabled: !!orgId,
  })

  const activities = data ?? []

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
                        <RequirePermission permission="RAT_UPDATE">
                          <button
                            onClick={() => setEditing(activity)}
                            className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border font-medium hover:bg-muted transition-colors border-border text-muted-foreground"
                          >
                            <Pencil className="w-3 h-3" />
                            Editar
                          </button>
                        </RequirePermission>
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
  thirdPartyRecipients: string
  internationalTransfer: boolean
  dataSystems: string
  securityMeasures: string
  dataCategoryIds: string[]
  status: TreatmentActivityStatus
}

function emptyForm(): FormState {
  return {
    name: "", description: "", purpose: "", legalBasis: "CONSENTIMIENTO",
    dataSubjectCategories: "", retentionPeriodDays: "", thirdPartyRecipients: "",
    internationalTransfer: false, dataSystems: "", securityMeasures: "",
    dataCategoryIds: [], status: "ACTIVE",
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
    thirdPartyRecipients: activity.thirdPartyRecipients ?? "",
    internationalTransfer: activity.internationalTransfer,
    dataSystems: activity.dataSystems ?? "",
    securityMeasures: activity.securityMeasures ?? "",
    dataCategoryIds: activity.dataCategories.map((c) => c.id),
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
    queryFn: () => complianceApi.getDataCategories().then((r) => r.data.data ?? []),
    enabled: open,
  })
  const categories: DataCategory[] = categoriesData ?? []

  const mutation = useMutation({
    mutationFn: () => {
      const base = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        purpose: form.purpose.trim(),
        legalBasis: form.legalBasis,
        dataSubjectCategories: form.dataSubjectCategories.trim() || undefined,
        retentionPeriodDays: form.retentionPeriodDays ? Number(form.retentionPeriodDays) : undefined,
        thirdPartyRecipients: form.thirdPartyRecipients.trim() || undefined,
        internationalTransfer: form.internationalTransfer,
        dataSystems: form.dataSystems.trim() || undefined,
        securityMeasures: form.securityMeasures.trim() || undefined,
        dataCategoryIds: form.dataCategoryIds,
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

            <div className="grid grid-cols-2 gap-3">
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
              <label className="flex items-center gap-2 mt-6">
                <input
                  type="checkbox"
                  checked={form.internationalTransfer}
                  onChange={(e) => setForm((f) => ({ ...f, internationalTransfer: e.target.checked }))}
                  disabled={mutation.isPending}
                  className="w-4 h-4 accent-primary"
                />
                <span className="text-sm text-foreground">Transferencia internacional</span>
              </label>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ta-third">Destinatarios / terceros</Label>
              <textarea
                id="ta-third"
                rows={2}
                value={form.thirdPartyRecipients}
                onChange={(e) => setForm((f) => ({ ...f, thirdPartyRecipients: e.target.value }))}
                disabled={mutation.isPending}
                className="w-full text-sm rounded-md border border-border px-3 py-2 bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="A quién se comunican estos datos, si corresponde..."
              />
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

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Loader2, Users, Pencil, Trash2, Globe } from "lucide-react"
import { toast } from "sonner"
import * as Dialog from "@radix-ui/react-dialog"
import { terceroApi } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { RequirePermission } from "@/components/RequirePermission"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import type {
  Tercero, TerceroTipo, MecanismoTransferencia,
  TerceroCreateRequest, TerceroUpdateRequest,
} from "@/types/compliance"
import { TERCERO_TIPO_LABELS, MECANISMO_LABELS } from "@/types/compliance"

const TIPO_OPTIONS: { value: TerceroTipo; label: string }[] = [
  { value: "ENCARGADO",            label: TERCERO_TIPO_LABELS.ENCARGADO },
  { value: "CESIONARIO",           label: TERCERO_TIPO_LABELS.CESIONARIO },
  { value: "TERCERO_INDEPENDIENTE", label: TERCERO_TIPO_LABELS.TERCERO_INDEPENDIENTE },
]

const MECANISMO_OPTIONS: { value: MecanismoTransferencia; label: string }[] = [
  { value: "CLAUSULA_CONTRACTUAL",    label: MECANISMO_LABELS.CLAUSULA_CONTRACTUAL },
  { value: "DECISION_ADECUACION",     label: MECANISMO_LABELS.DECISION_ADECUACION },
  { value: "CONSENTIMIENTO_EXPLICITO", label: MECANISMO_LABELS.CONSENTIMIENTO_EXPLICITO },
]

const TIPO_VARIANT: Record<TerceroTipo, "default" | "secondary" | "outline"> = {
  ENCARGADO:            "default",
  CESIONARIO:           "secondary",
  TERCERO_INDEPENDIENTE: "outline",
}

export default function TercerosPage() {
  const { getUser } = useAuth()
  const orgId = getUser()?.organizationId ?? ""
  const qc = useQueryClient()

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Tercero | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Tercero | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["terceros", orgId],
    queryFn: () => terceroApi.list(orgId).then((r) => r.data),
    enabled: !!orgId,
  })
  const terceros = Array.isArray(data) ? data : []

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["terceros", orgId] })
  }

  const deleteMutation = useMutation({
    mutationFn: (id: string) => terceroApi.delete(id),
    onSuccess: () => {
      toast.success("Tercero eliminado.")
      setDeleteTarget(null)
      invalidate()
    },
    onError: () => toast.error("No se pudo eliminar el tercero."),
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-y-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Terceros</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Catálogo de destinatarios y encargados de tratamiento (Art. 15 y 26-28 Ley 21.719)
          </p>
        </div>
        <RequirePermission permission="RAT_CREATE">
          <Button onClick={() => setShowForm(true)} className="gap-2 shrink-0">
            <Plus className="w-4 h-4" />
            Nuevo tercero
          </Button>
        </RequirePermission>
      </div>

      <Card>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : terceros.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <Users className="w-8 h-8 mx-auto text-muted-foreground opacity-40" />
              <p className="text-sm font-medium text-foreground">Sin terceros registrados</p>
              <p className="text-xs text-muted-foreground">
                Registra los destinatarios y encargados a quienes comunicas datos personales.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {terceros.map((t) => (
                <div key={t.id} className="flex items-center justify-between py-3 gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground truncate">{t.nombre}</span>
                      <Badge variant={TIPO_VARIANT[t.tipo]}>{TERCERO_TIPO_LABELS[t.tipo]}</Badge>
                      {!t.activo && <Badge variant="outline" className="text-muted-foreground">Inactivo</Badge>}
                      {t.pais !== "Chile" && (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                          <Globe className="w-3 h-3" />
                          {t.pais}
                        </span>
                      )}
                    </div>
                    {t.finalidadUso && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{t.finalidadUso}</p>
                    )}
                  </div>
                  <RequirePermission permission="RAT_UPDATE">
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => setEditing(t)}
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border font-medium hover:bg-muted transition-colors border-border text-muted-foreground"
                      >
                        <Pencil className="w-3 h-3" />
                        Editar
                      </button>
                      <button
                        onClick={() => setDeleteTarget(t)}
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border font-medium hover:bg-destructive/10 hover:text-destructive transition-colors border-border text-muted-foreground"
                      >
                        <Trash2 className="w-3 h-3" />
                        Eliminar
                      </button>
                    </div>
                  </RequirePermission>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <TerceroFormDialog
        key={editing?.id ?? (showForm ? "new" : "idle")}
        open={showForm || !!editing}
        orgId={orgId}
        tercero={editing}
        onClose={() => { setShowForm(false); setEditing(null) }}
        onSaved={invalidate}
      />

      {deleteTarget && (
        <Dialog.Root open onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm" />
            <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-border focus:outline-none">
              <Dialog.Title className="text-base font-bold mb-2">Eliminar tercero</Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground mb-4">
                ¿Eliminar <strong>{deleteTarget.nombre}</strong>? Las actividades de tratamiento que lo referencian perderán esta asociación.
              </Dialog.Description>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 px-4 py-2 text-xs rounded-lg border font-medium hover:bg-muted transition-colors border-border text-muted-foreground"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => deleteMutation.mutate(deleteTarget.id)}
                  disabled={deleteMutation.isPending}
                  className="flex-1 px-4 py-2 text-xs rounded-lg font-semibold flex items-center justify-center gap-1.5 bg-destructive text-destructive-foreground disabled:opacity-50 transition-colors"
                >
                  {deleteMutation.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                  Eliminar
                </button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </div>
  )
}

// ── create/edit dialog ──────────────────────────────────────────────────────

type FormState = {
  nombre: string
  tipo: TerceroTipo
  pais: string
  finalidadUso: string
  linkContrato: string
  mecanismoTransferencia: MecanismoTransferencia | ""
  activo: boolean
}

function emptyForm(): FormState {
  return {
    nombre: "", tipo: "ENCARGADO", pais: "Chile",
    finalidadUso: "", linkContrato: "", mecanismoTransferencia: "", activo: true,
  }
}

function terceroToForm(t: Tercero): FormState {
  return {
    nombre: t.nombre,
    tipo: t.tipo,
    pais: t.pais,
    finalidadUso: t.finalidadUso ?? "",
    linkContrato: t.linkContrato ?? "",
    mecanismoTransferencia: t.mecanismoTransferencia ?? "",
    activo: t.activo,
  }
}

function TerceroFormDialog({
  open, orgId, tercero, onClose, onSaved,
}: {
  open: boolean
  orgId: string
  tercero: Tercero | null
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = !!tercero
  const [form, setForm] = useState<FormState>(() => tercero ? terceroToForm(tercero) : emptyForm())
  const [error, setError] = useState("")

  const isInternational = form.pais.trim().toLowerCase() !== "chile"

  const mutation = useMutation({
    mutationFn: () => {
      const base = {
        nombre: form.nombre.trim(),
        tipo: form.tipo,
        pais: form.pais.trim(),
        finalidadUso: form.finalidadUso.trim() || undefined,
        linkContrato: form.linkContrato.trim() || undefined,
        mecanismoTransferencia: (form.mecanismoTransferencia || undefined) as MecanismoTransferencia | undefined,
      }
      return isEdit
        ? terceroApi.update(tercero!.id, { ...base, activo: form.activo } satisfies TerceroUpdateRequest)
        : terceroApi.create({ ...base, organizationId: orgId } satisfies TerceroCreateRequest)
    },
    onSuccess: () => {
      toast.success(isEdit ? "Tercero actualizado." : "Tercero registrado.")
      onSaved()
      onClose()
    },
    onError: () => setError(`Error al ${isEdit ? "actualizar" : "registrar"} el tercero. Intenta de nuevo.`),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!form.nombre.trim()) { setError("El nombre es obligatorio."); return }
    if (!form.pais.trim()) { setError("El país es obligatorio."); return }
    mutation.mutate()
  }

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg border border-border focus:outline-none max-h-[90vh] overflow-y-auto">
          <Dialog.Title className="text-base font-bold mb-1 text-foreground">
            {isEdit ? "Editar tercero" : "Nuevo tercero"}
          </Dialog.Title>
          <Dialog.Description className="text-xs text-muted-foreground mb-5">
            Destinatarios y encargados de tratamiento a quienes se comunican datos personales (Art. 15 Ley 21.719).
          </Dialog.Description>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="t-nombre">Nombre del tercero *</Label>
              <Input
                id="t-nombre"
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                disabled={mutation.isPending}
                placeholder="Ej: Mailchimp Inc."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="t-tipo">Tipo *</Label>
                <select
                  id="t-tipo"
                  value={form.tipo}
                  onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value as TerceroTipo }))}
                  disabled={mutation.isPending}
                  className="w-full text-sm border rounded-md px-3 py-2 bg-background text-foreground border-border"
                >
                  {TIPO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="t-pais">País *</Label>
                <Input
                  id="t-pais"
                  value={form.pais}
                  onChange={(e) => setForm((f) => ({ ...f, pais: e.target.value }))}
                  disabled={mutation.isPending}
                  placeholder="Chile"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="t-finalidad">Finalidad de uso</Label>
              <textarea
                id="t-finalidad"
                rows={2}
                value={form.finalidadUso}
                onChange={(e) => setForm((f) => ({ ...f, finalidadUso: e.target.value }))}
                disabled={mutation.isPending}
                className="w-full text-sm rounded-md border border-border px-3 py-2 bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Para qué se comunican los datos a este tercero..."
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="t-link">Link contrato / acuerdo</Label>
              <Input
                id="t-link"
                value={form.linkContrato}
                onChange={(e) => setForm((f) => ({ ...f, linkContrato: e.target.value }))}
                disabled={mutation.isPending}
                placeholder="https://..."
              />
            </div>

            {isInternational && (
              <div className="space-y-1.5">
                <Label htmlFor="t-mecanismo">Mecanismo de transferencia internacional *</Label>
                <select
                  id="t-mecanismo"
                  value={form.mecanismoTransferencia}
                  onChange={(e) => setForm((f) => ({ ...f, mecanismoTransferencia: e.target.value as MecanismoTransferencia }))}
                  disabled={mutation.isPending}
                  className="w-full text-sm border rounded-md px-3 py-2 bg-background text-foreground border-border"
                >
                  <option value="">Seleccionar mecanismo...</option>
                  {MECANISMO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <p className="text-xs text-amber-600">
                  País fuera de Chile — se requiere mecanismo conforme Art. 26-28 Ley 21.719.
                </p>
              </div>
            )}

            {isEdit && (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.activo}
                  onChange={(e) => setForm((f) => ({ ...f, activo: e.target.checked }))}
                  disabled={mutation.isPending}
                  className="w-4 h-4 accent-primary"
                />
                <span className="text-sm text-foreground">Activo</span>
              </label>
            )}

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
                disabled={mutation.isPending || !form.nombre.trim() || !form.pais.trim()}
                className="flex-1 px-4 py-2 text-xs rounded-lg font-semibold flex items-center justify-center gap-1.5 bg-primary text-primary-foreground disabled:opacity-50 transition-colors"
              >
                {mutation.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                {isEdit ? "Guardar cambios" : "Registrar tercero"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

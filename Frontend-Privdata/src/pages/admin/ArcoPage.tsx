import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Search, Loader2, X, Clock, CheckCircle2, AlertCircle } from "lucide-react"
import { arcoApi } from "@/lib/api"
import type { ArcoRequest, ArcoStatus, UpdateArcoStatus } from "@/types/arco"
import { useAuth } from "@/hooks/use-auth"
import ArcoAccessReport from "@/components/arco/ArcoAccessReport"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// ── Helpers ───────────────────────────────────────────────────────────────────
const TYPE_LABELS: Record<string, string> = {
  ACCESO:          "Acceso",
  RECTIFICACION:   "Rectificación",
  SUPRESION:       "Supresión",
  OPOSICION:       "Oposición",
  PORTABILIDAD:    "Portabilidad",
  BLOQUEO_TEMPORAL:"Bloqueo temporal",
}

const STATUS_LABELS: Record<string, string> = {
  RECIBIDA:    "Recibida",
  EN_REVISION: "En revisión",
  EN_GESTION:  "En gestión",
  RESPONDIDA:  "Respondida",
  RECHAZADA:   "Rechazada",
  CERRADA:     "Cerrada",
}

const STATUS_TRANSITIONS: Record<ArcoStatus, ArcoStatus[]> = {
  RECIBIDA:    ["EN_REVISION", "RECHAZADA"],
  EN_REVISION: ["EN_GESTION", "RECHAZADA"],
  EN_GESTION:  ["RESPONDIDA", "RECHAZADA"],
  RESPONDIDA:  ["CERRADA"],
  RECHAZADA:   ["CERRADA"],
  CERRADA:     [],
}

function statusVariant(s: ArcoStatus): "default" | "secondary" | "destructive" | "outline" {
  if (s === "RESPONDIDA" || s === "CERRADA") return "default"
  if (s === "RECHAZADA") return "destructive"
  if (s === "RECIBIDA") return "outline"
  return "secondary"
}

function daysRemaining(dueDate: string) {
  const diff = Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86_400_000)
  return diff
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" })
}

// ── Modal cambio de estado ────────────────────────────────────────────────────
function UpdateStatusModal({
  request,
  onClose,
}: {
  request: ArcoRequest
  onClose: () => void
}) {
  const qc = useQueryClient()
  const transitions = STATUS_TRANSITIONS[request.status]
  const [form, setForm] = useState<UpdateArcoStatus>({
    status: transitions[0] ?? request.status,
    resolutionSummary: request.resolutionSummary ?? "",
  })
  const [error, setError] = useState("")

  const mutation = useMutation({
    mutationFn: () => arcoApi.updateStatus(request.id, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["arco"] })
      onClose()
    },
    onError: (e: unknown) =>
      setError(
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Error al actualizar el estado"
      ),
  })

  const needsSummary =
    form.status === "RESPONDIDA" || form.status === "RECHAZADA"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-2xl space-y-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between">
          <p className="font-semibold text-foreground">Actualizar estado</p>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>Solicitud: <span className="font-mono text-foreground">{request.id.substring(0, 8)}…</span></p>
          <p>Tipo: <span className="font-medium text-foreground">{TYPE_LABELS[request.requestType] ?? request.requestType}</span></p>
          <p>Estado actual: <span className="font-medium text-foreground">{STATUS_LABELS[request.status]}</span></p>
        </div>

        {request.requestType === "ACCESO" && (
          <ArcoAccessReport
            dataSubjectId={request.dataSubjectId}
            organizationId={request.organizationId}
            onGenerateResolution={(text) => setForm(f => ({ ...f, resolutionSummary: text }))}
          />
        )}

        {transitions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Esta solicitud ya está en estado final.</p>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Nuevo estado</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ArcoStatus }))}
              >
                {transitions.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>
                Comentario / resolución
                {needsSummary ? " *" : " (opcional)"}
              </Label>
              <textarea
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder={needsSummary ? "Descripción de la resolución…" : "Observaciones internas…"}
                value={form.resolutionSummary ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, resolutionSummary: e.target.value }))}
              />
            </div>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
          {transitions.length > 0 && (
            <Button
              size="sm"
              onClick={() => mutation.mutate()}
              disabled={
                mutation.isPending ||
                (needsSummary && !form.resolutionSummary?.trim())
              }
            >
              {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Guardar
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Página principal ───────────────────────────────────────────────────────────
export default function ArcoPage() {
  const { getUser } = useAuth()
  const user = getUser()
  const orgId = user?.organizationId ?? ""

  const [search, setSearch]           = useState("")
  const [filterStatus, setFilterStatus] = useState<ArcoStatus | "">("")
  const [selected, setSelected]       = useState<ArcoRequest | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["arco", orgId],
    queryFn: () => arcoApi.list(orgId).then((r) => r.data),
    enabled: !!orgId,
  })

  const requests = data?.data ?? []

  const filtered = requests.filter((r) => {
    const matchSearch =
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.dataSubjectId.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !filterStatus || r.status === filterStatus
    return matchSearch && matchStatus
  })

  // KPIs
  const pending  = requests.filter((r) => !["RESPONDIDA", "CERRADA", "RECHAZADA"].includes(r.status)).length
  const overdue  = requests.filter((r) => daysRemaining(r.dueDate) < 0 && !["RESPONDIDA", "CERRADA"].includes(r.status)).length
  const resolved = requests.filter((r) => r.status === "RESPONDIDA" || r.status === "CERRADA").length

  return (
    <>
      {selected && (
        <UpdateStatusModal request={selected} onClose={() => setSelected(null)} />
      )}

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Solicitudes ARCO</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Acceso · Rectificación · Supresión · Oposición · Portabilidad · Bloqueo — Art. 11 Ley 21.719
          </p>
        </div>

        {/* ── KPIs ── */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3 flex items-center gap-3">
              <Clock className="w-8 h-8 text-primary shrink-0" />
              <div>
                <p className="text-2xl font-bold text-foreground">{pending}</p>
                <p className="text-xs text-muted-foreground">Pendientes</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-destructive shrink-0" />
              <div>
                <p className="text-2xl font-bold text-foreground">{overdue}</p>
                <p className="text-xs text-muted-foreground">Vencidas</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-green-600 shrink-0" />
              <div>
                <p className="text-2xl font-bold text-foreground">{resolved}</p>
                <p className="text-xs text-muted-foreground">Resueltas</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Tabla ── */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por ID, titular o descripción…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <select
                className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as ArcoStatus | "")}
              >
                <option value="">Todos los estados</option>
                {Object.entries(STATUS_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Canal</TableHead>
                      <TableHead>Recibida</TableHead>
                      <TableHead>Vencimiento</TableHead>
                      <TableHead className="text-right">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                          {requests.length === 0
                            ? "No hay solicitudes ARCO registradas."
                            : "No hay solicitudes que coincidan con el filtro."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((r) => {
                        const days = daysRemaining(r.dueDate)
                        const isOverdue = days < 0 && !["RESPONDIDA", "CERRADA"].includes(r.status)
                        return (
                          <TableRow key={r.id}>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {r.id.substring(0, 8)}…
                            </TableCell>
                            <TableCell className="font-medium">
                              {TYPE_LABELS[r.requestType] ?? r.requestType}
                            </TableCell>
                            <TableCell>
                              <Badge variant={statusVariant(r.status)}>
                                {STATUS_LABELS[r.status] ?? r.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {r.requestChannel.replace("_", " ").toLowerCase()}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {formatDate(r.submittedAt)}
                            </TableCell>
                            <TableCell>
                              <span className={isOverdue ? "text-destructive font-medium text-sm" : "text-muted-foreground text-sm"}>
                                {isOverdue
                                  ? `Venció hace ${Math.abs(days)}d`
                                  : ["RESPONDIDA", "CERRADA"].includes(r.status)
                                  ? "—"
                                  : `${days}d restantes`}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              {!["CERRADA"].includes(r.status) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelected(r)}
                                >
                                  Gestionar
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })
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

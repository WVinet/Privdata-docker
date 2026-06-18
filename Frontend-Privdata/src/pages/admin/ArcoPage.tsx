import { useState, useEffect, type ElementType } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Search, Loader2, X, Clock, CheckCircle2, AlertCircle, AlertTriangle, Send, XCircle, Lock, Hourglass } from "lucide-react"
import { arcoApi, personsApi } from "@/lib/api"
import type { ArcoRequest, ArcoStatus, UpdateArcoStatus } from "@/types/arco"
import { useAuth } from "@/hooks/use-auth"
import ArcoAccessReport from "@/components/arco/ArcoAccessReport"
import ArcoRectificationPanel from "@/components/arco/ArcoRectificationPanel"
import ArcoSuppressionPanel from "@/components/arco/ArcoSuppressionPanel"
import ArcoPortabilityPanel from "@/components/arco/ArcoPortabilityPanel"
import ArcoOppositionPanel from "@/components/arco/ArcoOppositionPanel"
import ArcoBlockingPanel from "@/components/arco/ArcoBlockingPanel"
import ArcoAnonymizationPanel from "@/components/arco/ArcoAnonymizationPanel"
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
  ANONIMIZACION:   "Anonimización",
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
  RECIBIDA:    ["RECHAZADA"],
  EN_REVISION: ["RECHAZADA"],
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

// ── Acciones de resolución ────────────────────────────────────────────────────
type ActionKey = Exclude<ArcoStatus, "RECIBIDA" | "EN_REVISION" | "EN_GESTION"> | "PRORROGA"

const ACTION_CONFIG: Record<ActionKey, {
  label: string
  icon: ElementType
  variant: "default" | "destructive" | "secondary" | "outline"
  confirmTitle: string
  confirmDescription: string
}> = {
  RESPONDIDA: {
    label: "Responder solicitud",
    icon: Send,
    variant: "default",
    confirmTitle: "¿Confirmar el envío de la respuesta al titular?",
    confirmDescription: "Se registrará como la respuesta oficial entregada al titular (Art. 11 Ley 21.719). Esta acción no se puede deshacer.",
  },
  RECHAZADA: {
    label: "Rechazar solicitud",
    icon: XCircle,
    variant: "destructive",
    confirmTitle: "¿Confirmar el rechazo de esta solicitud?",
    confirmDescription: "La denegación debe fundarse en una norma legal específica (Art. 5° Ley 21.719). El titular podrá reclamar ante la Agencia de Protección de Datos.",
  },
  CERRADA: {
    label: "Cerrar solicitud",
    icon: Lock,
    variant: "secondary",
    confirmTitle: "¿Cerrar definitivamente esta solicitud?",
    confirmDescription: "La solicitud quedará en un estado final y no podrá modificarse nuevamente.",
  },
  PRORROGA: {
    label: "Solicitar prórroga (+30 días)",
    icon: Hourglass,
    variant: "outline",
    confirmTitle: "¿Otorgar una prórroga de 30 días corridos?",
    confirmDescription: "El Art. 11 de la Ley 21.719 permite extender el plazo de respuesta una sola vez por 30 días corridos adicionales. Esta acción no se puede deshacer.",
  },
}

const NOT_RESOLVED: ArcoStatus[] = ["RECIBIDA", "EN_REVISION", "EN_GESTION"]

// ── Modal cambio de estado ────────────────────────────────────────────────────
function UpdateStatusModal({
  request,
  onClose,
}: {
  request: ArcoRequest
  onClose: () => void
}) {
  const qc = useQueryClient()

  const [pendingAction, setPendingAction] = useState<ActionKey | null>(null)
  const [comment, setComment] = useState(request.resolutionSummary ?? "")
  const [legalBasis, setLegalBasis] = useState(request.denialLegalBasis ?? "")
  const [error, setError] = useState("")
  const [effectiveStatus, setEffectiveStatus] = useState<ArcoStatus>(request.status)

  const transitions = STATUS_TRANSITIONS[effectiveStatus] as ActionKey[]
  const canExtend = !request.extensionGranted && NOT_RESOLVED.includes(effectiveStatus)
  const availableActions: ActionKey[] = canExtend ? [...transitions, "PRORROGA"] : transitions

  // Acceso, Rectificación, Supresión, Oposición, Portabilidad, Bloqueo y Anonimización tienen su propio flujo
  // de verificación de identidad (Xxx Service) en vez del auto-paso a EN_GESTION genérico.
  const requiresExplicitIdentity = [
    "ACCESO", "RECTIFICACION", "SUPRESION", "OPOSICION",
    "PORTABILIDAD", "BLOQUEO_TEMPORAL", "ANONIMIZACION",
  ].includes(request.requestType)
  const [identityComment, setIdentityComment] = useState("")

  const autoGestionMutation = useMutation({
    mutationFn: async () => {
      const res = await arcoApi.updateStatus(request.id, { status: "EN_GESTION" })
      if (!res.data.success) throw new Error(res.data.message)
      return res
    },
    onSuccess: () => {
      setEffectiveStatus("EN_GESTION")
      qc.invalidateQueries({ queryKey: ["arco"] })
    },
  })

  const verifyIdentityMutation = useMutation({
    mutationFn: async (verified: boolean) => {
      const call =
        request.requestType === "ACCESO" ? arcoApi.verifyAccessIdentity :
        request.requestType === "RECTIFICACION" ? arcoApi.verifyRectificationIdentity :
        request.requestType === "SUPRESION" ? arcoApi.verifySuppressionIdentity :
        request.requestType === "OPOSICION" ? arcoApi.verifyOppositionIdentity :
        request.requestType === "PORTABILIDAD" ? arcoApi.verifyPortabilityIdentity :
        request.requestType === "BLOQUEO_TEMPORAL" ? arcoApi.verifyBlockingIdentity :
        arcoApi.verifyAnonymizationIdentity
      const res = await call(request.id, verified, identityComment.trim() || undefined)
      if (!res.data.success) throw new Error(res.data.message)
      return verified
    },
    onSuccess: (verified) => {
      setEffectiveStatus(verified ? "EN_GESTION" : "RECHAZADA")
      qc.invalidateQueries({ queryKey: ["arco"] })
    },
  })

  useEffect(() => {
    if (requiresExplicitIdentity) return
    if (request.status === "RECIBIDA" || request.status === "EN_REVISION") {
      autoGestionMutation.mutate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const mutation = useMutation({
    mutationFn: async () => {
      if (pendingAction === "PRORROGA") {
        const res = await arcoApi.extendDeadline(request.id)
        if (!res.data.success) throw new Error(res.data.message)
        return res
      }
      if (pendingAction === "RESPONDIDA" && request.requestType === "ACCESO") {
        const res = await arcoApi.respondAccess(request.id, comment.trim())
        if (!res.data.success) throw new Error(res.data.message)
        return res
      }
      if (pendingAction === "RESPONDIDA" && request.requestType === "RECTIFICACION") {
        const res = await arcoApi.respondRectification(request.id, comment.trim())
        if (!res.data.success) throw new Error(res.data.message)
        return res
      }
      if (request.requestType === "SUPRESION" && (pendingAction === "RESPONDIDA" || pendingAction === "RECHAZADA")) {
        const res = await arcoApi.respondSuppression(request.id, {
          approved: pendingAction === "RESPONDIDA",
          observations: pendingAction === "RESPONDIDA" ? comment.trim() : undefined,
          rejectionReason: pendingAction === "RECHAZADA" ? comment.trim() : undefined,
        })
        if (!res.data.success) throw new Error(res.data.message)
        return res
      }
      if (request.requestType === "OPOSICION" && (pendingAction === "RESPONDIDA" || pendingAction === "RECHAZADA")) {
        const res = await arcoApi.respondOpposition(request.id, {
          approved: pendingAction === "RESPONDIDA",
          observations: pendingAction === "RESPONDIDA" ? comment.trim() : undefined,
          rejectionReason: pendingAction === "RECHAZADA" ? comment.trim() : undefined,
        })
        if (!res.data.success) throw new Error(res.data.message)
        return res
      }
      const body: UpdateArcoStatus = {
        status: pendingAction as ArcoStatus,
        resolutionSummary: comment.trim() || undefined,
      }
      if (pendingAction === "RECHAZADA") body.denialLegalBasis = legalBasis.trim()
      const res = await arcoApi.updateStatus(request.id, body)
      if (!res.data.success) throw new Error(res.data.message)
      return res
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["arco"] })
      onClose()
    },
    onError: (e: unknown) => {
      const err = e as { message?: string; response?: { data?: { message?: string } } }
      setError(
        err?.response?.data?.message ?? err?.message ?? "Error al ejecutar la acción"
      )
    },
  })

  const draftMutation = useMutation({
    mutationFn: async () => {
      const res = await arcoApi.updateStatus(request.id, {
        status: effectiveStatus,
        resolutionSummary: comment.trim(),
      })
      if (!res.data.success) throw new Error(res.data.message)
      return res
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["arco"] })
    },
    onError: (e: unknown) => {
      const err = e as { message?: string; response?: { data?: { message?: string } } }
      setError(
        err?.response?.data?.message ?? err?.message ?? "Error al guardar el borrador"
      )
    },
  })

  const isValid =
    pendingAction === "RESPONDIDA" ? comment.trim().length > 0 :
    pendingAction === "RECHAZADA"  ? comment.trim().length > 0 && legalBasis.trim().length > 0 :
    true

  function backToActions() {
    setPendingAction(null)
    setError("")
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-2xl space-y-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between">
          <p className="font-semibold text-foreground">Gestionar solicitud</p>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>Solicitud: <span className="font-mono text-foreground">{request.id.substring(0, 8)}…</span></p>
          <p>Tipo: <span className="font-medium text-foreground">{TYPE_LABELS[request.requestType] ?? request.requestType}</span></p>
          <p>Estado actual: <span className="font-medium text-foreground">{STATUS_LABELS[effectiveStatus]}</span></p>
          {request.extensionGranted && request.extendedDueDate && (
            <p>Prórroga otorgada — nuevo plazo: <span className="font-medium text-foreground">{formatDate(request.extendedDueDate)}</span></p>
          )}
        </div>

        {request.requestType === "ACCESO" && pendingAction === null && (
          <ArcoAccessReport
            dataSubjectId={request.dataSubjectId}
            organizationId={request.organizationId}
            onGenerateResolution={(text) => {
              setComment(text)
              if (transitions.includes("RESPONDIDA")) setPendingAction("RESPONDIDA")
            }}
          />
        )}

        {request.requestType === "RECTIFICACION" && pendingAction === null && (
          <ArcoRectificationPanel
            arcoRequestId={request.id}
            dataSubjectId={request.dataSubjectId}
            organizationId={request.organizationId}
            description={request.description}
            onApplied={(text) => {
              // El panel ya llamó a respondRectification y dejó la solicitud RESPONDIDA en el backend.
              setComment(text)
              qc.invalidateQueries({ queryKey: ["arco"] })
              onClose()
            }}
          />
        )}

        {request.requestType === "SUPRESION" && pendingAction === null && (
          <ArcoSuppressionPanel
            arcoRequestId={request.id}
            dataSubjectId={request.dataSubjectId}
            organizationId={request.organizationId}
            description={request.description}
            onApplied={(text) => {
              // El panel ya llamó a respondSuppression y dejó la solicitud resuelta en el backend.
              setComment(text)
              qc.invalidateQueries({ queryKey: ["arco"] })
              onClose()
            }}
          />
        )}

        {request.requestType === "PORTABILIDAD" && pendingAction === null && (
          <ArcoPortabilityPanel
            arcoRequestId={request.id}
            dataSubjectId={request.dataSubjectId}
            organizationId={request.organizationId}
            description={request.description}
            status={effectiveStatus}
            onApplied={(text) => {
              // El panel ya llamó a respondPortability; se deja el modal abierto para permitir
              // descargar el archivo generado antes de cerrar.
              setComment(text)
              qc.invalidateQueries({ queryKey: ["arco"] })
            }}
          />
        )}

        {request.requestType === "OPOSICION" && pendingAction === null && (
          <ArcoOppositionPanel
            arcoRequestId={request.id}
            dataSubjectId={request.dataSubjectId}
            organizationId={request.organizationId}
            description={request.description}
            onApplied={(text) => {
              // El panel ya llamó a respondOpposition y dejó la solicitud resuelta en el backend.
              setComment(text)
              qc.invalidateQueries({ queryKey: ["arco"] })
              onClose()
            }}
          />
        )}

        {request.requestType === "BLOQUEO_TEMPORAL" && pendingAction === null && (
          <ArcoBlockingPanel
            arcoRequestId={request.id}
            dataSubjectId={request.dataSubjectId}
            organizationId={request.organizationId}
            description={request.description}
            onApplied={(text) => {
              // El panel ya llamó a respondBlocking y dejó la solicitud resuelta en el backend.
              setComment(text)
              qc.invalidateQueries({ queryKey: ["arco"] })
              onClose()
            }}
          />
        )}

        {request.requestType === "ANONIMIZACION" && pendingAction === null && (
          <ArcoAnonymizationPanel
            arcoRequestId={request.id}
            dataSubjectId={request.dataSubjectId}
            organizationId={request.organizationId}
            description={request.description}
            onApplied={(text) => {
              // El panel ya llamó a respondAnonymization y dejó la solicitud resuelta en el backend.
              setComment(text)
              qc.invalidateQueries({ queryKey: ["arco"] })
              onClose()
            }}
          />
        )}

        {pendingAction === null && (
          requiresExplicitIdentity && effectiveStatus === "RECIBIDA" ? (
            <div className="space-y-3 border-t border-border pt-3">
              <Label>Verificación de identidad del titular</Label>
              <p className="text-xs text-muted-foreground">
                Antes de gestionar esta solicitud, confirma que la identidad del titular fue verificada (Art. 5° Ley 21.719).
              </p>
              <textarea
                rows={2}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Comentario opcional…"
                value={identityComment}
                onChange={(e) => setIdentityComment(e.target.value)}
              />
              {verifyIdentityMutation.isError && (
                <p className="text-sm text-destructive">{(verifyIdentityMutation.error as Error).message}</p>
              )}
              <div className="flex gap-2">
                <Button onClick={() => verifyIdentityMutation.mutate(true)} disabled={verifyIdentityMutation.isPending}>
                  {verifyIdentityMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Identidad verificada
                </Button>
                <Button variant="destructive" onClick={() => verifyIdentityMutation.mutate(false)} disabled={verifyIdentityMutation.isPending}>
                  No se pudo verificar
                </Button>
              </div>
            </div>
          ) : autoGestionMutation.isPending ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Marcando solicitud como "En gestión"…
            </div>
          ) : autoGestionMutation.isError ? (
            <p className="text-sm text-destructive">
              No se pudo iniciar la gestión automáticamente. Cierra y vuelve a abrir la solicitud para reintentar.
            </p>
          ) : effectiveStatus === "EN_GESTION" ? (
            <div className="space-y-3 border-t border-border pt-3">
              <div className="space-y-1.5">
                <Label>Respuesta / observaciones internas</Label>
                <textarea
                  rows={4}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Escribe aquí la respuesta para el titular. Puedes guardar el avance y continuar más tarde…"
                  value={comment}
                  onChange={(e) => {
                    setComment(e.target.value)
                    draftMutation.reset()
                  }}
                />
                {draftMutation.isSuccess && (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Borrador guardado
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => draftMutation.mutate()}
                  disabled={draftMutation.isPending || !comment.trim()}
                >
                  {draftMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Guardar borrador
                </Button>
                <Button
                  onClick={() => setPendingAction("RESPONDIDA")}
                  disabled={!comment.trim()}
                >
                  <Send className="w-4 h-4" />
                  Responder solicitud
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                <Button variant="destructive" size="sm" onClick={() => setPendingAction("RECHAZADA")}>
                  <XCircle className="w-4 h-4" />
                  Rechazar solicitud
                </Button>
                {canExtend && (
                  <Button variant="outline" size="sm" onClick={() => setPendingAction("PRORROGA")}>
                    <Hourglass className="w-4 h-4" />
                    Solicitar prórroga (+30 días)
                  </Button>
                )}
              </div>
            </div>
          ) : availableActions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Esta solicitud ya está en estado final.</p>
          ) : (
            <div className="space-y-1.5">
              <Label>¿Qué resolución deseas tomar?</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {availableActions.map((action) => {
                  const cfg = ACTION_CONFIG[action]
                  const Icon = cfg.icon
                  return (
                    <Button
                      key={action}
                      type="button"
                      variant={cfg.variant}
                      className="justify-start h-auto py-2.5"
                      onClick={() => setPendingAction(action)}
                    >
                      <Icon className="w-4 h-4" />
                      {cfg.label}
                    </Button>
                  )
                })}
              </div>
            </div>
          )
        )}

        {pendingAction !== null && (
          <div className={`space-y-3 rounded-xl border p-4 ${ACTION_CONFIG[pendingAction].variant === "destructive" ? "border-destructive/40" : "border-border"}`}>
            <div className="flex items-start gap-2.5">
              <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${ACTION_CONFIG[pendingAction].variant === "destructive" ? "text-destructive" : "text-primary"}`} />
              <div>
                <p className="font-semibold text-sm text-foreground">{ACTION_CONFIG[pendingAction].confirmTitle}</p>
                <p className="text-xs text-muted-foreground mt-1">{ACTION_CONFIG[pendingAction].confirmDescription}</p>
              </div>
            </div>

            {pendingAction === "RESPONDIDA" && (
              <div className="space-y-1.5">
                <Label>Contenido de la respuesta *</Label>
                <textarea
                  rows={4}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Describe la información o gestión entregada al titular…"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>
            )}

            {pendingAction === "RECHAZADA" && (
              <>
                <div className="space-y-1.5">
                  <Label>Motivo de la denegación *</Label>
                  <textarea
                    rows={3}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Explica por qué se deniega la solicitud…"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Norma legal que fundamenta la denegación *</Label>
                  <Input
                    placeholder="Ej.: Art. 19 N°4 de la Constitución, Ley 21.719 art. 5°…"
                    value={legalBasis}
                    onChange={(e) => setLegalBasis(e.target.value)}
                  />
                </div>
              </>
            )}

            {pendingAction === "CERRADA" && (
              <div className="space-y-1.5">
                <Label>Observaciones internas (opcional)</Label>
                <textarea
                  rows={2}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Notas internas sobre este cambio de estado…"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={backToActions} disabled={mutation.isPending}>
                Volver
              </Button>
              <Button
                variant={ACTION_CONFIG[pendingAction].variant === "destructive" ? "destructive" : "default"}
                size="sm"
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending || !isValid}
              >
                {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Confirmar
              </Button>
            </div>
          </div>
        )}

        {pendingAction === null && (
          <>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={onClose}>Cerrar</Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Página principal ───────────────────────────────────────────────────────────
export default function ArcoPage() {
  const { getUser } = useAuth()
  const user = getUser()
  const orgId = user?.organizationId ?? ""

  const [filterId, setFilterId]               = useState("")
  const [filterTitular, setFilterTitular]     = useState("")
  const [filterDate, setFilterDate]           = useState("")
  const [filterStatus, setFilterStatus]       = useState<ArcoStatus | "">("")
  const [selected, setSelected]       = useState<ArcoRequest | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["arco", orgId],
    queryFn: () => arcoApi.list(orgId).then((r) => r.data),
    enabled: !!orgId,
  })

  const { data: personsData } = useQuery({
    queryKey: ["persons", orgId],
    queryFn: () => personsApi.list(orgId).then((r) => r.data),
    enabled: !!orgId,
  })

  const requests = [...(data?.data ?? [])].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  )
  const persons = personsData?.data ?? []
  const personsById = Object.fromEntries(persons.map((p) => [p.id, p]))

  const hasActiveFilters = !!(filterId || filterTitular || filterDate || filterStatus)

  const clearFilters = () => {
    setFilterId("")
    setFilterTitular("")
    setFilterDate("")
    setFilterStatus("")
  }

  const filtered = requests.filter((r) => {
    const titular = personsById[r.dataSubjectId]
    const matchId = !filterId || r.id.toLowerCase().includes(filterId.toLowerCase())
    const matchTitular =
      !filterTitular ||
      r.dataSubjectId.toLowerCase().includes(filterTitular.toLowerCase()) ||
      titular?.fullName.toLowerCase().includes(filterTitular.toLowerCase()) ||
      titular?.email?.toLowerCase().includes(filterTitular.toLowerCase()) ||
      titular?.rut?.toLowerCase().includes(filterTitular.toLowerCase())
    const matchDate = !filterDate || r.submittedAt.slice(0, 10) === filterDate
    const matchStatus = !filterStatus || r.status === filterStatus
    return matchId && matchTitular && matchDate && matchStatus
  })

  // KPIs
  const pending  = requests.filter((r) => !["RESPONDIDA", "CERRADA", "RECHAZADA"].includes(r.status)).length
  const overdue  = requests.filter((r) => daysRemaining(r.extendedDueDate ?? r.dueDate) < 0 && !["RESPONDIDA", "CERRADA"].includes(r.status)).length
  const resolved = requests.filter((r) => r.status === "RESPONDIDA" || r.status === "CERRADA").length

  return (
    <>
      {selected && (
        <UpdateStatusModal request={selected} onClose={() => setSelected(null)} />
      )}

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Solicitudes ARSOP</h1>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por ID…"
                  value={filterId}
                  onChange={(e) => setFilterId(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por titular (nombre, RUT, email)…"
                  value={filterTitular}
                  onChange={(e) => setFilterTitular(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="text-muted-foreground"
              />
              <div className="flex gap-2">
                <select
                  className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as ArcoStatus | "")}
                >
                  <option value="">Todos los estados</option>
                  {Object.entries(STATUS_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
                {hasActiveFilters && (
                  <Button variant="outline" size="icon" onClick={clearFilters} title="Limpiar filtros">
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
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
                      <TableHead>Titular</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Estado</TableHead>
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
                            ? "No hay solicitudes ARSOP registradas."
                            : "No hay solicitudes que coincidan con el filtro."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((r) => {
                        const effectiveDueDate = r.extendedDueDate ?? r.dueDate
                        const days = daysRemaining(effectiveDueDate)
                        const isOverdue = days < 0 && !["RESPONDIDA", "CERRADA"].includes(r.status)
                        const titular = personsById[r.dataSubjectId]
                        return (
                          <TableRow key={r.id} className={["CERRADA", "RESPONDIDA"].includes(r.status) ? "bg-muted/40" : undefined}>
                            <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                              {r.id}
                            </TableCell>
                            <TableCell>
                              {titular ? (
                                <div className="flex flex-col">
                                  <span className="font-medium text-sm text-foreground">{titular.fullName}</span>
                                  <span className="text-xs text-muted-foreground font-mono">{titular.email ?? titular.rut ?? titular.id}</span>
                                </div>
                              ) : (
                                <span className="font-mono text-xs text-muted-foreground">{r.dataSubjectId}</span>
                              )}
                            </TableCell>
                            <TableCell className="font-medium">
                              {TYPE_LABELS[r.requestType] ?? r.requestType}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <Badge variant={statusVariant(r.status)} className="w-fit">
                                  {STATUS_LABELS[r.status] ?? r.status}
                                </Badge>
                                {r.agencyClaimId && (
                                  <Badge variant="outline" className="w-fit text-[10px] gap-1 border-destructive/40 text-destructive">
                                    <AlertTriangle className="w-3 h-3" />
                                    {r.agencyRespondedAt ? "Reclamo resuelto por Agencia" : "Reclamo en Agencia"}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {formatDate(r.submittedAt)}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <span className={isOverdue ? "text-destructive font-medium text-sm" : "text-muted-foreground text-sm"}>
                                  {isOverdue
                                    ? `Venció hace ${Math.abs(days)}d`
                                    : ["RESPONDIDA", "CERRADA"].includes(r.status)
                                    ? "—"
                                    : `${days}d restantes`}
                                </span>
                                {r.extensionGranted && (
                                  <Badge variant="outline" className="w-fit text-[10px] gap-1">
                                    <Hourglass className="w-3 h-3" />
                                    Prórroga otorgada
                                  </Badge>
                                )}
                              </div>
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

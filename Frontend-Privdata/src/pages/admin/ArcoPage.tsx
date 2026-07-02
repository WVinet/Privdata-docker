import { useState, useEffect, type ElementType } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Search, Loader2, X, Clock, CheckCircle2, AlertCircle, AlertTriangle, Send, XCircle, Lock, Hourglass, Download, Paperclip, ShieldCheck } from "lucide-react"
import { arcoApi, personsApi } from "@/lib/api"
import type { ArcoRequest, ArcoStatus, UpdateArcoStatus } from "@/types/arco"
import { useAuth } from "@/hooks/use-auth"
import ArcoAccessReport from "@/components/arco/ArcoAccessReport"
import ArcoRectificationPanel from "@/components/arco/ArcoRectificationPanel"
import ArcoSuppressionPanel from "@/components/arco/ArcoSuppressionPanel"
import ArcoPortabilityPanel from "@/components/arco/ArcoPortabilityPanel"
import ArcoOppositionPanel from "@/components/arco/ArcoOppositionPanel"
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
}

const TYPE_ICONS: Record<string, string> = {
  ACCESO: "🔍", RECTIFICACION: "✏️", SUPRESION: "🗑️",
  OPOSICION: "🚫", PORTABILIDAD: "📦",
}

const CHANNEL_LABELS: Record<string, string> = {
  WEB_PORTAL: "Portal web", EMAIL: "Correo electrónico",
  PHONE: "Teléfono", IN_PERSON: "Presencial",
  LETTER: "Carta", INTERNAL: "Interno",
}

const STATUS_STEPS: ArcoStatus[] = ["RECIBIDA", "EN_REVISION", "EN_GESTION", "RESPONDIDA"]

function stepColor(done: boolean, active: boolean) {
  if (done)   return "hsl(var(--success))"
  if (active) return "hsl(var(--primary))"
  return "hsl(var(--border))"
}

function stepTimestamp(step: ArcoStatus, req: ArcoRequest): string | null {
  switch (step) {
    case "RECIBIDA":    return req.submittedAt
    case "EN_REVISION": return req.reviewStartedAt
    case "EN_GESTION":  return req.managementStartedAt
    case "RESPONDIDA":  return req.resolvedAt
    default:            return null
  }
}

function formatDateTime(iso: string) {
  const d = new Date(iso)
  const date = d.toLocaleDateString("es-CL", { day: "2-digit", month: "short" })
  const time = d.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })
  return `${date} · ${time}`
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

// Sobrevive el doble-mount de React StrictMode (desarrollo), evitando que
// startReview/autoGestion se llame dos veces para la misma solicitud.
const autoTransitionedIds = new Set<string>()

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
  const [accessPdfFile, setAccessPdfFile] = useState<File | null>(null)
  const [localBlockApplied, setLocalBlockApplied] = useState(
    !!(request.blockAppliedAt && !request.blockLiftedAt)
  )
  const [localBlockByEmail, setLocalBlockByEmail] = useState<string | null>(
    request.blockAppliedByEmail ?? null
  )
  const [localBlockScope, setLocalBlockScope] = useState<string | null>(
    request.blockScope ?? null
  )

  const { data: personData } = useQuery({
    queryKey: ["person", request.organizationId, request.dataSubjectId],
    queryFn: () => personsApi.getById(request.organizationId, request.dataSubjectId).then(r => r.data),
  })
  const person = personData?.data

  // Consulta el request fresco para obtener supportingDocumentKey actualizado
  // (el titular puede adjuntar el documento tras crear la solicitud).
  // Se activa en EN_GESTION o cuando la solicitud puede tener documento adjunto.
  const hasAttachedDoc = ["RECTIFICACION", "OPOSICION"].includes(request.requestType)
  const { data: freshArcoData } = useQuery({
    queryKey: ["arco", request.id],
    queryFn: () => arcoApi.getById(request.id).then(r => r.data),
    staleTime: 0,
    enabled: effectiveStatus === "EN_GESTION" || (hasAttachedDoc && effectiveStatus === "EN_REVISION"),
  })
  const freshRequest = freshArcoData?.data

  const transitions = STATUS_TRANSITIONS[effectiveStatus] as ActionKey[]
  const canExtend = !request.extensionGranted && NOT_RESOLVED.includes(effectiveStatus)
  const availableActions: ActionKey[] = canExtend ? [...transitions, "PRORROGA"] : transitions

  // Acceso, Rectificación, Supresión, Oposición y Portabilidad tienen su propio flujo
  // de verificación de identidad (Xxx Service) en vez del auto-paso a EN_GESTION genérico.
  const requiresExplicitIdentity = [
    "ACCESO", "RECTIFICACION", "SUPRESION", "OPOSICION", "PORTABILIDAD",
  ].includes(request.requestType)
  const [identityComment, setIdentityComment] = useState("")

  const startReviewMutation = useMutation({
    mutationFn: async () => {
      const res = await arcoApi.startReview(request.id)
      if (!res.data.success) throw new Error(res.data.message)
    },
    onSuccess: () => {
      setEffectiveStatus("EN_REVISION")
      qc.invalidateQueries({ queryKey: ["arco"] })
      qc.invalidateQueries({ queryKey: ["arco-subject"] })
    },
    onError: () => {
      // Si falló (ej: ya estaba en EN_REVISION por una llamada anterior),
      // usar el estado ya actualizado o el original para no quedar bloqueado.
      qc.invalidateQueries({ queryKey: ["arco"] })
      qc.invalidateQueries({ queryKey: ["arco-subject"] })
    },
  })

  const autoGestionMutation = useMutation({
    mutationFn: async () => {
      const res = await arcoApi.updateStatus(request.id, { status: "EN_GESTION" })
      if (!res.data.success) throw new Error(res.data.message)
      return res
    },
    onSuccess: () => {
      setEffectiveStatus("EN_GESTION")
      qc.invalidateQueries({ queryKey: ["arco"] })
      qc.invalidateQueries({ queryKey: ["arco-subject"] })
    },
  })

  const verifyIdentityMutation = useMutation({
    mutationFn: async (verified: boolean) => {
      const call =
        request.requestType === "ACCESO" ? arcoApi.verifyAccessIdentity :
        request.requestType === "RECTIFICACION" ? arcoApi.verifyRectificationIdentity :
        request.requestType === "SUPRESION" ? arcoApi.verifySuppressionIdentity :
        request.requestType === "OPOSICION" ? arcoApi.verifyOppositionIdentity :
        arcoApi.verifyPortabilityIdentity
      const res = await call(request.id, verified, identityComment.trim() || undefined)
      if (!res.data.success) throw new Error(res.data.message)
      return verified
    },
    onSuccess: (verified) => {
      setEffectiveStatus(verified ? "EN_GESTION" : "RECHAZADA")
      qc.invalidateQueries({ queryKey: ["arco"] })
      qc.invalidateQueries({ queryKey: ["arco-subject"] })
    },
  })

  useEffect(() => {
    if (autoTransitionedIds.has(request.id)) return
    autoTransitionedIds.add(request.id)

    if (request.status === "RECIBIDA") {
      startReviewMutation.mutate()
      return
    }
    if (requiresExplicitIdentity) return
    if (request.status === "EN_REVISION") {
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
        if (accessPdfFile) {
          await arcoApi.uploadAccessResponseDocument(request.id, accessPdfFile)
        }
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
      qc.invalidateQueries({ queryKey: ["arco-subject"] })
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
      qc.invalidateQueries({ queryKey: ["arco-subject"] })
    },
    onError: (e: unknown) => {
      const err = e as { message?: string; response?: { data?: { message?: string } } }
      setError(
        err?.response?.data?.message ?? err?.message ?? "Error al guardar el borrador"
      )
    },
  })

  const blockMutation = useMutation({
    mutationFn: async () => {
      const res = await arcoApi.applyBlock(request.id)
      if (!res.data.success) throw new Error(res.data.message)
      return res.data.data
    },
    onSuccess: (data) => {
      setLocalBlockApplied(true)
      setLocalBlockByEmail(data?.blockAppliedByEmail ?? null)
      setLocalBlockScope(data?.blockScope ?? null)
      qc.invalidateQueries({ queryKey: ["arco"] })
    },
  })

  const unblockMutation = useMutation({
    mutationFn: async () => {
      const res = await arcoApi.liftBlock(request.id)
      if (!res.data.success) throw new Error(res.data.message)
    },
    onSuccess: () => {
      setLocalBlockApplied(false)
      qc.invalidateQueries({ queryKey: ["arco"] })
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
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-2xl space-y-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between">
          <p className="font-semibold text-foreground">Gestionar solicitud</p>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>Solicitud: <span className="font-mono text-foreground select-all">{request.id}</span></p>
          <p>Tipo: <span className="font-medium text-foreground">{TYPE_LABELS[request.requestType] ?? request.requestType}</span></p>
          <p>Estado actual: <span className="font-medium text-foreground">{STATUS_LABELS[effectiveStatus]}</span></p>
          {person && (
            <p>
              Titular:{" "}
              <span className="font-medium text-foreground">{person.fullName}</span>
              {person.rut && <span className="text-foreground"> · RUT {person.rut}</span>}
            </p>
          )}
          {request.extensionGranted && request.extendedDueDate && (
            <p>Prórroga otorgada — nuevo plazo: <span className="font-medium text-foreground">{formatDate(request.extendedDueDate)}</span></p>
          )}
        </div>

        {/* Línea de eventos */}
        <div className="border border-border rounded-lg overflow-hidden text-xs divide-y divide-border">
          <div className="flex items-center justify-between px-3 py-1.5">
            <span className="text-foreground">Solicitud recibida</span>
            <span className="text-muted-foreground">{formatDateTime(request.submittedAt)}</span>
          </div>
          {request.reviewStartedAt && (
            <div className="flex items-center justify-between px-3 py-1.5">
              <span className="text-foreground">Revisión iniciada</span>
              <span className="text-muted-foreground">{formatDateTime(request.reviewStartedAt)}</span>
            </div>
          )}
          {request.managementStartedAt && (
            <div className="flex items-center justify-between px-3 py-1.5">
              {request.identityVerificationStatus === "VERIFICADA" ? (
                <span className="flex items-center gap-1.5 text-green-600 font-medium">
                  <ShieldCheck className="w-3 h-3 shrink-0" />
                  Identidad verificada · En gestión
                </span>
              ) : (
                <span className="text-foreground">En gestión</span>
              )}
              <span className="text-muted-foreground shrink-0">{formatDateTime(request.managementStartedAt)}</span>
            </div>
          )}
          {request.blockAppliedAt && (
            <div className="flex items-center justify-between px-3 py-1.5 bg-amber-50/50">
              <span className="flex items-center gap-1.5 text-amber-700 min-w-0">
                <Lock className="w-3 h-3 shrink-0" />
                <span className="truncate">
                  Bloqueo aplicado
                  {request.blockAppliedByEmail && <span className="text-amber-500 font-normal"> · {request.blockAppliedByEmail}</span>}
                </span>
              </span>
              <span className="text-amber-500 shrink-0 ml-2">{formatDateTime(request.blockAppliedAt)}</span>
            </div>
          )}
          {request.blockLiftedAt && (
            <div className="flex items-center justify-between px-3 py-1.5">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Lock className="w-3 h-3 shrink-0 opacity-40" />
                Bloqueo levantado
              </span>
              <span className="text-muted-foreground shrink-0">{formatDateTime(request.blockLiftedAt)}</span>
            </div>
          )}
          {request.resolvedAt && (
            <div className="flex items-center justify-between px-3 py-1.5">
              <span className={request.status === "RECHAZADA" ? "text-destructive" : "text-foreground"}>
                {STATUS_LABELS[request.status] ?? "Resuelta"}
              </span>
              <span className="text-muted-foreground shrink-0">{formatDateTime(request.resolvedAt)}</span>
            </div>
          )}
          {request.closedAt && (
            <div className="flex items-center justify-between px-3 py-1.5">
              <span className="text-muted-foreground">Cerrada</span>
              <span className="text-muted-foreground shrink-0">{formatDateTime(request.closedAt)}</span>
            </div>
          )}
        </div>

        {/* Bloqueo provisional — solo Oposición puede tener tratamiento suspendido preventivamente */}
        {request.requestType === "OPOSICION" && ["RECIBIDA", "EN_REVISION", "EN_GESTION"].includes(effectiveStatus) && (
          <>
            <div className={`rounded-lg border px-3 py-2.5 flex items-center justify-between gap-3 ${localBlockApplied ? "border-amber-300 bg-amber-50/60" : "border-border bg-muted/30"}`}>
              <div className="flex items-center gap-2 text-xs">
                <Lock className={`w-3.5 h-3.5 shrink-0 ${localBlockApplied ? "text-amber-600" : "text-muted-foreground"}`} />
                {localBlockApplied ? (
                  <span className="font-medium text-amber-800">
                    {localBlockScope ?? "Tratamiento en disputa suspendido preventivamente"}
                    {localBlockByEmail && <span className="font-normal text-amber-600"> · por {localBlockByEmail}</span>}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Sin bloqueo provisional activo</span>
                )}
              </div>
              {localBlockApplied ? (
                <button
                  type="button"
                  onClick={() => unblockMutation.mutate()}
                  disabled={unblockMutation.isPending}
                  className="shrink-0 text-xs font-medium px-2.5 py-1 rounded-md border border-border bg-background hover:bg-muted transition-colors inline-flex items-center gap-1.5"
                >
                  {unblockMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Lock className="w-3 h-3" />}
                  Levantar bloqueo
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => blockMutation.mutate()}
                  disabled={blockMutation.isPending}
                  className="shrink-0 text-xs font-medium px-2.5 py-1 rounded-md border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors inline-flex items-center gap-1.5"
                >
                  {blockMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Lock className="w-3 h-3" />}
                  Bloqueo provisional
                </button>
              )}
            </div>
            {(blockMutation.isError || unblockMutation.isError) && (
              <p className="text-xs text-destructive">
                {blockMutation.isError
                  ? (blockMutation.error as Error).message
                  : (unblockMutation.error as Error).message}
              </p>
            )}
          </>
        )}

        {request.requestType === "ACCESO" && pendingAction === null && effectiveStatus === "EN_GESTION" && (
          <ArcoAccessReport
            dataSubjectId={request.dataSubjectId}
            organizationId={request.organizationId}
            onGenerateResolution={(text) => {
              setComment(text)
              if (transitions.includes("RESPONDIDA")) setPendingAction("RESPONDIDA")
            }}
          />
        )}

        {request.requestType === "RECTIFICACION" && pendingAction === null && effectiveStatus === "EN_GESTION" && (
          <ArcoRectificationPanel
            arcoRequestId={request.id}
            dataSubjectId={request.dataSubjectId}
            organizationId={request.organizationId}
            description={request.description}
            supportingDocumentKey={freshRequest?.supportingDocumentKey ?? request.supportingDocumentKey}
            onApplied={(text) => {
              // El panel ya llamó a respondRectification y dejó la solicitud RESPONDIDA en el backend.
              setComment(text)
              qc.invalidateQueries({ queryKey: ["arco"] })
      qc.invalidateQueries({ queryKey: ["arco-subject"] })
              onClose()
            }}
          />
        )}

        {request.requestType === "SUPRESION" && pendingAction === null && effectiveStatus === "EN_GESTION" && (
          <ArcoSuppressionPanel
            arcoRequestId={request.id}
            dataSubjectId={request.dataSubjectId}
            organizationId={request.organizationId}
            description={request.description}
            onApplied={(text) => {
              // El panel ya llamó a respondSuppression y dejó la solicitud resuelta en el backend.
              setComment(text)
              qc.invalidateQueries({ queryKey: ["arco"] })
      qc.invalidateQueries({ queryKey: ["arco-subject"] })
              onClose()
            }}
          />
        )}

        {request.requestType === "PORTABILIDAD" && pendingAction === null && effectiveStatus === "EN_GESTION" && (
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
      qc.invalidateQueries({ queryKey: ["arco-subject"] })
            }}
          />
        )}

        {request.requestType === "OPOSICION" && pendingAction === null && effectiveStatus === "EN_GESTION" && (
          <ArcoOppositionPanel
            arcoRequestId={request.id}
            dataSubjectId={request.dataSubjectId}
            organizationId={request.organizationId}
            description={request.description}
            supportingDocumentKey={freshRequest?.supportingDocumentKey ?? request.supportingDocumentKey}
            onApplied={(text) => {
              // El panel ya llamó a respondOpposition y dejó la solicitud resuelta en el backend.
              setComment(text)
              qc.invalidateQueries({ queryKey: ["arco"] })
      qc.invalidateQueries({ queryKey: ["arco-subject"] })
              onClose()
            }}
          />
        )}

        {pendingAction === null && (
          startReviewMutation.isPending && effectiveStatus === "RECIBIDA" ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Iniciando revisión…
            </div>
          ) : requiresExplicitIdentity && (effectiveStatus === "RECIBIDA" || effectiveStatus === "EN_REVISION") ? (
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
          ) : effectiveStatus === "EN_GESTION" && request.requestType === "ACCESO" ? (
            <div className="flex flex-wrap gap-2 border-t border-border pt-3">
              <Button onClick={() => setPendingAction("RESPONDIDA")}>
                <Send className="w-4 h-4" />
                Responder solicitud
              </Button>
              <Button variant="destructive" onClick={() => setPendingAction("RECHAZADA")}>
                <XCircle className="w-4 h-4" />
                Rechazar solicitud
              </Button>
              {canExtend && (
                <Button variant="outline" onClick={() => setPendingAction("PRORROGA")}>
                  <Hourglass className="w-4 h-4" />
                  Solicitar prórroga (+30 días)
                </Button>
              )}
            </div>
          ) : effectiveStatus === "EN_GESTION" ? null
          : availableActions.length === 0 ? (
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

        {error && pendingAction === null && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>Cerrar</Button>
        </div>
      </div>
    </div>

    {pendingAction !== null && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-xl space-y-5 p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${ACTION_CONFIG[pendingAction].variant === "destructive" ? "text-destructive" : "text-primary"}`} />
            <div>
              <p className="font-semibold text-sm text-foreground">{ACTION_CONFIG[pendingAction].confirmTitle}</p>
              <p className="text-xs text-muted-foreground mt-1">{ACTION_CONFIG[pendingAction].confirmDescription}</p>
            </div>
          </div>

          {pendingAction === "RESPONDIDA" && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Respuesta para el titular *</Label>
                <textarea
                  rows={10}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Escribe aquí la respuesta para el titular…"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>
              {request.requestType === "ACCESO" && (
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5" />
                    Adjuntar PDF de respuesta (opcional)
                  </Label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf"
                    className="block w-full text-sm text-muted-foreground file:mr-3 file:py-1 file:px-3 file:rounded-md file:border file:border-border file:text-xs file:font-medium file:bg-muted file:text-foreground cursor-pointer"
                    onChange={(e) => setAccessPdfFile(e.target.files?.[0] ?? null)}
                  />
                  {accessPdfFile && (
                    <p className="text-xs text-muted-foreground">
                      Archivo seleccionado: <span className="font-medium text-foreground">{accessPdfFile.name}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {pendingAction === "RECHAZADA" && (
            <>
              <div className="space-y-1.5">
                <Label>Motivo de la denegación *</Label>
                <textarea
                  rows={6}
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
                rows={4}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Notas internas sobre este cambio de estado…"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={backToActions} disabled={mutation.isPending}>
              Cancelar
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
      </div>
    )}
    </>
  )
}

// ── Preview modal para el panel de auditor ──────────────────────────────────
function AdminDocPreviewModal({ fetchFn, filename, onClose }: {
  fetchFn: () => Promise<{ data: unknown }>
  filename: string
  onClose: () => void
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [contentType, setContentType] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let url: string | null = null
    fetchFn()
      .then((res) => {
        const blob = res.data as Blob
        setContentType(blob.type || "application/octet-stream")
        url = URL.createObjectURL(blob)
        setBlobUrl(url)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
    return () => { if (url) URL.revokeObjectURL(url) }
  }, [])

  const download = () => {
    if (!blobUrl) return
    const a = document.createElement("a"); a.href = blobUrl; a.download = filename; a.click()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-background rounded-xl shadow-2xl flex flex-col"
        style={{ width: "min(92vw, 960px)", height: "min(90vh, 780px)" }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <span className="text-sm font-semibold truncate max-w-[70%]">{filename}</span>
          <div className="flex items-center gap-2">
            {blobUrl && (
              <Button variant="outline" size="sm" onClick={download} className="gap-1.5">
                <Download className="w-3.5 h-3.5" /> Descargar
              </Button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden rounded-b-xl bg-muted/30">
          {loading && (
            <div className="flex items-center justify-center h-full gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Cargando…
            </div>
          )}
          {error && <div className="flex items-center justify-center h-full text-sm text-destructive">No se pudo cargar el documento.</div>}
          {blobUrl && !loading && (
            contentType.startsWith("image/") ? (
              <img src={blobUrl} alt={filename} className="w-full h-full object-contain p-4" />
            ) : contentType === "application/pdf" ? (
              <iframe src={blobUrl} title={filename} className="w-full h-full border-0 rounded-b-xl" />
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-sm text-muted-foreground">
                <p>Este tipo de archivo no se puede previsualizar.</p>
                <Button variant="outline" size="sm" onClick={download} className="gap-1.5">
                  <Download className="w-3.5 h-3.5" /> Descargar archivo
                </Button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}

// ── Modal de detalle (solicitudes cerradas) ───────────────────────────────────
function RequestDetailModal({
  request,
  titular,
  onClose,
}: {
  request: ArcoRequest
  titular: { fullName: string; email?: string | null; rut?: string | null } | undefined
  onClose: () => void
}) {
  const effectiveDueDate = request.extendedDueDate ?? request.dueDate
  const isRejected = !!(request.denialLegalBasis?.trim())
  const isTerminal = ["RESPONDIDA", "CERRADA"].includes(request.status)
  const currentIdx = STATUS_STEPS.indexOf(request.status as ArcoStatus)
  const [previewDoc, setPreviewDoc] = useState<{ fetchFn: () => Promise<{ data: unknown }>; filename: string } | null>(null)

  const showPortabilityDownload =
    request.requestType === "PORTABILIDAD" && isTerminal && !isRejected

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-xl space-y-4 p-6 max-h-[90vh] overflow-y-auto">

        {/* Cabecera */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl leading-none">{TYPE_ICONS[request.requestType] ?? "📋"}</span>
            <div>
              <p className="font-semibold text-foreground text-sm">
                {TYPE_LABELS[request.requestType] ?? request.requestType}
              </p>
              <p className="text-xs text-muted-foreground font-mono">{request.id.substring(0, 8)}…</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isRejected ? "destructive" : "default"}>
              {STATUS_LABELS[request.status] ?? request.status}
            </Badge>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-xs rounded-lg bg-muted/40 p-3">
          {titular && (
            <>
              <span className="text-muted-foreground">Titular</span>
              <span className="font-medium text-foreground">{titular.fullName}</span>
            </>
          )}
          <span className="text-muted-foreground">Canal</span>
          <span className="text-foreground">{CHANNEL_LABELS[request.requestChannel] ?? request.requestChannel}</span>
          <span className="text-muted-foreground">Enviada</span>
          <span className="text-foreground">{formatDate(request.submittedAt)}</span>
          <span className="text-muted-foreground">Plazo</span>
          <span className="text-foreground">
            {formatDate(effectiveDueDate)}
            {request.extensionGranted && <span className="text-muted-foreground"> (con prórroga)</span>}
          </span>
        </div>

        {/* Timeline de estados */}
        {!isRejected && (
          <div className="flex items-start pt-1">
            {STATUS_STEPS.map((step, i) => {
              const done   = currentIdx > i || isTerminal
              const active = currentIdx === i && !isTerminal
              const isLast = i === STATUS_STEPS.length - 1
              const ts     = (done || active) ? stepTimestamp(step, request) : null
              return (
                <div key={step} className="flex flex-col items-center" style={{ flex: isLast ? "0 0 auto" : 1 }}>
                  <div className="flex items-center w-full">
                    <div
                      className="shrink-0 rounded-full ring-2 ring-background"
                      style={{ width: 13, height: 13, background: stepColor(done, active) }}
                    />
                    {!isLast && (
                      <div
                        className="flex-1 h-0.5"
                        style={{ background: done ? "hsl(var(--success))" : "hsl(var(--border))" }}
                      />
                    )}
                  </div>
                  <span
                    className="text-xs mt-1.5 text-center leading-tight pr-1"
                    style={{
                      color: done ? "hsl(var(--success))" : active ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                      fontWeight: active ? 600 : 400,
                      maxWidth: 72,
                    }}
                  >
                    {STATUS_LABELS[step] ?? step}
                  </span>
                  {ts && (
                    <span
                      className="text-[10px] text-center leading-tight"
                      style={{ color: "hsl(var(--muted-foreground))", maxWidth: 88 }}
                    >
                      {formatDateTime(ts)}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Resolución */}
        {request.resolutionSummary && (
          <div
            className="rounded-xl px-4 py-3 text-xs border-l-4 leading-relaxed whitespace-pre-line space-y-1"
            style={{
              borderColor: isRejected ? "hsl(var(--destructive))" : "hsl(var(--success))",
              background:  isRejected ? "hsl(var(--destructive) / 0.07)" : "hsl(var(--success) / 0.07)",
              color:       isRejected ? "hsl(var(--destructive))" : "hsl(var(--success))",
            }}
          >
            <p><span className="font-semibold">Resolución: </span>{request.resolutionSummary}</p>
            {isRejected && request.denialLegalBasis && (
              <p><span className="font-semibold">Norma invocada: </span>{request.denialLegalBasis}</p>
            )}
            {request.resolvedAt && (
              <p className="opacity-70">Resuelta el {formatDate(request.resolvedAt)}</p>
            )}
            {request.resolvedByEmail && (
              <p className="opacity-70">Responsable: {request.resolvedByEmail}</p>
            )}
          </div>
        )}

        {/* Reclamo ante la Agencia */}
        {request.agencyClaimId && (
          <div className="rounded-xl px-4 py-3 text-xs bg-muted/50 space-y-1">
            <p className="font-semibold text-foreground">Reclamo ante la Agencia de Protección de Datos</p>
            {request.agencyResolution ? (
              <p className="text-muted-foreground whitespace-pre-line">{request.agencyResolution}</p>
            ) : (
              <p className="text-muted-foreground">Pendiente de respuesta de la Agencia.</p>
            )}
            {request.agencyRespondedAt && (
              <p className="text-muted-foreground">Respondido el {formatDate(request.agencyRespondedAt)}</p>
            )}
          </div>
        )}

        {/* Descarga de archivo de portabilidad */}
        {showPortabilityDownload && (
          <div className="rounded-xl border px-4 py-3 space-y-2"
            style={{ borderColor: "hsl(var(--primary) / 0.3)", background: "hsl(var(--primary) / 0.04)" }}>
            <p className="text-xs font-semibold" style={{ color: "hsl(var(--primary))" }}>
              📦 Archivo de portabilidad generado
            </p>
            <p className="text-xs text-muted-foreground">
              Se generó un archivo JSON con los datos del titular disponible para descarga.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setPreviewDoc({
                fetchFn: () => arcoApi.downloadPortability(request.id) as Promise<{ data: unknown }>,
                filename: `portabilidad-${request.id}.json`,
              })}
            >
              <Download className="w-3.5 h-3.5" />
              Descargar / Ver archivo
            </Button>
          </div>
        )}

        <div className="flex justify-end pt-1 border-t border-border">
          <Button variant="outline" size="sm" onClick={onClose}>Cerrar</Button>
        </div>
      </div>
    </div>

    {previewDoc && (
      <AdminDocPreviewModal
        fetchFn={previewDoc.fetchFn}
        filename={previewDoc.filename}
        onClose={() => setPreviewDoc(null)}
      />
    )}
    </>
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
  const [filterTab, setFilterTab]             = useState<"abiertas" | "cerradas">("abiertas")
  const [selected, setSelected]       = useState<ArcoRequest | null>(null)
  const [detailRequest, setDetailRequest] = useState<ArcoRequest | null>(null)

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

  const TERMINAL: ArcoStatus[] = ["CERRADA", "RECHAZADA"]
  const countAbiertas = requests.filter(r => !TERMINAL.includes(r.status)).length
  const countCerradas = requests.filter(r => TERMINAL.includes(r.status)).length

  const filtered = requests.filter((r) => {
    const titular = personsById[r.dataSubjectId]
    const matchTab = filterTab === "abiertas" ? !TERMINAL.includes(r.status) : TERMINAL.includes(r.status)
    const matchId = !filterId || r.id.toLowerCase().includes(filterId.toLowerCase())
    const matchTitular =
      !filterTitular ||
      r.dataSubjectId.toLowerCase().includes(filterTitular.toLowerCase()) ||
      titular?.fullName.toLowerCase().includes(filterTitular.toLowerCase()) ||
      titular?.email?.toLowerCase().includes(filterTitular.toLowerCase()) ||
      titular?.rut?.toLowerCase().includes(filterTitular.toLowerCase())
    const matchDate = !filterDate || r.submittedAt.slice(0, 10) === filterDate
    const matchStatus = !filterStatus || r.status === filterStatus
    return matchTab && matchId && matchTitular && matchDate && matchStatus
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
      {detailRequest && (
        <RequestDetailModal
          request={detailRequest}
          titular={personsById[detailRequest.dataSubjectId]}
          onClose={() => setDetailRequest(null)}
        />
      )}

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Solicitudes ARSOP</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Acceso · Rectificación · Supresión · Oposición · Portabilidad — Art. 11 Ley 21.719
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
          <CardHeader className="pb-4 space-y-4">
            {/* Tabs Abiertas / Cerradas */}
            <div className="flex gap-1 p-1 rounded-xl w-fit bg-muted">
              {(["abiertas", "cerradas"] as const).map((t) => {
                const count = t === "abiertas" ? countAbiertas : countCerradas
                const active = filterTab === t
                return (
                  <button key={t} onClick={() => { setFilterTab(t); setFilterStatus("") }}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                    style={{
                      background: active ? "hsl(var(--background))" : "transparent",
                      color: active ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                      boxShadow: active ? "0 1px 3px hsl(var(--border))" : "none",
                    }}>
                    {t === "abiertas" ? <Clock className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    {t === "abiertas" ? "Abiertas" : "Cerradas"}
                    <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
                      style={{
                        background: active ? "hsl(var(--primary) / 0.1)" : "hsl(var(--border))",
                        color: active ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                      }}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>

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
                  {Object.entries(STATUS_LABELS)
                    .filter(([v]) => filterTab === "abiertas"
                      ? !["CERRADA", "RECHAZADA"].includes(v)
                      : ["CERRADA", "RECHAZADA"].includes(v))
                    .map(([v, l]) => (
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
                                {r.blockAppliedAt && !r.blockLiftedAt && (
                                  <Badge variant="outline" className="w-fit text-[10px] gap-1 border-amber-300 text-amber-700">
                                    <Lock className="w-3 h-3" />
                                    Bloqueado
                                  </Badge>
                                )}
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
                              {r.status === "CERRADA" ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDetailRequest(r)}
                                >
                                  Ver detalle
                                </Button>
                              ) : (
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

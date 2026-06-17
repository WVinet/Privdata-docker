import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { arcoApi } from "@/lib/api"
import type { ArcoRequest, ArcoStatus } from "@/types/arco"

const TYPE_LABELS: Record<string, string> = {
  ACCESO:           "Derecho de Acceso",
  RECTIFICACION:    "Derecho de Rectificación",
  CANCELLATION:     "Derecho de Cancelación",
  OPOSICION:        "Derecho de Oposición",
  PORTABILIDAD:     "Derecho de Portabilidad",
  BLOQUEO_TEMPORAL: "Bloqueo Temporal de Datos",
}

const TYPE_ICONS: Record<string, string> = {
  ACCESO: "🔍", RECTIFICACION: "✏️", CANCELLATION: "🗑️",
  OPOSICION: "🚫", PORTABILIDAD: "📦", BLOQUEO_TEMPORAL: "🔒",
}

const STATUS_STEPS: ArcoStatus[] = [
  "RECIBIDA", "EN_REVISION", "EN_GESTION", "RESPONDIDA",
]

const STATUS_LABEL: Record<string, string> = {
  RECIBIDA: "Recibida", EN_REVISION: "En revisión",
  EN_GESTION: "En gestión", RESPONDIDA: "Respondida",
  RECHAZADA: "Rechazada", CERRADA: "Cerrada",
}

function stepColor(done: boolean, active: boolean) {
  if (done)   return "hsl(var(--success))"
  if (active) return "hsl(var(--primary))"
  return "hsl(var(--border))"
}

function daysLeft(dueDate: string) {
  return Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86_400_000)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-CL", {
    day: "2-digit", month: "long", year: "numeric",
  })
}

function ConformidadSection({ req }: { req: ArcoRequest }) {
  const queryClient = useQueryClient()
  const [showMotivo, setShowMotivo] = useState(false)
  const [motivo, setMotivo] = useState("")

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["arco-subject", req.dataSubjectId] })

  const closeMutation = useMutation({
    mutationFn: () => arcoApi.updateStatus(req.id, { status: "CERRADA" }),
    onSuccess: (res) => {
      if (!res.data.success) { toast.error(res.data.message ?? "No se pudo cerrar la solicitud."); return }
      toast.success("¡Gracias! Solicitud cerrada.")
      invalidate()
    },
    onError: () => toast.error("Error de conexión."),
  })

  const disconformidadMutation = useMutation({
    mutationFn: () => arcoApi.registrarDisconformidad(req.id, motivo || undefined),
    onSuccess: (res) => {
      if (!res.data.success) { toast.error(res.data.message ?? "No se pudo registrar la disconformidad."); return }
      toast.success("Disconformidad registrada.")
      setShowMotivo(false)
      invalidate()
    },
    onError: () => toast.error("Error de conexión."),
  })

  const reclamoMutation = useMutation({
    mutationFn: () => arcoApi.reclamoAgencia(req.id),
    onSuccess: (res) => {
      if (!res.data.success) { toast.error(res.data.message ?? "No se pudo registrar el reclamo."); return }
      toast.success("Reclamo registrado ante la Agencia de Protección de Datos.")
      invalidate()
    },
    onError: () => toast.error("Error de conexión."),
  })

  // La Agencia ya respondió — la solicitud ya quedó CERRADA por el callback
  if (req.agencyResolution) {
    return (
      <div
        className="rounded-xl px-4 py-3 text-xs border-l-4 leading-relaxed whitespace-pre-line"
        style={{ borderColor: "hsl(var(--primary))", background: "hsl(var(--primary) / 0.07)", color: "hsl(var(--primary))" }}
      >
        <span className="font-semibold">Respuesta de la Agencia de Protección de Datos: </span>
        {req.agencyResolution}
        {req.agencyRespondedAt && (
          <p className="mt-1 opacity-80">Respondido el {formatDate(req.agencyRespondedAt)}</p>
        )}
      </div>
    )
  }

  // Cerrada sin pasar por la Agencia (el titular quedó conforme) — nada más que mostrar
  if (req.status === "CERRADA") return null

  // Ya reclamó, esperando respuesta de la Agencia
  if (req.agencyClaimId) {
    return (
      <div className="rounded-xl px-4 py-3 text-xs" style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>
        Reclamo registrado ante la Agencia de Protección de Datos. Quedaremos atentos a su respuesta.
      </div>
    )
  }

  // Ya registró disconformidad — ofrecer escalar a la Agencia
  if (req.titularDisconforme) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 flex-wrap" style={{ background: "hsl(var(--muted))" }}>
        <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
          Registraste tu disconformidad con esta resolución.
        </span>
        <button
          onClick={() => reclamoMutation.mutate()}
          disabled={reclamoMutation.isPending}
          className="text-xs font-semibold px-3 py-1.5 rounded-full shrink-0 disabled:opacity-60"
          style={{ background: "hsl(var(--destructive))", color: "white" }}
        >
          {reclamoMutation.isPending ? "Enviando…" : "Hacer reclamo ante la Agencia"}
        </button>
      </div>
    )
  }

  // Caso por defecto: preguntar si está conforme con la resolución
  return (
    <div className="rounded-xl px-4 py-3 space-y-3" style={{ background: "hsl(var(--muted))" }}>
      <p className="text-xs font-semibold" style={{ color: "hsl(var(--foreground))" }}>
        ¿Está conforme con esta resolución?
      </p>
      {!showMotivo ? (
        <div className="flex gap-2">
          <button
            onClick={() => closeMutation.mutate()}
            disabled={closeMutation.isPending}
            className="text-xs font-semibold px-3 py-1.5 rounded-full disabled:opacity-60"
            style={{ background: "hsl(var(--success))", color: "white" }}
          >
            Sí, estoy conforme
          </button>
          <button
            onClick={() => setShowMotivo(true)}
            className="text-xs font-semibold px-3 py-1.5 rounded-full border"
            style={{ borderColor: "hsl(var(--destructive))", color: "hsl(var(--destructive))" }}
          >
            No estoy conforme
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Cuéntanos por qué no estás conforme (opcional)"
            rows={2}
            className="w-full text-xs rounded-lg border p-2 resize-none"
            style={{ borderColor: "hsl(var(--border))" }}
          />
          <div className="flex gap-2">
            <button
              onClick={() => disconformidadMutation.mutate()}
              disabled={disconformidadMutation.isPending}
              className="text-xs font-semibold px-3 py-1.5 rounded-full disabled:opacity-60"
              style={{ background: "hsl(var(--destructive))", color: "white" }}
            >
              {disconformidadMutation.isPending ? "Enviando…" : "Registrar disconformidad"}
            </button>
            <button
              onClick={() => setShowMotivo(false)}
              className="text-xs font-semibold px-3 py-1.5 rounded-full border"
              style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function SolicitudCard({ req }: { req: ArcoRequest }) {
  const isTerminal = ["RESPONDIDA", "RECHAZADA", "CERRADA"].includes(req.status)
  const isRejected = req.status === "RECHAZADA"
  const effectiveDueDate = req.extendedDueDate ?? req.dueDate
  const days = daysLeft(effectiveDueDate)

  const currentIdx = STATUS_STEPS.indexOf(req.status as ArcoStatus)

  return (
    <div
      className="bg-white rounded-2xl shadow-sm border overflow-hidden"
      style={{ borderColor: isRejected ? "hsl(var(--destructive) / 0.4)" : "hsl(var(--border))" }}
    >
      {/* Header */}
      <div
        className="px-5 pt-4 pb-3 flex items-start justify-between gap-3 flex-wrap border-b"
        style={{ borderColor: "hsl(var(--border))" }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
            style={{ background: "hsl(var(--muted))" }}
          >
            {TYPE_ICONS[req.requestType] ?? "📋"}
          </div>
          <div>
            <span className="font-mono text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
              {req.id.substring(0, 8)}…
            </span>
            <p className="font-bold text-sm mt-0.5" style={{ color: "hsl(var(--foreground))" }}>
              {TYPE_LABELS[req.requestType] ?? req.requestType}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
              Enviada el {formatDate(req.submittedAt)} · Vence: {formatDate(effectiveDueDate)}
              {req.extensionGranted && " (con prórroga)"}
            </p>
          </div>
        </div>

        <span
          className="text-xs font-semibold px-3 py-1 rounded-full shrink-0"
          style={{
            background: isRejected
              ? "hsl(var(--destructive) / 0.1)"
              : isTerminal
              ? "hsl(var(--success) / 0.1)"
              : "hsl(var(--primary) / 0.1)",
            color: isRejected
              ? "hsl(var(--destructive))"
              : isTerminal
              ? "hsl(var(--success))"
              : "hsl(var(--primary))",
          }}
        >
          {STATUS_LABEL[req.status] ?? req.status}
        </span>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Días restantes */}
        {!isTerminal && (
          <div className="flex justify-between text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
            <span>Plazo legal (Art. 11 Ley 21.719)</span>
            <span
              className="font-semibold"
              style={{ color: days < 5 ? "hsl(var(--destructive))" : "hsl(var(--foreground))" }}
            >
              {days > 0 ? `${days} días restantes` : `Venció hace ${Math.abs(days)} días`}
            </span>
          </div>
        )}

        {/* Timeline de estados */}
        {!isRejected && (
          <div className="flex items-start">
            {STATUS_STEPS.map((step, i) => {
              const done   = currentIdx > i || isTerminal
              const active = currentIdx === i && !isTerminal
              const isLast = i === STATUS_STEPS.length - 1
              return (
                <div key={step} className="flex flex-col items-center" style={{ flex: isLast ? "0 0 auto" : 1 }}>
                  <div className="flex items-center w-full">
                    <div
                      className="shrink-0 rounded-full ring-2 ring-white"
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
                    {STATUS_LABEL[step]}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {/* Resolución */}
        {req.resolutionSummary && (
          <div
            className="rounded-xl px-4 py-3 text-xs border-l-4 leading-relaxed whitespace-pre-line"
            style={{
              borderColor: isRejected ? "hsl(var(--destructive))" : "hsl(var(--success))",
              background: isRejected ? "hsl(var(--destructive) / 0.07)" : "hsl(var(--success) / 0.07)",
              color: isRejected ? "hsl(var(--destructive))" : "hsl(var(--success))",
            }}
          >
            <span className="font-semibold">Resolución: </span>
            {req.resolutionSummary}
            {isRejected && req.denialLegalBasis && (
              <p className="mt-1">
                <span className="font-semibold">Norma invocada: </span>
                {req.denialLegalBasis}
              </p>
            )}
          </div>
        )}

        {/* Conformidad / disconformidad / reclamo ante la Agencia */}
        {isTerminal && <ConformidadSection req={req} />}
      </div>
    </div>
  )
}

interface Props {
  organizationId: string
  dataSubjectId: string
}

export default function TitularSeguimiento({ organizationId, dataSubjectId }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["arco-subject", dataSubjectId],
    queryFn: () => arcoApi.findByDataSubject(dataSubjectId).then((r) => r.data),
    enabled: !!dataSubjectId,
  })

  const solicitudes = data?.data ?? []

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "hsl(var(--muted-foreground))" }} />
      </div>
    )
  }

  if (solicitudes.length === 0) {
    return (
      <div
        className="bg-white rounded-2xl shadow-sm border p-12 text-center"
        style={{ borderColor: "hsl(var(--border))" }}
      >
        <div className="text-4xl mb-3">📋</div>
        <h2 className="text-xl font-bold mb-1" style={{ color: "hsl(var(--foreground))" }}>
          Seguimiento de Solicitudes
        </h2>
        <p style={{ color: "hsl(var(--muted-foreground))" }}>
          No tienes solicitudes registradas todavía.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold" style={{ color: "hsl(var(--foreground))" }}>
          Seguimiento de Solicitudes
        </h2>
        <p className="text-sm mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
          Estado y avance de tus solicitudes ARCO — Art. 11 Ley 21.719.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {solicitudes.map((sol) => (
          <SolicitudCard key={sol.id} req={sol} />
        ))}
      </div>
    </div>
  )
}

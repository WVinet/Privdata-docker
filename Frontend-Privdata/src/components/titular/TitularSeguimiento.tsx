import { useState, useEffect, useRef } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, Download, CheckCircle2, Clock, Eye, X, Lock, ShieldCheck, AlertTriangle, FileJson, UserRound, Building2, Bell, UserX } from "lucide-react"
import { toast } from "sonner"
import { arcoApi } from "@/lib/api"
import type { ArcoRequest, ArcoStatus } from "@/types/arco"

const TYPE_LABELS: Record<string, string> = {
  ACCESO: "Derecho de Acceso",
  RECTIFICACION: "Derecho de Rectificación",
  SUPRESION: "Derecho de Supresión",
  OPOSICION: "Derecho de Oposición",
  PORTABILIDAD: "Derecho de Portabilidad",
}

const TYPE_ICONS: Record<string, string> = {
  ACCESO: "🔍", RECTIFICACION: "✏️", SUPRESION: "🗑️",
  OPOSICION: "🚫", PORTABILIDAD: "📦",
}

const STATUS_STEPS: ArcoStatus[] = ["RECIBIDA", "EN_REVISION", "EN_GESTION", "RESPONDIDA"]

const STATUS_LABEL: Record<string, string> = {
  RECIBIDA: "Recibida", EN_REVISION: "En revisión",
  EN_GESTION: "En gestión", RESPONDIDA: "Respondida",
  RECHAZADA: "Rechazada", CERRADA: "Cerrada",
}

function stepColor(done: boolean, active: boolean) {
  if (done) return "hsl(var(--success))"
  if (active) return "hsl(var(--primary))"
  return "hsl(var(--border))"
}

function daysLeft(dueDate: string) {
  return Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86_400_000)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-CL", { day: "2-digit", month: "long", year: "numeric" })
}

function formatDateTime(iso: string) {
  const d = new Date(iso)
  const date = d.toLocaleDateString("es-CL", { day: "2-digit", month: "short" })
  const time = d.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })
  return `${date} · ${time}`
}

function stepTimestamp(step: ArcoStatus, req: ArcoRequest): string | null {
  switch (step) {
    case "RECIBIDA": return req.submittedAt
    case "EN_REVISION": return req.reviewStartedAt ?? null
    case "EN_GESTION": return req.managementStartedAt ?? null
    case "RESPONDIDA": return req.resolvedAt ?? null
    default: return null
  }
}

// ── Modal de reclamo ante la Agencia (se abre automáticamente tras registrar disconformidad) ──
function ReclamoModal({ req, onClose, onDone }: { req: ArcoRequest; onClose: () => void; onDone: () => void }) {
  const qc = useQueryClient()
  const [quiereReclamar, setQuiereReclamar] = useState<boolean | null>(null)
  const [motivoReclamo, setMotivoReclamo] = useState("")
  const invalidate = () => qc.invalidateQueries({ queryKey: ["arco-subject", req.dataSubjectId] })

  const reclamoMutation = useMutation({
    mutationFn: () => arcoApi.reclamoAgencia(req.id),
    onSuccess: (res) => {
      if (!res.data.success) { toast.error(res.data.message ?? "Error"); return }
      toast.success("Reclamo registrado ante la Agencia.")
      invalidate()
      onDone()
    },
    onError: () => toast.error("Error de conexión."),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-background rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}>

        <div className="px-6 pt-6 pb-4 text-center space-y-2"
          style={{ background: "hsl(var(--destructive) / 0.06)", borderBottom: "1px solid hsl(var(--border))" }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto"
            style={{ background: "hsl(var(--destructive) / 0.12)" }}>
            <AlertTriangle className="w-6 h-6" style={{ color: "hsl(var(--destructive))" }} />
          </div>
          <h3 className="font-bold text-base" style={{ color: "hsl(var(--foreground))" }}>
            Disconformidad registrada
          </h3>
          <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
            {TYPE_LABELS[req.requestType] ?? req.requestType}
          </p>
        </div>

        <div className="px-6 py-5 space-y-4">
          {quiereReclamar === null ? (
            <>
              <p className="text-xs leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
                Tienes derecho a reclamar ante la{" "}
                <span className="font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                  Agencia de Protección de Datos Personales
                </span>{" "}
                si consideras que tu solicitud no fue resuelta conforme a la Ley 21.719.
              </p>
              <div className="rounded-xl px-4 py-3 text-xs space-y-1" style={{ background: "hsl(var(--muted))" }}>
                <p className="font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                  ¿Deseas reclamar ante la Agencia ahora?
                </p>
                <p style={{ color: "hsl(var(--muted-foreground))" }}>
                  También puedes hacerlo más tarde desde el detalle de tu solicitud.
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => setQuiereReclamar(true)}
                  className="text-xs font-semibold px-4 py-1.5 rounded-full"
                  style={{ background: "hsl(var(--destructive))", color: "white" }}>
                  Sí, quiero reclamar
                </button>
                <button onClick={onClose}
                  className="text-xs font-semibold px-4 py-1.5 rounded-full border"
                  style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}>
                  No por ahora
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
                Describe brevemente por qué consideras que la resolución no fue adecuada. Este motivo queda registrado para tu referencia.
              </p>
              <textarea
                value={motivoReclamo}
                onChange={(e) => setMotivoReclamo(e.target.value)}
                placeholder="Motivo del reclamo (opcional)…"
                rows={3}
                className="w-full text-xs rounded-lg border p-3 resize-none bg-background"
                style={{ borderColor: "hsl(var(--border))" }}
              />
              {reclamoMutation.isError && (
                <p className="text-xs" style={{ color: "hsl(var(--destructive))" }}>
                  {(reclamoMutation.error as Error).message}
                </p>
              )}
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => reclamoMutation.mutate()} disabled={reclamoMutation.isPending}
                  className="text-xs font-semibold px-4 py-1.5 rounded-full disabled:opacity-60"
                  style={{ background: "hsl(var(--destructive))", color: "white" }}>
                  {reclamoMutation.isPending ? "Enviando…" : "Enviar reclamo a la Agencia"}
                </button>
                <button onClick={() => setQuiereReclamar(null)}
                  className="text-xs font-semibold px-4 py-1.5 rounded-full border"
                  style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}>
                  Volver
                </button>
              </div>
            </>
          )}
          <button onClick={onClose}
            className="w-full text-xs py-1.5 rounded-lg text-center"
            style={{ color: "hsl(var(--muted-foreground))" }}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Conformidad inline (dentro de la card, para recordatorio) ─────────────────
function ConformidadSection({ req }: { req: ArcoRequest }) {
  const qc = useQueryClient()
  const [showMotivo, setShowMotivo] = useState(false)
  const [motivo, setMotivo] = useState("")
  const [showReclamoModal, setShowReclamoModal] = useState(false)
  const invalidate = () => qc.invalidateQueries({ queryKey: ["arco-subject", req.dataSubjectId] })

  const closeMutation = useMutation({
    mutationFn: () => arcoApi.updateStatus(req.id, { status: "CERRADA" }),
    onSuccess: (res) => {
      if (!res.data.success) { toast.error(res.data.message ?? "Error"); return }
      toast.success("Solicitud cerrada.")
      invalidate()
    },
    onError: () => toast.error("Error de conexión."),
  })

  const disconformidadMutation = useMutation({
    mutationFn: () => arcoApi.registrarDisconformidad(req.id, motivo || undefined),
    onSuccess: (res) => {
      if (!res.data.success) { toast.error(res.data.message ?? "Error"); return }
      setShowMotivo(false)
      invalidate()
      setShowReclamoModal(true)
    },
    onError: () => toast.error("Error de conexión."),
  })

  const reclamoMutation = useMutation({
    mutationFn: () => arcoApi.reclamoAgencia(req.id),
    onSuccess: (res) => {
      if (!res.data.success) { toast.error(res.data.message ?? "Error"); return }
      toast.success("Reclamo registrado ante la Agencia.")
      invalidate()
    },
    onError: () => toast.error("Error de conexión."),
  })

  const modal = showReclamoModal ? (
    <ReclamoModal
      req={req}
      onClose={() => setShowReclamoModal(false)}
      onDone={() => { setShowReclamoModal(false); invalidate() }}
    />
  ) : null

  if (req.agencyResolution) return null  // shown prominently in SolicitudCard body

  if (req.status === "CERRADA" && (req.agencyClaimId || req.titularDisconforme)) {
    return (
      <div className="rounded-xl px-4 py-3 text-xs border-l-4 leading-relaxed space-y-0.5"
        style={{ borderColor: "hsl(var(--destructive))", background: "hsl(var(--destructive) / 0.06)", color: "hsl(var(--destructive))" }}>
        <p className="font-semibold">Cerrada por reclamo ante la Agencia</p>
        <p style={{ opacity: 0.8 }}>
          Esta solicitud fue cerrada tras presentar un reclamo formal ante la Agencia de Protección de Datos Personales.
          {req.agencyClaimDeadline && <> En espera de resolución.</>}
        </p>
      </div>
    )
  }

  if (req.status === "CERRADA") return null

  if (req.agencyClaimId) {
    return (
      <>
        <div className="rounded-xl px-4 py-3 text-xs" style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>
          Reclamo registrado ante la Agencia de Protección de Datos. En espera de respuesta.
        </div>
        {modal}
      </>
    )
  }

  if (req.titularDisconforme) {
    return (
      <>
        <div className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 flex-wrap" style={{ background: "hsl(var(--muted))" }}>
          <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Registraste tu disconformidad.</span>
          <button onClick={() => reclamoMutation.mutate()} disabled={reclamoMutation.isPending}
            className="text-xs font-semibold px-3 py-1.5 rounded-full shrink-0 disabled:opacity-60"
            style={{ background: "hsl(var(--destructive))", color: "white" }}>
            {reclamoMutation.isPending ? "Enviando…" : "Reclamar ante la Agencia"}
          </button>
        </div>
        {modal}
      </>
    )
  }

  return (
    <>
      <div className="rounded-xl px-4 py-3 space-y-3" style={{ background: "hsl(var(--muted))" }}>
        <p className="text-xs font-semibold" style={{ color: "hsl(var(--foreground))" }}>¿Estás conforme con esta resolución?</p>
        {!showMotivo ? (
          <div className="flex gap-2">
            <button onClick={() => closeMutation.mutate()} disabled={closeMutation.isPending}
              className="text-xs font-semibold px-3 py-1.5 rounded-full disabled:opacity-60"
              style={{ background: "hsl(var(--success))", color: "white" }}>
              Sí, estoy conforme
            </button>
            <button onClick={() => setShowMotivo(true)}
              className="text-xs font-semibold px-3 py-1.5 rounded-full border"
              style={{ borderColor: "hsl(var(--destructive))", color: "hsl(var(--destructive))" }}>
              No estoy conforme
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)}
              placeholder="Cuéntanos por qué no estás conforme (opcional)" rows={2}
              className="w-full text-xs rounded-lg border p-2 resize-none bg-background"
              style={{ borderColor: "hsl(var(--border))" }} />
            <div className="flex gap-2">
              <button onClick={() => disconformidadMutation.mutate()} disabled={disconformidadMutation.isPending}
                className="text-xs font-semibold px-3 py-1.5 rounded-full disabled:opacity-60"
                style={{ background: "hsl(var(--destructive))", color: "white" }}>
                {disconformidadMutation.isPending ? "Enviando…" : "Registrar disconformidad"}
              </button>
              <button onClick={() => setShowMotivo(false)}
                className="text-xs font-semibold px-3 py-1.5 rounded-full border"
                style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}>
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
      {modal}
    </>
  )
}

// ── Modal de notificación al quedar RESPONDIDA ────────────────────────────────
function ConformidadModal({ req, onClose, onDone }: { req: ArcoRequest; onClose: () => void; onDone: () => void }) {
  const qc = useQueryClient()
  const [showMotivo, setShowMotivo] = useState(false)
  const [motivo, setMotivo] = useState("")
  const [fase, setFase] = useState<"conformidad" | "reclamo">("conformidad")
  const invalidate = () => qc.invalidateQueries({ queryKey: ["arco-subject", req.dataSubjectId] })

  const closeMutation = useMutation({
    mutationFn: () => arcoApi.updateStatus(req.id, { status: "CERRADA" }),
    onSuccess: (res) => {
      if (!res.data.success) { toast.error(res.data.message ?? "Error"); return }
      toast.success("¡Gracias! Solicitud cerrada.")
      invalidate()
      onDone()
    },
    onError: () => toast.error("Error de conexión."),
  })

  const disconformidadMutation = useMutation({
    mutationFn: () => arcoApi.registrarDisconformidad(req.id, motivo || undefined),
    onSuccess: (res) => {
      if (!res.data.success) { toast.error(res.data.message ?? "Error"); return }
      invalidate()
      setFase("reclamo")
    },
    onError: () => toast.error("Error de conexión."),
  })

  if (fase === "reclamo") {
    return <ReclamoModal req={req} onClose={onDone} onDone={onDone} />
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-background rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}>

        {/* Header verde */}
        <div className="px-6 pt-6 pb-4 text-center space-y-2"
          style={{ background: "hsl(var(--success) / 0.08)", borderBottom: "1px solid hsl(var(--border))" }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto"
            style={{ background: "hsl(var(--success) / 0.15)" }}>
            <CheckCircle2 className="w-6 h-6" style={{ color: "hsl(var(--success))" }} />
          </div>
          <h3 className="font-bold text-base" style={{ color: "hsl(var(--foreground))" }}>
            Tu solicitud fue respondida
          </h3>
          <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
            {TYPE_LABELS[req.requestType] ?? req.requestType}
          </p>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Resolución */}
          <div className="rounded-xl px-4 py-3 text-xs border-l-4 leading-relaxed space-y-1.5"
            style={{ borderColor: "hsl(var(--success))", background: "hsl(var(--success) / 0.07)" }}>
            {req.resolvedAt && (
              <p className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>
                Respondida el {formatDate(req.resolvedAt)}
              </p>
            )}
            <p className="font-semibold mb-1" style={{ color: "hsl(var(--success))" }}>Respuesta:</p>
            <div className="whitespace-pre-line overflow-y-auto" style={{ color: "hsl(var(--success))", maxHeight: "220px" }}>
              {req.resolutionSummary ?? "La solicitud fue respondida por el responsable de tratamiento."}
            </div>
          </div>

          {/* Descarga archivo de portabilidad */}
          {req.requestType === "PORTABILIDAD" && (
            <button
              type="button"
              onClick={async () => {
                try {
                  const res = await arcoApi.downloadPortability(req.id)
                  const blob = res.data as Blob
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement("a")
                  a.href = url
                  a.download = `portabilidad-${req.id}.json`
                  a.click()
                  URL.revokeObjectURL(url)
                } catch { /* silencioso */ }
              }}
              className="flex items-center justify-center gap-2 w-full text-xs font-semibold py-2.5 rounded-xl border transition-colors"
              style={{ borderColor: "hsl(var(--primary) / 0.4)", color: "hsl(var(--primary))", background: "hsl(var(--primary) / 0.06)" }}
            >
              <Download className="w-3.5 h-3.5" />
              Descargar archivo de portabilidad (JSON)
            </button>
          )}

          {/* Pregunta conformidad */}
          <div className="rounded-xl px-4 py-4 space-y-3" style={{ background: "hsl(var(--muted))" }}>
            <p className="text-xs font-semibold" style={{ color: "hsl(var(--foreground))" }}>
              ¿Estás conforme con esta resolución?
            </p>
            {!showMotivo ? (
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => closeMutation.mutate()} disabled={closeMutation.isPending}
                  className="text-xs font-semibold px-4 py-1.5 rounded-full disabled:opacity-60"
                  style={{ background: "hsl(var(--success))", color: "white" }}>
                  {closeMutation.isPending ? "Cerrando…" : "Sí, estoy conforme"}
                </button>
                <button onClick={() => setShowMotivo(true)}
                  className="text-xs font-semibold px-4 py-1.5 rounded-full border"
                  style={{ borderColor: "hsl(var(--destructive))", color: "hsl(var(--destructive))" }}>
                  No estoy conforme
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Cuéntanos por qué no estás conforme (opcional)" rows={2}
                  className="w-full text-xs rounded-lg border p-2 resize-none bg-background"
                  style={{ borderColor: "hsl(var(--border))" }} />
                <div className="flex gap-2">
                  <button onClick={() => disconformidadMutation.mutate()} disabled={disconformidadMutation.isPending}
                    className="text-xs font-semibold px-4 py-1.5 rounded-full disabled:opacity-60"
                    style={{ background: "hsl(var(--destructive))", color: "white" }}>
                    {disconformidadMutation.isPending ? "Enviando…" : "Registrar disconformidad"}
                  </button>
                  <button onClick={() => setShowMotivo(false)}
                    className="text-xs font-semibold px-4 py-1.5 rounded-full border"
                    style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>

          <button onClick={onClose}
            className="w-full text-xs py-1.5 rounded-lg text-center"
            style={{ color: "hsl(var(--muted-foreground))" }}>
            Responder después
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Preview modal reutilizable ────────────────────────────────────────────────
function DocPreviewModal({ fetchFn, filename, onClose }: {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-background rounded-xl shadow-2xl flex flex-col"
        style={{ width: "min(92vw, 960px)", height: "min(90vh, 780px)" }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <span className="text-sm font-semibold truncate max-w-[70%]">{filename}</span>
          <div className="flex items-center gap-2">
            {blobUrl && (
              <button onClick={download}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors">
                <Download className="w-3.5 h-3.5" /> Descargar
              </button>
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
                <button onClick={download} className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-border hover:bg-muted">
                  <Download className="w-3.5 h-3.5" /> Descargar archivo
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}

// ── Resolución de portabilidad con formato visual ────────────────────────────
function PortabilityResolutionCard({ summary }: { summary: string }) {
  const lines = summary.split("\n").map(l => l.trimEnd())

  // ── Parser ─────────────────────────────────────────────────────────────────
  const dateStr = lines.find(l => l.startsWith("Fecha de emisión:"))?.replace("Fecha de emisión:", "").trim() ?? ""

  // Datos identificativos
  const personStart = lines.findIndex(l => l === "Datos identificativos registrados:")
  const personFields: { label: string; value: string }[] = []
  if (personStart >= 0) {
    for (let i = personStart + 1; i < lines.length; i++) {
      const t = lines[i].trim()
      if (!t || t.endsWith(":")) break
      const col = t.indexOf(":")
      if (col > 0) personFields.push({ label: t.substring(0, col).trim(), value: t.substring(col + 1).trim() })
    }
  }

  // Consentimientos — cada item: línea numerada + sublíneas opcionales
  const consentHeader = lines.find(l => /^Consentimientos vigentes \(/.test(l))
  const consentCount  = parseInt(consentHeader?.match(/\((\d+)\)/)?.[1] ?? "0")
  const consentStart  = consentHeader ? lines.indexOf(consentHeader) : -1
  const consentItems: { main: string; desc?: string }[] = []
  if (consentStart >= 0) {
    let cur: { main: string; desc?: string } | null = null
    for (let i = consentStart + 1; i < lines.length; i++) {
      const t = lines[i].trim()
      if (!t || t.startsWith("Actividades") || t.startsWith("Su archivo")) { if (cur) consentItems.push(cur); break }
      if (t.match(/^\d+\./)) {
        if (cur) consentItems.push(cur)
        cur = { main: t.replace(/^\d+\.\s+/, "") }
      } else if (cur && t) {
        cur.desc = t
      }
    }
    if (cur && !consentItems.includes(cur)) consentItems.push(cur)
  }

  // Actividades — nombre en línea numerada, atributos en sublíneas ("Clave: valor")
  const actHeader = lines.find(l => /^Actividades de tratamiento a exportar \(/.test(l))
  const actCount  = parseInt(actHeader?.match(/\((\d+)\)/)?.[1] ?? "0")
  const actStart  = actHeader ? lines.indexOf(actHeader) : -1
  type Act = { name: string; attrs: Record<string, string> }
  const activities: Act[] = []
  if (actStart >= 0) {
    let cur: Act | null = null
    for (let i = actStart + 1; i < lines.length; i++) {
      const t = lines[i].trim()
      if (!t || t.startsWith("Su archivo")) { if (cur) activities.push(cur); break }
      if (t.match(/^\d+\./)) {
        if (cur) activities.push(cur)
        cur = { name: t.replace(/^\d+\.\s+/, ""), attrs: {} }
      } else if (cur) {
        const col = t.indexOf(":")
        if (col > 0) cur.attrs[t.substring(0, col).trim()] = t.substring(col + 1).trim()
      }
    }
    if (cur && !activities.includes(cur)) activities.push(cur)
  }

  // Footer
  const footer = lines.find(l => l.startsWith("Su archivo de datos")) ?? ""

  return (
    <div className="rounded-xl border px-4 py-4 space-y-4 text-sm"
      style={{ borderColor: "hsl(var(--success) / 0.3)", background: "hsl(var(--success) / 0.04)" }}>

      {/* Header */}
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 font-semibold" style={{ color: "hsl(var(--success))" }}>
          <FileJson className="w-4 h-4 shrink-0" />
          Informe de Portabilidad — Art. 8 bis Ley 21.719
        </div>
        {dateStr && (
          <span className="text-xs shrink-0" style={{ color: "hsl(var(--muted-foreground))" }}>Emitido el {dateStr}</span>
        )}
      </div>

      {/* Datos identificativos */}
      {personFields.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-2 flex items-center gap-1.5"
            style={{ color: "hsl(var(--muted-foreground))" }}>
            <UserRound className="w-3.5 h-3.5" />
            Datos identificativos
          </p>
          <div className="rounded-lg border px-3 py-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs"
            style={{ background: "hsl(var(--background))", borderColor: "hsl(var(--border))" }}>
            {personFields.map(f => (
              <div key={f.label}>
                <span style={{ color: "hsl(var(--muted-foreground))" }}>{f.label}:</span>{" "}
                <span className="font-medium" style={{ color: "hsl(var(--foreground))" }}>{f.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Consentimientos */}
      {consentCount > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-2 flex items-center gap-1.5"
            style={{ color: "hsl(var(--muted-foreground))" }}>
            <ShieldCheck className="w-3.5 h-3.5" /> Consentimientos vigentes ({consentCount})
          </p>
          <div className="space-y-1.5">
            {consentItems.map((item, i) => (
              <div key={i} className="rounded-lg border px-3 py-2 space-y-0.5 text-xs"
                style={{ background: "hsl(var(--background))", borderColor: "hsl(var(--border))" }}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium" style={{ color: "hsl(var(--foreground))" }}>{item.main}</span>
                  <span className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: "hsl(var(--success) / 0.12)", color: "hsl(var(--success))" }}>Vigente</span>
                </div>
                {item.desc && <p style={{ color: "hsl(var(--muted-foreground))" }}>{item.desc}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actividades */}
      {actCount > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-2 flex items-center gap-1.5"
            style={{ color: "hsl(var(--muted-foreground))" }}>
            <FileJson className="w-3.5 h-3.5" /> Actividades a exportar ({actCount})
          </p>
          <div className="space-y-1.5">
            {activities.map((a, i) => (
              <div key={i} className="rounded-lg border px-3 py-2 space-y-1 text-xs"
                style={{ background: "hsl(var(--background))", borderColor: "hsl(var(--border))" }}>
                <p className="font-medium" style={{ color: "hsl(var(--foreground))" }}>{a.name}</p>
                {a.attrs["Finalidad"] && <p style={{ color: "hsl(var(--muted-foreground))" }}>{a.attrs["Finalidad"]}</p>}
                {(a.attrs["Base legal"] || a.attrs["Destinatarios"] || a.attrs["Retenci\u00f3n"]) && (
                  <p style={{ color: "hsl(var(--muted-foreground))" }}>
                    {a.attrs["Base legal"] && <>Base legal: <span className="font-medium" style={{ color: "hsl(var(--foreground))" }}>{a.attrs["Base legal"]}</span></>}
                    {a.attrs["Destinatarios"] && <> · Destinatarios: <span className="font-medium" style={{ color: "hsl(var(--foreground))" }}>{a.attrs["Destinatarios"]}</span></>}
                    {a.attrs["Retenci\u00f3n"] && <> · Retención: <span className="font-medium" style={{ color: "hsl(var(--foreground))" }}>{a.attrs["Retenci\u00f3n"]}</span></>}
                  </p>
                )}
                {a.attrs["Categor\u00edas de datos"] && (
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {a.attrs["Categor\u00edas de datos"].split(", ").map(cat => (
                      <span key={cat} className="px-1.5 py-0.5 rounded-full"
                        style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>{cat}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      {footer && (
        <div className="flex items-start gap-1.5 text-xs"
          style={{ color: "hsl(var(--success))" }}>
          <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>{footer}</span>
        </div>
      )}
    </div>
  )
}

// ── Card individual ───────────────────────────────────────────────────────────
function SolicitudCard({ req }: { req: ArcoRequest }) {
  const isTerminal = ["RESPONDIDA", "RECHAZADA", "CERRADA"].includes(req.status)
  const isRejected = req.status === "RECHAZADA"
  const isClosed = req.status === "CERRADA"
  const isAgencyClaim = isClosed && (!!req.agencyClaimId || !!req.titularDisconforme)
  const effectiveDueDate = req.extendedDueDate ?? req.dueDate
  const days = daysLeft(effectiveDueDate)
  const currentIdx = STATUS_STEPS.indexOf(req.status as ArcoStatus)

  const [previewDoc, setPreviewDoc] = useState<{ fetchFn: () => Promise<{ data: unknown }>; filename: string } | null>(null)

  const hasDoc = !!req.supportingDocumentKey
  const hasResponseDoc = !!req.responseDocumentKey

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden h-fit"
        style={{ borderColor: isRejected ? "hsl(var(--destructive) / 0.4)" : isAgencyClaim ? "hsl(var(--destructive) / 0.3)" : isClosed ? "hsl(var(--success) / 0.4)" : "hsl(var(--border))" }}>

        {/* Header */}
        <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-3 flex-wrap border-b"
          style={{ borderColor: "hsl(var(--border))" }}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
              style={{ background: "hsl(var(--muted))" }}>
              {TYPE_ICONS[req.requestType] ?? "📋"}
            </div>
            <div>
              <span className="font-mono text-xs select-all" style={{ color: "hsl(var(--muted-foreground))" }}>
                {req.id}
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
          <span className="text-xs font-semibold px-3 py-1 rounded-full shrink-0"
            style={{
              background: isRejected ? "hsl(var(--destructive) / 0.1)" : isAgencyClaim ? "hsl(var(--destructive) / 0.08)" : isTerminal ? "hsl(var(--success) / 0.1)" : "hsl(var(--primary) / 0.1)",
              color: isRejected ? "hsl(var(--destructive))" : isAgencyClaim ? "hsl(var(--destructive))" : isTerminal ? "hsl(var(--success))" : "hsl(var(--primary))",
            }}>
            {STATUS_LABEL[req.status] ?? req.status}
          </span>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Días restantes */}
          {!isTerminal && (
            <div className="flex justify-between text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
              <span>Plazo legal (Art. 11 Ley 21.719)</span>
              <span className="font-semibold"
                style={{ color: days < 5 ? "hsl(var(--destructive))" : "hsl(var(--foreground))" }}>
                {days > 0 ? `${days} días restantes` : `Venció hace ${Math.abs(days)} días`}
              </span>
            </div>
          )}

          {/* Timeline */}
          {!isRejected && (
            <div className="flex items-start">
              {STATUS_STEPS.map((step, i) => {
                const done = currentIdx > i || isTerminal
                const active = currentIdx === i && !isTerminal
                const isLast = i === STATUS_STEPS.length - 1
                const ts = (done || active) ? stepTimestamp(step, req) : null
                return (
                  <div key={step} className="flex flex-col items-center" style={{ flex: isLast ? "0 0 auto" : 1 }}>
                    <div className="flex items-center w-full">
                      <div className="shrink-0 rounded-full ring-2 ring-white"
                        style={{ width: 13, height: 13, background: stepColor(done, active) }} />
                      {!isLast && (
                        <div className="flex-1 h-0.5"
                          style={{ background: done ? "hsl(var(--success))" : "hsl(var(--border))" }} />
                      )}
                    </div>
                    <span className="text-xs mt-1.5 text-center leading-tight pr-1"
                      style={{
                        color: done ? "hsl(var(--success))" : active ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                        fontWeight: active ? 600 : 400, maxWidth: 72,
                      }}>
                      {STATUS_LABEL[step]}
                    </span>
                    {ts && (
                      <span className="text-[10px] text-center leading-tight whitespace-nowrap"
                        style={{ color: "hsl(var(--muted-foreground))", maxWidth: 88 }}>
                        {formatDateTime(ts)}
                      </span>
                    )}
                    {step === "EN_GESTION" && (done || active) && req.identityVerificationStatus === "VERIFICADA" && (
                      <span className="text-[10px] text-center leading-tight mt-0.5 text-green-600 font-medium">
                        ✓ id. verificada
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Eventos de bloqueo provisional */}
          {req.blockAppliedAt && (
            <div className="space-y-1 pt-1 border-t border-border/40">
              <div className="flex items-start gap-1.5 text-[11px] text-amber-700">
                <Lock className="w-3 h-3 shrink-0 mt-px" />
                <span>
                  {req.blockScope ?? "Tratamiento suspendido preventivamente"}
                  <span className="text-amber-500/80"> — {formatDateTime(req.blockAppliedAt)}</span>
                </span>
              </div>
              {req.blockLiftedAt && (
                <div className="flex items-center gap-1.5 text-[11px]" style={{ color: "hsl(var(--muted-foreground))" }}>
                  <Lock className="w-3 h-3 shrink-0 opacity-40" />
                  <span>Suspensión levantada — {formatDateTime(req.blockLiftedAt)}</span>
                </div>
              )}
            </div>
          )}

          {/* Resolución */}
          {req.resolutionSummary && (
            req.requestType === "PORTABILIDAD" && !isRejected
              ? <PortabilityResolutionCard summary={req.resolutionSummary} />
              : (
                <div className="rounded-xl px-4 py-3 text-xs border-l-4 leading-relaxed whitespace-pre-line"
                  style={{
                    borderColor: isRejected ? "hsl(var(--destructive))" : "hsl(var(--success))",
                    background: isRejected ? "hsl(var(--destructive) / 0.07)" : "hsl(var(--success) / 0.07)",
                    color: isRejected ? "hsl(var(--destructive))" : "hsl(var(--success))",
                  }}>
                  <span className="font-semibold">Resolución: </span>{req.resolutionSummary}
                  {isRejected && req.denialLegalBasis && (
                    <p className="mt-1"><span className="font-semibold">Norma invocada: </span>{req.denialLegalBasis}</p>
                  )}
                </div>
              )
          )}

          {/* Cuenta desactivada — supresión aprobada */}
          {req.requestType === "SUPRESION" && req.status === "RESPONDIDA" && !isRejected && (
            <div className="rounded-xl px-4 py-3.5 flex items-start gap-3 border"
              style={{ borderColor: "hsl(var(--destructive) / 0.4)", background: "hsl(var(--destructive) / 0.07)" }}>
              <UserX className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "hsl(var(--destructive))" }} />
              <div className="space-y-0.5">
                <p className="text-xs font-semibold" style={{ color: "hsl(var(--destructive))" }}>
                  Tu cuenta ha sido desactivada
                </p>
                <p className="text-xs leading-relaxed" style={{ color: "hsl(var(--destructive) / 0.8)" }}>
                  Tu solicitud de supresión fue aprobada. Tus datos fueron anonimizados y no podrás volver a iniciar sesión en PrivData.
                </p>
              </div>
            </div>
          )}

          {/* Respuesta de la Agencia — prominente */}
          {req.agencyResolution && (
            <div className="rounded-xl px-4 py-3.5 space-y-1.5 border"
              style={{ borderColor: "hsl(var(--primary) / 0.3)", background: "hsl(var(--primary) / 0.06)" }}>
              <div className="flex items-center gap-1.5 text-xs font-semibold"
                style={{ color: "hsl(var(--primary))" }}>
                <Building2 className="w-3.5 h-3.5 shrink-0" />
                Resolución de la Agencia de Protección de Datos
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "hsl(var(--primary))" }}>
                {req.agencyResolution}
              </p>
              {req.agencyRespondedAt && (
                <p className="text-[10px]" style={{ color: "hsl(var(--primary) / 0.6)" }}>
                  Respondido el {formatDate(req.agencyRespondedAt)}
                </p>
              )}
            </div>
          )}

          {/* Documentos adjuntos */}
          <div className="flex flex-wrap gap-2">
            {hasDoc && (
              <button type="button"
                onClick={() => setPreviewDoc({
                  fetchFn: () => (req.requestType === "OPOSICION"
                    ? arcoApi.downloadOppositionDocument(req.id)
                    : arcoApi.downloadRectificationDocument(req.id)
                  ) as Promise<{ data: unknown }>,
                  filename: req.supportingDocumentKey!,
                })}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border"
                style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}>
                <Eye className="w-3.5 h-3.5" />
                Ver documento adjunto
              </button>
            )}
            {hasResponseDoc && (
              <button type="button"
                onClick={() => setPreviewDoc({
                  fetchFn: () => arcoApi.downloadAccessResponseDocument(req.id) as Promise<{ data: unknown }>,
                  filename: req.responseDocumentKey!,
                })}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border"
                style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}>
                <Eye className="w-3.5 h-3.5" />
                Ver respuesta en PDF
              </button>
            )}
            {req.requestType === "PORTABILIDAD" && isTerminal && !isRejected && (
              <button type="button"
                onClick={() => setPreviewDoc({
                  fetchFn: () => arcoApi.downloadPortability(req.id) as Promise<{ data: unknown }>,
                  filename: `portabilidad-${req.id}.json`,
                })}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border"
                style={{ borderColor: "hsl(var(--primary) / 0.4)", color: "hsl(var(--primary))" }}>
                <Download className="w-3.5 h-3.5" />
                Descargar archivo de portabilidad
              </button>
            )}
          </div>

          {/* Conformidad inline */}
          {isTerminal && <ConformidadSection req={req} />}
        </div>
      </div>

      {previewDoc && (
        <DocPreviewModal
          fetchFn={previewDoc.fetchFn}
          filename={previewDoc.filename}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
interface Props {
  organizationId: string
  dataSubjectId: string
}

function isAgencyClaimedReq(s: ArcoRequest) {
  return !!s.agencyClaimId || !!s.titularDisconforme
}

export default function TitularSeguimiento({ organizationId: _organizationId, dataSubjectId }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["arco-subject", dataSubjectId],
    queryFn: () => arcoApi.findByDataSubject(dataSubjectId).then((r) => r.data),
    enabled: !!dataSubjectId,
    staleTime: 0,
    refetchInterval: 10_000,
  })

  const solicitudes = [...(data?.data ?? [])].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  )

  const abiertas = solicitudes.filter(s => !["CERRADA", "RECHAZADA"].includes(s.status))
  const cerradas = solicitudes.filter(s => ["CERRADA", "RECHAZADA"].includes(s.status))
  const reclamos = solicitudes.filter(s => isAgencyClaimedReq(s))
  const reclamosConRespuesta = reclamos.filter(s => !!s.agencyResolution)

  const [tab, setTab] = useState<"abiertas" | "cerradas" | "reclamos">("abiertas")
  const [cerradasFilter, setCerradasFilter] = useState<"todas" | "cerradas" | "reclamadas">("todas")

  const cerradasFiltered = cerradas.filter(s => {
    if (cerradasFilter === "reclamadas") return isAgencyClaimedReq(s)
    if (cerradasFilter === "cerradas") return !isAgencyClaimedReq(s)
    return true
  })

  const reclamadasCount = cerradas.filter(isAgencyClaimedReq).length
  const cerradasNormalesCount = cerradas.length - reclamadasCount

  // Notificación automática para RESPONDIDA nuevas
  const [notifRequest, setNotifRequest] = useState<ArcoRequest | null>(null)
  const shownRef = useRef(new Set<string>())

  useEffect(() => {
    const pending = solicitudes.find(
      s => s.status === "RESPONDIDA"
        && !s.titularDisconforme
        && !s.agencyClaimId
        && !shownRef.current.has(s.id)
    )
    if (pending && !notifRequest) {
      shownRef.current.add(pending.id)
      setNotifRequest(pending)
    }
  }, [solicitudes])

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "hsl(var(--muted-foreground))" }} />
      </div>
    )
  }

  if (solicitudes.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border p-12 text-center" style={{ borderColor: "hsl(var(--border))" }}>
        <div className="text-4xl mb-3">📋</div>
        <h2 className="text-xl font-bold mb-1" style={{ color: "hsl(var(--foreground))" }}>Seguimiento de Solicitudes</h2>
        <p style={{ color: "hsl(var(--muted-foreground))" }}>No tienes solicitudes registradas todavía.</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-5">
        {/* Título */}
        <div>
          <h2 className="text-xl font-bold" style={{ color: "hsl(var(--foreground))" }}>Seguimiento de Solicitudes</h2>
          <p className="text-sm mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
            Estado y avance de tus solicitudes ARSOP — Art. 11 Ley 21.719.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: "hsl(var(--muted))" }}>
          {([
            { key: "abiertas",  label: "Abiertas",  icon: Clock,         count: abiertas.length,  dot: false },
            { key: "cerradas",  label: "Cerradas",  icon: CheckCircle2,  count: cerradas.length,  dot: false },
            { key: "reclamos",  label: "Reclamos",  icon: Building2,     count: reclamos.length,  dot: reclamosConRespuesta.length > 0 },
          ] as const).map(({ key, label, icon: Icon, count, dot }) => {
            const active = tab === key
            return (
              <button key={key} onClick={() => setTab(key)}
                className="relative flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                style={{
                  background: active ? "hsl(var(--background))" : "transparent",
                  color: active ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                  boxShadow: active ? "0 1px 3px hsl(var(--border))" : "none",
                }}>
                <Icon className="w-3.5 h-3.5" />
                {label}
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
                  style={{
                    background: active ? "hsl(var(--primary) / 0.1)" : "hsl(var(--border))",
                    color: active ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                  }}>
                  {count}
                </span>
                {dot && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-background"
                    style={{ background: "hsl(var(--destructive))" }} />
                )}
              </button>
            )
          })}
        </div>

        {/* Solicitudes */}
        {tab === "abiertas" && (
          abiertas.length === 0 ? (
            <div className="bg-white rounded-2xl border p-10 text-center" style={{ borderColor: "hsl(var(--border))" }}>
              <CheckCircle2 className="w-8 h-8 mx-auto mb-3" style={{ color: "hsl(var(--success))" }} />
              <p className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>No tienes solicitudes abiertas.</p>
              <p className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>Todas tus solicitudes han sido cerradas.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {abiertas.map(s => <SolicitudCard key={s.id} req={s} />)}
            </div>
          )
        )}

        {tab === "cerradas" && (
          cerradas.length === 0 ? (
            <div className="bg-white rounded-2xl border p-10 text-center" style={{ borderColor: "hsl(var(--border))" }}>
              <Clock className="w-8 h-8 mx-auto mb-3" style={{ color: "hsl(var(--muted-foreground))" }} />
              <p className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>No tienes solicitudes cerradas aún.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Sub-filtro cerradas */}
              <div className="flex gap-1.5 flex-wrap">
                {([
                  { key: "todas",      label: "Todas",      count: cerradas.length },
                  { key: "cerradas",   label: "Cerradas",   count: cerradasNormalesCount },
                  { key: "reclamadas", label: "Reclamadas", count: reclamadasCount },
                ] as const).map(({ key, label, count }) => {
                  const active = cerradasFilter === key
                  const isReclamo = key === "reclamadas"
                  return (
                    <button key={key} onClick={() => setCerradasFilter(key)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border"
                      style={{
                        background: active
                          ? isReclamo ? "hsl(var(--destructive) / 0.1)" : "hsl(var(--success) / 0.1)"
                          : "hsl(var(--background))",
                        borderColor: active
                          ? isReclamo ? "hsl(var(--destructive) / 0.4)" : "hsl(var(--success) / 0.4)"
                          : "hsl(var(--border))",
                        color: active
                          ? isReclamo ? "hsl(var(--destructive))" : "hsl(var(--success))"
                          : "hsl(var(--muted-foreground))",
                      }}>
                      {label}
                      <span className="font-semibold px-1.5 py-0.5 rounded-full text-[10px]"
                        style={{
                          background: active
                            ? isReclamo ? "hsl(var(--destructive) / 0.15)" : "hsl(var(--success) / 0.15)"
                            : "hsl(var(--muted))",
                          color: active
                            ? isReclamo ? "hsl(var(--destructive))" : "hsl(var(--success))"
                            : "hsl(var(--muted-foreground))",
                        }}>
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>

              {cerradasFiltered.length === 0 ? (
                <div className="bg-white rounded-2xl border p-8 text-center" style={{ borderColor: "hsl(var(--border))" }}>
                  <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                    No hay solicitudes en esta categoría.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {cerradasFiltered.map(s => <SolicitudCard key={s.id} req={s} />)}
                </div>
              )}
            </div>
          )
        )}
        {/* Tab reclamos ante la Agencia */}
        {tab === "reclamos" && (
          reclamos.length === 0 ? (
            <div className="bg-white rounded-2xl border p-10 text-center" style={{ borderColor: "hsl(var(--border))" }}>
              <Building2 className="w-8 h-8 mx-auto mb-3" style={{ color: "hsl(var(--muted-foreground))" }} />
              <p className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Sin reclamos registrados.</p>
              <p className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                Puedes reclamar ante la Agencia cuando no estés conforme con la resolución de una solicitud.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reclamosConRespuesta.length > 0 && (
                <div className="flex items-start gap-3 rounded-xl px-4 py-3"
                  style={{ background: "hsl(var(--primary) / 0.08)", border: "1px solid hsl(var(--primary) / 0.2)" }}>
                  <Bell className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "hsl(var(--primary))" }} />
                  <p className="text-xs leading-relaxed" style={{ color: "hsl(var(--primary))" }}>
                    <span className="font-semibold">
                      {reclamosConRespuesta.length === 1
                        ? "Tienes 1 respuesta de la Agencia disponible."
                        : `Tienes ${reclamosConRespuesta.length} respuestas de la Agencia disponibles.`}
                    </span>
                    {" "}Revisa las solicitudes marcadas a continuación.
                  </p>
                </div>
              )}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {reclamos.map(s => <SolicitudCard key={s.id} req={s} />)}
              </div>
            </div>
          )
        )}
      </div>

      {/* Modal de notificación */}
      {notifRequest && (
        <ConformidadModal
          req={notifRequest}
          onClose={() => setNotifRequest(null)}
          onDone={() => setNotifRequest(null)}
        />
      )}
    </>
  )
}

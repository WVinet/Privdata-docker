import { useState } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { Loader2, Download, FileJson, ShieldCheck, AlertTriangle, UserRound, CheckCircle2, XCircle } from "lucide-react"
import { complianceApi, personsApi, arcoApi } from "@/lib/api"
import type { Consent, ConsentDefinition, TreatmentActivity } from "@/types/compliance"
import { parsePortability, PORTABILITY_CAUSE_LABELS } from "@/lib/portability"

const LEGAL_BASIS_LABEL: Record<string, string> = {
  CONSENTIMIENTO:   "Consentimiento (Art. 12)",
  CONTRATO:         "Contrato (Art. 13 c)",
  OBLIGACION_LEGAL: "Obligación legal (Art. 13 b)",
  INTERES_LEGITIMO: "Interés legítimo (Art. 13 d)",
  INTERES_VITAL:    "Interés vital (Art. 13 e)",
}

function formatDate(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" })
}

interface Props {
  arcoRequestId: string
  dataSubjectId: string
  organizationId: string
  description: string
  status: string
  onApplied: (resolutionText: string) => void
}

export default function ArcoPortabilityPanel({ arcoRequestId, dataSubjectId, organizationId, description, status, onApplied }: Props) {
  const details = parsePortability(description)
  const [mode, setMode] = useState<"idle" | "approve" | "reject">("idle")
  const [showConfirm, setShowConfirm] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [observations, setObservations] = useState("")
  const [downloadError, setDownloadError] = useState("")
  const [justApproved, setJustApproved] = useState(false)

  const { data: personData, isLoading: loadingPerson } = useQuery({
    queryKey: ["person", organizationId, dataSubjectId],
    queryFn: () => personsApi.getById(organizationId, dataSubjectId).then(r => r.data),
  })

  const { data: consentsData, isLoading: loadingConsents } = useQuery({
    queryKey: ["consents-subject", dataSubjectId],
    queryFn: () => complianceApi.getConsentsBySubject(dataSubjectId).then(r => r.data),
  })

  const { data: ratData, isLoading: loadingRat } = useQuery({
    queryKey: ["rat", organizationId],
    queryFn: () => complianceApi.getRat(organizationId).then(r => r.data),
  })

  const { data: definitionsData } = useQuery({
    queryKey: ["consent-definitions", organizationId],
    queryFn: () => complianceApi.getConsentDefinitions(organizationId).then(r => Array.isArray(r.data) ? r.data : []),
  })

  const person       = personData?.data
  const consents: Consent[]              = Array.isArray(consentsData) ? consentsData : []
  const activities: TreatmentActivity[]  = Array.isArray(ratData) ? ratData : []
  const definitions: ConsentDefinition[] = Array.isArray(definitionsData) ? definitionsData : []
  const defMap = new Map(definitions.map(d => [d.id, d]))

  const isLoading = loadingPerson || loadingConsents || loadingRat

  const portableActivities = activities.filter(a => a.status === "ACTIVE" && a.legalBasis === "CONSENTIMIENTO")
  const excludedActivities = activities.filter(a => a.status === "ACTIVE" && a.legalBasis !== "CONSENTIMIENTO")

  const respondMutation = useMutation({
    mutationFn: async (approved: boolean) => {
      const res = await arcoApi.respondPortability(arcoRequestId, {
        approved,
        observations: approved ? observations.trim() || undefined : undefined,
        rejectionReason: !approved ? rejectionReason.trim() || undefined : undefined,
      })
      if (!res.data.success) throw new Error(res.data.message)
      return { approved, data: res.data.data }
    },
    onSuccess: ({ approved, data }) => {
      setMode("idle")
      if (approved) setJustApproved(true)
      onApplied(
        approved
          ? buildPortabilityResolution()
          : `Portabilidad rechazada — Art. 8 bis Ley 21.719\n\n${data?.resolutionSummary ?? rejectionReason.trim()}`
      )
    },
  })

  function formatRetention(days: number): string {
    if (days >= 365) { const y = Math.round(days / 365); return y === 1 ? "1 año" : `${y} años` }
    if (days >= 30)  { const m = Math.round(days / 30);  return m === 1 ? "1 mes"  : `${m} meses` }
    return days === 1 ? "1 día" : `${days} días`
  }

  function buildPortabilityResolution(): string {
    const lines: string[] = []
    lines.push(`Informe de Portabilidad — Art. 8 bis Ley 21.719`)
    lines.push(`Fecha de emisión: ${new Date().toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" })}`)
    lines.push("")

    if (person) {
      lines.push("Datos identificativos registrados:")
      lines.push(`  Nombre completo: ${person.fullName}`)
      if (person.rut)            lines.push(`  RUT: ${person.rut}`)
      if (person.email)          lines.push(`  Correo electrónico: ${person.email}`)
      if (person.phone)          lines.push(`  Teléfono: ${person.phone}`)
      if (person.position)       lines.push(`  Cargo: ${person.position}`)
      if (person.departmentName) lines.push(`  Departamento: ${person.departmentName}`)
      lines.push(`  Estado: ${person.isActive ? "Activo" : "Inactivo"}`)
      if (person.createdAt)      lines.push(`  Fecha de registro: ${new Date(person.createdAt).toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" })}`)
      lines.push("")
    }

    const activeConsents = consents.filter(c => c.status === "ACTIVE")
    if (activeConsents.length > 0) {
  lines.push(`Consentimientos vigentes (${activeConsents.length}):`)
      activeConsents.forEach((c, i) => {
        const def = c.definitionId ? defMap.get(c.definitionId) : undefined
        const title = def?.title ?? c.collectionMethod.replace(/_/g, " ").toLowerCase()
        const date  = c.grantedAt ? new Date(c.grantedAt).toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—"
        const vence = c.expiresAt  ? ` · Vence: ${new Date(c.expiresAt).toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" })}` : ""
        lines.push(`  ${i + 1}. ${title} · Otorgado el ${date} vía ${c.collectionMethod.replace(/_/g, " ").toLowerCase()}${vence}`)
        if (def?.description) lines.push(`     ${def.description}`)
      })
      lines.push("")
    } else {
      lines.push("Sin consentimientos vigentes registrados.")
      lines.push("")
    }

    if (portableActivities.length > 0) {
      lines.push(`Actividades de tratamiento a exportar (${portableActivities.length}):`)
      portableActivities.forEach((a, i) => {
        lines.push(`  ${i + 1}. ${a.name}`)
        lines.push(`     Finalidad: ${a.purpose}`)
        lines.push(`     Base legal: ${LEGAL_BASIS_LABEL[a.legalBasis] ?? a.legalBasis}`)
        const dest = a.terceros && a.terceros.length > 0
          ? a.terceros.map((t: { nombre: string; pais: string }) => `${t.nombre} (${t.pais})`).join(", ")
          : a.thirdPartyRecipients
        if (dest)                  lines.push(`     Destinatarios: ${dest}`)
        if (a.retentionPeriodDays) lines.push(`     Retención: ${formatRetention(a.retentionPeriodDays)}`)
        if (a.dataCategories.length > 0) {
          const cats = a.dataCategories.map(dc => dc.name).join(", ")
          lines.push(`     Categorías de datos: ${cats}`)
        }
      })
      lines.push("")
    }

    lines.push("Su archivo de datos en formato JSON ha sido generado y está disponible para descarga en el portal de seguimiento.")
    if (observations.trim()) lines.push(""), lines.push(observations.trim())
    return lines.join("\n")
  }

  const downloadMutation = useMutation({
    mutationFn: async () => {
      const res = await arcoApi.downloadPortability(arcoRequestId)
      return res.data
    },
    onSuccess: (blob) => {
      setDownloadError("")
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `portabilidad-${dataSubjectId}.json`
      link.click()
      URL.revokeObjectURL(url)
    },
    onError: () => setDownloadError("No se pudo descargar el archivo generado"),
  })

  function buildExportData() {
    return {
      tipo: "PORTABILIDAD_DATOS",
      fechaExportacion: new Date().toISOString(),
      titular: person ? {
        nombreCompleto: person.fullName,
        rut: person.rut,
        email: person.email,
        telefono: person.phone,
        cargo: person.position,
        departamento: person.departmentName,
      } : null,
      consentimientos: consents.map(c => {
        const def = c.definitionId ? defMap.get(c.definitionId) : undefined
        return {
          id: c.id,
          titulo: def?.title ?? null,
          descripcion: def?.description ?? null,
          estado: c.status,
          otorgadoEl: c.grantedAt,
          revocadoEl: c.revokedAt,
          expiraEl: c.expiresAt,
          metodoRecoleccion: c.collectionMethod,
          notas: c.notes,
        }
      }),
      actividadesTratamiento: portableActivities.map(a => {
        const destinatarios = a.terceros && a.terceros.length > 0
          ? a.terceros.map(t => ({ nombre: t.nombre, pais: t.pais }))
          : a.thirdPartyRecipients
              ? [{ nombre: a.thirdPartyRecipients, pais: null }]
              : []
        return {
          nombre: a.name,
          finalidad: a.purpose,
          baseLegal: a.legalBasis,
          baseLegalLabel: LEGAL_BASIS_LABEL[a.legalBasis] ?? a.legalBasis,
          categoriasDatos: a.dataCategories.map(dc => ({ nombre: dc.name, sensible: dc.sensitive })),
          retencionDias: a.retentionPeriodDays,
          destinatarios,
        }
      }),
    }
  }

  function handlePreviewDownload() {
    const blob = new Blob([JSON.stringify(buildExportData(), null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `portabilidad-vista-previa-${dataSubjectId}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (!details) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Solicitud de portabilidad</p>
        <p className="whitespace-pre-line">{description}</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Cargando datos del titular…
      </div>
    )
  }

  const alreadyApplied = status === "RESPONDIDA" || justApproved

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-4 text-sm">
      <div className="flex items-center gap-2 font-semibold text-foreground">
        <FileJson className="w-4 h-4 text-primary" />
        Solicitud de portabilidad
      </div>

      <div className="rounded-lg bg-background border border-border px-3 py-2 space-y-1.5 text-xs">
        <div>
          <span className="text-muted-foreground">Titular:</span>{" "}
          <span className="font-medium text-foreground">{person?.fullName ?? "—"}</span>
          {person?.rut && <span className="text-foreground"> · {person.rut}</span>}
        </div>
        <div>
          <span className="text-muted-foreground">Motivo invocado:</span>{" "}
          <span className="font-medium text-foreground">{PORTABILITY_CAUSE_LABELS[details.cause]}</span>
        </div>
        {details.destinationOrganization && (
          <div>
            <span className="text-muted-foreground">Responsable de destino:</span>{" "}
            <span className="text-foreground">{details.destinationOrganization}</span>
          </div>
        )}
        <div>
          <span className="text-muted-foreground">Detalle indicado por el titular:</span>{" "}
          <span className="text-foreground">{details.reason}</span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Conforme al Art. 9 de la Ley 21.719, la portabilidad solo procede sobre datos tratados de forma automatizada y cuyo
        tratamiento se base en el <span className="font-medium text-foreground">consentimiento</span> del titular.
      </p>

      {/* Datos identificativos */}
      {person && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
            <UserRound className="w-3.5 h-3.5" />
            Datos identificativos a exportar
          </p>
          <div className="rounded-lg bg-background border border-border px-3 py-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <div><span className="text-muted-foreground">Nombre completo:</span> <span className="font-medium text-foreground">{person.fullName}</span></div>
            <div><span className="text-muted-foreground">RUT:</span> <span className="font-medium text-foreground">{person.rut ?? "—"}</span></div>
            <div><span className="text-muted-foreground">Correo:</span> <span className="font-medium text-foreground">{person.email ?? "—"}</span></div>
            <div><span className="text-muted-foreground">Teléfono:</span> <span className="font-medium text-foreground">{person.phone ?? "—"}</span></div>
            <div><span className="text-muted-foreground">Cargo:</span> <span className="font-medium text-foreground">{person.position ?? "—"}</span></div>
            <div><span className="text-muted-foreground">Departamento:</span> <span className="font-medium text-foreground">{person.departmentName ?? "—"}</span></div>
          </div>
        </div>
      )}

      {/* Consentimientos */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          Consentimientos a exportar ({consents.length})
        </p>
        {consents.length === 0 ? (
          <p className="text-xs text-muted-foreground">Sin consentimientos registrados.</p>
        ) : (
          <div className="space-y-1.5">
            {consents.map(c => {
              const def = c.definitionId ? defMap.get(c.definitionId) : undefined
              return (
              <div key={c.id} className="rounded-lg bg-background border border-border px-3 py-2 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-foreground">
                    {def?.title ?? c.collectionMethod.replace(/_/g, " ").toLowerCase()}
                  </span>
                  <span
                    className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: c.status === "ACTIVE" ? "hsl(var(--success) / 0.12)" : "hsl(var(--muted))",
                      color: c.status === "ACTIVE" ? "hsl(var(--success))" : "hsl(var(--muted-foreground))",
                    }}
                  >
                    {c.status === "ACTIVE" ? "Vigente" : c.status}
                  </span>
                </div>
                {def?.description && <p className="text-xs text-muted-foreground">{def.description}</p>}
                <p className="text-xs text-muted-foreground">
                  Otorgado el {formatDate(c.grantedAt)} · vía {c.collectionMethod.replace(/_/g, " ").toLowerCase()}
                  {c.expiresAt && <> · vence {formatDate(c.expiresAt)}</>}
                </p>
              </div>
            )})}
          </div>
        )}
      </div>

      {/* Actividades de tratamiento portables */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
          <FileJson className="w-3.5 h-3.5" />
          Actividades de tratamiento a exportar ({portableActivities.length})
        </p>
        {portableActivities.length === 0 ? (
          <p className="text-xs text-muted-foreground">No hay actividades de tratamiento basadas en consentimiento.</p>
        ) : (
          <div className="space-y-1.5">
            {portableActivities.map(a => {
              const dest = a.terceros && a.terceros.length > 0
                ? a.terceros.map(t => `${t.nombre} (${t.pais})`).join(", ")
                : a.thirdPartyRecipients
              return (
              <div key={a.id} className="rounded-lg bg-background border border-border px-3 py-2 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-medium text-foreground">{a.name}</p>
                  {a.containsSensitiveData && (
                    <span className="shrink-0 text-xs font-semibold px-1.5 py-0.5 rounded bg-destructive/10 text-destructive">sensible</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{a.purpose}</p>
                <p className="text-xs text-muted-foreground">
                  Base legal: <span className="font-medium text-foreground">{LEGAL_BASIS_LABEL[a.legalBasis] ?? a.legalBasis}</span>
                  {dest && <> · Destinatarios: <span className="font-medium text-foreground">{dest}</span></>}
                  {a.retentionPeriodDays && <> · Retención: <span className="font-medium text-foreground">{formatRetention(a.retentionPeriodDays)}</span></>}
                </p>
                {a.dataCategories.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {a.dataCategories.map(dc => (
                      <span key={dc.id} className="text-xs px-1.5 py-0.5 rounded-full"
                        style={{
                          background: dc.sensitive ? "hsl(var(--destructive) / 0.1)" : "hsl(var(--muted))",
                          color: dc.sensitive ? "hsl(var(--destructive))" : "hsl(var(--muted-foreground))",
                        }}>{dc.name}</span>
                    ))}
                  </div>
                )}
              </div>
            )})}
          </div>
        )}
      </div>

      {/* Actividades excluidas */}
      {excludedActivities.length > 0 && (
        <div className="rounded-lg bg-background border border-border px-3 py-2 space-y-1.5">
          <p className="flex items-start gap-1.5 text-xs font-medium text-muted-foreground">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            No incluidas en la exportación — base legal distinta a consentimiento ({excludedActivities.length}):
          </p>
          <ul className="space-y-0.5 pl-5 list-disc text-xs text-muted-foreground">
            {excludedActivities.map(a => (
              <li key={a.id}>
                {a.name} — <span className="font-medium text-foreground">{LEGAL_BASIS_LABEL[a.legalBasis] ?? a.legalBasis}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="button"
        onClick={handlePreviewDownload}
        className="text-xs font-medium px-3 py-1.5 rounded-lg border border-border transition-colors hover:bg-muted inline-flex items-center gap-1.5"
      >
        <Download className="w-3.5 h-3.5" />
        Descargar vista previa (JSON)
      </button>

      {alreadyApplied ? (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "hsl(var(--success))" }}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            La solicitud ya fue respondida. El archivo oficial quedó generado y disponible para descarga.
          </div>
          {downloadError && <p className="text-xs text-destructive">{downloadError}</p>}
          <button
            type="button"
            onClick={() => downloadMutation.mutate()}
            disabled={downloadMutation.isPending}
            className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5"
            style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
          >
            {downloadMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <Download className="w-3.5 h-3.5" />
            Descargar archivo oficial
          </button>
        </div>
      ) : mode === "approve" ? (
        <div className="rounded-lg border border-primary/40 bg-background p-3 space-y-2">
          <p className="flex items-start gap-1.5 text-xs font-medium text-primary">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            Esta acción generará el archivo de exportación oficial y lo dejará disponible para descarga.
          </p>
          <textarea
            rows={2}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Observaciones para el titular (opcional)…"
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
          />
          {respondMutation.isError && (
            <p className="text-xs text-destructive">{(respondMutation.error as Error).message}</p>
          )}
          {showConfirm ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 space-y-2">
              <p className="text-xs font-semibold text-amber-800">¿Está seguro que desea enviar esta resolución?</p>
              <p className="text-xs text-amber-700">Esta acción no se puede deshacer.</p>
              <div className="flex gap-2">
                <button type="button"
                  onClick={() => { setShowConfirm(false); respondMutation.mutate(true) }}
                  disabled={respondMutation.isPending}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5"
                  style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
                  {respondMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Sí, enviar
                </button>
                <button type="button" onClick={() => setShowConfirm(false)}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg border border-border transition-colors hover:bg-muted">
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowConfirm(true)}
                className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5"
                style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
                Aprobar y generar archivo
              </button>
              <button type="button" onClick={() => { setMode("idle"); setShowConfirm(false) }}
                className="text-xs font-medium px-3 py-1.5 rounded-lg border border-border transition-colors hover:bg-muted">
                Cancelar
              </button>
            </div>
          )}
        </div>
      ) : mode === "reject" ? (
        <div className="rounded-lg border border-border bg-background p-3 space-y-2">
          <textarea
            rows={2}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Motivo del rechazo (opcional — si se deja vacío se usa un texto estándar)…"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
          {respondMutation.isError && (
            <p className="text-xs text-destructive">{(respondMutation.error as Error).message}</p>
          )}
          {showConfirm ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 space-y-2">
              <p className="text-xs font-semibold text-amber-800">¿Está seguro que desea enviar esta resolución?</p>
              <p className="text-xs text-amber-700">Esta acción no se puede deshacer.</p>
              <div className="flex gap-2">
                <button type="button"
                  onClick={() => { setShowConfirm(false); respondMutation.mutate(false) }}
                  disabled={respondMutation.isPending}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5"
                  style={{ background: "hsl(var(--destructive))", color: "hsl(var(--destructive-foreground))" }}>
                  {respondMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Sí, rechazar
                </button>
                <button type="button" onClick={() => setShowConfirm(false)}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg border border-border transition-colors hover:bg-muted">
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowConfirm(true)}
                className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5"
                style={{ background: "hsl(var(--destructive))", color: "hsl(var(--destructive-foreground))" }}>
                Confirmar rechazo
              </button>
              <button type="button" onClick={() => { setMode("idle"); setShowConfirm(false) }}
                className="text-xs font-medium px-3 py-1.5 rounded-lg border border-border transition-colors hover:bg-muted">
                Cancelar
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMode("approve")}
            className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5"
            style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
          >
            Aprobar y generar archivo
          </button>
          <button
            type="button"
            onClick={() => setMode("reject")}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-border transition-colors hover:bg-muted inline-flex items-center gap-1.5"
          >
            <XCircle className="w-3.5 h-3.5" />
            Rechazar
          </button>
        </div>
      )}
    </div>
  )
}

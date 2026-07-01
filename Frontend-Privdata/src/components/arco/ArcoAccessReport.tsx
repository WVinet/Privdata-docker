import { useQuery } from "@tanstack/react-query"
import { Loader2, ShieldCheck, FileText, AlertTriangle, UserRound } from "lucide-react"
import { complianceApi, personsApi } from "@/lib/api"
import type { Consent, TreatmentActivity } from "@/types/compliance"

const LEGAL_BASIS_LABEL: Record<string, string> = {
  CONSENTIMIENTO:   "Consentimiento (Art. 12)",
  CONTRATO:         "Contrato (Art. 13 c)",
  OBLIGACION_LEGAL: "Obligación legal (Art. 13 b)",
  INTERES_LEGITIMO: "Interés legítimo (Art. 13 d)",
  INTERES_VITAL:    "Interés vital (Art. 13 e)",
  FUNCION_PUBLICA:  "Función pública (Art. 20)",
}

const CONSENT_STATUS_LABEL: Record<string, string> = {
  ACTIVE:    "Vigente",
  REVOKED:   "Revocado",
  EXPIRED:   "Expirado",
  SUSPENDED: "Suspendido",
}

function formatDate(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" })
}

interface Props {
  dataSubjectId: string
  organizationId: string
  onGenerateResolution: (text: string) => void
}

export default function ArcoAccessReport({ dataSubjectId, organizationId, onGenerateResolution }: Props) {
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

  const person     = personData?.data
  const consents: Consent[]            = Array.isArray(consentsData) ? consentsData : []
  const activities: TreatmentActivity[] = Array.isArray(ratData) ? ratData : []

  const isLoading = loadingPerson || loadingConsents || loadingRat

  function buildResolution() {
    const activeConsents = consents.filter(c => c.status === "ACTIVE")
    const lines: string[] = []

    lines.push(`Informe de Acceso — Art. 11 Ley 21.719`)
    lines.push(`Fecha de emisión: ${formatDate(new Date().toISOString())}`)
    lines.push("")

    if (person) {
      lines.push("Datos identificativos registrados:")
      lines.push(`  Nombre completo: ${person.fullName}`)
      if (person.rut) lines.push(`  RUT: ${person.rut}`)
      if (person.email) lines.push(`  Correo electrónico: ${person.email}`)
      if (person.phone) lines.push(`  Teléfono: ${person.phone}`)
      if (person.position) lines.push(`  Cargo: ${person.position}`)
      if (person.departmentName) lines.push(`  Departamento: ${person.departmentName}`)
      lines.push(`  Estado: ${person.isActive ? "Activo" : "Inactivo"}`)
      lines.push(`  Fecha de registro: ${formatDate(person.createdAt)}`)
      lines.push("")
    }

    if (activeConsents.length > 0) {
      lines.push(`Consentimientos vigentes (${activeConsents.length}):`)
      activeConsents.forEach((c, i) => {
        lines.push(`  ${i + 1}. Otorgado el ${formatDate(c.grantedAt)} vía ${c.collectionMethod.replace("_", " ").toLowerCase()}${c.expiresAt ? ` · Vence: ${formatDate(c.expiresAt)}` : ""}`)
      })
      lines.push("")
    } else {
      lines.push("Sin consentimientos vigentes registrados.")
      lines.push("")
    }

    const activeRat = activities.filter(a => a.status === "ACTIVE")
    if (activeRat.length > 0) {
      lines.push(`Actividades de tratamiento activas que pueden incluir sus datos (${activeRat.length}):`)
      activeRat.forEach((a, i) => {
        lines.push(`  ${i + 1}. ${a.name} — Finalidad: ${a.purpose} — Base legal: ${LEGAL_BASIS_LABEL[a.legalBasis] ?? a.legalBasis}`)
        const dest = a.terceros && a.terceros.length > 0
          ? a.terceros.map(t => `${t.nombre} (${t.pais})`).join(", ")
          : a.thirdPartyRecipients
        if (dest) lines.push(`     Destinatarios: ${dest}`)
        if (a.retentionPeriodDays) lines.push(`     Retención: ${a.retentionPeriodDays} días`)
      })
    } else {
      lines.push("No hay actividades de tratamiento activas registradas.")
    }

    onGenerateResolution(lines.join("\n"))
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Cargando datos del titular…
      </div>
    )
  }

  const activeConsents = consents.filter(c => c.status === "ACTIVE")
  const activeRat      = activities.filter(a => a.status === "ACTIVE")
  const hasSensitive   = activeRat.some(a => a.containsSensitiveData)

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-4 text-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <FileText className="w-4 h-4 text-primary" />
          Informe de datos del titular
        </div>
        <button
          type="button"
          onClick={buildResolution}
          className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
          style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
        >
          Usar como resolución →
        </button>
      </div>

      {hasSensitive && (
        <div className="flex items-start gap-2 rounded-lg px-3 py-2 text-xs bg-destructive/10 text-destructive">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          Algunos tratamientos incluyen datos sensibles (Art. 2g Ley 21.719). Verificar nivel de acceso antes de entregar.
        </div>
      )}

      {/* Datos identificativos */}
      {person && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
            <UserRound className="w-3.5 h-3.5" />
            Datos identificativos registrados
          </p>
          <div className="rounded-lg bg-background border border-border px-3 py-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <div><span className="text-muted-foreground">Nombre completo:</span> <span className="font-medium text-foreground">{person.fullName}</span></div>
            <div><span className="text-muted-foreground">RUT:</span> <span className="font-medium text-foreground">{person.rut ?? "—"}</span></div>
            <div><span className="text-muted-foreground">Correo:</span> <span className="font-medium text-foreground">{person.email ?? "—"}</span></div>
            <div><span className="text-muted-foreground">Teléfono:</span> <span className="font-medium text-foreground">{person.phone ?? "—"}</span></div>
            <div><span className="text-muted-foreground">Cargo:</span> <span className="font-medium text-foreground">{person.position ?? "—"}</span></div>
            <div><span className="text-muted-foreground">Departamento:</span> <span className="font-medium text-foreground">{person.departmentName ?? "—"}</span></div>
            <div><span className="text-muted-foreground">Estado:</span> <span className="font-medium text-foreground">{person.isActive ? "Activo" : "Inactivo"}</span></div>
            <div><span className="text-muted-foreground">Fecha de registro:</span> <span className="font-medium text-foreground">{formatDate(person.createdAt)}</span></div>
          </div>
        </div>
      )}

      {/* Consentimientos */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          Consentimientos ({consents.length} total · {activeConsents.length} vigentes)
        </p>
        {consents.length === 0 ? (
          <p className="text-xs text-muted-foreground">Sin consentimientos registrados.</p>
        ) : (
          <div className="space-y-1.5">
            {consents.map(c => (
              <div key={c.id} className="flex items-center justify-between rounded-lg bg-background border border-border px-3 py-2">
                <div className="text-xs">
                  <span className="font-medium">{c.collectionMethod.replace("_", " ").toLowerCase()}</span>
                  <span className="text-muted-foreground ml-1.5">· otorgado {formatDate(c.grantedAt)}</span>
                  {c.expiresAt && <span className="text-muted-foreground"> · vence {formatDate(c.expiresAt)}</span>}
                </div>
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    background: c.status === "ACTIVE" ? "hsl(var(--success) / 0.12)" : "hsl(var(--muted))",
                    color: c.status === "ACTIVE" ? "hsl(var(--success))" : "hsl(var(--muted-foreground))",
                  }}
                >
                  {CONSENT_STATUS_LABEL[c.status] ?? c.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RAT activo */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" />
          Actividades de tratamiento activas ({activeRat.length})
        </p>
        {activeRat.length === 0 ? (
          <p className="text-xs text-muted-foreground">Sin actividades de tratamiento activas.</p>
        ) : (
          <div className="space-y-1.5">
            {activeRat.map(a => (
              <div key={a.id} className="rounded-lg bg-background border border-border px-3 py-2 space-y-0.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-medium text-foreground">{a.name}</p>
                  {a.containsSensitiveData && (
                    <span className="shrink-0 text-xs font-semibold px-1.5 py-0.5 rounded bg-destructive/10 text-destructive">sensible</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{a.purpose}</p>
                <p className="text-xs text-muted-foreground">
                  Base legal: <span className="font-medium text-foreground">{LEGAL_BASIS_LABEL[a.legalBasis] ?? a.legalBasis}</span>
                  {(() => {
                    const dest = a.terceros && a.terceros.length > 0
                      ? a.terceros.map(t => `${t.nombre} (país: ${t.pais})`).join(", ")
                      : a.thirdPartyRecipients
                    return dest ? <> · Destinatarios: <span className="font-medium text-foreground">{dest}</span></> : null
                  })()}
                  {a.retentionPeriodDays && <> · Retención: <span className="font-medium text-foreground">{a.retentionPeriodDays}d</span></>}
                </p>
                {a.dataCategories.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {a.dataCategories.map(dc => (
                      <span
                        key={dc.id}
                        className="text-xs px-1.5 py-0.5 rounded-full"
                        style={{
                          background: dc.sensitive ? "hsl(var(--destructive) / 0.1)" : "hsl(var(--muted))",
                          color: dc.sensitive ? "hsl(var(--destructive))" : "hsl(var(--muted-foreground))",
                        }}
                      >
                        {dc.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

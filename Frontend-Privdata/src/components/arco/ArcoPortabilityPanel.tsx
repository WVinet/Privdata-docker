import { useQuery } from "@tanstack/react-query"
import { Loader2, Download, FileJson, ShieldCheck, AlertTriangle, UserRound } from "lucide-react"
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

function formatDate(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" })
}

interface Props {
  dataSubjectId: string
  organizationId: string
  onGenerateResolution: (text: string) => void
}

export default function ArcoPortabilityPanel({ dataSubjectId, organizationId, onGenerateResolution }: Props) {
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
  const consents: Consent[]            = consentsData ?? []
  const activities: TreatmentActivity[] = ratData ?? []

  const isLoading = loadingPerson || loadingConsents || loadingRat

  const portableActivities = activities.filter(a => a.status === "ACTIVE" && a.legalBasis === "CONSENTIMIENTO")
  const excludedActivities = activities.filter(a => a.status === "ACTIVE" && a.legalBasis !== "CONSENTIMIENTO")

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
      consentimientos: consents.map(c => ({
        id: c.id,
        estado: c.status,
        otorgadoEl: c.grantedAt,
        revocadoEl: c.revokedAt,
        expiraEl: c.expiresAt,
        metodoRecoleccion: c.collectionMethod,
        notas: c.notes,
      })),
      actividadesTratamiento: portableActivities.map(a => ({
        nombre: a.name,
        finalidad: a.purpose,
        baseLegal: a.legalBasis,
        categoriasDatos: a.dataCategories.map(dc => dc.name),
        retencionDias: a.retentionPeriodDays,
        destinatarios: a.thirdPartyRecipients,
      })),
    }
  }

  function handleDownload() {
    const blob = new Blob([JSON.stringify(buildExportData(), null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `portabilidad-${dataSubjectId}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  function buildResolution() {
    const lines: string[] = []
    lines.push(`Informe de Portabilidad — Art. 9 Ley 21.719`)
    lines.push(`Fecha de emisión: ${formatDate(new Date().toISOString())}`)
    lines.push("")
    lines.push("A continuación se entregan tus datos personales en un formato estructurado, genérico y de uso común (JSON), conforme al Art. 9 de la Ley 21.719. Solo se incluyen los datos cuyo tratamiento se basa en tu consentimiento.")
    lines.push("")
    lines.push(JSON.stringify(buildExportData(), null, 2))

    if (excludedActivities.length > 0) {
      lines.push("")
      lines.push(`Nota: ${excludedActivities.length} actividad(es) de tratamiento no se incluyeron en esta exportación por no estar basadas en tu consentimiento (Art. 9 Ley 21.719):`)
      excludedActivities.forEach((a) => {
        lines.push(`  - ${a.name} — Base legal: ${LEGAL_BASIS_LABEL[a.legalBasis] ?? a.legalBasis}`)
      })
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

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-4 text-sm">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <FileJson className="w-4 h-4 text-primary" />
          Exportación de datos (Portabilidad)
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleDownload}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-border transition-colors hover:bg-muted inline-flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Descargar JSON
          </button>
          <button
            type="button"
            onClick={buildResolution}
            className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
            style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
          >
            Usar como resolución →
          </button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Conforme al Art. 9 de la Ley 21.719, la portabilidad solo procede sobre datos tratados de forma automatizada y cuyo
        tratamiento se base en el <span className="font-medium text-foreground">consentimiento</span> del titular. Los datos
        identificativos y consentimientos se incluyen siempre; las actividades de tratamiento solo se incluyen si su base
        legal es consentimiento.
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
                  {c.status}
                </span>
              </div>
            ))}
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
            {portableActivities.map(a => (
              <div key={a.id} className="rounded-lg bg-background border border-border px-3 py-2 space-y-0.5">
                <p className="text-xs font-medium text-foreground">{a.name}</p>
                <p className="text-xs text-muted-foreground">{a.purpose}</p>
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
    </div>
  )
}

import { useQuery } from "@tanstack/react-query"
import { Loader2, Ban, CheckCircle2, XCircle, HelpCircle } from "lucide-react"
import { complianceApi } from "@/lib/api"
import { parseOpposition } from "@/lib/opposition"
import type { TreatmentActivity } from "@/types/compliance"

const LEGAL_BASIS_LABEL: Record<string, string> = {
  CONSENTIMIENTO:   "Consentimiento (Art. 12)",
  CONTRATO:         "Contrato (Art. 13 c)",
  OBLIGACION_LEGAL: "Obligación legal (Art. 13 b)",
  INTERES_LEGITIMO: "Interés legítimo (Art. 13 d)",
  INTERES_VITAL:    "Interés vital (Art. 13 e)",
  FUNCION_PUBLICA:  "Función pública (Art. 20)",
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" })
}

interface Props {
  dataSubjectId: string
  organizationId: string
  description: string
  onGenerateResolution: (text: string) => void
}

export default function ArcoOppositionPanel({ organizationId, description, onGenerateResolution }: Props) {
  const details = parseOpposition(description)

  const { data: ratData, isLoading } = useQuery({
    queryKey: ["rat", organizationId],
    queryFn: () => complianceApi.getRat(organizationId).then(r => r.data),
    enabled: !!details,
  })
  const activities: TreatmentActivity[] = ratData ?? []

  if (!details) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Solicitud de oposición</p>
        <p className="whitespace-pre-line">{description}</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Cargando actividades de tratamiento…
      </div>
    )
  }

  const evaluated = details.activities.map((ref) => {
    const current = activities.find(a => a.id === ref.id)
    if (!current) {
      return { ref, current, status: "NO_VIGENTE" as const }
    }
    if (current.legalBasis === "INTERES_LEGITIMO") {
      return { ref, current, status: "PROCEDE" as const }
    }
    return { ref, current, status: "NO_PROCEDE" as const }
  })

  const granted = evaluated.filter(e => e.status === "PROCEDE")
  const denied = evaluated.filter(e => e.status === "NO_PROCEDE")
  const notFound = evaluated.filter(e => e.status === "NO_VIGENTE")

  function buildResolution() {
    const lines: string[] = []
    lines.push(`Resolución de Oposición — Art. 8 Ley 21.719`)
    lines.push(`Fecha de emisión: ${formatDate(new Date().toISOString())}`)
    lines.push("")
    lines.push(`Evaluamos tu oposición al tratamiento de tus datos para ${details!.activities.length} finalidad(es). Resultado:`)

    if (granted.length > 0) {
      lines.push("")
      lines.push(`ACOGIDAS (${granted.length}):`)
      granted.forEach(({ ref, current }) => {
        lines.push(`  - "${ref.name}" — Finalidad: ${current!.purpose}`)
        lines.push(`    Conforme al Art. 8 de la Ley 21.719, dado que el tratamiento se basaba en interés legítimo, dejaremos de tratar tus datos para esta finalidad.`)
      })
    }

    if (denied.length > 0) {
      lines.push("")
      lines.push(`NO PROCEDEN (${denied.length}):`)
      denied.forEach(({ ref, current }) => {
        lines.push(`  - "${ref.name}" — Finalidad: ${current!.purpose}`)
        lines.push(`    Base legal: ${LEGAL_BASIS_LABEL[current!.legalBasis] ?? current!.legalBasis}. El derecho de oposición no procede para esta base legal conforme al Art. 8 de la Ley 21.719, ya que prevalece sobre la solicitud.`)
      })
    }

    if (notFound.length > 0) {
      lines.push("")
      lines.push(`SIN EFECTO (${notFound.length}):`)
      notFound.forEach(({ ref }) => {
        lines.push(`  - "${ref.name}" — Esta actividad de tratamiento ya no se encuentra vigente.`)
      })
    }

    lines.push("")
    lines.push(`Motivo indicado por el titular: ${details!.reason}`)

    onGenerateResolution(lines.join("\n"))
  }

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-4 text-sm">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <Ban className="w-4 h-4 text-primary" />
          Solicitud de oposición ({details.activities.length})
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

      <p className="text-xs text-muted-foreground">
        Conforme al Art. 8 de la Ley 21.719, la oposición procede cuando el tratamiento se basa en{" "}
        <span className="font-medium text-foreground">interés legítimo</span>, salvo que existan motivos legítimos
        imperiosos que prevalezcan. Para las demás bases legales, el derecho de oposición no aplica.
      </p>

      <div className="space-y-1.5">
        {evaluated.map(({ ref, current, status }) => (
          <div key={ref.id} className="rounded-lg bg-background border border-border px-3 py-2 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <div className="text-xs">
                <p className="font-medium text-foreground">{ref.name}</p>
                {current && <p className="text-muted-foreground">{current.purpose}</p>}
              </div>
              {status === "PROCEDE" && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 shrink-0"
                  style={{ background: "hsl(var(--success) / 0.12)", color: "hsl(var(--success))" }}>
                  <CheckCircle2 className="w-3 h-3" /> Procede
                </span>
              )}
              {status === "NO_PROCEDE" && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 shrink-0"
                  style={{ background: "hsl(var(--destructive) / 0.1)", color: "hsl(var(--destructive))" }}>
                  <XCircle className="w-3 h-3" /> No procede
                </span>
              )}
              {status === "NO_VIGENTE" && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 shrink-0"
                  style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>
                  <HelpCircle className="w-3 h-3" /> No vigente
                </span>
              )}
            </div>
            {status === "NO_PROCEDE" && current && (
              <p className="text-xs text-muted-foreground">
                Base legal: <span className="font-medium text-foreground">{LEGAL_BASIS_LABEL[current.legalBasis] ?? current.legalBasis}</span> — prevalece sobre la oposición (Art. 8).
              </p>
            )}
            {status === "NO_VIGENTE" && (
              <p className="text-xs text-muted-foreground">Esta actividad de tratamiento ya no se encuentra vigente.</p>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-lg bg-background border border-border px-3 py-2 text-xs">
        <span className="text-muted-foreground">Motivo indicado por el titular:</span>{" "}
        <span className="text-foreground">{details.reason}</span>
      </div>
    </div>
  )
}

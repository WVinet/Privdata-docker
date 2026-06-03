import { useQuery } from "@tanstack/react-query"
import { complianceApi, arcoApi } from "@/lib/api"
import { type TitularTab } from "./TitularPortalLayout"
import type { Consent, ConsentDefinition } from "@/types/compliance"
import type { ArcoRequest } from "@/types/arco"

interface Props {
  organizationId: string
  dataSubjectId:  string
  name:           string
  rut:            string
  email:          string
  onNavigate:     (tab: TitularTab) => void
}

const ARCO_STATUS_LABEL: Record<string, { label: string; color: string }> = {
  RECIBIDA:   { label: "Recibida",   color: "hsl(var(--primary))" },
  EN_PROCESO: { label: "En proceso", color: "hsl(36 70% 40%)" },
  RESPONDIDA: { label: "Resuelta",   color: "hsl(142 71% 35%)" },
  RECHAZADA:  { label: "Rechazada",  color: "hsl(var(--destructive))" },
  CERRADA:    { label: "Cerrada",    color: "hsl(var(--muted-foreground))" },
}

export default function TitularInicio({ organizationId, dataSubjectId, name, rut, email, onNavigate }: Props) {

  const { data: consentsRaw } = useQuery({
    queryKey: ["consents", dataSubjectId],
    queryFn:  () => complianceApi.getConsentsBySubject(dataSubjectId).then((r) => r.data ?? []),
    enabled:  !!dataSubjectId,
  })

  const { data: defsRaw } = useQuery({
    queryKey: ["consent-definitions", organizationId],
    queryFn:  () => complianceApi.getConsentDefinitions(organizationId).then((r) => r.data ?? []),
    enabled:  !!organizationId,
  })

  const { data: arcoRaw } = useQuery({
    queryKey: ["arco-subject", dataSubjectId],
    queryFn:  () => arcoApi.findByDataSubject(dataSubjectId).then((r) => r.data),
    enabled:  !!dataSubjectId,
  })

  const consents: Consent[]          = consentsRaw ?? []
  const definitions: ConsentDefinition[] = defsRaw ?? []
  const arcoList: ArcoRequest[]       = arcoRaw?.data ?? []

  const defMap = new Map<string, ConsentDefinition>(definitions.map((d) => [d.id, d]))

  const activeConsents  = consents.filter((c) => c.status === "ACTIVE")
  const enTramite       = arcoList.filter((r) => r.status === "RECIBIDA" || r.status === "EN_PROCESO")
  const resueltas       = arcoList.filter((r) => r.status === "RESPONDIDA")
  const latestTramite   = enTramite[0] ?? null

  const stats = [
    { value: activeConsents.length, label: "Consentimientos activos" },
    { value: enTramite.length,      label: "En trámite" },
    { value: resueltas.length,      label: "Resueltas" },
  ]

  const actionCards = [
    {
      icon: "🔔",
      title: "Mis Consentimientos",
      description: "Revisa y modifica los permisos que has otorgado.",
      tab: "consentimientos" as TitularTab,
      accent: "hsl(var(--primary))",
    },
    {
      icon: "⚖️",
      title: "Derechos ARCO",
      description: "Acceso, rectificación, supresión, portabilidad y más.",
      tab: "arco" as TitularTab,
      accent: "hsl(var(--info))",
    },
    {
      icon: "📋",
      title: "Seguimiento",
      description: "Estado de tus solicitudes abiertas y resueltas.",
      tab: "seguimiento" as TitularTab,
      accent: "hsl(var(--success))",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="rounded-2xl overflow-hidden relative" style={{ background: "hsl(var(--primary))" }}>
        <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full opacity-10 pointer-events-none"
          style={{ background: "hsl(var(--accent))" }} />
        <div className="absolute -bottom-20 right-20 w-44 h-44 rounded-full opacity-10 pointer-events-none"
          style={{ background: "hsl(var(--primary-foreground))" }} />

        <div className="relative grid grid-cols-1 lg:grid-cols-5 gap-0">
          <div className="lg:col-span-3 p-7 lg:p-8">
            <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-4"
              style={{ background: "hsl(var(--accent))", color: "hsl(var(--accent-foreground))" }}>
              Portal Titular · Ley 21.719
            </span>
            <h1 className="text-2xl lg:text-3xl font-bold mb-2"
              style={{ color: "hsl(var(--primary-foreground))" }}>
              Bienvenido, {name.split(" ")[0]}
            </h1>
            <p className="text-sm mb-6 max-w-md leading-relaxed"
              style={{ color: "hsl(var(--primary-foreground) / 0.72)" }}>
              Desde este portal puedes gestionar tus datos personales y ejercer
              los derechos que te otorga la Ley de Protección de Datos Personales.
            </p>
            <div className="flex flex-wrap gap-3">
              {[
                { label: "RUT",   value: rut,   mono: true },
                { label: "Email", value: email, mono: false },
              ].map((item) => (
                <div key={item.label} className="rounded-xl px-3 py-2 text-xs"
                  style={{ background: "hsl(var(--primary-foreground) / 0.12)" }}>
                  <span style={{ color: "hsl(var(--primary-foreground) / 0.55)" }}>{item.label}: </span>
                  <span className={item.mono ? "font-mono font-semibold" : "font-medium"}
                    style={{ color: "hsl(var(--primary-foreground))" }}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 p-6 lg:p-8 flex flex-col justify-center gap-3 lg:border-l"
            style={{ borderColor: "hsl(var(--primary-foreground) / 0.12)" }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1"
              style={{ color: "hsl(var(--primary-foreground) / 0.45)" }}>
              Resumen de privacidad
            </p>
            <div className="grid grid-cols-2 gap-3">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-xl px-3 py-3 text-center"
                  style={{ background: "hsl(var(--primary-foreground) / 0.1)" }}>
                  <div className="text-2xl font-extrabold" style={{ color: "hsl(var(--accent))" }}>
                    {stat.value}
                  </div>
                  <div className="text-xs mt-0.5 leading-snug"
                    style={{ color: "hsl(var(--primary-foreground) / 0.6)" }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Action cards */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest mb-3"
          style={{ color: "hsl(var(--muted-foreground))" }}>
          ¿Qué deseas hacer?
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {actionCards.map((card) => (
            <button key={card.title} onClick={() => onNavigate(card.tab)}
              className="bg-white rounded-2xl p-5 text-left shadow-sm border-2 transition-all duration-150 focus:outline-none hover:-translate-y-0.5 hover:shadow-md"
              style={{ borderColor: "hsl(var(--border))" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = card.accent }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "hsl(var(--border))" }}
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl mb-4"
                style={{ background: `${card.accent}18` }}>
                {card.icon}
              </div>
              <p className="font-bold text-sm mb-1" style={{ color: "hsl(var(--foreground))" }}>
                {card.title}
              </p>
              <p className="text-xs leading-snug" style={{ color: "hsl(var(--muted-foreground))" }}>
                {card.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {/* Consentimientos activos */}
        <div className="bg-white rounded-2xl border p-5 shadow-sm" style={{ borderColor: "hsl(var(--border))" }}>
          <h3 className="text-xs font-semibold uppercase tracking-widest mb-4"
            style={{ color: "hsl(var(--muted-foreground))" }}>
            Consentimientos activos
          </h3>
          {activeConsents.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sin consentimientos activos.</p>
          ) : (
            <div className="space-y-2">
              {activeConsents.slice(0, 4).map((c) => {
                const def = c.definitionId ? defMap.get(c.definitionId) : undefined
                return (
                  <div key={c.id} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: "hsl(var(--success))" }} />
                    <span className="text-xs truncate" style={{ color: "hsl(var(--foreground))" }}>
                      {def?.title ?? "Consentimiento"}
                    </span>
                  </div>
                )
              })}
              {activeConsents.length > 4 && (
                <p className="text-xs text-muted-foreground">+{activeConsents.length - 4} más</p>
              )}
            </div>
          )}
          <button onClick={() => onNavigate("consentimientos")}
            className="mt-4 text-xs font-semibold" style={{ color: "hsl(var(--primary))" }}>
            Ver todos →
          </button>
        </div>

        {/* Finalidades — próximamente */}
        <div className="bg-white rounded-2xl border p-5 shadow-sm" style={{ borderColor: "hsl(var(--border))" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "hsl(var(--muted-foreground))" }}>
              Finalidades de tratamiento
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>
              Próximamente
            </span>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
            Aquí podrás ver todas las finalidades para las que se tratan tus datos personales,
            incluyendo las bases legales y los responsables de cada tratamiento.
          </p>
        </div>

        {/* Solicitud en trámite */}
        <div className="bg-white rounded-2xl border p-5 shadow-sm" style={{ borderColor: "hsl(var(--border))" }}>
          <h3 className="text-xs font-semibold uppercase tracking-widest mb-4"
            style={{ color: "hsl(var(--muted-foreground))" }}>
            Solicitud en trámite
          </h3>
          {latestTramite ? (
            <div>
              <div className="rounded-xl p-4" style={{ background: "hsl(var(--info) / 0.08)" }}>
                <p className="text-xs font-mono mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                  {latestTramite.id.slice(0, 8).toUpperCase()}
                </p>
                <p className="text-sm font-bold mb-2" style={{ color: "hsl(var(--foreground))" }}>
                  {latestTramite.requestType}
                </p>
                <span className="text-xs font-semibold"
                  style={{ color: ARCO_STATUS_LABEL[latestTramite.status]?.color ?? "hsl(var(--primary))" }}>
                  {ARCO_STATUS_LABEL[latestTramite.status]?.label ?? latestTramite.status}
                </span>
                <p className="text-xs mt-2" style={{ color: "hsl(var(--muted-foreground))" }}>
                  Vence: {new Date(latestTramite.dueDate).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" })}
                </p>
              </div>
              <button onClick={() => onNavigate("seguimiento")}
                className="mt-4 text-xs font-semibold" style={{ color: "hsl(var(--primary))" }}>
                Ver seguimiento →
              </button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No tienes solicitudes en trámite.</p>
          )}
        </div>
      </div>
    </div>
  )
}

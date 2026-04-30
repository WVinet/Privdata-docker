import { toast } from "sonner"
import { type TitularArcoSolicitud } from "@/lib/mock-data"

interface Props {
  solicitudes: TitularArcoSolicitud[]
}

const typeLabels: Record<TitularArcoSolicitud["type"], string> = {
  access:        "Derecho de Acceso",
  rectification: "Derecho de Rectificación",
  suppression:   "Derecho de Supresión",
  opposition:    "Derecho de Oposición",
  portability:   "Derecho de Portabilidad",
  blocking:      "Bloqueo Temporal de Datos",
}

const typeIcons: Record<TitularArcoSolicitud["type"], string> = {
  access:        "🔍",
  rectification: "✏️",
  suppression:   "🗑️",
  opposition:    "🚫",
  portability:   "📦",
  blocking:      "🔒",
}

const statusConfig: Record<
  TitularArcoSolicitud["status"],
  { label: string; bg: string; text: string }
> = {
  en_tramite: {
    label: "En trámite",
    bg: "hsl(var(--info) / 0.1)",
    text: "hsl(var(--info))",
  },
  resuelta: {
    label: "Resuelta",
    bg: "hsl(var(--success) / 0.1)",
    text: "hsl(var(--success))",
  },
  rechazada: {
    label: "Rechazada",
    bg: "hsl(var(--destructive) / 0.1)",
    text: "hsl(var(--destructive))",
  },
}

function stepColor(status: "done" | "active" | "pending"): string {
  if (status === "done") return "hsl(var(--success))"
  if (status === "active") return "hsl(var(--accent))"
  return "hsl(var(--border))"
}

function progressColor(pct: number): string {
  if (pct >= 80) return "hsl(var(--destructive))"
  if (pct >= 50) return "hsl(var(--warning))"
  return "hsl(var(--success))"
}

export default function TitularSeguimiento({ solicitudes }: Props) {
  if (solicitudes.length === 0) {
    return (
      <div
        className="bg-white rounded-2xl shadow-sm border p-12 text-center"
        style={{ borderColor: "hsl(var(--border))" }}
      >
        <div className="text-4xl mb-3">📋</div>
        <p style={{ color: "hsl(var(--muted-foreground))" }}>
          No tienes solicitudes registradas.
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
          Estado y avance de tus solicitudes ARCO enviadas.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {solicitudes.map((sol) => {
        const sc = statusConfig[sol.status]
        const pct = Math.min(Math.round((sol.elapsedDays / sol.deadlineDays) * 100), 100)
        const pc = progressColor(pct)

        return (
          <div
            key={sol.id}
            className={`bg-white rounded-2xl shadow-sm border overflow-hidden${sol.urgent ? " lg:col-span-2" : ""}`}
            style={{
              borderColor: sol.urgent
                ? "hsl(var(--warning) / 0.5)"
                : "hsl(var(--border))",
              borderWidth: sol.urgent ? 2 : 1,
            }}
          >
            {/* Card header */}
            <div
              className="px-5 pt-4 pb-3 flex items-start justify-between gap-3 flex-wrap border-b"
              style={{ borderColor: "hsl(var(--border))" }}
            >
              <div className="flex items-start gap-3">
                {/* Icono */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                  style={{ background: "hsl(var(--muted))" }}
                >
                  {typeIcons[sol.type]}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="font-mono text-xs"
                      style={{ color: "hsl(var(--muted-foreground))" }}
                    >
                      {sol.id}
                    </span>
                    {sol.urgent && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{
                          background: "hsl(var(--warning) / 0.12)",
                          color: "hsl(36 70% 32%)",
                        }}
                      >
                        Urgente · {sol.deadlineDays} días hábiles
                      </span>
                    )}
                  </div>
                  <p
                    className="font-bold text-sm mt-0.5"
                    style={{ color: "hsl(var(--foreground))" }}
                  >
                    {typeLabels[sol.type]}
                  </p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                  >
                    Enviada el {sol.createdAt} · Plazo: {sol.deadline}
                  </p>
                </div>
              </div>
              <span
                className="text-xs font-semibold px-3 py-1 rounded-full shrink-0"
                style={{ background: sc.bg, color: sc.text }}
              >
                {sc.label}
              </span>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* Progress bar — solo en trámite */}
              {sol.status === "en_tramite" && (
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span style={{ color: "hsl(var(--muted-foreground))" }}>
                      Día {sol.elapsedDays} de {sol.deadlineDays} hábiles
                    </span>
                    <span className="font-semibold" style={{ color: pc }}>
                      {pct}% del plazo
                    </span>
                  </div>
                  <div
                    className="w-full h-2 rounded-full"
                    style={{ background: "hsl(var(--muted))" }}
                  >
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{ width: `${pct}%`, background: pc }}
                    />
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div className="flex items-start">
                {sol.steps.map((step, i) => {
                  const isLast = i === sol.steps.length - 1
                  return (
                    <div
                      key={i}
                      className="flex flex-col items-center"
                      style={{ flex: isLast ? "0 0 auto" : 1 }}
                    >
                      <div className="flex items-center w-full">
                        <div
                          className="shrink-0 rounded-full shadow-sm ring-2 ring-white"
                          style={{
                            width: 13,
                            height: 13,
                            background: stepColor(step.status),
                          }}
                        />
                        {!isLast && (
                          <div
                            className="flex-1 h-0.5"
                            style={{
                              background:
                                step.status === "done"
                                  ? "hsl(var(--success))"
                                  : "hsl(var(--border))",
                            }}
                          />
                        )}
                      </div>
                      <span
                        className="text-xs mt-1.5 text-center leading-tight pr-1"
                        style={{
                          color:
                            step.status === "done"
                              ? "hsl(var(--success))"
                              : step.status === "active"
                              ? "hsl(var(--foreground))"
                              : "hsl(var(--muted-foreground))",
                          fontWeight: step.status === "active" ? 600 : 400,
                          maxWidth: 72,
                        }}
                      >
                        {step.label}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Resolution */}
              {sol.resolution && (
                <div
                  className="rounded-xl px-4 py-3 text-xs border-l-4 leading-relaxed"
                  style={{
                    borderColor: "hsl(var(--success))",
                    background: "hsl(var(--success) / 0.07)",
                    color: "hsl(var(--success))",
                  }}
                >
                  <span className="font-semibold">Resolución: </span>
                  {sol.resolution}
                </div>
              )}

              {/* Download */}
              {sol.status === "resuelta" && (
                <div className="flex justify-end">
                  <button
                    onClick={() =>
                      toast("Descargando constancia " + sol.id)
                    }
                    className="text-xs px-4 py-1.5 rounded-lg border font-medium transition-colors hover:bg-muted"
                    style={{
                      borderColor: "hsl(var(--border))",
                      color: "hsl(var(--muted-foreground))",
                    }}
                  >
                    ⬇ Descargar constancia
                  </button>
                </div>
              )}
            </div>
          </div>
        )
      })}
      </div>
    </div>
  )
}

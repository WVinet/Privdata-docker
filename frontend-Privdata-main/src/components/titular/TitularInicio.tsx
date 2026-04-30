import { type TitularPortalData } from "@/lib/mock-data"
import { type TitularTab } from "./TitularPortalLayout"

interface Props {
  data: TitularPortalData
  onNavigate: (tab: TitularTab) => void
}

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

const stats = [
  { value: 4,  label: "Consentimientos activos", color: "hsl(var(--primary))",     bg: "hsl(var(--secondary))" },
  { value: 1,  label: "En trámite",               color: "hsl(var(--warning))",     bg: "hsl(var(--warning) / 0.1)" },
  { value: 2,  label: "Resueltas",                color: "hsl(var(--success))",     bg: "hsl(var(--success) / 0.1)" },
]

export default function TitularInicio({ data, onNavigate }: Props) {
  return (
    <div className="space-y-6">
      {/* ── Hero: 2 columnas en lg+ ── */}
      <div
        className="rounded-2xl overflow-hidden relative"
        style={{ background: "hsl(var(--primary))" }}
      >
        {/* Círculos decorativos */}
        <div
          className="absolute -top-12 -right-12 w-64 h-64 rounded-full opacity-10 pointer-events-none"
          style={{ background: "hsl(var(--accent))" }}
        />
        <div
          className="absolute -bottom-20 right-20 w-44 h-44 rounded-full opacity-10 pointer-events-none"
          style={{ background: "hsl(var(--primary-foreground))" }}
        />

        <div className="relative grid grid-cols-1 lg:grid-cols-5 gap-0">
          {/* Columna izquierda — bienvenida + datos del titular */}
          <div className="lg:col-span-3 p-7 lg:p-8">
            <span
              className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-4"
              style={{ background: "hsl(var(--accent))", color: "hsl(var(--accent-foreground))" }}
            >
              Portal Titular · Ley 21.719
            </span>
            <h1
              className="text-2xl lg:text-3xl font-bold mb-2"
              style={{ color: "hsl(var(--primary-foreground))" }}
            >
              Bienvenido, {data.name.split(" ")[0]}
            </h1>
            <p
              className="text-sm mb-6 max-w-md leading-relaxed"
              style={{ color: "hsl(var(--primary-foreground) / 0.72)" }}
            >
              Desde este portal puedes gestionar tus datos personales y ejercer
              los derechos que te otorga la Ley de Protección de Datos Personales.
            </p>

            {/* Info pills */}
            <div className="flex flex-wrap gap-3">
              {[
                { label: "RUT",           value: data.rut,   mono: true },
                { label: "Email",         value: data.email            },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl px-3 py-2 text-xs"
                  style={{ background: "hsl(var(--primary-foreground) / 0.12)" }}
                >
                  <span style={{ color: "hsl(var(--primary-foreground) / 0.55)" }}>
                    {item.label}:{" "}
                  </span>
                  <span
                    className={item.mono ? "font-mono font-semibold" : "font-medium"}
                    style={{ color: "hsl(var(--primary-foreground))" }}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Columna derecha — stats integrados en el hero */}
          <div
            className="lg:col-span-2 p-6 lg:p-8 flex flex-col justify-center gap-3 lg:border-l"
            style={{ borderColor: "hsl(var(--primary-foreground) / 0.12)" }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-1"
              style={{ color: "hsl(var(--primary-foreground) / 0.45)" }}
            >
              Resumen de privacidad
            </p>
            <div className="grid grid-cols-2 gap-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl px-3 py-3 text-center"
                  style={{ background: "hsl(var(--primary-foreground) / 0.1)" }}
                >
                  <div className="text-2xl font-extrabold" style={{ color: "hsl(var(--accent))" }}>
                    {stat.value}
                  </div>
                  <div
                    className="text-xs mt-0.5 leading-snug"
                    style={{ color: "hsl(var(--primary-foreground) / 0.6)" }}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Action cards: 4 columnas en lg+, 2 en sm ── */}
      <div>
        <h2
          className="text-xs font-semibold uppercase tracking-widest mb-3"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          ¿Qué deseas hacer?
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {actionCards.map((card) => (
            <button
              key={card.title}
              onClick={() => onNavigate(card.tab)}
              className="bg-white rounded-2xl p-5 text-left shadow-sm border-2 transition-all duration-150 focus:outline-none hover:-translate-y-0.5 hover:shadow-md group"
              style={{ borderColor: "hsl(var(--border))" }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLElement).style.borderColor = card.accent
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLElement).style.borderColor = "hsl(var(--border))"
              }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl mb-4"
                style={{ background: `${card.accent}18` }}
              >
                {card.icon}
              </div>
              <p
                className="font-bold text-sm mb-1"
                style={{ color: "hsl(var(--foreground))" }}
              >
                {card.title}
              </p>
              <p
                className="text-xs leading-snug"
                style={{ color: "hsl(var(--muted-foreground))" }}
              >
                {card.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* ── Panel inferior: actividad reciente (solo en lg+) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Consentimientos activos */}
        <div
          className="bg-white rounded-2xl border p-5 shadow-sm"
          style={{ borderColor: "hsl(var(--border))" }}
        >
          <h3
            className="text-xs font-semibold uppercase tracking-widest mb-4"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            Consentimientos activos
          </h3>
          <div className="space-y-2">
            {[
              "Atención farmacéutica",
              "Recordatorio de medicamentos",
              "Ofertas personalizadas",
              "Análisis de navegación",
            ].map((name) => (
              <div key={name} className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: "hsl(var(--success))" }}
                />
                <span className="text-xs" style={{ color: "hsl(var(--foreground))" }}>
                  {name}
                </span>
              </div>
            ))}
          </div>
          <button
            onClick={() => onNavigate("consentimientos")}
            className="mt-4 text-xs font-semibold"
            style={{ color: "hsl(var(--primary))" }}
          >
            Ver todos →
          </button>
        </div>

        {/* Finalidades de tratamiento — próximamente */}
        <div
          className="bg-white rounded-2xl border p-5 shadow-sm"
          style={{ borderColor: "hsl(var(--border))" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              Finalidades de tratamiento
            </h3>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{
                background: "hsl(var(--muted))",
                color: "hsl(var(--muted-foreground))",
              }}
            >
              Próximamente
            </span>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
            Aquí podrás ver todas las finalidades para las que se tratan tus datos personales,
            incluyendo las bases legales y los responsables de cada tratamiento.
          </p>
        </div>

        {/* Solicitud en curso */}
        <div
          className="bg-white rounded-2xl border p-5 shadow-sm"
          style={{ borderColor: "hsl(var(--border))" }}
        >
          <h3
            className="text-xs font-semibold uppercase tracking-widest mb-4"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            Solicitud en trámite
          </h3>
          <div
            className="rounded-xl p-4"
            style={{ background: "hsl(var(--info) / 0.08)" }}
          >
            <p
              className="text-xs font-mono mb-1"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              SOL-2026-00412
            </p>
            <p className="text-sm font-bold mb-2" style={{ color: "hsl(var(--foreground))" }}>
              Derecho de Acceso
            </p>
            <div className="w-full h-1.5 rounded-full" style={{ background: "hsl(var(--muted))" }}>
              <div
                className="h-1.5 rounded-full"
                style={{ width: "13%", background: "hsl(var(--success))" }}
              />
            </div>
            <p className="text-xs mt-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>
              Día 2 de 15 · Plazo: 22 abr 2026
            </p>
          </div>
          <button
            onClick={() => onNavigate("seguimiento")}
            className="mt-4 text-xs font-semibold"
            style={{ color: "hsl(var(--primary))" }}
          >
            Ver seguimiento →
          </button>
        </div>
      </div>
    </div>
  )
}

import { useQuery } from "@tanstack/react-query"
import { usersApi, arcoApi, complianceApi, personsApi, auditApi } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Users, FileCheck, ClipboardList, AlertCircle, Clock, CheckCircle, PlusCircle, LogIn, RotateCcw, ShieldOff, Send } from "lucide-react"
import type { ArcoRequest } from "@/types/arco"
import type { Person } from "@/types/person"
import type { AuditLog } from "@/types/audit"

// ── helpers ───────────────────────────────────────────────────────────────────

const ARCO_STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  RECIBIDA:   { label: "Recibida",   color: "hsl(var(--primary))",         bg: "hsl(var(--primary) / 0.1)" },
  EN_PROCESO: { label: "En proceso", color: "hsl(36 70% 40%)",             bg: "hsl(36 70% 40% / 0.1)" },
  RESPONDIDA: { label: "Resuelto",   color: "hsl(142 71% 35%)",            bg: "hsl(142 71% 35% / 0.1)" },
  RECHAZADA:  { label: "Rechazado",  color: "hsl(var(--destructive))",     bg: "hsl(var(--destructive) / 0.08)" },
  CERRADA:    { label: "Cerrada",    color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))" },
}

const ACTION_ICON: Record<string, React.ElementType> = {
  LOGIN:    LogIn,
  CREATE:   PlusCircle,
  UPDATE:   RotateCcw,
  REVOCAR:  ShieldOff,
  RESOLVER: CheckCircle,
  INVITAR:  Users,
  PUBLICAR: Send,
}
const ACTION_COLOR: Record<string, string> = {
  LOGIN:    "text-primary",
  CREATE:   "text-green-600",
  UPDATE:   "text-blue-500",
  REVOCAR:  "text-destructive",
  RESOLVER: "text-green-600",
  INVITAR:  "text-purple-500",
  PUBLICAR: "text-amber-500",
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("es-CL", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

// ── component ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { getUser } = useAuth()
  const orgId = getUser()?.organizationId ?? ""

  const { data: usersRes } = useQuery({
    queryKey: ["users"],
    queryFn: () => usersApi.list().then((r) => r.data),
  })

  const { data: arcoRes, isLoading: arcoLoading } = useQuery({
    queryKey: ["arco-all", orgId],
    queryFn: () => arcoApi.list(orgId).then((r) => r.data),
    enabled: !!orgId,
  })

  const { data: consentsRes } = useQuery({
    queryKey: ["admin-consents", "ACTIVE", 0],
    queryFn: () => complianceApi.listConsents({ status: "ACTIVE", page: 0, size: 1 }).then((r) => r.data),
  })

  const { data: personsRes } = useQuery({
    queryKey: ["persons", orgId],
    queryFn: () => personsApi.list(orgId).then((r) => r.data),
    enabled: !!orgId,
  })

  const { data: auditRes, isLoading: auditLoading } = useQuery({
    queryKey: ["audit-logs", orgId, 0],
    queryFn: () => auditApi.list(orgId, 0, 5).then((r) => r.data),
    enabled: !!orgId,
    refetchInterval: 30_000,
  })

  // ── derived values ──────────────────────────────────────────────────────────

  const allUsers   = usersRes?.data ?? []
  const titulares  = allUsers.filter((u) => u.roles?.includes("END_USER"))

  const arcoList: ArcoRequest[] = arcoRes?.data ?? []
  const pendientes = arcoList.filter((r) => r.status === "RECIBIDA")
  const recentArco = [...arcoList]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  const activeConsents = consentsRes?.totalElements ?? 0

  const personMap = new Map<string, Person>((personsRes?.data ?? []).map((p) => [p.id, p]))

  const auditLogs: AuditLog[] = auditRes?.data?.content ?? []

  // ── kpis ────────────────────────────────────────────────────────────────────

  const kpis = [
    {
      title: "Total Titulares",
      value: titulares.length,
      icon: Users,
      description: "Titulares registrados",
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "Consentimientos Activos",
      value: activeConsents,
      icon: FileCheck,
      description: "Consentimientos vigentes",
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      title: "Solicitudes ARCO",
      value: arcoList.length,
      icon: ClipboardList,
      description: "Total de solicitudes",
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      title: "Pendientes",
      value: pendientes.length,
      icon: AlertCircle,
      description: "Solicitudes por atender",
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Resumen del sistema de protección de datos personales
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.title}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{kpi.title}</p>
                    <p className="text-3xl font-bold mt-1">{kpi.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{kpi.description}</p>
                  </div>
                  <div className={`p-2 rounded-lg ${kpi.bg}`}>
                    <Icon className={`w-5 h-5 ${kpi.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Solicitudes ARCO recientes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Solicitudes ARCO Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            {arcoLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : recentArco.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay solicitudes registradas.
              </p>
            ) : (
              <div className="space-y-0">
                {recentArco.map((req) => {
                  const person = personMap.get(req.dataSubjectId)
                  const cfg    = ARCO_STATUS_LABEL[req.status] ?? ARCO_STATUS_LABEL.RECIBIDA
                  return (
                    <div key={req.id} className="flex items-center justify-between py-2.5 border-b last:border-0">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {person?.fullName ?? req.dataSubjectId.slice(0, 8)}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {req.requestType} · {fmtDate(req.submittedAt)}
                        </p>
                      </div>
                      <span
                        className="shrink-0 ml-3 text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ color: cfg.color, background: cfg.bg }}
                      >
                        {cfg.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actividad reciente — audit log */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            {auditLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : auditLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay eventos registrados aún.
              </p>
            ) : (
              <div className="space-y-0">
                {auditLogs.map((event) => {
                  const Icon = ACTION_ICON[event.action] ?? Clock
                  return (
                    <div key={event.id} className="flex items-start gap-3 py-2.5 border-b last:border-0">
                      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${ACTION_COLOR[event.action] ?? "text-muted-foreground"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{event.detail}</p>
                        <p className="text-xs text-muted-foreground">
                          {event.performedByEmail ?? "Sistema"} · {fmtDate(event.createdAt)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

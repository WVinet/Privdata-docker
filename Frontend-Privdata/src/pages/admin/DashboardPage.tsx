import { mockArcoRequests, mockAuditEvents, mockConsents, mockTitulares } from "@/lib/mock-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/StatusBadge"
import { Users, FileCheck, ClipboardList, AlertCircle, Clock, CheckCircle, PlusCircle, LogIn, RotateCcw } from "lucide-react"

const kpis = [
  {
    title: "Total Titulares",
    value: mockTitulares.length,
    icon: Users,
    description: "Titulares registrados",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    title: "Consentimientos Activos",
    value: mockConsents.filter((c) => c.status === "active").length,
    icon: FileCheck,
    description: "Consentimientos vigentes",
    color: "text-success",
    bg: "bg-success/10",
  },
  {
    title: "Solicitudes ARCO",
    value: mockArcoRequests.length,
    icon: ClipboardList,
    description: "Total de solicitudes",
    color: "text-accent",
    bg: "bg-accent/10",
  },
  {
    title: "Pendientes",
    value: mockArcoRequests.filter((r) => r.status === "pending").length,
    icon: AlertCircle,
    description: "Solicitudes por atender",
    color: "text-warning",
    bg: "bg-warning/10",
  },
]

const actionIcon: Record<string, React.ElementType> = {
  CREATE: PlusCircle,
  UPDATE: RotateCcw,
  REVOKE: AlertCircle,
  LOGIN: LogIn,
  RESOLVE: CheckCircle,
}

const actionColor: Record<string, string> = {
  CREATE: "text-success",
  UPDATE: "text-info",
  REVOKE: "text-destructive",
  LOGIN: "text-primary",
  RESOLVE: "text-success",
}

export default function DashboardPage() {
  const recentArco = mockArcoRequests.slice(0, 4)
  const recentAudit = mockAuditEvents.slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Resumen del sistema de protección de datos personales
        </p>
      </div>

      {/* KPI Cards */}
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

      {/* Bottom panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Solicitudes ARCO Recientes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Solicitudes ARCO Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentArco.map((req) => (
                <div key={req.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{req.titularName}</p>
                    <p className="text-xs text-muted-foreground font-mono">{req.id}</p>
                  </div>
                  <StatusBadge status={req.status} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actividad Reciente */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAudit.map((event) => {
                const Icon = actionIcon[event.action] ?? Clock
                return (
                  <div key={event.id} className="flex items-start gap-3 py-2 border-b last:border-0">
                    <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${actionColor[event.action] ?? "text-muted-foreground"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{event.details}</p>
                      <p className="text-xs text-muted-foreground">{event.userName} · {event.timestamp.replace("T", " ").slice(0, 16)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

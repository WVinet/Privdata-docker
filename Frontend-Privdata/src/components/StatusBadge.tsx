import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type Status =
  // Admin — estados generales
  | "active"
  | "inactive"
  | "revoked"
  | "pending"
  | "in_progress"
  | "resolved"
  | "rejected"
  // Admin — roles de usuario interno
  | "admin"
  | "analyst"
  | "viewer"
  // Portal titular — estados de solicitud ARCO
  | "en_tramite"
  | "resuelta"
  | "rechazada"

interface StatusBadgeProps {
  status: Status
  className?: string
}

const statusConfig: Record<
  Status,
  { label: string; className: string }
> = {
  // Estados generales
  active:      { label: "Activo",        className: "border-success/30 bg-success/15 text-success" },
  inactive:    { label: "Inactivo",      className: "border-muted/30 bg-muted/50 text-muted-foreground" },
  revoked:     { label: "Revocado",      className: "border-destructive/30 bg-destructive/15 text-destructive" },
  pending:     { label: "Pendiente",     className: "border-warning/30 bg-warning/15 text-warning" },
  in_progress: { label: "En proceso",    className: "border-info/30 bg-info/15 text-info" },
  resolved:    { label: "Resuelto",      className: "border-success/30 bg-success/15 text-success" },
  rejected:    { label: "Rechazado",     className: "border-destructive/30 bg-destructive/15 text-destructive" },
  // Roles de usuario interno
  admin:       { label: "Administrador", className: "border-primary/30 bg-primary/15 text-primary" },
  analyst:     { label: "Analista",      className: "border-accent/30 bg-accent/15 text-accent" },
  viewer:      { label: "Visor",         className: "border-muted/30 bg-muted/50 text-muted-foreground" },
  // Estados portal titular (solicitudes ARCO)
  en_tramite:  { label: "En trámite",    className: "border-info/30 bg-info/15 text-info" },
  resuelta:    { label: "Resuelta",      className: "border-success/30 bg-success/15 text-success" },
  rechazada:   { label: "Rechazada",     className: "border-destructive/30 bg-destructive/15 text-destructive" },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]
  return (
    <Badge
      variant="outline"
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  )
}

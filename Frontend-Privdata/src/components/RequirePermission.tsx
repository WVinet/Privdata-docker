import type { ReactNode } from "react"
import { useAuth } from "@/hooks/use-auth"

interface RequirePermissionProps {
  permission: string
  fallback?: ReactNode
  children: ReactNode
}

// Oculta children si el usuario no tiene el permiso
// <RequirePermission permission="USER_CREATE">
//   <Button>Crear usuario</Button>
// </RequirePermission>
export function RequirePermission({ permission, fallback = null, children }: RequirePermissionProps) {
  const { hasPermission } = useAuth()
  return hasPermission(permission) ? <>{children}</> : <>{fallback}</>
}

interface RequireRoleProps {
  role: string
  fallback?: ReactNode
  children: ReactNode
}

// Oculta children si el usuario no tiene el rol (sin prefijo ROLE_)
// <RequireRole role="ADMIN">...</RequireRole>
export function RequireRole({ role, fallback = null, children }: RequireRoleProps) {
  const { hasRole } = useAuth()
  return hasRole(role) ? <>{children}</> : <>{fallback}</>
}
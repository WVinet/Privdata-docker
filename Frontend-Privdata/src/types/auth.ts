// ── Respuesta envolvente de todas las APIs ─────────────────────────────────
export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T | null
}

// ── Login ──────────────────────────────────────────────────────────────────
export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
}

// ── Usuario autenticado (GET /auth/me) ─────────────────────────────────────
export interface MeResponse {
  id: string
  email: string
  organizationId: string
  personId: string
  status: "ACTIVE" | "INACTIVE" | "LOCKED"
  authorities: string[] // mezcla ROLE_ADMIN y ARCO_VIEW
}

// ── Roles ──────────────────────────────────────────────────────────────────
export interface Role {
  id: string
  name: string
  description: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateRoleRequest {
  name: string
  description: string
}

// ── Permisos ───────────────────────────────────────────────────────────────
export interface Permission {
  id: string
  module: string
  action: string
  description: string
  isActive: boolean
  createdAt: string
}

// ── Usuarios ───────────────────────────────────────────────────────────────
export interface AuthUser {
  id: string
  email: string
  organizationId: string
  personId: string
  status: "ACTIVE" | "INACTIVE" | "LOCKED"
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface RegisterRequest {
  email: string
  password: string
  organizationId: string
  personId: string
}

export interface AssignRoleRequest {
  roleName: string
}

// ── Helpers ────────────────────────────────────────────────────────────────
export function hasAuthority(authorities: string[], permission: string): boolean {
  const norm = permission.toUpperCase()
  return authorities.some((a) => a === norm || a === `ROLE_${norm}`)
}

export const KNOWN_PERMISSIONS = [
  "USER_VIEW", "USER_CREATE", "USER_UPDATE", "USER_DELETE",
  "ROLE_VIEW", "ROLE_ASSIGN",
  "PERMISSION_VIEW",
  "ARCO_VIEW", "ARCO_CREATE", "ARCO_RESOLVE",
  "RAT_VIEW", "RAT_CREATE", "RAT_UPDATE", "RAT_EXPORT",
  "AUDIT_VIEW",
] as const
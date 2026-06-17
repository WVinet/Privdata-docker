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
  status: "ACTIVE" | "INACTIVE" | "LOCKED" | "PENDING"
  authorities: string[]
}

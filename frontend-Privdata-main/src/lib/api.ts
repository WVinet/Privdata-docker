import axios from "axios"
import type {
  ApiResponse, LoginRequest, LoginResponse, MeResponse,
  Role, Permission, AuthUser, RegisterRequest,
  AssignRoleRequest, CreateRoleRequest,
} from "@/types/auth"

const BASE_URL = import.meta.env.VITE_API_URL ?? "/api"

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
})

// Adjunta el JWT en cada request
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("privdata_token")
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Si el backend devuelve 401, limpia sesión y manda al login
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem("privdata_token")
      sessionStorage.removeItem("privdata_user")
      window.location.href = "/login"
    }
    return Promise.reject(error)
  }
)

// ── Endpoints existentes en AuthService ───────────────────────────────────
export const authApi = {
  login: (body: LoginRequest) =>
    api.post<ApiResponse<LoginResponse>>("/auth/login", body),

  me: () =>
    api.get<ApiResponse<MeResponse>>("/auth/me"),

  register: (body: RegisterRequest) =>
    api.post<ApiResponse<{ id: string; email: string; status: string }>>("/auth/register", body),

  assignRole: (userId: string, body: AssignRoleRequest) =>
    api.post<ApiResponse<null>>(`/auth/users/${userId}/roles`, body),
}

// ── Endpoints debe agregar al AuthService ─────────────────────
// GET  /auth/roles
// POST /auth/roles
// GET  /auth/permissions
// GET  /auth/users
// POST /auth/roles/{id}/permissions
// DELETE /auth/roles/{id}/permissions/{permId}

export const rolesApi = {
  list: () =>
    api.get<ApiResponse<Role[]>>("/auth/roles"),
  create: (body: CreateRoleRequest) =>
    api.post<ApiResponse<Role>>("/auth/roles", body),
  assignPermission: (roleId: string, permissionId: string) =>
    api.post<ApiResponse<null>>(`/auth/roles/${roleId}/permissions`, { permissionId }),
  removePermission: (roleId: string, permissionId: string) =>
    api.delete<ApiResponse<null>>(`/auth/roles/${roleId}/permissions/${permissionId}`),
}

export const permissionsApi = {
  list: () =>
    api.get<ApiResponse<Permission[]>>("/auth/permissions"),
}

export const usersApi = {
  list: () =>
    api.get<ApiResponse<AuthUser[]>>("/auth/users"),
}

export default api
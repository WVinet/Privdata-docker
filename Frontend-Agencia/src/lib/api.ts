import axios from "axios"
import type { ApiResponse, LoginRequest, LoginResponse, MeResponse } from "@/types/auth"
import type {
  AgencyClaim, AgencyClaimPage, AgencyClaimStatus,
  RespondAgencyClaimRequest, ArcoRequestOverview,
} from "@/types/agencyClaim"

const BASE_URL = import.meta.env.VITE_API_URL ?? "/api"

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
})

// Adjunta el JWT en cada request
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("agencia_token")
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Si el backend devuelve 401/403, limpia sesión y manda al login
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      sessionStorage.removeItem("agencia_token")
      sessionStorage.removeItem("agencia_user")
      window.location.href = "/login"
    }
    return Promise.reject(error)
  }
)

// ── Auth (vía Auth-service de PrivData) ────────────────────────────────────
export const authApi = {
  login: (body: LoginRequest) =>
    api.post<ApiResponse<LoginResponse>>("/auth/login", body),

  me: () =>
    api.get<ApiResponse<MeResponse>>("/auth/me"),
}

// ── Agencia — reclamos ──────────────────────────────────────────────────────
export const agencyApi = {
  list: (status?: AgencyClaimStatus, page = 0, size = 20) =>
    api.get<ApiResponse<AgencyClaimPage>>("/agency-claims", { params: { status, page, size } }),

  getById: (id: string) =>
    api.get<ApiResponse<AgencyClaim>>(`/agency-claims/${id}`),

  respond: (id: string, body: RespondAgencyClaimRequest) =>
    api.patch<ApiResponse<AgencyClaim>>(`/agency-claims/${id}/respond`, body),

  // Panel de transparencia: pasa por el doble envoltorio Agencia-service → Arco-service
  arcoOverview: async (organizationId?: string): Promise<ArcoRequestOverview[]> => {
    const res = await api.get<ApiResponse<ApiResponse<ArcoRequestOverview[]>>>(
      "/agency-claims/arco-overview",
      { params: organizationId ? { organizationId } : undefined }
    )
    return res.data?.data?.data ?? []
  },
}

export default api

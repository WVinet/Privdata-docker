import axios from "axios"
import type {
  ApiResponse, LoginRequest, LoginResponse, MeResponse,
  Role, Permission, AuthUser, RegisterRequest,
  AssignRoleRequest, CreateRoleRequest,
} from "@/types/auth"
import type {
  Organization, OrganizationCreateRequest, OrganizationUpdateRequest,
  Department, DepartmentCreateRequest,
} from "@/types/organization"
import type {
  Person, InvitePersonRequest, UpdatePersonRequest, InvitePersonResponse,
} from "@/types/person"
import type {
  ArcoRequest, ArcoStatus, ArcoRequestType, ArcoRequestChannel,
  CreateArcoRequest, UpdateArcoStatus,
} from "@/types/arco"
import type { Consent, TreatmentActivity, DataCategory, ConsentPage, ConsentStatus } from "@/types/compliance"

export type { ArcoRequest, ArcoStatus, ArcoRequestType, ArcoRequestChannel, CreateArcoRequest, UpdateArcoStatus }
export type { Organization, OrganizationCreateRequest, OrganizationUpdateRequest, Department, DepartmentCreateRequest }
export type { Person, InvitePersonRequest, UpdatePersonRequest, InvitePersonResponse }

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

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (body: LoginRequest) =>
    api.post<ApiResponse<LoginResponse>>("/auth/login", body),

  me: () =>
    api.get<ApiResponse<MeResponse>>("/auth/me"),

  register: (body: RegisterRequest) =>
    api.post<ApiResponse<{ id: string; email: string; status: string }>>("/auth/register", body),

  assignRole: (userId: string, body: AssignRoleRequest) =>
    api.post<ApiResponse<null>>(`/auth/users/${userId}/roles`, body),

  activateAccount: (newPassword: string) =>
    api.post<ApiResponse<{ token: string }>>("/auth/me/activate", { newPassword }),
}

// ── Roles & Permissions ───────────────────────────────────────────────────────
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

// ── Organizations ─────────────────────────────────────────────────────────────
export const organizationsApi = {
  list: () =>
    api.get<ApiResponse<Organization[]>>("/organizations"),

  getById: (id: string) =>
    api.get<ApiResponse<Organization>>(`/organizations/${id}`),

  create: (body: OrganizationCreateRequest) =>
    api.post<ApiResponse<Organization>>("/organizations", body),

  update: (id: string, body: OrganizationUpdateRequest) =>
    api.put<ApiResponse<Organization>>(`/organizations/${id}`, body),

  updateStatus: (id: string, isActive: boolean) =>
    api.patch<ApiResponse<Organization>>(`/organizations/${id}/status`, { isActive }),
}

// ── Departments ───────────────────────────────────────────────────────────────
export const departmentsApi = {
  list: (organizationId: string) =>
    api.get<ApiResponse<Department[]>>(`/organizations/${organizationId}/departments`),

  create: (organizationId: string, body: DepartmentCreateRequest) =>
    api.post<ApiResponse<Department>>(`/organizations/${organizationId}/departments`, body),

  updateStatus: (organizationId: string, departmentId: string, isActive: boolean) =>
    api.patch<ApiResponse<Department>>(
      `/organizations/${organizationId}/departments/${departmentId}/status`,
      { isActive }
    ),
}

// ── Persons ───────────────────────────────────────────────────────────────────
export const personsApi = {
  getById: (organizationId: string, personId: string) =>
    api.get<ApiResponse<Person>>(`/organizations/${organizationId}/persons/${personId}`),

  list: (organizationId: string, departmentId?: string) =>
    api.get<ApiResponse<Person[]>>(
      `/organizations/${organizationId}/persons`,
      { params: departmentId ? { departmentId } : undefined }
    ),

  invite: (organizationId: string, body: InvitePersonRequest) =>
    api.post<ApiResponse<InvitePersonResponse>>(`/organizations/${organizationId}/persons/invite`, body),

  update: (organizationId: string, personId: string, body: UpdatePersonRequest) =>
    api.put<ApiResponse<Person>>(`/organizations/${organizationId}/persons/${personId}`, body),

  updateStatus: (organizationId: string, personId: string, isActive: boolean) =>
    api.patch<ApiResponse<Person>>(
      `/organizations/${organizationId}/persons/${personId}/status`,
      { isActive }
    ),
}

// ── ARCO ──────────────────────────────────────────────────────────────────────
export const arcoApi = {
  list: (organizationId?: string) =>
    api.get<ApiResponse<ArcoRequest[]>>(
      "/arco",
      { params: organizationId ? { organizationId } : undefined }
    ),

  getById: (id: string) =>
    api.get<ApiResponse<ArcoRequest>>(`/arco/${id}`),

  findByDataSubject: (dataSubjectId: string) =>
    api.get<ApiResponse<ArcoRequest[]>>(`/arco/by-subject/${dataSubjectId}`),

  create: (body: CreateArcoRequest) =>
    api.post<ApiResponse<ArcoRequest>>("/arco", body),

  updateStatus: (id: string, body: UpdateArcoStatus) =>
    api.patch<ApiResponse<ArcoRequest>>(`/arco/${id}/status`, body),
}

// ── Compliance ────────────────────────────────────────────────────────────────
export const complianceApi = {
  getConsentsBySubject: (dataSubjectId: string) =>
    api.get<ApiResponse<Consent[]>>(`/compliance/consents/data-subject/${dataSubjectId}`),

  getRat: (organizationId: string) =>
    api.get<ApiResponse<TreatmentActivity[]>>(`/compliance/rat`, { params: { organizationId } }),

  revokeConsent: (consentId: string) =>
    api.post<ApiResponse<Consent>>(`/compliance/consents/${consentId}/revoke`),

  getDataCategories: () =>
    api.get<ApiResponse<DataCategory[]>>(`/compliance/data-categories`),

  listConsents: (params?: { status?: ConsentStatus; page?: number; size?: number }) =>
    api.get<ConsentPage>(`/compliance/consents`, { params }),
}

export default api

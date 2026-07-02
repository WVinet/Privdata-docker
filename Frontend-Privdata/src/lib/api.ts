import axios from "axios"
import type {
  ApiResponse, LoginRequest, LoginResponse, MeResponse,
  Role, Permission, AuthUser, RegisterRequest,
  AssignRoleRequest, CreateRoleRequest,
} from "@/types/auth"
import type {
  Organization, OrganizationCreateRequest, OrganizationUpdateRequest,
  Department, DepartmentCreateRequest,
  JobPosition, JobPositionCreateRequest,
} from "@/types/organization"
import type {
  Person, InvitePersonRequest, UpdatePersonRequest, InvitePersonResponse,
} from "@/types/person"
import type {
  ArcoRequest, ArcoStatus, ArcoRequestType, ArcoRequestChannel,
  CreateArcoRequest, UpdateArcoStatus, CreateSuppressionDetails, RespondSuppression,
  CreateOppositionDetails, RespondOpposition,
  CreatePortabilityDetails, RespondPortability,
} from "@/types/arco"
import type {
  Consent, TreatmentActivity, DataCategory, ConsentPage, ConsentStatus,
  ConsentDefinition, ConsentCreateRequest,
  TreatmentActivityCreateRequest, TreatmentActivityUpdateRequest, TreatmentActivityStatus,
  Tercero, TerceroCreateRequest, TerceroUpdateRequest,
} from "@/types/compliance"
import type { AuditPage } from "@/types/audit"

export type { ArcoRequest, ArcoStatus, ArcoRequestType, ArcoRequestChannel, CreateArcoRequest, UpdateArcoStatus }
export type { Organization, OrganizationCreateRequest, OrganizationUpdateRequest, Department, DepartmentCreateRequest, JobPosition, JobPositionCreateRequest }
export type { Person, InvitePersonRequest, UpdatePersonRequest, InvitePersonResponse }

const BASE_URL = import.meta.env.VITE_API_URL ?? "/api"

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30_000,
})

// Adjunta el JWT en cada request.
// Para FormData, elimina el Content-Type del default (application/json) para que
// axios/browser lo genere automáticamente con el multipart boundary correcto.
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("privdata_token")
  if (token) config.headers.Authorization = `Bearer ${token}`
  if (config.data instanceof FormData) {
    // AxiosHeaders v1.x: usar el método delete() para quitar realmente el header
    config.headers.delete("Content-Type")
  }
  return config
})

// Si el backend devuelve 401, limpia sesión y manda al login
// (excepto en /auth/login: ahí un 401 es simplemente "credenciales incorrectas",
// no una sesión expirada, y el formulario ya maneja ese error sin necesidad de redirigir)
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const isLoginRequest = error.config?.url?.includes("/auth/login")
    if (error.response?.status === 401 && !isLoginRequest) {
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

  forgotPassword: (email: string) =>
    api.post<ApiResponse<null>>("/auth/password/forgot", { email }),

  resetPassword: (email: string, code: string, newPassword: string) =>
    api.post<ApiResponse<null>>("/auth/password/reset", { email, code, newPassword }),
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

  resendInvite: (userId: string) =>
    api.post<ApiResponse<null>>(`/auth/users/${userId}/resend-invite`),
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

// ── Job Positions (Cargos) ──────────────────────────────────────────────────────
export const jobPositionsApi = {
  list: (organizationId: string) =>
    api.get<ApiResponse<JobPosition[]>>(`/organizations/${organizationId}/job-positions`),

  create: (organizationId: string, body: JobPositionCreateRequest) =>
    api.post<ApiResponse<JobPosition>>(`/organizations/${organizationId}/job-positions`, body),

  updateStatus: (organizationId: string, jobPositionId: string, isActive: boolean) =>
    api.patch<ApiResponse<JobPosition>>(
      `/organizations/${organizationId}/job-positions/${jobPositionId}/status`,
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

  anonymize: (organizationId: string, personId: string) =>
    api.post<ApiResponse<Person>>(`/organizations/${organizationId}/persons/${personId}/anonymize`),
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

  startReview: (id: string) =>
    api.patch<ApiResponse<ArcoRequest>>(`/arco/${id}/start-review`),

  extendDeadline: (id: string) =>
    api.patch<ApiResponse<ArcoRequest>>(`/arco/${id}/prorroga`),

  registrarDisconformidad: (id: string, motivo?: string) =>
    api.post<ApiResponse<ArcoRequest>>(`/arco/${id}/disconformidad`, { motivo }),

  reclamoAgencia: (id: string) =>
    api.post<ApiResponse<ArcoRequest>>(`/arco/${id}/reclamo-agencia`),

  updateVerificacionIdentidad: (id: string, nuevoEstado: string) =>
    api.patch<ApiResponse<ArcoRequest>>(
      `/arco/${id}/verificacion-identidad`,
      null,
      { params: { nuevoEstado } }
    ),

  verifyAccessIdentity: (id: string, verified: boolean, comment?: string) =>
    api.patch<ApiResponse<ArcoRequest>>(`/arco/access/${id}/verify-identity`, { verified, comment }),

  respondAccess: (id: string, observations: string) =>
    api.patch<ApiResponse<ArcoRequest>>(`/arco/access/${id}/respond`, { observations }),

  createRectification: (
    arcoRequest: CreateArcoRequest,
    rectificationData: Partial<Record<"firstName" | "secondName" | "lastName" | "maternalLastName" | "rut" | "email" | "phone" | "position", string>>
  ) =>
    api.post<ApiResponse<ArcoRequest>>("/arco/rectification", { arcoRequest, rectificationData }),

  verifyRectificationIdentity: (id: string, verified: boolean, comment?: string) =>
    api.patch<ApiResponse<ArcoRequest>>(`/arco/rectification/${id}/verify-identity`, { verified, comment }),

  respondRectification: (id: string, observations: string) =>
    api.patch<ApiResponse<ArcoRequest>>(`/arco/rectification/${id}/respond`, { observations }),

  createSuppression: (arcoRequest: CreateArcoRequest, details: CreateSuppressionDetails) =>
    api.post<ApiResponse<ArcoRequest>>("/arco/suppression", { arcoRequest, ...details }),

  verifySuppressionIdentity: (id: string, verified: boolean, comment?: string) =>
    api.patch<ApiResponse<ArcoRequest>>(`/arco/suppression/${id}/verify-identity`, { verified, comment }),

  respondSuppression: (id: string, body: RespondSuppression) =>
    api.patch<ApiResponse<ArcoRequest>>(`/arco/suppression/${id}/respond`, body),

  createOpposition: (arcoRequest: CreateArcoRequest, details: CreateOppositionDetails) =>
    api.post<ApiResponse<ArcoRequest>>("/arco/opposition", { arcoRequest, ...details }),

  verifyOppositionIdentity: (id: string, verified: boolean, comment?: string) =>
    api.patch<ApiResponse<ArcoRequest>>(`/arco/opposition/${id}/verify-identity`, { verified, comment }),

  respondOpposition: (id: string, body: RespondOpposition) =>
    api.patch<ApiResponse<ArcoRequest>>(`/arco/opposition/${id}/respond`, body),

  createPortability: (arcoRequest: CreateArcoRequest, details: CreatePortabilityDetails) =>
    api.post<ApiResponse<ArcoRequest>>("/arco/portability", { arcoRequest, ...details }),

  verifyPortabilityIdentity: (id: string, verified: boolean, comment?: string) =>
    api.patch<ApiResponse<ArcoRequest>>(`/arco/portability/${id}/verify-identity`, { verified, comment }),

  respondPortability: (id: string, body: RespondPortability) =>
    api.patch<ApiResponse<ArcoRequest>>(`/arco/portability/${id}/respond`, body),

  downloadPortability: (id: string) =>
    api.get<Blob>(`/arco/portability/${id}/download`, { responseType: "blob" }),

  uploadRectificationDocument: (id: string, file: File) => {
    const form = new FormData()
    form.append("file", file)
    return api.post<ApiResponse<ArcoRequest>>(`/arco/rectification/${id}/document`, form)
  },

  downloadRectificationDocument: (id: string) =>
    api.get<Blob>(`/arco/rectification/${id}/document`, { responseType: "blob" }),

  uploadOppositionDocument: (id: string, file: File) => {
    const form = new FormData()
    form.append("file", file)
    return api.post<ApiResponse<ArcoRequest>>(`/arco/opposition/${id}/document`, form)
  },

  downloadOppositionDocument: (id: string) =>
    api.get<Blob>(`/arco/opposition/${id}/document`, { responseType: "blob" }),

  uploadAccessResponseDocument: (id: string, file: File) => {
    const form = new FormData()
    form.append("file", file)
    return api.post<ApiResponse<ArcoRequest>>(`/arco/access/${id}/response-document`, form)
  },

  downloadAccessResponseDocument: (id: string) =>
    api.get<Blob>(`/arco/access/${id}/response-document`, { responseType: "blob" }),

  applyBlock: (id: string) =>
    api.patch<ApiResponse<ArcoRequest>>(`/arco/${id}/block`),

  liftBlock: (id: string) =>
    api.patch<ApiResponse<ArcoRequest>>(`/arco/${id}/unblock`),
}

// ── Compliance ────────────────────────────────────────────────────────────────
export const complianceApi = {
  getConsentsBySubject: (dataSubjectId: string) =>
    api.get<Consent[]>(`/compliance/consents/data-subject/${dataSubjectId}`),

  getRat: (organizationId: string, status?: TreatmentActivityStatus) =>
    api.get<TreatmentActivity[]>(`/compliance/rat`, { params: { organizationId, status } }),

  createRat: (body: TreatmentActivityCreateRequest) =>
    api.post<ApiResponse<TreatmentActivity>>(`/compliance/rat`, body),

  updateRat: (id: string, body: TreatmentActivityUpdateRequest) =>
    api.put<ApiResponse<TreatmentActivity>>(`/compliance/rat/${id}`, body),

  revokeConsent: (consentId: string) =>
    api.post<ApiResponse<Consent>>(`/compliance/consents/${consentId}/revoke`),

  getDataCategories: () =>
    api.get<DataCategory[]>(`/compliance/data-categories`),

  listConsents: (params?: { status?: ConsentStatus; page?: number; size?: number }) =>
    api.get<ConsentPage>(`/compliance/consents`, { params }),

  createConsent: (body: ConsentCreateRequest) =>
    api.post<ApiResponse<Consent>>(`/compliance/consents`, body),

  grantConsent: (consentId: string) =>
    api.post<ApiResponse<Consent>>(`/compliance/consents/${consentId}/grant`),

  getConsentDefinitions: (organizationId: string) =>
    api.get<ConsentDefinition[]>(`/compliance/consent-definitions`, { params: { organizationId } }),

  createConsentDefinition: (body: { organizationId: string; title: string; description?: string; required: boolean; legalBasis: string }) =>
    api.post<ConsentDefinition>(`/compliance/consent-definitions`, body),

  setConsentDefinitionActive: (id: string, value: boolean) =>
    api.patch<ConsentDefinition>(`/compliance/consent-definitions/${id}/active`, null, { params: { value } }),

  getPendingConsents: (organizationId: string, personId: string) =>
    api.get<ConsentDefinition[]>(`/compliance/consents/pending`, { params: { organizationId, personId } }),
}

export const terceroApi = {
  list: (organizationId: string, onlyActive?: boolean) =>
    api.get<Tercero[]>(`/compliance/terceros`, { params: { organizationId, onlyActive } }),

  getById: (id: string) =>
    api.get<Tercero>(`/compliance/terceros/${id}`),

  create: (body: TerceroCreateRequest) =>
    api.post<Tercero>(`/compliance/terceros`, body),

  update: (id: string, body: TerceroUpdateRequest) =>
    api.put<Tercero>(`/compliance/terceros/${id}`, body),

  delete: (id: string) =>
    api.delete<void>(`/compliance/terceros/${id}`),
}

// ── Audit ─────────────────────────────────────────────────────────────────────
export const auditApi = {
  list: (organizationId: string, page = 0, size = 50, search?: string) =>
    api.get<ApiResponse<AuditPage>>("/auth/audit", { params: { organizationId, page, size, ...(search ? { search } : {}) } }),
}

export default api

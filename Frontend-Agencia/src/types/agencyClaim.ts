export type AgencyClaimStatus = "PENDIENTE" | "RESPONDIDO"

export interface AgencyClaim {
  id: string
  arcoRequestId: string
  organizationId: string
  dataSubjectId: string
  dataSubjectName: string
  dataSubjectEmail: string
  dataSubjectRut: string
  requestType: string
  originalResolutionSummary: string | null
  originalDenialLegalBasis: string | null
  originalResolvedByEmail: string | null
  claimReason: string
  status: AgencyClaimStatus
  agencyResponse: string | null
  respondedByEmail: string | null
  respondedAt: string | null
  submittedAt: string
  createdAt: string
  updatedAt: string
}

export interface AgencyClaimPage {
  content: AgencyClaim[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export interface RespondAgencyClaimRequest {
  response: string
}

// ── Solicitud ARCO (panel de transparencia, solo lectura) ──────────────────
export type ArcoStatus =
  | "RECIBIDA" | "EN_REVISION" | "EN_GESTION"
  | "RESPONDIDA" | "RECHAZADA" | "CERRADA"

export type ArcoRequestType =
  | "ACCESO" | "RECTIFICACION" | "SUPRESION"
  | "OPOSICION" | "PORTABILIDAD" | "BLOQUEO_TEMPORAL" | "ANONIMIZACION"

export interface ArcoRequestOverview {
  id: string
  organizationId: string
  dataSubjectId: string
  requestType: ArcoRequestType
  status: ArcoStatus
  submittedAt: string
  dueDate: string
  resolutionSummary: string | null
  resolvedAt: string | null
  closedAt?: string | null
  titularDisconforme?: boolean
  agencyClaimId?: string | null
  agencyResolution?: string | null
  agencyRespondedAt?: string | null
}

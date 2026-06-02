export type ArcoStatus =
  | "RECIBIDA" | "EN_REVISION" | "EN_GESTION"
  | "RESPONDIDA" | "RECHAZADA" | "CERRADA"

export type ArcoRequestType =
  | "ACCESO" | "RECTIFICACION" | "SUPRESION"
  | "OPOSICION" | "PORTABILIDAD" | "BLOQUEO_TEMPORAL"

export type ArcoRequestChannel =
  | "WEB_PORTAL" | "EMAIL" | "PHONE" | "IN_PERSON" | "LETTER" | "INTERNAL"

export interface ArcoRequest {
  id: string
  organizationId: string
  dataSubjectId: string
  assignedToUserId: string | null
  requestType: ArcoRequestType
  status: ArcoStatus
  identityVerificationStatus: string
  requestChannel: ArcoRequestChannel
  submittedAt: string
  dueDate: string
  description: string
  resolutionSummary: string | null
  resolvedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateArcoRequest {
  organizationId: string
  dataSubjectId: string
  assignedToUserId?: string
  requestType: ArcoRequestType
  requestChannel: ArcoRequestChannel
  description: string
}

export interface UpdateArcoStatus {
  status: ArcoStatus
  resolutionSummary?: string
}

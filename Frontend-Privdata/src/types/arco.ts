export type ArcoStatus =
  | "RECIBIDA" | "EN_REVISION" | "EN_GESTION"
  | "RESPONDIDA" | "RECHAZADA" | "CERRADA"

export type ArcoRequestType =
  | "ACCESO" | "RECTIFICACION" | "SUPRESION"
  | "OPOSICION" | "PORTABILIDAD" | "BLOQUEO_TEMPORAL" | "ANONIMIZACION"

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
  managementStartedAt: string | null
  resolvedAt: string | null
  denialLegalBasis: string | null
  extensionGranted: boolean
  extendedDueDate: string | null
  createdAt: string
  updatedAt: string
  agencyClaimDeadline?: string
  titularDisconforme?: boolean
  closedAt?: string
  thirdPartiesNotified?: boolean
  agencyClaimId?: string | null
  agencyResolution?: string | null
  agencyRespondedAt?: string | null
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
  denialLegalBasis?: string
}

export type SuppressionCause = "DATA_NOT_NECESSARY" | "CONSENT_REVOKED" | "DATA_EXPIRED"

export interface CreateSuppressionDetails {
  cause: SuppressionCause
  reason: string
  originalPurpose?: string
  consentRevokedAt?: string
  dataCollectedAt?: string
  retentionExpiresAt?: string
}

export interface RespondSuppression {
  approved: boolean
  observations?: string
  rejectionReason?: string
  dataStillNecessary?: boolean
  anotherLegalBasisExists?: boolean
  retentionPeriodStillValid?: boolean
  exceptionApplies?: boolean
  retentionExpiresAt?: string
}

export type OppositionCause = "LEGITIMATE_INTEREST" | "DIRECT_MARKETING" | "PUBLIC_SOURCE"

export interface CreateOppositionDetails {
  cause: OppositionCause
  reason: string
  processingPurpose?: string
  opposedTreatment?: string
  treatmentActivityId?: string
}

export interface RespondOpposition {
  approved: boolean
  observations?: string
  rejectionReason?: string
  overridingLegitimateGrounds?: boolean
  legalObligationApplies?: boolean
  publicInterestApplies?: boolean
  exceptionApplies?: boolean
}

export type PortabilityCause = "USER_REQUEST" | "TRANSFER_TO_OTHER_PROVIDER" | "PERSONAL_BACKUP"

export interface CreatePortabilityDetails {
  cause: PortabilityCause
  destinationOrganization?: string
  reason: string
}

export interface RespondPortability {
  approved: boolean
  observations?: string
  rejectionReason?: string
}

export type BlockingCause = "PROCESSING_UNDER_CHALLENGE" | "UNLAWFUL_PROCESSING" | "PENDING_SUPPRESSION_REVIEW"

export interface CreateBlockingDetails {
  cause: BlockingCause
  reason: string
}

export interface RespondBlocking {
  approved: boolean
  observations?: string
  rejectionReason?: string
  legalObligationApplies?: boolean
  exceptionApplies?: boolean
}

export type AnonymizationCause =
  | "DATA_NO_LONGER_REQUIRES_IDENTIFICATION"
  | "PRIVACY_PRESERVING_RETENTION"
  | "STATISTICAL_OR_RESEARCH_PURPOSE"

export interface CreateAnonymizationDetails {
  cause: AnonymizationCause
  reason: string
}

export interface RespondAnonymization {
  approved: boolean
  observations?: string
  rejectionReason?: string
  legalObligationApplies?: boolean
  identificationStillRequired?: boolean
  technicalImpossibility?: boolean
  exceptionApplies?: boolean
}

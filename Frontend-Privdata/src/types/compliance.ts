export type ConsentStatus = "ACTIVE" | "REVOKED" | "EXPIRED" | "SUSPENDED"
export type CollectionMethod = "WEB_PORTAL" | "ADMIN_PANEL" | "EMAIL" | "PHONE" | "IN_PERSON"
export type LegalBasis =
  | "CONSENTIMIENTO" | "CONTRATO" | "OBLIGACION_LEGAL"
  | "INTERES_LEGITIMO" | "INTERES_VITAL" | "FUNCION_PUBLICA"
export type TreatmentActivityStatus = "ACTIVE" | "INACTIVE" | "UNDER_REVIEW"

export interface DataCategory {
  id: string
  name: string
  description: string | null
  sensitive: boolean
  active: boolean
}

export interface Consent {
  id: string
  organizationId: string
  dataSubjectId: string
  purposeId: string
  policyVersionId: string
  status: ConsentStatus
  grantedAt: string | null
  revokedAt: string | null
  expiresAt: string | null
  collectionMethod: CollectionMethod
  evidenceHash: string
  evidenceUrl: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  categoryIds: string[]
}

export interface ConsentPage {
  content: Consent[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

export interface TreatmentActivity {
  id: string
  organizationId: string
  name: string
  description: string | null
  purpose: string
  legalBasis: LegalBasis
  dataSubjectCategories: string | null
  retentionPeriodDays: number | null
  thirdPartyRecipients: string | null
  internationalTransfer: boolean
  dataSystems: string | null
  securityMeasures: string | null
  status: TreatmentActivityStatus
  containsSensitiveData: boolean
  dataCategories: DataCategory[]
  createdAt: string
  updatedAt: string
}

export type TerceroTipo = "ENCARGADO" | "CESIONARIO" | "TERCERO_INDEPENDIENTE"
export type MecanismoTransferencia = "CLAUSULA_CONTRACTUAL" | "DECISION_ADECUACION" | "CONSENTIMIENTO_EXPLICITO"

export interface Tercero {
  id: string
  organizationId: string
  nombre: string
  tipo: TerceroTipo
  pais: string
  finalidadUso: string | null
  linkContrato: string | null
  mecanismoTransferencia: MecanismoTransferencia | null
  activo: boolean
  createdAt: string
  updatedAt: string
}

export interface TerceroCreateRequest {
  organizationId: string
  nombre: string
  tipo: TerceroTipo
  pais: string
  finalidadUso?: string
  linkContrato?: string
  mecanismoTransferencia?: MecanismoTransferencia
}

export interface TerceroUpdateRequest {
  nombre: string
  tipo: TerceroTipo
  pais: string
  finalidadUso?: string
  linkContrato?: string
  mecanismoTransferencia?: MecanismoTransferencia
  activo: boolean
}

export type ConsentStatus = "ACTIVE" | "REVOKED" | "EXPIRED" | "SUSPENDED"
export type CollectionMethod = "WEB_PORTAL" | "ADMIN_PANEL" | "EMAIL" | "PHONE" | "IN_PERSON"
export type LegalBasis =
  | "CONSENTIMIENTO" | "CONTRATO" | "OBLIGACION_LEGAL"
  | "INTERES_LEGITIMO" | "INTERES_VITAL"
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
  definitionId?: string
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

export interface ConsentDefinition {
  id: string
  organizationId: string
  title: string
  description: string | null
  required: boolean
  legalBasis: LegalBasis
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface ConsentCreateRequest {
  organizationId: string
  dataSubjectId: string
  definitionId: string
  collectionMethod: CollectionMethod
  notes?: string
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
  hasAutomatedDecisions: boolean
  profilingDescription: string | null
  status: TreatmentActivityStatus
  containsSensitiveData: boolean
  dataCategories: DataCategory[]
  terceros?: Tercero[]
  createdAt: string
  updatedAt: string
}

interface TreatmentActivityFormFields {
  name: string
  description?: string
  purpose: string
  legalBasis: LegalBasis
  dataSubjectCategories?: string
  retentionPeriodDays?: number
  thirdPartyRecipients?: string
  dataSystems?: string
  securityMeasures?: string
  hasAutomatedDecisions?: boolean
  profilingDescription?: string
  dataCategoryIds?: string[]
  terceroIds?: string[]
}

export interface TreatmentActivityCreateRequest extends TreatmentActivityFormFields {
  organizationId: string
}

export interface TreatmentActivityUpdateRequest extends TreatmentActivityFormFields {
  status: TreatmentActivityStatus
}

export const TERCERO_TIPO_LABELS: Record<TerceroTipo, string> = {
  ENCARGADO: "Encargado de tratamiento",
  CESIONARIO: "Cesionario",
  TERCERO_INDEPENDIENTE: "Tercero independiente",
}

export const MECANISMO_LABELS: Record<MecanismoTransferencia, string> = {
  CLAUSULA_CONTRACTUAL: "Cláusulas contractuales tipo",
  DECISION_ADECUACION: "Decisión de adecuación",
  CONSENTIMIENTO_EXPLICITO: "Consentimiento explícito del titular",
}

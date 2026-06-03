export interface AuditLog {
  id: string
  organizationId: string | null
  action: string
  entityType: string
  detail: string
  performedByEmail: string | null
  createdAt: string
}

export interface AuditPage {
  content: AuditLog[]
  totalPages: number
  totalElements: number
  number: number
  size: number
}

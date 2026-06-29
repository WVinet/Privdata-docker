export type DataStatus = "ACTIVE" | "BLOCKED" | "DELETION_REQUESTED" | "PROCESSING_RESTRICTED" | "ANONYMIZED"

export interface Person {
  id: string
  organizationId: string
  departmentId: string | null
  departmentName: string | null
  firstName: string
  lastName: string
  fullName: string
  rut: string | null
  email: string | null
  phone: string | null
  position: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  blocked: boolean
  anonymized: boolean
  deletionRequest: boolean
  dataStatus: DataStatus
}

export interface InvitePersonRequest {
  firstName: string
  lastName: string
  email: string
  rut: string
  position?: string
  departmentId?: string
  roleName: string
}

export interface UpdatePersonRequest {
  firstName: string
  lastName: string
  email?: string
  rut?: string
  phone?: string
  position?: string
  departmentId?: string
}

export interface InvitePersonResponse {
  person: Person
  user: {
    data: {
      userId: string
      email: string
      temporaryPassword: string
    }
  }
}

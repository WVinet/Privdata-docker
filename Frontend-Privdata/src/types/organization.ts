export interface Organization {
  id: string
  name: string
  legalName: string
  rut: string
  businessType: string | null
  email: string | null
  phone: string | null
  address: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface OrganizationCreateRequest {
  name: string
  legalName: string
  rut: string
  businessType?: string
  email?: string
  phone?: string
  address?: string
}

export interface OrganizationUpdateRequest extends OrganizationCreateRequest {}

export interface Department {
  id: string
  organizationId: string
  name: string
  description: string | null
  isActive: boolean
  createdAt: string
}

export interface DepartmentCreateRequest {
  name: string
  description?: string
}

export interface JobPosition {
  id: string
  organizationId: string
  name: string
  description: string | null
  isActive: boolean
  createdAt: string
}

export interface JobPositionCreateRequest {
  name: string
  description?: string
}

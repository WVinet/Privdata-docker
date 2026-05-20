// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface User {
  id: string
  name: string
  email: string
  role: "admin" | "analyst" | "viewer"
  status: "active" | "inactive"
  createdAt: string
}

export interface Titular {
  id: string
  rut: string
  name: string
  email: string
  phone: string
  consentsCount: number
  createdAt: string
}

export interface Consent {
  id: string
  titularId: string
  titularName: string
  purpose: string
  category: string
  status: "active" | "revoked"
  version: string
  hash: string
  grantedAt: string
  revokedAt?: string
}

export interface ArcoRequest {
  id: string
  titularId: string
  titularName: string
  type: "access" | "rectification" | "suppression" | "opposition" | "portability" | "blocking"
  status: "pending" | "in_progress" | "resolved" | "rejected"
  assignee?: string
  createdAt: string
  deadline: string
  resolution?: string
}

export interface AuditEvent {
  id: string
  action: "CREATE" | "UPDATE" | "REVOKE" | "LOGIN" | "RESOLVE"
  entity: string
  entityId: string
  userId: string
  userName: string
  details: string
  timestamp: string
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

export const mockUsers: User[] = [
  { id: "u1", name: "Carlos Méndez", email: "cmendez@privdata.cl", role: "admin", status: "active", createdAt: "2024-01-10" },
  { id: "u2", name: "Ana Torres", email: "atorres@privdata.cl", role: "analyst", status: "active", createdAt: "2024-02-15" },
  { id: "u3", name: "Rodrigo Vega", email: "rvega@privdata.cl", role: "viewer", status: "inactive", createdAt: "2024-03-01" },
  { id: "u4", name: "Valentina Ríos", email: "vrios@privdata.cl", role: "analyst", status: "active", createdAt: "2024-04-20" },
  { id: "u5", name: "Felipe Morales", email: "fmorales@privdata.cl", role: "viewer", status: "active", createdAt: "2024-05-05" },
]

export const mockTitulares: Titular[] = [
  { id: "t1", rut: "12.345.678-9", name: "María González", email: "mgonzalez@gmail.com", phone: "+56 9 1234 5678", consentsCount: 3, createdAt: "2024-01-15" },
  { id: "t2", rut: "9.876.543-2", name: "Juan Pérez", email: "jperez@outlook.com", phone: "+56 9 8765 4321", consentsCount: 1, createdAt: "2024-02-20" },
  { id: "t3", rut: "15.432.109-K", name: "Luisa Contreras", email: "lcontreras@empresa.cl", phone: "+56 2 2345 6789", consentsCount: 2, createdAt: "2024-03-10" },
  { id: "t4", rut: "8.765.432-1", name: "Pedro Soto", email: "psoto@correo.cl", phone: "+56 9 5678 1234", consentsCount: 4, createdAt: "2024-04-05" },
  { id: "t5", rut: "11.223.344-5", name: "Andrea Fuentes", email: "afuentes@mail.com", phone: "+56 9 4321 8765", consentsCount: 2, createdAt: "2024-05-18" },
  { id: "t6", rut: "7.654.321-0", name: "Diego Navarro", email: "dnavarro@gmail.com", phone: "+56 9 9876 5432", consentsCount: 1, createdAt: "2024-06-01" },
]

export const mockConsents: Consent[] = [
  {
    id: "c1", titularId: "t1", titularName: "María González",
    purpose: "Marketing directo", category: "Comercial",
    status: "active", version: "v2.1",
    hash: "a3f8c1d9e2b4", grantedAt: "2024-01-20",
  },
  {
    id: "c2", titularId: "t1", titularName: "María González",
    purpose: "Análisis de datos", category: "Estadístico",
    status: "revoked", version: "v1.0",
    hash: "b7e2a5f1c8d3", grantedAt: "2024-01-20", revokedAt: "2024-06-10",
  },
  {
    id: "c3", titularId: "t2", titularName: "Juan Pérez",
    purpose: "Envío de comunicaciones", category: "Comunicación",
    status: "active", version: "v2.1",
    hash: "c9d4b6e3a1f7", grantedAt: "2024-02-25",
  },
  {
    id: "c4", titularId: "t3", titularName: "Luisa Contreras",
    purpose: "Mejora del servicio", category: "Calidad",
    status: "active", version: "v2.0",
    hash: "d2e8f5a3c7b1", grantedAt: "2024-03-15",
  },
  {
    id: "c5", titularId: "t4", titularName: "Pedro Soto",
    purpose: "Marketing directo", category: "Comercial",
    status: "active", version: "v2.1",
    hash: "e5f1d8b4a9c2", grantedAt: "2024-04-10",
  },
  {
    id: "c6", titularId: "t5", titularName: "Andrea Fuentes",
    purpose: "Análisis de datos", category: "Estadístico",
    status: "active", version: "v2.1",
    hash: "f3a7c2e6d1b8", grantedAt: "2024-05-20",
  },
]

export const mockArcoRequests: ArcoRequest[] = [
  {
    id: "ARCO-001", titularId: "t1", titularName: "María González",
    type: "access", status: "resolved",
    assignee: "Ana Torres", createdAt: "2024-05-01", deadline: "2024-05-31",
    resolution: "Información entregada vía correo certificado.",
  },
  {
    id: "ARCO-002", titularId: "t2", titularName: "Juan Pérez",
    type: "rectification", status: "in_progress",
    assignee: "Ana Torres", createdAt: "2024-06-10", deadline: "2024-07-10",
  },
  {
    id: "ARCO-003", titularId: "t3", titularName: "Luisa Contreras",
    type: "suppression", status: "pending",
    createdAt: "2024-07-01", deadline: "2024-08-01",
  },
  {
    id: "ARCO-004", titularId: "t4", titularName: "Pedro Soto",
    type: "opposition", status: "rejected",
    assignee: "Valentina Ríos", createdAt: "2024-06-20", deadline: "2024-07-20",
    resolution: "No procede según art. 13 Ley 21.719.",
  },
  {
    id: "ARCO-005", titularId: "t5", titularName: "Andrea Fuentes",
    type: "portability", status: "pending",
    createdAt: "2024-07-05", deadline: "2024-08-05",
  },
]

// ─── Portal Titular Interfaces ────────────────────────────────────────────────

export interface TitularPortalConsent {
  id: string
  group: string
  groupIcon: string
  purpose: string
  description: string
  category: "necesario" | "opcional" | "marketing" | "salud" | "terceros"
  enabled: boolean
  required: boolean // si es true, no se puede revocar
  grantedAt: string | null
}

export interface TitularArcoSolicitud {
  id: string
  type: "access" | "rectification" | "suppression" | "opposition" | "portability" | "blocking"
  status: "en_tramite" | "resuelta" | "rechazada"
  createdAt: string
  deadline: string
  deadlineDays: number
  elapsedDays: number
  steps: { label: string; status: "done" | "active" | "pending" }[]
  resolution?: string
  urgent?: boolean
}

export interface TitularPortalData {
  id: string
  rut: string
  name: string
  email: string
  lastAccess: string
  activeConsents: number
  pendingRequests: number
  resolvedRequests: number
  consents: TitularPortalConsent[]
  solicitudes: TitularArcoSolicitud[]
}

// ─── Mock Portal Titular ──────────────────────────────────────────────────────

export const mockTitularPortal: TitularPortalData = {
  id: "t2",
  rut: "9.876.543-2",
  name: "Juan Pérez",
  email: "jperez@outlook.com",
  lastAccess: "2026-04-13T18:42:00",
  activeConsents: 4,
  pendingRequests: 1,
  resolvedRequests: 2,
  consents: [
    // Grupo: Datos de salud
    {
      id: "pc1",
      group: "Datos de salud y prescripciones",
      groupIcon: "🏥",
      purpose: "Atención farmacéutica y dispensación de medicamentos",
      description: "Necesario para procesar sus recetas y entregar medicamentos.",
      category: "necesario",
      enabled: true,
      required: true,
      grantedAt: "2025-03-10",
    },
    {
      id: "pc2",
      group: "Datos de salud y prescripciones",
      groupIcon: "🏥",
      purpose: "Recordatorio de medicamentos crónicos",
      description: "Le enviaremos alertas cuando deba renovar sus medicamentos habituales.",
      category: "salud",
      enabled: true,
      required: false,
      grantedAt: "2025-03-10",
    },
    // Grupo: Marketing
    {
      id: "pc3",
      group: "Marketing y comunicaciones",
      groupIcon: "🎯",
      purpose: "Ofertas y promociones personalizadas",
      description: "Recibirá descuentos y promociones basados en su historial de compras.",
      category: "marketing",
      enabled: true,
      required: false,
      grantedAt: "2025-03-10",
    },
    {
      id: "pc4",
      group: "Marketing y comunicaciones",
      groupIcon: "🎯",
      purpose: "Comunicaciones del programa de fidelización",
      description: "Información sobre beneficios, puntos acumulados y recompensas.",
      category: "marketing",
      enabled: true,
      required: false,
      grantedAt: "2025-03-10",
    },
    {
      id: "pc5",
      group: "Marketing y comunicaciones",
      groupIcon: "🎯",
      purpose: "Compartir datos con laboratorios y proveedores",
      description: "Sus datos podrán ser compartidos con laboratorios asociados para mejorar ofertas.",
      category: "terceros",
      enabled: false,
      required: false,
      grantedAt: null,
    },
    // Grupo: Experiencia digital
    {
      id: "pc6",
      group: "Experiencia digital",
      groupIcon: "🌐",
      purpose: "Análisis de navegación y mejora de la app",
      description: "Usamos datos de uso para mejorar continuamente la experiencia en la aplicación.",
      category: "opcional",
      enabled: true,
      required: false,
      grantedAt: "2025-04-01",
    },
  ],
  solicitudes: [
    {
      id: "SOL-2026-00412",
      type: "access",
      status: "en_tramite",
      createdAt: "2026-04-01",
      deadline: "2026-04-22",
      deadlineDays: 15,
      elapsedDays: 2,
      steps: [
        { label: "Solicitud recibida", status: "done" },
        { label: "Verificación de identidad", status: "done" },
        { label: "Revisión interna", status: "active" },
        { label: "Preparación de respuesta", status: "pending" },
        { label: "Entrega al titular", status: "pending" },
      ],
    },
    {
      id: "SOL-2026-00318",
      type: "rectification",
      status: "resuelta",
      createdAt: "2026-03-10",
      deadline: "2026-04-01",
      deadlineDays: 15,
      elapsedDays: 15,
      steps: [
        { label: "Solicitud recibida", status: "done" },
        { label: "Verificación de identidad", status: "done" },
        { label: "Corrección aplicada", status: "done" },
        { label: "Notificación enviada", status: "done" },
      ],
      resolution: "Sus datos fueron corregidos exitosamente.",
    },
    {
      id: "SOL-2025-00891",
      type: "blocking",
      status: "resuelta",
      createdAt: "2025-11-20",
      deadline: "2025-11-22",
      deadlineDays: 2,
      elapsedDays: 1,
      urgent: true,
      steps: [
        { label: "Solicitud recibida", status: "done" },
        { label: "Bloqueo temporal aplicado", status: "done" },
        { label: "Confirmación enviada", status: "done" },
      ],
      resolution: "Bloqueo temporal aplicado en 1 día hábil.",
    },
  ],
}

export const mockAuditEvents: AuditEvent[] = [
  { id: "ae1", action: "LOGIN", entity: "Usuario", entityId: "u1", userId: "u1", userName: "Carlos Méndez", details: "Inicio de sesión exitoso desde IP 192.168.1.1", timestamp: "2024-07-10T08:30:00" },
  { id: "ae2", action: "CREATE", entity: "Titular", entityId: "t6", userId: "u2", userName: "Ana Torres", details: "Nuevo titular registrado: Diego Navarro (7.654.321-0)", timestamp: "2024-07-10T09:15:00" },
  { id: "ae3", action: "REVOKE", entity: "Consentimiento", entityId: "c2", userId: "u2", userName: "Ana Torres", details: "Consentimiento de análisis de datos revocado para María González", timestamp: "2024-07-10T10:00:00" },
  { id: "ae4", action: "UPDATE", entity: "Solicitud ARCO", entityId: "ARCO-002", userId: "u4", userName: "Valentina Ríos", details: "Estado actualizado a 'en proceso' para solicitud de Juan Pérez", timestamp: "2024-07-10T11:30:00" },
  { id: "ae5", action: "RESOLVE", entity: "Solicitud ARCO", entityId: "ARCO-001", userId: "u2", userName: "Ana Torres", details: "Solicitud de acceso resuelta para María González", timestamp: "2024-07-10T14:00:00" },
  { id: "ae6", action: "CREATE", entity: "Solicitud ARCO", entityId: "ARCO-005", userId: "u1", userName: "Carlos Méndez", details: "Nueva solicitud de portabilidad para Andrea Fuentes", timestamp: "2024-07-10T15:45:00" },
]

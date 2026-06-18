import type { PortabilityCause } from "@/types/arco"

export interface PortabilityDetails {
  type: "PORTABILITY_REQUEST"
  cause: PortabilityCause
  destinationOrganization?: string
  reason: string
}

export const PORTABILITY_CAUSE_LABELS: Record<PortabilityCause, string> = {
  USER_REQUEST: "Solicito una copia de mis datos para uso personal",
  TRANSFER_TO_OTHER_PROVIDER: "Quiero transferir mis datos a otro responsable",
  PERSONAL_BACKUP: "Quiero un respaldo personal de mis datos",
}

export function encodePortability(details: Omit<PortabilityDetails, "type">): string {
  return JSON.stringify({ type: "PORTABILITY_REQUEST", ...details })
}

export function parsePortability(description: string): PortabilityDetails | null {
  try {
    const obj = JSON.parse(description)
    if (obj?.type === "PORTABILITY_REQUEST" && typeof obj.cause === "string" && typeof obj.reason === "string") {
      return obj as PortabilityDetails
    }
    return null
  } catch {
    return null
  }
}

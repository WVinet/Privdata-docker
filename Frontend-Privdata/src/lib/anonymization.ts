import type { AnonymizationCause } from "@/types/arco"

export interface AnonymizationDetails {
  type: "ANONYMIZATION_REQUEST"
  cause: AnonymizationCause
  reason: string
}

export const ANONYMIZATION_CAUSE_LABELS: Record<AnonymizationCause, string> = {
  DATA_NO_LONGER_REQUIRES_IDENTIFICATION: "Mis datos ya no requieren estar identificados para la finalidad con que fueron recopilados",
  PRIVACY_PRESERVING_RETENTION: "Solicito que se conserven de forma anonimizada en lugar de eliminarse",
  STATISTICAL_OR_RESEARCH_PURPOSE: "El uso restante de mis datos es solo estadístico o de investigación",
}

export function encodeAnonymization(details: Omit<AnonymizationDetails, "type">): string {
  return JSON.stringify({ type: "ANONYMIZATION_REQUEST", ...details })
}

export function parseAnonymization(description: string): AnonymizationDetails | null {
  try {
    const obj = JSON.parse(description)
    if (obj?.type === "ANONYMIZATION_REQUEST" && typeof obj.cause === "string" && typeof obj.reason === "string") {
      return obj as AnonymizationDetails
    }
    return null
  } catch {
    return null
  }
}

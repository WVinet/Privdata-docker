import type { OppositionCause } from "@/types/arco"

export interface OppositionDetails {
  type: "OPPOSITION_REQUEST"
  cause: OppositionCause
  reason: string
  processingPurpose?: string
  opposedTreatment?: string
}

export const OPPOSITION_CAUSE_LABELS: Record<OppositionCause, string> = {
  LEGITIMATE_INTEREST: "El tratamiento se basa en un interés legítimo del responsable",
  DIRECT_MARKETING: "El tratamiento es para fines de marketing directo",
  PUBLIC_SOURCE: "Mis datos provienen de una fuente de acceso público",
}

export function encodeOpposition(details: Omit<OppositionDetails, "type">): string {
  return JSON.stringify({ type: "OPPOSITION_REQUEST", ...details })
}

export function parseOpposition(description: string): OppositionDetails | null {
  try {
    const obj = JSON.parse(description)
    if (obj?.type === "OPPOSITION_REQUEST" && typeof obj.reason === "string" && typeof obj.cause === "string") {
      return obj as OppositionDetails
    }
    return null
  } catch {
    return null
  }
}

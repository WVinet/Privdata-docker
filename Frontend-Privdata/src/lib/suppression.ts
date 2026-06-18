import type { SuppressionCause } from "@/types/arco"

export interface SuppressionDetails {
  type: "SUPPRESSION_REQUEST"
  cause: SuppressionCause
  reason: string
}

export const SUPPRESSION_CAUSE_LABELS: Record<SuppressionCause, string> = {
  DATA_NOT_NECESSARY: "Los datos ya no son necesarios para la finalidad con que fueron recopilados",
  CONSENT_REVOKED: "El titular revocó el consentimiento que dio para el tratamiento",
  DATA_EXPIRED: "Venció el plazo de conservación de los datos",
}

export function encodeSuppression(cause: SuppressionCause, reason: string): string {
  return JSON.stringify({ type: "SUPPRESSION_REQUEST", cause, reason })
}

export function parseSuppression(description: string): SuppressionDetails | null {
  try {
    const obj = JSON.parse(description)
    if (obj?.type === "SUPPRESSION_REQUEST" && typeof obj.reason === "string") {
      return obj as SuppressionDetails
    }
    return null
  } catch {
    return null
  }
}

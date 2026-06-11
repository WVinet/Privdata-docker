export interface SuppressionDetails {
  type: "SUPPRESSION_REQUEST"
  reason: string
}

export function encodeSuppression(reason: string): string {
  return JSON.stringify({ type: "SUPPRESSION_REQUEST", reason })
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

export interface AnonymizationDetails {
  type: "ANONYMIZATION_REQUEST"
  reason: string
}

export function encodeAnonymization(reason: string): string {
  return JSON.stringify({ type: "ANONYMIZATION_REQUEST", reason })
}

export function parseAnonymization(description: string): AnonymizationDetails | null {
  try {
    const obj = JSON.parse(description)
    if (obj?.type === "ANONYMIZATION_REQUEST" && typeof obj.reason === "string") {
      return obj as AnonymizationDetails
    }
    return null
  } catch {
    return null
  }
}

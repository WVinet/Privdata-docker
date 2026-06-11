export interface OppositionActivityRef {
  id: string
  name: string
}

export interface OppositionDetails {
  type: "OPPOSITION_REQUEST"
  activities: OppositionActivityRef[]
  reason: string
}

export function encodeOpposition(details: Omit<OppositionDetails, "type">): string {
  return JSON.stringify({ type: "OPPOSITION_REQUEST", ...details })
}

export function parseOpposition(description: string): OppositionDetails | null {
  try {
    const obj = JSON.parse(description)
    if (
      obj?.type === "OPPOSITION_REQUEST" &&
      Array.isArray(obj.activities) &&
      typeof obj.reason === "string"
    ) {
      return obj as OppositionDetails
    }
    return null
  } catch {
    return null
  }
}

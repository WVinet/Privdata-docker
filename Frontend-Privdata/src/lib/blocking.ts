export type BlockingRelatedType = "RECTIFICACION" | "SUPRESION" | "OPOSICION" | "ALTERNATIVA_SUPRESION"

export const BLOCKING_RELATED_TYPES: { key: BlockingRelatedType; label: string }[] = [
  { key: "RECTIFICACION",       label: "Rectificación en curso" },
  { key: "SUPRESION",           label: "Supresión en curso" },
  { key: "OPOSICION",           label: "Oposición en curso" },
  { key: "ALTERNATIVA_SUPRESION", label: "Alternativa a la supresión (Art. 7)" },
]

export interface BlockingDetails {
  type: "BLOCKING_REQUEST"
  relatedType: BlockingRelatedType
  relatedRequestId?: string
  reason: string
}

export function encodeBlocking(details: Omit<BlockingDetails, "type">): string {
  return JSON.stringify({ type: "BLOCKING_REQUEST", ...details })
}

export function parseBlocking(description: string): BlockingDetails | null {
  try {
    const obj = JSON.parse(description)
    if (
      obj?.type === "BLOCKING_REQUEST" &&
      typeof obj.relatedType === "string" &&
      typeof obj.reason === "string"
    ) {
      return obj as BlockingDetails
    }
    return null
  } catch {
    return null
  }
}

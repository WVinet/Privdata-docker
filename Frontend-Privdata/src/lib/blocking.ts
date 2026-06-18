import type { BlockingCause } from "@/types/arco"

export interface BlockingDetails {
  type: "BLOCKING_REQUEST"
  cause: BlockingCause
  reason: string
}

export const BLOCKING_CAUSE_LABELS: Record<BlockingCause, string> = {
  PROCESSING_UNDER_CHALLENGE: "Estoy impugnando la exactitud de mis datos y solicito suspender su uso mientras se resuelve",
  UNLAWFUL_PROCESSING: "Considero que el tratamiento de mis datos es ilícito",
  PENDING_SUPPRESSION_REVIEW: "Solicité la supresión de mis datos y pido que se suspenda su uso mientras se evalúa",
}

export function encodeBlocking(details: Omit<BlockingDetails, "type">): string {
  return JSON.stringify({ type: "BLOCKING_REQUEST", ...details })
}

export function parseBlocking(description: string): BlockingDetails | null {
  try {
    const obj = JSON.parse(description)
    if (obj?.type === "BLOCKING_REQUEST" && typeof obj.cause === "string" && typeof obj.reason === "string") {
      return obj as BlockingDetails
    }
    return null
  } catch {
    return null
  }
}

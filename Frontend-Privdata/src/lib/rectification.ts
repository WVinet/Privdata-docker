import type { Person } from "@/types/person"

export type RectifiableField = "firstName" | "secondName" | "lastName" | "maternalLastName" | "rut" | "email" | "phone" | "position"

export const RECTIFIABLE_FIELDS: { key: RectifiableField; label: string }[] = [
  { key: "firstName",        label: "Primer nombre" },
  { key: "secondName",       label: "Segundo nombre" },
  { key: "lastName",         label: "Apellido paterno" },
  { key: "maternalLastName", label: "Apellido materno" },
  { key: "rut",              label: "RUT" },
  { key: "email",            label: "Correo electrónico" },
  { key: "phone",            label: "Teléfono" },
  { key: "position",         label: "Cargo" },
]

export interface RectificationDetails {
  type: "RECTIFICATION_REQUEST"
  field: RectifiableField
  fieldLabel: string
  currentValue: string
  proposedValue: string
  reason: string
}

export function encodeRectification(details: Omit<RectificationDetails, "type">): string {
  return JSON.stringify({ type: "RECTIFICATION_REQUEST", ...details })
}

export function parseRectification(description: string): RectificationDetails | null {
  try {
    const obj = JSON.parse(description)
    if (
      obj?.type === "RECTIFICATION_REQUEST" &&
      typeof obj.field === "string" &&
      typeof obj.proposedValue === "string"
    ) {
      return obj as RectificationDetails
    }
    return null
  } catch {
    return null
  }
}

export function getPersonFieldValue(person: Person, field: RectifiableField): string {
  return person[field] ?? ""
}

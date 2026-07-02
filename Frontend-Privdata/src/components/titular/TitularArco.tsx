import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { useQuery } from "@tanstack/react-query"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import * as Dialog from "@radix-ui/react-dialog"
import { toast } from "sonner"
import { arcoApi, personsApi, complianceApi } from "@/lib/api"
import type {
  ArcoRequestType, CreateSuppressionDetails, CreateOppositionDetails,
  CreatePortabilityDetails,
} from "@/types/arco"
import type { TreatmentActivity } from "@/types/compliance"
import { RECTIFIABLE_FIELDS, encodeRectification, getPersonFieldValue, type RectifiableField } from "@/lib/rectification"
import { encodeSuppression } from "@/lib/suppression"
import { encodeOpposition } from "@/lib/opposition"
import { PORTABILITY_CAUSE_LABELS, encodePortability } from "@/lib/portability"

type ArcoRight = {
  id: string
  icon: string
  label: string
  deadline: string
  urgent?: boolean
  description: string
  variant: "primary" | "danger" | "warning"
  group: "core" | "additional"
}

const rights: ArcoRight[] = [
  {
    id: "access",
    icon: "🔍",
    label: "Acceso",
    deadline: "30 días corridos",
    description:
      "Solicita conocer qué datos personales tuyos tenemos registrados, con qué finalidad y a quién los hemos comunicado.",
    variant: "primary",
    group: "core",
  },
  {
    id: "rectification",
    icon: "✏️",
    label: "Rectificación",
    deadline: "30 días corridos",
    description:
      "Solicita corregir datos inexactos, incompletos o desactualizados que tengamos sobre ti.",
    variant: "primary",
    group: "core",
  },
  {
    id: "suppression",
    icon: "🗑️",
    label: "Supresión",
    deadline: "30 días corridos",
    description:
      "Solicita la eliminación de tus datos personales cuando ya no sean necesarios para el fin con que fueron recopilados.",
    variant: "danger",
    group: "core",
  },
  {
    id: "opposition",
    icon: "🚫",
    label: "Oposición",
    deadline: "30 días corridos",
    description:
      "Solicita que dejemos de tratar tus datos para ciertos fines, como marketing directo o elaboración de perfiles.",
    variant: "primary",
    group: "core",
  },
  {
    id: "portability",
    icon: "📦",
    label: "Portabilidad",
    deadline: "30 días corridos",
    description:
      "Recibe tus datos en un formato estructurado para transferirlos a otro responsable.",
    variant: "primary",
    group: "core",
  },
]

const variantStyles = {
  primary: {
    border: "hsl(var(--primary))",
    bg: "hsl(var(--primary) / 0.08)",
    text: "hsl(var(--primary))",
    infoBorder: "hsl(var(--primary) / 0.4)",
    infoBg: "hsl(var(--secondary))",
    infoText: "hsl(var(--primary))",
  },
  danger: {
    border: "hsl(var(--destructive))",
    bg: "hsl(var(--destructive) / 0.07)",
    text: "hsl(var(--destructive))",
    infoBorder: "hsl(var(--destructive) / 0.4)",
    infoBg: "hsl(var(--destructive) / 0.06)",
    infoText: "hsl(var(--destructive))",
  },
  warning: {
    border: "hsl(var(--warning))",
    bg: "hsl(var(--warning) / 0.08)",
    text: "hsl(var(--warning))",
    infoBorder: "hsl(var(--warning) / 0.4)",
    infoBg: "hsl(var(--warning) / 0.06)",
    infoText: "hsl(36 70% 32%)",
  },
}


const formSchema = z
  .object({
    email: z.string().email("Email inválido"),
    mode: z.enum(["other", "rectification", "suppression", "opposition", "portability"]),
    dataScope: z.string().optional(),
    description: z.string().optional(),
    rectField: z.string().optional(),
    rectNewValue: z.string().optional(),
    rectReason: z.string().optional(),
    suppressCause: z.string().optional(),
    suppressReason: z.string().optional(),
    suppressConfirm: z.boolean().optional(),
    oppositionCause: z.string().optional(),
    oppositionActivityId: z.string().optional(),
    oppositionReason: z.string().optional(),
    portabilityCause: z.string().optional(),
    portabilityDestination: z.string().optional(),
    portabilityReason: z.string().optional(),
    declaration: z
      .boolean()
      .refine((v) => v === true, "Debes aceptar la declaración"),
  })
  .superRefine((data, ctx) => {
    if (data.mode === "rectification") {
      if (!data.rectField) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["rectField"], message: "Selecciona el dato a corregir" })
      }
      if (!data.rectNewValue?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["rectNewValue"], message: "Indica el valor correcto" })
      }
      if (!data.rectReason?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["rectReason"], message: "Indica el motivo de la corrección" })
      }
    } else if (data.mode === "suppression") {
      if (!data.suppressCause) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["suppressCause"], message: "Selecciona la causal de la solicitud de supresión" })
      }
      if (!data.suppressReason?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["suppressReason"], message: "Indica el motivo de la solicitud de supresión" })
      }
      if (data.suppressConfirm !== true) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["suppressConfirm"], message: "Debes confirmar que entiendes los efectos de la supresión" })
      }
    } else if (data.mode === "opposition") {
      if (!data.oppositionCause) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["oppositionCause"], message: "Selecciona la causal de la oposición" })
      }
      if (!data.oppositionActivityId) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["oppositionActivityId"], message: "Selecciona la finalidad a la que te opones" })
      }
      if (data.oppositionCause !== "DIRECT_MARKETING" && !data.oppositionReason?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["oppositionReason"], message: "Indica el motivo de la oposición" })
      }
    } else if (data.mode === "portability") {
      if (!data.portabilityCause) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["portabilityCause"], message: "Selecciona el motivo de tu solicitud de portabilidad" })
      }
      if (data.portabilityCause === "TRANSFER_TO_OTHER_PROVIDER" && !data.portabilityDestination?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["portabilityDestination"], message: "Indica a qué responsable deseas transferir tus datos" })
      }
      if (!data.portabilityReason?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["portabilityReason"], message: "Indica el motivo de la solicitud de portabilidad" })
      }
    } else if (!data.dataScope?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["dataScope"], message: "Selecciona una opción" })
    }
  })

type FormData = z.infer<typeof formSchema>

const RIGHT_TO_TYPE: Record<string, ArcoRequestType> = {
  access:         "ACCESO",
  rectification:  "RECTIFICACION",
  suppression:    "SUPRESION",
  opposition:     "OPOSICION",
  portability:    "PORTABILIDAD",
}

interface Props {
  rut: string
  email: string
  organizationId: string
  dataSubjectId: string
  onSolicitudCreated: () => void
}

export default function TitularArco({ rut, email, organizationId, dataSubjectId, onSolicitudCreated }: Props) {
  const [selectedRight, setSelectedRight] = useState<ArcoRight | null>(null)
  const [requestId, setRequestId] = useState("")
  const [successOpen, setSuccessOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)
  const [rectFile, setRectFile] = useState<File | null>(null)
  const [oppFile, setOppFile] = useState<File | null>(null)

  const { data: personData } = useQuery({
    queryKey: ["person", organizationId, dataSubjectId],
    queryFn: () => personsApi.getById(organizationId, dataSubjectId).then((r) => r.data),
    enabled: !!organizationId && !!dataSubjectId,
  })
  const person = personData?.data

  const { data: ratData } = useQuery({
    queryKey: ["rat", organizationId],
    queryFn: () => complianceApi.getRat(organizationId).then((r) => r.data),
    enabled: !!organizationId,
  })
  const treatmentActivities: TreatmentActivity[] = (ratData ?? []).filter((a) => a.status === "ACTIVE")

  const dataOptions = [
    "Todos mis datos",
    ...Array.from(new Set(
      treatmentActivities.flatMap((a) => a.dataCategories.map((c) => c.name))
    )).sort(),
  ]

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { email, mode: "other", dataScope: "", description: "", rectField: "", rectNewValue: "", rectReason: "", suppressCause: "", suppressReason: "", suppressConfirm: false, oppositionCause: "", oppositionActivityId: "", oppositionReason: "", portabilityCause: "", portabilityDestination: "", portabilityReason: "", declaration: false },
  })

  const rectField = watch("rectField") as RectifiableField | "" | undefined
  const rectCurrentValue = person && rectField ? getPersonFieldValue(person, rectField) : ""
  const selectedOppositionCause = watch("oppositionCause")

  useEffect(() => {
    const mode =
      selectedRight?.id === "rectification" ? "rectification" :
      selectedRight?.id === "suppression"   ? "suppression" :
      selectedRight?.id === "opposition"    ? "opposition" :
      selectedRight?.id === "portability"   ? "portability" :
      "other"
    setValue("mode", mode)
  }, [selectedRight, setValue])

  async function onSubmit(data: FormData) {
    if (submittingRef.current) return
    if (!selectedRight) {
      toast.error("Selecciona un derecho ARSOP antes de enviar.")
      return
    }
    if (!organizationId || !dataSubjectId) {
      toast.error("Tu cuenta no tiene organización o persona configurada. Contacta al administrador.")
      return
    }

    let description: string
    if (selectedRight.id === "rectification") {
      const fieldDef = RECTIFIABLE_FIELDS.find((f) => f.key === data.rectField)
      description = encodeRectification({
        field: data.rectField as RectifiableField,
        fieldLabel: fieldDef?.label ?? data.rectField ?? "",
        currentValue: rectCurrentValue,
        proposedValue: data.rectNewValue!.trim(),
        reason: data.rectReason!.trim(),
      })
    } else if (selectedRight.id === "suppression") {
      description = encodeSuppression(data.suppressCause as CreateSuppressionDetails["cause"], data.suppressReason!.trim())
    } else if (selectedRight.id === "opposition") {
      const oppositionActivity = treatmentActivities.find((a) => a.id === data.oppositionActivityId)
      description = encodeOpposition({
        cause: data.oppositionCause as CreateOppositionDetails["cause"],
        reason: data.oppositionReason?.trim() || undefined,
        opposedTreatment: oppositionActivity?.name,
        processingPurpose: oppositionActivity?.purpose,
      })
    } else if (selectedRight.id === "portability") {
      description = encodePortability({
        cause: data.portabilityCause as CreatePortabilityDetails["cause"],
        destinationOrganization: data.portabilityDestination?.trim() || undefined,
        reason: data.portabilityReason!.trim(),
      })
    } else {
      description = data.description
        ? `${data.dataScope} — ${data.description}`
        : data.dataScope!
    }

    submittingRef.current = true
    setSubmitting(true)
    try {
      const res = selectedRight.id === "rectification"
        ? await arcoApi.createRectification(
            {
              organizationId,
              dataSubjectId,
              requestType: RIGHT_TO_TYPE[selectedRight.id],
              requestChannel: "WEB_PORTAL",
              description,
            },
            { [data.rectField as RectifiableField]: data.rectNewValue!.trim() }
          )
        : selectedRight.id === "suppression"
        ? await arcoApi.createSuppression(
            {
              organizationId,
              dataSubjectId,
              requestType: RIGHT_TO_TYPE[selectedRight.id],
              requestChannel: "WEB_PORTAL",
              description,
            },
            {
              cause: data.suppressCause as CreateSuppressionDetails["cause"],
              reason: data.suppressReason!.trim(),
            }
          )
        : selectedRight.id === "opposition"
        ? await arcoApi.createOpposition(
            {
              organizationId,
              dataSubjectId,
              requestType: RIGHT_TO_TYPE[selectedRight.id],
              requestChannel: "WEB_PORTAL",
              description,
            },
            {
              cause: data.oppositionCause as CreateOppositionDetails["cause"],
              reason: data.oppositionReason?.trim() || "",
              opposedTreatment: treatmentActivities.find((a) => a.id === data.oppositionActivityId)?.name,
              processingPurpose: treatmentActivities.find((a) => a.id === data.oppositionActivityId)?.purpose,
              treatmentActivityId: data.oppositionActivityId,
            }
          )
        : selectedRight.id === "portability"
        ? await arcoApi.createPortability(
            {
              organizationId,
              dataSubjectId,
              requestType: RIGHT_TO_TYPE[selectedRight.id],
              requestChannel: "WEB_PORTAL",
              description,
            },
            {
              cause: data.portabilityCause as CreatePortabilityDetails["cause"],
              destinationOrganization: data.portabilityDestination?.trim() || undefined,
              reason: data.portabilityReason!.trim(),
            }
          )
        : await arcoApi.create({
            organizationId,
            dataSubjectId,
            requestType: RIGHT_TO_TYPE[selectedRight.id],
            requestChannel: "WEB_PORTAL",
            description,
          })
      if (!res.data?.success || !res.data?.data) {
        toast.error(res.data?.message ?? "No se pudo enviar la solicitud. Intenta nuevamente.")
        return
      }
      const id = res.data.data.id ?? "—"
      if (selectedRight.id === "rectification" && rectFile && id !== "—") {
        try {
          const uploadRes = await arcoApi.uploadRectificationDocument(id, rectFile)
          if (!uploadRes.data.success) {
            toast.error(`Documento no adjuntado: ${uploadRes.data.message ?? "error desconocido"}`)
          }
        } catch (e) {
          const msg = (e as { message?: string })?.message ?? ""
          toast.error(`Documento no adjuntado: ${msg || "error de conexión"}`)
        }
      }
      if (selectedRight.id === "opposition" && oppFile && id !== "—") {
        try {
          const uploadRes = await arcoApi.uploadOppositionDocument(id, oppFile)
          if (!uploadRes.data.success) {
            toast.error(`Documento no adjuntado: ${uploadRes.data.message ?? "error desconocido"}`)
          }
        } catch (e) {
          const msg = (e as { message?: string })?.message ?? ""
          toast.error(`Documento no adjuntado: ${msg || "error de conexión"}`)
        }
      }
      setRequestId(id)
      setSuccessOpen(true)
    } catch {
      toast.error("No se pudo enviar la solicitud. Intenta nuevamente.")
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  function handleSuccessClose() {
    setSuccessOpen(false)
    setSelectedRight(null)
    setRectFile(null)
    setOppFile(null)
    reset({ email, mode: "other", dataScope: "", description: "", rectField: "", rectNewValue: "", rectReason: "", suppressCause: "", suppressReason: "", suppressConfirm: false, oppositionCause: "", oppositionActivityId: "", oppositionReason: "", portabilityCause: "", portabilityDestination: "", portabilityReason: "", declaration: false })
    onSolicitudCreated()
  }

  const activeStyle = selectedRight ? variantStyles[selectedRight.variant] : null

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold" style={{ color: "hsl(var(--foreground))" }}>
          Ejercer un Derecho ARSOP
        </h2>
        <p className="text-sm mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
          Selecciona el derecho que deseas ejercer conforme a la Ley 21.719.
        </p>
      </div>

      {/* ── Split layout: selector izq | formulario der ── */}
      <div
        className="bg-white rounded-2xl shadow-sm border overflow-hidden"
        style={{ borderColor: "hsl(var(--border))" }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-5">
          {/* ── Columna izquierda: selector de derechos (~40%) ── */}
          <div
            className="lg:col-span-2 p-6 space-y-4 lg:border-r"
            style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--muted) / 0.35)" }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              Derechos ARSOP
            </p>

            {/* Rights grid — núcleo ARSOP */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3">
              {rights.filter((r) => r.group === "core").map((right) => {
                const active = selectedRight?.id === right.id
                const vs = variantStyles[right.variant]
                return (
                  <button
                    key={right.id}
                    onClick={() => setSelectedRight(right)}
                    className="flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-4 transition-all duration-150 focus:outline-none focus-visible:ring-2 hover:-translate-y-0.5"
                    style={{
                      borderColor: active ? vs.border : "hsl(var(--border))",
                      background: active ? vs.bg : "white",
                    }}
                  >
                    <span className="text-3xl">{right.icon}</span>
                    <span
                      className="text-xs font-bold"
                      style={{ color: active ? vs.text : "hsl(var(--foreground))" }}
                    >
                      {right.label}
                    </span>
                    <span
                      className="text-xs font-medium"
                      style={{ color: right.urgent ? "hsl(var(--warning))" : "hsl(var(--muted-foreground))" }}
                    >
                      {right.deadline}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Info box */}
            {selectedRight && activeStyle ? (
              <div
                className="rounded-xl px-4 py-3 border-l-4 text-xs leading-relaxed"
                style={{
                  borderColor: activeStyle.infoBorder,
                  background: activeStyle.infoBg,
                  color: activeStyle.infoText,
                }}
              >
                <span className="font-bold">{selectedRight.label}: </span>
                {selectedRight.description}
              </div>
            ) : (
              <div
                className="rounded-xl px-4 py-3 text-xs leading-relaxed"
                style={{
                  background: "hsl(var(--muted))",
                  color: "hsl(var(--muted-foreground))",
                }}
              >
                Selecciona un derecho arriba para ver su descripción y plazo de respuesta.
              </div>
            )}
          </div>

          {/* ── Columna derecha: formulario (~60%) ── */}
          <div className="lg:col-span-3 p-6">
        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* RUT read-only */}
          <div>
            <label
              className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              RUT
            </label>
            <input
              value={rut}
              readOnly
              className="w-full rounded-xl border px-3 py-2.5 text-sm font-mono cursor-not-allowed"
              style={{
                borderColor: "hsl(var(--border))",
                background: "hsl(var(--muted))",
                color: "hsl(var(--muted-foreground))",
              }}
            />
          </div>

          {/* Email */}
          <div>
            <label
              className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              Email de respuesta
            </label>
            <input
              {...register("email")}
              type="email"
              className="w-full rounded-xl border px-3 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2"
              style={{
                borderColor: "hsl(var(--border))",
                background: "white",
              }}
            />
            {errors.email && (
              <p className="text-xs mt-1" style={{ color: "hsl(var(--destructive))" }}>
                {errors.email.message}
              </p>
            )}
          </div>

          {selectedRight?.id === "rectification" ? (
            <>
              {/* Campo a corregir */}
              <div>
                <label
                  className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  Dato que deseas corregir
                </label>
                <select
                  {...register("rectField")}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 bg-white"
                  style={{ borderColor: "hsl(var(--border))" }}
                >
                  <option value="">Selecciona una opción...</option>
                  {RECTIFIABLE_FIELDS.map((f) => (
                    <option key={f.key} value={f.key}>
                      {f.label}
                    </option>
                  ))}
                </select>
                {errors.rectField && (
                  <p className="text-xs mt-1" style={{ color: "hsl(var(--destructive))" }}>
                    {errors.rectField.message}
                  </p>
                )}
              </div>

              {/* Valor actual (solo lectura) */}
              {rectField && (
                <div>
                  <label
                    className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                  >
                    Valor actual registrado
                  </label>
                  <input
                    value={rectCurrentValue || "—"}
                    readOnly
                    className="w-full rounded-xl border px-3 py-2.5 text-sm cursor-not-allowed"
                    style={{
                      borderColor: "hsl(var(--border))",
                      background: "hsl(var(--muted))",
                      color: "hsl(var(--muted-foreground))",
                    }}
                  />
                </div>
              )}

              {/* Valor correcto */}
              <div>
                <label
                  className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  Valor correcto
                </label>
                <input
                  {...register("rectNewValue")}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2"
                  style={{ borderColor: "hsl(var(--border))", background: "white" }}
                  placeholder="Escribe el dato correcto..."
                />
                {errors.rectNewValue && (
                  <p className="text-xs mt-1" style={{ color: "hsl(var(--destructive))" }}>
                    {errors.rectNewValue.message}
                  </p>
                )}
              </div>

              {/* Motivo */}
              <div>
                <label
                  className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  Motivo de la corrección
                </label>
                <textarea
                  {...register("rectReason")}
                  rows={3}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm resize-y focus:outline-none focus:ring-2"
                  style={{ borderColor: "hsl(var(--border))", background: "white" }}
                  placeholder="Explica por qué este dato es incorrecto, incompleto o está desactualizado..."
                />
                {errors.rectReason && (
                  <p className="text-xs mt-1" style={{ color: "hsl(var(--destructive))" }}>
                    {errors.rectReason.message}
                  </p>
                )}
              </div>

              {/* Documento de respaldo (opcional) */}
              <div>
                <label
                  className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  Documento de respaldo (opcional)
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,image/*,application/pdf"
                  className="block w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-border file:text-xs file:font-medium file:bg-muted file:cursor-pointer cursor-pointer"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                  onChange={(e) => setRectFile(e.target.files?.[0] ?? null)}
                />
                {rectFile && (
                  <p className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                    Archivo: <span style={{ color: "hsl(var(--foreground))", fontWeight: 500 }}>{rectFile.name}</span>
                  </p>
                )}
                <p className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                  Puedes adjuntar una imagen o PDF que respalde tu corrección (máx. 10 MB).
                </p>
              </div>
            </>
          ) : selectedRight?.id === "suppression" ? (
            <>
              {/* Aviso de efectos de la supresión */}
              <div
                className="rounded-xl px-4 py-3 border-l-4 text-xs leading-relaxed space-y-1"
                style={{
                  borderColor: "hsl(var(--destructive) / 0.4)",
                  background: "hsl(var(--destructive) / 0.06)",
                  color: "hsl(var(--destructive))",
                }}
              >
                <p className="font-bold">Si tu solicitud es aprobada:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Tus datos quedarán marcados para eliminación.</li>
                  <li>Tu cuenta será desactivada y no podrás volver a iniciar sesión.</li>
                </ul>
                <p>Esta acción puede ser irreversible y solo procede cuando no exista una obligación legal de conservar tus datos.</p>
              </div>

              {/* Causal */}
              <div>
                <label
                  className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  Causal de la solicitud
                </label>
                <select
                  {...register("suppressCause")}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 bg-white"
                  style={{ borderColor: "hsl(var(--border))" }}
                >
                  <option value="">Selecciona una opción...</option>
                  <option value="DATA_NOT_NECESSARY">Mis datos ya no son necesarios para la finalidad con que fueron recopilados</option>
                  <option value="CONSENT_REVOKED">Revoqué el consentimiento que di para el tratamiento</option>
                  <option value="DATA_EXPIRED">Venció el plazo de conservación de mis datos</option>
                </select>
                {errors.suppressCause && (
                  <p className="text-xs mt-1" style={{ color: "hsl(var(--destructive))" }}>
                    {errors.suppressCause.message}
                  </p>
                )}
              </div>

              {/* Motivo */}
              <div>
                <label
                  className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  Motivo de la solicitud de supresión
                </label>
                <textarea
                  {...register("suppressReason")}
                  rows={3}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm resize-y focus:outline-none focus:ring-2"
                  style={{ borderColor: "hsl(var(--border))", background: "white" }}
                  placeholder="Explica por qué solicitas la eliminación de tus datos personales..."
                />
                {errors.suppressReason && (
                  <p className="text-xs mt-1" style={{ color: "hsl(var(--destructive))" }}>
                    {errors.suppressReason.message}
                  </p>
                )}
              </div>

              {/* Confirmación adicional */}
              <div
                className="flex items-start gap-3 rounded-xl p-3"
                style={{ background: "hsl(var(--destructive) / 0.06)" }}
              >
                <input
                  type="checkbox"
                  id="suppressConfirm"
                  {...register("suppressConfirm")}
                  className="mt-0.5 h-4 w-4 rounded"
                  style={{ accentColor: "hsl(var(--destructive))" }}
                />
                <label
                  htmlFor="suppressConfirm"
                  className="text-xs leading-relaxed"
                  style={{ color: "hsl(var(--destructive))" }}
                >
                  Entiendo que, de aprobarse, mis datos quedarán marcados para eliminación y mi
                  cuenta será desactivada.
                </label>
              </div>
              {errors.suppressConfirm && (
                <p className="text-xs" style={{ color: "hsl(var(--destructive))" }}>
                  {errors.suppressConfirm.message}
                </p>
              )}
            </>
          ) : selectedRight?.id === "opposition" ? (
            <>
              {/* Info — diferenciado por causal */}
              <div
                className="rounded-xl px-4 py-3 border-l-4 text-xs leading-relaxed"
                style={{
                  borderColor: selectedOppositionCause === "DIRECT_MARKETING"
                    ? "hsl(36 70% 50% / 0.5)"
                    : "hsl(var(--primary) / 0.4)",
                  background: selectedOppositionCause === "DIRECT_MARKETING"
                    ? "hsl(36 70% 96%)"
                    : "hsl(var(--secondary))",
                  color: selectedOppositionCause === "DIRECT_MARKETING"
                    ? "hsl(36 70% 32%)"
                    : "hsl(var(--primary))",
                }}
              >
                <p className="font-bold">¿En qué consiste?</p>
                {selectedOppositionCause === "DIRECT_MARKETING" ? (
                  <p>
                    La oposición a marketing directo es un <strong>derecho absoluto e incondicional</strong> (Art. 8 Ley 21.719).
                    No necesitas justificar tu solicitud — el tratamiento debe cesar sin que la organización pueda oponerse.
                  </p>
                ) : (
                  <p>
                    Puedes oponerte a que sigamos tratando tus datos para una finalidad específica (Art. 8 Ley 21.719).
                    Selecciona la finalidad que te afecta y la causal legal; evaluaremos si corresponde acoger tu oposición.
                  </p>
                )}
              </div>

              {/* Causal */}
              <div>
                <label
                  className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  Causal de la oposición
                </label>
                <select
                  {...register("oppositionCause")}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 bg-white"
                  style={{ borderColor: "hsl(var(--border))" }}
                >
                  <option value="">Selecciona una opción...</option>
                  <option value="LEGITIMATE_INTEREST">El tratamiento se basa en un interés legítimo del responsable</option>
                  <option value="DIRECT_MARKETING">El tratamiento es para fines de marketing directo</option>
                  <option value="PUBLIC_SOURCE">Mis datos provienen de una fuente de acceso público</option>
                </select>
                {errors.oppositionCause && (
                  <p className="text-xs mt-1" style={{ color: "hsl(var(--destructive))" }}>
                    {errors.oppositionCause.message}
                  </p>
                )}
              </div>

              {/* Finalidad / actividad de tratamiento — filtrada según causal */}
              <div>
                <label
                  className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  Finalidad a la que te opones
                </label>
                {(() => {
                  const filtered = treatmentActivities.filter((a) => {
                    if (a.legalBasis === "CONTRATO" || a.legalBasis === "OBLIGACION_LEGAL") return false
                    if (selectedOppositionCause === "LEGITIMATE_INTEREST") {
                      return a.legalBasis === "INTERES_LEGITIMO" || a.legalBasis === "INTERES_VITAL"
                    }
                    return true
                  })
                  return filtered.length === 0 ? (
                    <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                      {treatmentActivities.length === 0
                        ? "No hay actividades de tratamiento registradas actualmente."
                        : "No hay finalidades opositables para la causal seleccionada."}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {filtered.map((activity) => (
                        <label
                          key={activity.id}
                          className="flex items-start gap-3 rounded-xl border px-3 py-2.5 cursor-pointer transition-colors hover:bg-muted/50"
                          style={{ borderColor: "hsl(var(--border))" }}
                        >
                          <input
                            type="radio"
                            value={activity.id}
                            {...register("oppositionActivityId")}
                            className="mt-0.5 h-4 w-4"
                            style={{ accentColor: "hsl(var(--primary))" }}
                          />
                          <div className="text-xs">
                            <p className="font-semibold" style={{ color: "hsl(var(--foreground))" }}>{activity.name}</p>
                            <p style={{ color: "hsl(var(--muted-foreground))" }}>{activity.purpose}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )
                })()}
                {errors.oppositionActivityId && (
                  <p className="text-xs mt-1" style={{ color: "hsl(var(--destructive))" }}>
                    {errors.oppositionActivityId.message}
                  </p>
                )}
              </div>

              {/* Motivo — obligatorio para interés legítimo/fuente pública, opcional para marketing */}
              <div>
                <label
                  className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  {selectedOppositionCause === "DIRECT_MARKETING"
                    ? "Contexto adicional (opcional)"
                    : "Motivo de la oposición"}
                </label>
                <textarea
                  {...register("oppositionReason")}
                  rows={3}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm resize-y focus:outline-none focus:ring-2"
                  style={{ borderColor: "hsl(var(--border))", background: "white" }}
                  placeholder={
                    selectedOppositionCause === "DIRECT_MARKETING"
                      ? "Puedes añadir contexto si lo deseas, pero no es obligatorio..."
                      : "Explica por qué te opones al tratamiento de tus datos para estas finalidades..."
                  }
                />
                {errors.oppositionReason && (
                  <p className="text-xs mt-1" style={{ color: "hsl(var(--destructive))" }}>
                    {errors.oppositionReason.message}
                  </p>
                )}
              </div>

              {/* Documento de respaldo — solo cuando hay ponderación (no aplica a marketing directo) */}
              {selectedOppositionCause && selectedOppositionCause !== "DIRECT_MARKETING" && (
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>
                    Documento de respaldo <span style={{ color: "hsl(var(--muted-foreground))", fontWeight: 400 }}>(opcional)</span>
                  </label>
                  <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                    Puedes adjuntar cualquier documento que respalde tu oposición (contrato, comunicación, etc.).
                  </p>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    className="block w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium cursor-pointer rounded-xl border px-3 py-2"
                    style={{ color: "hsl(var(--muted-foreground))", borderColor: "hsl(var(--border))" }}
                    onChange={(e) => setOppFile(e.target.files?.[0] ?? null)}
                  />
                  {oppFile && (
                    <p className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                      Archivo: <span style={{ color: "hsl(var(--foreground))", fontWeight: 500 }}>{oppFile.name}</span>
                    </p>
                  )}
                </div>
              )}
            </>
          ) : selectedRight?.id === "portability" ? (
            <>
              {/* Info */}
              <div
                className="rounded-xl px-4 py-3 border-l-4 text-xs leading-relaxed"
                style={{
                  borderColor: "hsl(var(--primary) / 0.4)",
                  background: "hsl(var(--secondary))",
                  color: "hsl(var(--primary))",
                }}
              >
                <p className="font-bold">¿En qué consiste?</p>
                <p>
                  Puedes recibir tus datos en un formato estructurado para transferirlos a otro responsable o para tu
                  propio respaldo (Art. 8 bis Ley 21.719).
                </p>
              </div>

              {/* Causal */}
              <div>
                <label
                  className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  Motivo de la solicitud
                </label>
                <select
                  {...register("portabilityCause")}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 bg-white"
                  style={{ borderColor: "hsl(var(--border))" }}
                >
                  <option value="">Selecciona una opción...</option>
                  {Object.entries(PORTABILITY_CAUSE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                {errors.portabilityCause && (
                  <p className="text-xs mt-1" style={{ color: "hsl(var(--destructive))" }}>
                    {errors.portabilityCause.message}
                  </p>
                )}
              </div>

              {/* Responsable de destino (solo si aplica) */}
              {watch("portabilityCause") === "TRANSFER_TO_OTHER_PROVIDER" && (
                <div>
                  <label
                    className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                  >
                    Responsable al que deseas transferir tus datos
                  </label>
                  <input
                    {...register("portabilityDestination")}
                    className="w-full rounded-xl border px-3 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2"
                    style={{ borderColor: "hsl(var(--border))", background: "white" }}
                    placeholder="Nombre del responsable o empresa de destino..."
                  />
                  {errors.portabilityDestination && (
                    <p className="text-xs mt-1" style={{ color: "hsl(var(--destructive))" }}>
                      {errors.portabilityDestination.message}
                    </p>
                  )}
                </div>
              )}

              {/* Motivo */}
              <div>
                <label
                  className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  Detalle de la solicitud
                </label>
                <textarea
                  {...register("portabilityReason")}
                  rows={3}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm resize-y focus:outline-none focus:ring-2"
                  style={{ borderColor: "hsl(var(--border))", background: "white" }}
                  placeholder="Explica qué datos necesitas y para qué los usarás..."
                />
                {errors.portabilityReason && (
                  <p className="text-xs mt-1" style={{ color: "hsl(var(--destructive))" }}>
                    {errors.portabilityReason.message}
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Data scope */}
              <div>
                <label
                  className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  Alcance de la solicitud
                </label>
                <select
                  {...register("dataScope")}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 bg-white"
                  style={{ borderColor: "hsl(var(--border))" }}
                >
                  <option value="">Selecciona una opción...</option>
                  {dataOptions.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
                {errors.dataScope && (
                  <p className="text-xs mt-1" style={{ color: "hsl(var(--destructive))" }}>
                    {errors.dataScope.message}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label
                  className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  Descripción{" "}
                  <span className="normal-case font-normal tracking-normal">(opcional)</span>
                </label>
                <textarea
                  {...register("description")}
                  rows={3}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm resize-y focus:outline-none focus:ring-2"
                  style={{ borderColor: "hsl(var(--border))", background: "white" }}
                  placeholder="Describe con más detalle tu solicitud si lo necesitas..."
                />
              </div>
            </>
          )}

          {/* Declaration */}
          <div
            className="flex items-start gap-3 rounded-xl p-3"
            style={{ background: "hsl(var(--muted))" }}
          >
            <input
              type="checkbox"
              id="declaration"
              {...register("declaration")}
              className="mt-0.5 h-4 w-4 rounded"
              style={{ accentColor: "hsl(var(--primary))" }}
            />
            <label
              htmlFor="declaration"
              className="text-xs leading-relaxed"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              Declaro que soy el titular de los datos indicados y que la información
              proporcionada es verídica, conforme a la Ley 21.719.
            </label>
          </div>
          {errors.declaration && (
            <p className="text-xs" style={{ color: "hsl(var(--destructive))" }}>
              {errors.declaration.message}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60 flex items-center gap-2"
              style={{
                background: "hsl(var(--primary))",
                color: "hsl(var(--primary-foreground))",
              }}
            >
              {submitting && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              )}
              {submitting ? "Enviando…" : "Enviar solicitud →"}
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedRight(null)
                reset({ email, mode: "other", dataScope: "", description: "", rectField: "", rectNewValue: "", rectReason: "", suppressCause: "", suppressReason: "", suppressConfirm: false, oppositionCause: "", oppositionActivityId: "", oppositionReason: "", portabilityCause: "", portabilityDestination: "", portabilityReason: "", declaration: false })
              }}
              className="px-5 py-2.5 rounded-xl text-sm font-medium border transition-colors hover:bg-muted"
              style={{
                borderColor: "hsl(var(--border))",
                color: "hsl(var(--muted-foreground))",
              }}
            >
              Limpiar
            </button>
          </div>
        </form>
          </div>{/* end right col */}
        </div>{/* end grid */}
      </div>{/* end outer card */}

      {/* Success modal */}
      <Dialog.Root open={successOpen} onOpenChange={(o) => { if (!o) handleSuccessClose() }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm" />
          <Dialog.Content
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center border focus:outline-none"
            style={{ borderColor: "hsl(var(--border))" }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4"
              style={{ background: "hsl(var(--success) / 0.12)" }}
            >
              ✅
            </div>
            <Dialog.Title
              className="text-base font-bold mb-1"
              style={{ color: "hsl(var(--foreground))" }}
            >
              Solicitud enviada
            </Dialog.Title>
            <Dialog.Description
              className="text-xs mb-4 leading-relaxed"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              Tu solicitud de{" "}
              <span className="font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                {selectedRight?.label}
              </span>{" "}
              fue recibida. Tienes{" "}
              <span className="font-semibold">{selectedRight?.deadline}</span> para
              recibir respuesta.
            </Dialog.Description>

            {/* ID de seguimiento */}
            <div
              className="rounded-xl px-4 py-3 mb-4 font-mono text-xs font-bold tracking-wider break-all"
              style={{
                background: "hsl(var(--secondary))",
                color: "hsl(var(--primary))",
              }}
            >
              {requestId}
            </div>
            <p className="text-xs mb-6" style={{ color: "hsl(var(--muted-foreground))" }}>
              Guarda este ID para hacer seguimiento de tu solicitud.
            </p>

            <div className="flex gap-2">
              <button
                onClick={handleSuccessClose}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold"
                style={{
                  background: "hsl(var(--primary))",
                  color: "hsl(var(--primary-foreground))",
                }}
              >
                Ver seguimiento
              </button>
              <button
                onClick={() => setSuccessOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm border font-medium hover:bg-muted"
                style={{
                  borderColor: "hsl(var(--border))",
                  color: "hsl(var(--muted-foreground))",
                }}
              >
                Cerrar
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}

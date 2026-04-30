import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import * as Dialog from "@radix-ui/react-dialog"
import { toast } from "sonner"

type ArcoRight = {
  id: string
  icon: string
  label: string
  deadline: string
  urgent?: boolean
  description: string
  variant: "primary" | "danger" | "warning"
}

const rights: ArcoRight[] = [
  {
    id: "access",
    icon: "🔍",
    label: "Acceso",
    deadline: "15 días hábiles",
    description:
      "Solicita conocer qué datos personales tuyos tenemos registrados, con qué finalidad y a quién los hemos comunicado.",
    variant: "primary",
  },
  {
    id: "rectification",
    icon: "✏️",
    label: "Rectificación",
    deadline: "15 días hábiles",
    description:
      "Solicita corregir datos inexactos, incompletos o desactualizados que tengamos sobre ti.",
    variant: "primary",
  },
  {
    id: "suppression",
    icon: "🗑️",
    label: "Supresión",
    deadline: "15 días hábiles",
    description:
      "Solicita la eliminación de tus datos personales cuando ya no sean necesarios para el fin con que fueron recopilados.",
    variant: "danger",
  },
  {
    id: "opposition",
    icon: "🚫",
    label: "Oposición",
    deadline: "15 días hábiles",
    description:
      "Solicita que dejemos de tratar tus datos para ciertos fines, como marketing directo o elaboración de perfiles.",
    variant: "primary",
  },
  {
    id: "portability",
    icon: "📦",
    label: "Portabilidad",
    deadline: "15 días hábiles",
    description:
      "Recibe tus datos en un formato estructurado para transferirlos a otro responsable.",
    variant: "primary",
  },
  {
    id: "blocking",
    icon: "🔒",
    label: "Bloqueo",
    deadline: "2 días hábiles",
    urgent: true,
    description:
      "Suspensión temporal del tratamiento de tus datos mientras se resuelve una controversia o verificación de exactitud.",
    variant: "warning",
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

const dataOptions = [
  "Todos mis datos",
  "Historial de compras",
  "Datos de salud",
  "Datos de contacto",
  "Programa de fidelización",
  "Datos financieros",
]

const formSchema = z.object({
  email: z.string().email("Email inválido"),
  dataScope: z.string().min(1, "Selecciona una opción"),
  description: z.string().optional(),
  declaration: z
    .boolean()
    .refine((v) => v === true, "Debes aceptar la declaración"),
})

type FormData = z.infer<typeof formSchema>

interface Props {
  rut: string
  email: string
  onSolicitudCreated: () => void
}

export default function TitularArco({ rut, email, onSolicitudCreated }: Props) {
  const [selectedRight, setSelectedRight] = useState<ArcoRight | null>(null)
  const [token, setToken] = useState("")
  const [successOpen, setSuccessOpen] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { email, dataScope: "", description: "", declaration: false },
  })

  function generateToken() {
    const part = () => Math.random().toString(36).slice(2, 8).toUpperCase()
    return `TKN-${part()}-${part()}`
  }

  function onSubmit(_data: FormData) {
    if (!selectedRight) {
      toast.error("Selecciona un derecho ARCO antes de enviar.")
      return
    }
    setToken(generateToken())
    setSuccessOpen(true)
  }

  function handleSuccessClose() {
    setSuccessOpen(false)
    setSelectedRight(null)
    reset({ email, dataScope: "", description: "", declaration: false })
    onSolicitudCreated()
  }

  const activeStyle = selectedRight ? variantStyles[selectedRight.variant] : null

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold" style={{ color: "hsl(var(--foreground))" }}>
          Ejercer un Derecho ARCO
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
              Selecciona un derecho
            </p>

            {/* Rights grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-3">
              {rights.map((right) => {
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
              className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
              style={{
                background: "hsl(var(--primary))",
                color: "hsl(var(--primary-foreground))",
              }}
            >
              Enviar solicitud →
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedRight(null)
                reset({ email, dataScope: "", description: "", declaration: false })
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

            {/* Token */}
            <div
              className="rounded-xl px-4 py-3 mb-4 font-mono text-sm font-bold tracking-widest"
              style={{
                background: "hsl(var(--secondary))",
                color: "hsl(var(--primary))",
              }}
            >
              {token}
            </div>
            <p className="text-xs mb-6" style={{ color: "hsl(var(--muted-foreground))" }}>
              Guarda este código para hacer seguimiento de tu solicitud.
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

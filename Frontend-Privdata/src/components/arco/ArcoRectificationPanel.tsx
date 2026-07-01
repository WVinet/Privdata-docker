import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, FileEdit, CheckCircle2, AlertTriangle, Download, Eye, X } from "lucide-react"
import { personsApi, arcoApi } from "@/lib/api"
import { parseRectification, getPersonFieldValue } from "@/lib/rectification"

interface Props {
  arcoRequestId: string
  dataSubjectId: string
  organizationId: string
  description: string
  supportingDocumentKey?: string | null
  onApplied: (resolutionText: string) => void
}

export default function ArcoRectificationPanel({ arcoRequestId, dataSubjectId, organizationId, description, supportingDocumentKey, onApplied }: Props) {
  const qc = useQueryClient()
  const details = parseRectification(description)

  const { data: personData, isLoading } = useQuery({
    queryKey: ["person", organizationId, dataSubjectId],
    queryFn: () => personsApi.getById(organizationId, dataSubjectId).then(r => r.data),
    enabled: !!details,
  })
  const person = personData?.data

  const [showObsInput, setShowObsInput] = useState(false)
  const [obsText, setObsText] = useState("")
  const [showConfirm, setShowConfirm] = useState(false)

  // Preview modal state
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null)
  const [previewContentType, setPreviewContentType] = useState("")
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState(false)
  const filename = supportingDocumentKey?.split("/").pop() ?? "documento"

  useEffect(() => {
    return () => {
      if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl)
    }
  }, [previewBlobUrl])

  const openPreview = async () => {
    setPreviewOpen(true)
    if (previewBlobUrl) return
    setPreviewLoading(true)
    setPreviewError(false)
    try {
      const res = await arcoApi.downloadRectificationDocument(arcoRequestId)
      const blob = res.data as unknown as Blob
      setPreviewContentType(blob.type || "application/octet-stream")
      setPreviewBlobUrl(URL.createObjectURL(blob))
    } catch {
      setPreviewError(true)
    } finally {
      setPreviewLoading(false)
    }
  }

  const downloadFromPreview = () => {
    if (!previewBlobUrl) return
    const a = document.createElement("a")
    a.href = previewBlobUrl
    a.download = filename
    a.click()
  }

  const applyMutation = useMutation({
    mutationFn: async (observation: string) => {
      if (!details) throw new Error("Datos de la solicitud no disponibles")
      const res = await arcoApi.respondRectification(arcoRequestId, observation)
      if (!res.data.success) throw new Error(res.data.message)
      return observation
    },
    onSuccess: (observation) => {
      qc.invalidateQueries({ queryKey: ["person", organizationId, dataSubjectId] })
      qc.invalidateQueries({ queryKey: ["persons", organizationId] })
      onApplied(`Informe de Rectificación — Art. 11 Ley 21.719\n\n${observation}`)
    },
  })

  if (!details) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Solicitud de rectificación</p>
        <p className="whitespace-pre-line">{description}</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Cargando datos del titular…
      </div>
    )
  }

  const currentLive = person ? getPersonFieldValue(person, details.field) : ""
  const alreadyApplied = currentLive === details.proposedValue

  return (
    <>
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3 text-sm">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <FileEdit className="w-4 h-4 text-primary" />
          Solicitud de rectificación
        </div>

        <div className="rounded-lg bg-background border border-border px-3 py-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
          <div className="col-span-2">
            <span className="text-muted-foreground">Campo:</span>{" "}
            <span className="font-medium text-foreground">{details.fieldLabel}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Valor actual:</span>{" "}
            <span className="font-medium text-foreground">{currentLive || "—"}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Valor propuesto:</span>{" "}
            <span className="font-medium text-foreground">{details.proposedValue}</span>
          </div>
          <div className="col-span-2">
            <span className="text-muted-foreground">Motivo indicado por el titular:</span>{" "}
            <span className="text-foreground">{details.reason}</span>
          </div>
        </div>

        {supportingDocumentKey && (
          <button
            type="button"
            onClick={openPreview}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-border transition-colors hover:bg-muted"
          >
            <Eye className="w-3.5 h-3.5" />
            Ver documento de respaldo del titular
          </button>
        )}

        {alreadyApplied ? (
          <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "hsl(var(--success))" }}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            La corrección ya fue aplicada en los datos del titular.
          </div>
        ) : showObsInput ? (
          <div className="space-y-2">
            <p className="text-xs font-medium text-foreground">Observación / respuesta para el titular *</p>
            <textarea
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              value={obsText}
              onChange={(e) => setObsText(e.target.value)}
            />
            {applyMutation.isError && (
              <p className="text-xs text-destructive">{(applyMutation.error as Error).message}</p>
            )}
            {showConfirm ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 space-y-2">
                <p className="text-xs font-semibold text-amber-800">¿Está seguro que desea aplicar esta corrección?</p>
                <p className="text-xs text-amber-700">Los datos del titular se actualizarán de inmediato. Esta acción no se puede deshacer.</p>
                <div className="flex gap-2">
                  <button type="button"
                    onClick={() => { setShowConfirm(false); applyMutation.mutate(obsText.trim()) }}
                    disabled={applyMutation.isPending}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5"
                    style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
                    {applyMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Sí, aplicar
                  </button>
                  <button type="button" onClick={() => setShowConfirm(false)}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg border border-border transition-colors hover:bg-muted">
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowObsInput(false)}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg border border-border transition-colors hover:bg-muted">
                  Cancelar
                </button>
                <button type="button" onClick={() => setShowConfirm(true)}
                  disabled={!obsText.trim()}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5"
                  style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
                  Confirmar y aplicar
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {applyMutation.isError && (
              <p className="text-xs text-destructive">{(applyMutation.error as Error).message}</p>
            )}
            <button
              type="button"
              onClick={() => {
                setObsText(`Se corrigió el campo "${details.fieldLabel}": de "${currentLive || "—"}" a "${details.proposedValue}".`)
                setShowObsInput(true)
              }}
              className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5"
              style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
            >
              Aplicar corrección
            </button>
            <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              Esto actualizará el dato del titular en el sistema de inmediato. Verifica la solicitud antes de aplicar.
            </p>
          </>
        )}
      </div>

      {/* Document preview modal */}
      {previewOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setPreviewOpen(false)}
        >
          <div
            className="bg-background rounded-xl shadow-2xl flex flex-col"
            style={{ width: "min(92vw, 960px)", height: "min(90vh, 780px)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
              <span className="text-sm font-semibold truncate max-w-[70%]">{filename}</span>
              <div className="flex items-center gap-2">
                {previewBlobUrl && (
                  <button
                    type="button"
                    onClick={downloadFromPreview}
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Descargar
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden rounded-b-xl bg-muted/30">
              {previewLoading && (
                <div className="flex items-center justify-center h-full gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cargando documento…
                </div>
              )}
              {previewError && (
                <div className="flex items-center justify-center h-full text-sm text-destructive">
                  No se pudo cargar el documento.
                </div>
              )}
              {previewBlobUrl && !previewLoading && (
                previewContentType.startsWith("image/") ? (
                  <img
                    src={previewBlobUrl}
                    alt={filename}
                    className="w-full h-full object-contain p-4"
                  />
                ) : previewContentType === "application/pdf" ? (
                  <iframe
                    src={previewBlobUrl}
                    title={filename}
                    className="w-full h-full border-0 rounded-b-xl"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-sm text-muted-foreground">
                    <p>Este tipo de archivo no se puede previsualizar en el navegador.</p>
                    <button
                      type="button"
                      onClick={downloadFromPreview}
                      className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Descargar archivo
                    </button>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

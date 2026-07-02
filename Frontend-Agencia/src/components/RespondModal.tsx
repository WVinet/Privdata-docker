import { useState } from "react"
import { X, Loader2 } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { agencyApi } from "@/lib/api"
import type { AgencyClaim } from "@/types/agencyClaim"

export function RespondModal({ claim, onClose }: { claim: AgencyClaim; onClose: () => void }) {
  const [response, setResponse] = useState("")
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => agencyApi.respond(claim.id, { response }),
    onSuccess: (res) => {
      if (!res.data.success) {
        toast.error(res.data.message || "No se pudo enviar la respuesta")
        return
      }
      toast.success("Respuesta enviada al titular")
      queryClient.invalidateQueries({ queryKey: ["agency-claims"] })
      onClose()
    },
    onError: () => toast.error("No se pudo enviar la respuesta"),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-lg border border-border bg-card shadow-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Responder reclamo</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div className="rounded-md bg-muted px-3 py-2 space-y-1">
            <p className="text-xs text-muted-foreground">Quién reclama</p>
            <p className="text-sm text-foreground">
              {claim.dataSubjectName} · {claim.dataSubjectEmail}
              {claim.dataSubjectRut && ` · ${claim.dataSubjectRut}`}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Tipo de solicitud: {claim.requestType}</p>
          </div>

          {claim.originalResolutionSummary && (
            <div className="rounded-md bg-muted px-3 py-2 space-y-1">
              <p className="text-xs text-muted-foreground">Resolución original de la organización</p>
              <div className="text-sm text-foreground whitespace-pre-wrap overflow-y-auto" style={{ maxHeight: "220px" }}>{claim.originalResolutionSummary}</div>
              {claim.originalResolvedByEmail && (
                <p className="text-xs text-muted-foreground mt-1">
                  Contacto: <span className="font-medium text-foreground">{claim.originalResolvedByEmail}</span>
                </p>
              )}
            </div>
          )}

          <div className="rounded-md bg-muted px-3 py-2 space-y-1">
            <p className="text-xs text-muted-foreground">Motivo del reclamo</p>
            <p className="text-sm text-foreground whitespace-pre-wrap">{claim.claimReason}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="response">Respuesta de la Agencia</Label>
            <textarea
              id="response"
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              rows={5}
              placeholder="Escribe la resolución de la Agencia para este reclamo..."
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-border">
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || response.trim().length === 0}
          >
            {mutation.isPending
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enviando...</>
              : "Enviar respuesta"
            }
          </Button>
        </div>
      </div>
    </div>
  )
}

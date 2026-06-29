import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Shield, Loader2, Eye, EyeOff, CheckCircle2, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/hooks/use-auth"
import { authApi, personsApi, complianceApi } from "@/lib/api"
import type { ConsentDefinition } from "@/types/compliance"

const TOKEN_KEY = "privdata_token"
const USER_KEY  = "privdata_user"

const LEGAL_BASIS_LABEL: Record<string, string> = {
  CONSENTIMIENTO:    "Art. 12 Ley 21.719 — Consentimiento",
  CONTRATO:          "Art. 13 — Ejecución de contrato",
  OBLIGACION_LEGAL:  "Art. 13 — Obligación legal",
  INTERES_LEGITIMO:  "Art. 13 — Interés legítimo",
  INTERES_VITAL:     "Art. 13 — Interés vital",
  FUNCION_PUBLICA:   "Art. 20 — Función pública",
}

export default function CompleteProfilePage() {
  const { getUser } = useAuth()
  const navigate    = useNavigate()
  const authUser    = getUser()

  if (!authUser || authUser.status !== "PENDING") {
    navigate(authUser?.authorities.includes("ROLE_END_USER") ? "/portal" : "/dashboard", { replace: true })
    return null
  }

  return (
    <CompleteProfileForm
      orgId={authUser.organizationId}
      personId={authUser.personId}
      authorities={authUser.authorities}
    />
  )
}

function CompleteProfileForm({
  orgId, personId, authorities,
}: { orgId: string; personId: string; authorities: string[] }) {
  const navigate = useNavigate()

  const [newPwd, setNewPwd]      = useState("")
  const [confirmPwd, setConfirm] = useState("")
  const [showPwd, setShowPwd]    = useState(false)
  const [error, setError]        = useState("")
  const [loading, setLoading]    = useState(false)

  const [consentChecks, setConsentChecks] = useState<Record<string, boolean>>({})

  const { data: personData, isLoading: fetchingPerson } = useQuery({
    queryKey: ["person-complete", orgId, personId],
    queryFn: () => personsApi.getById(orgId, personId).then((r) => r.data),
    enabled: !!orgId && !!personId,
  })

  const { data: definitionsData, isLoading: fetchingDefs } = useQuery({
    queryKey: ["consent-definitions", orgId],
    queryFn: () => complianceApi.getConsentDefinitions(orgId).then((r) => r.data ?? []),
    enabled: !!orgId,
  })

  const definitions: ConsentDefinition[] = definitionsData ?? []
  const person = personData?.data

  useEffect(() => {
    if (definitions.length > 0) {
      setConsentChecks((prev) => {
        const next: Record<string, boolean> = {}
        definitions.forEach((def) => {
          // keep existing state if already set; otherwise required=true, optional=false
          next[def.id] = def.id in prev ? prev[def.id] : def.required
        })
        return next
      })
    }
  }, [definitions])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (newPwd.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres")
      return
    }
    if (newPwd !== confirmPwd) {
      setError("Las contraseñas no coinciden")
      return
    }
    if (!person) {
      setError("No se pudieron cargar los datos del perfil. Recarga la página.")
      return
    }

    setLoading(true)
    try {
      // 1. Activate account — returns new token
      const activateRes = await authApi.activateAccount(newPwd)
      const newToken    = activateRes.data?.data?.token

      if (!newToken) {
        setError("Error al activar la cuenta. Inténtalo de nuevo.")
        setLoading(false)
        return
      }

      // 2. Persist new token and refresh user profile
      sessionStorage.setItem(TOKEN_KEY, newToken)
      const meRes   = await authApi.me()
      const updated = meRes.data?.data
      if (updated) sessionStorage.setItem(USER_KEY, JSON.stringify(updated))

      // 3. Register consent decisions (non-blocking — errors don't prevent navigation)
      if (definitions.length > 0) {
        await Promise.allSettled(
          definitions.map(async (def) => {
            const res = await complianceApi.createConsent({
              organizationId: orgId,
              dataSubjectId:  personId,
              definitionId:   def.id,
              collectionMethod: "WEB_PORTAL",
            })
            // If optional and unchecked, immediately revoke to record the rejection
            const consentId = (res.data?.data as { id?: string })?.id
            if (consentId && !consentChecks[def.id] && !def.required) {
              await complianceApi.revokeConsent(consentId)
            }
          })
        )
      }

      // 4. Redirect
      navigate(authorities.includes("ROLE_END_USER") ? "/portal" : "/dashboard", { replace: true })
    } catch {
      setError("Ocurrió un error al guardar tu perfil. Inténtalo de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  const isLoading = fetchingPerson || fetchingDefs

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-3">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Bienvenido a PrivData</h1>
          <p className="text-sm text-muted-foreground mt-1 text-center">
            Antes de continuar, define tu contraseña personal.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Configura tu contraseña</CardTitle>
            <CardDescription>
              Reemplaza la contraseña temporal por una personal para activar tu cuenta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Read-only name */}
                {person && (
                  <div className="rounded-lg bg-muted px-4 py-3 flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{person.fullName}</p>
                      <p className="text-xs text-muted-foreground">{person.email}</p>
                    </div>
                  </div>
                )}

                {/* New password */}
                <div className="space-y-1.5">
                  <Label htmlFor="newPwd">Nueva contraseña *</Label>
                  <div className="relative">
                    <Input
                      id="newPwd"
                      type={showPwd ? "text" : "password"}
                      placeholder="Mínimo 8 caracteres"
                      value={newPwd}
                      onChange={(e) => setNewPwd(e.target.value)}
                      className="pr-10"
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm password */}
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPwd">Confirmar contraseña *</Label>
                  <Input
                    id="confirmPwd"
                    type={showPwd ? "text" : "password"}
                    placeholder="Repite tu nueva contraseña"
                    value={confirmPwd}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                {/* Consent definitions */}
                {definitions.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">Consentimientos</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Revisa y acepta los consentimientos requeridos para usar el sistema.
                        </p>
                      </div>
                      {definitions.map((def) => (
                        <ConsentItem
                          key={def.id}
                          definition={def}
                          checked={consentChecks[def.id] ?? def.required}
                          onChange={(checked) =>
                            setConsentChecks((prev) => ({ ...prev, [def.id]: checked }))
                          }
                          disabled={loading}
                        />
                      ))}
                    </div>
                  </>
                )}

                {error && (
                  <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || !newPwd || !confirmPwd}
                >
                  {loading
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Guardando...</>
                    : "Guardar y continuar"
                  }
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ConsentItem({
  definition, checked, onChange, disabled,
}: {
  definition: ConsentDefinition
  checked: boolean
  onChange: (v: boolean) => void
  disabled: boolean
}) {
  return (
    <label
      className={`flex gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
        definition.required
          ? "bg-muted/50 border-border cursor-default"
          : checked
          ? "bg-primary/5 border-primary/30"
          : "bg-background border-border hover:bg-muted/30"
      }`}
    >
      <div className="mt-0.5 shrink-0">
        {definition.required ? (
          <Lock className="w-4 h-4 text-muted-foreground" />
        ) : (
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled || definition.required}
            className="w-4 h-4 accent-primary rounded"
          />
        )}
      </div>
      <div className="space-y-0.5 min-w-0">
        <p className="text-sm font-medium text-foreground leading-snug">
          {definition.title}
          {definition.required && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">(requerido)</span>
          )}
        </p>
        {definition.description && (
          <p className="text-xs text-muted-foreground">{definition.description}</p>
        )}
        <p className="text-xs text-muted-foreground/70">
          {LEGAL_BASIS_LABEL[definition.legalBasis] ?? definition.legalBasis}
        </p>
        {definition.required && (
          <p className="text-xs text-muted-foreground italic">
            Este consentimiento es obligatorio para acceder al sistema.
          </p>
        )}
      </div>
    </label>
  )
}

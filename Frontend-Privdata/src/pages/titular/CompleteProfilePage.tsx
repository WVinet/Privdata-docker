import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Shield, Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"
import { authApi, personsApi } from "@/lib/api"

const TOKEN_KEY = "privdata_token"
const USER_KEY  = "privdata_user"

export default function CompleteProfilePage() {
  const { getUser } = useAuth()
  const navigate    = useNavigate()
  const authUser    = getUser()

  if (!authUser || authUser.status !== "PENDING") {
    navigate(authUser?.authorities.includes("ROLE_END_USER") ? "/portal" : "/dashboard", { replace: true })
    return null
  }

  return <CompleteProfileForm orgId={authUser.organizationId} personId={authUser.personId} authorities={authUser.authorities} />
}

function CompleteProfileForm({
  orgId, personId, authorities,
}: { orgId: string; personId: string; authorities: string[] }) {
  const navigate = useNavigate()

  const [rut, setRut]             = useState("")
  const [phone, setPhone]         = useState("")
  const [newPwd, setNewPwd]       = useState("")
  const [confirmPwd, setConfirm]  = useState("")
  const [showPwd, setShowPwd]     = useState(false)
  const [error, setError]         = useState("")
  const [loading, setLoading]     = useState(false)

  const { data: personData, isLoading: fetchingPerson } = useQuery({
    queryKey: ["person-complete", orgId, personId],
    queryFn: () => personsApi.getById(orgId, personId).then((r) => r.data),
    enabled: !!orgId && !!personId,
  })

  const person = personData?.data

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
      // 1. Update person record (RUT and phone)
      if (rut.trim() || phone.trim()) {
        await personsApi.update(orgId, personId, {
          firstName:  person.firstName,
          lastName:   person.lastName,
          email:      person.email ?? undefined,
          position:   person.position ?? undefined,
          rut:        rut.trim() || undefined,
          phone:      phone.trim() || undefined,
        })
      }

      // 2. Activate account — sets new password and status ACTIVE, returns new token
      const activateRes = await authApi.activateAccount(newPwd)
      const newToken = activateRes.data?.data?.token

      if (!newToken) {
        setError("Error al activar la cuenta. Inténtalo de nuevo.")
        setLoading(false)
        return
      }

      // 3. Fetch updated user profile with new token
      sessionStorage.setItem(TOKEN_KEY, newToken)
      const meRes   = await authApi.me()
      const updated = meRes.data?.data
      if (updated) {
        sessionStorage.setItem(USER_KEY, JSON.stringify(updated))
      }

      // 4. Redirect based on role
      const destination = authorities.includes("ROLE_END_USER") ? "/portal" : "/dashboard"
      navigate(destination, { replace: true })
    } catch {
      setError("Ocurrió un error al guardar tu perfil. Inténtalo de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-3">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Completar perfil</h1>
          <p className="text-sm text-muted-foreground mt-1 text-center">
            Bienvenido a PrivData. Completa tu perfil antes de continuar.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Configura tu cuenta</CardTitle>
            <CardDescription>
              Establece una contraseña personal y, opcionalmente, ingresa tu RUT y teléfono.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {fetchingPerson ? (
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

                {/* RUT */}
                <div className="space-y-1.5">
                  <Label htmlFor="rut">RUT <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                  <Input
                    id="rut"
                    placeholder="12.345.678-9"
                    value={rut}
                    onChange={(e) => setRut(e.target.value)}
                    disabled={loading}
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Teléfono <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                  <Input
                    id="phone"
                    placeholder="+56 9 1234 5678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={loading}
                  />
                </div>

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

                {error && (
                  <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading || !newPwd || !confirmPwd}>
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

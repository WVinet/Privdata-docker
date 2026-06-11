import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Shield, Loader2, ArrowLeft, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { authApi } from "@/lib/api"

type Step = "email" | "code"

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep]           = useState<Step>("email")
  const [email, setEmail]         = useState("")
  const [code, setCode]           = useState("")
  const [newPassword, setNewPass] = useState("")
  const [confirm, setConfirm]     = useState("")
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState("")
  const [done, setDone]           = useState(false)

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await authApi.forgotPassword(email)
      if (!res.data.success) {
        setError(res.data.message ?? "Error al enviar el código.")
      } else {
        setStep("code")
      }
    } catch {
      setError("No se pudo conectar con el servidor.")
    } finally {
      setLoading(false)
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (newPassword !== confirm) {
      setError("Las contraseñas no coinciden.")
      return
    }
    if (newPassword.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.")
      return
    }
    setLoading(true)
    try {
      const res = await authApi.resetPassword(email, code, newPassword)
      if (!res.data.success) {
        setError(res.data.message ?? "Código inválido o expirado.")
      } else {
        setDone(true)
      }
    } catch {
      setError("No se pudo conectar con el servidor.")
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-7 h-7 text-green-600" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-foreground">Contraseña actualizada</h2>
          <p className="text-sm text-muted-foreground">
            Tu contraseña fue cambiada correctamente. Ya puedes iniciar sesión.
          </p>
          <Button className="w-full" onClick={() => navigate("/login")}>
            Ir al inicio de sesión
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-3">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">PrivData</h1>
          <p className="text-sm text-muted-foreground mt-1">Cumplimiento · Ley 21.719</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              {step === "email" ? "Recuperar contraseña" : "Ingresa el código"}
            </CardTitle>
            <CardDescription>
              {step === "email"
                ? "Te enviaremos un código de 6 dígitos a tu correo."
                : `Código enviado a ${email}. Válido por 15 minutos.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === "email" ? (
              <form onSubmit={handleSendCode} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="usuario@empresa.cl"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                {error && (
                  <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enviando...</>
                    : "Enviar código"
                  }
                </Button>

                <div className="text-center">
                  <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1">
                    <ArrowLeft className="w-3 h-3" />
                    Volver al inicio de sesión
                  </Link>
                </div>
              </form>
            ) : (
              <form onSubmit={handleReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Código de verificación</Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    maxLength={6}
                    required
                    disabled={loading}
                    className="font-mono tracking-widest text-center text-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nueva contraseña</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPass(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirmar contraseña</Label>
                  <Input
                    id="confirm"
                    type="password"
                    placeholder="Repite la contraseña"
                    value={confirm}
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

                <Button type="submit" className="w-full" disabled={loading || code.length < 6}>
                  {loading
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Actualizando...</>
                    : "Cambiar contraseña"
                  }
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => { setStep("email"); setError(""); setCode("") }}
                    className="text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 mx-auto"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    Cambiar correo
                  </button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

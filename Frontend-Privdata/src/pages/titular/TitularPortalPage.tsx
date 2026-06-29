import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Toaster, toast } from "sonner"
import { Loader2, Pencil, X } from "lucide-react"
import { personsApi, complianceApi } from "@/lib/api"
import { formatRut } from "@/lib/rut"
// import { validateRut } from "@/lib/rut" // validación de dígito verificador desactivada temporalmente
import { useAuth } from "@/hooks/use-auth"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import TitularPortalLayout, { type TitularTab } from "@/components/titular/TitularPortalLayout"
import TitularInicio from "@/components/titular/TitularInicio"
import TitularConsentimientos from "@/components/titular/TitularConsentimientos"
import TitularArco from "@/components/titular/TitularArco"
import TitularSeguimiento from "@/components/titular/TitularSeguimiento"

const VALID_TABS: TitularTab[] = ["inicio", "consentimientos", "arco", "seguimiento"]

export default function TitularPortalPage() {
  const { getUser, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()

  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam  = searchParams.get("tab")
  const activeTab: TitularTab = VALID_TABS.includes(tabParam as TitularTab) ? (tabParam as TitularTab) : "inicio"

  // Mantiene la pestaña activa en la URL para que sobreviva a un recargo de página
  const setActiveTab = (tab: TitularTab) => {
    setSearchParams(tab === "inicio" ? {} : { tab }, { replace: true })
  }

  const authUser = getUser()

  if (!isAuthenticated() || !authUser) {
    navigate("/login", { replace: true })
    return null
  }

  const orgId    = authUser.organizationId
  const personId = authUser.personId

  if (!orgId || !personId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <p className="text-sm font-medium">Perfil incompleto</p>
          <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
            Tu cuenta no tiene organización o persona asociada. Contacta al administrador.
          </p>
          <button
            onClick={logout}
            className="mt-4 text-xs underline"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    )
  }

  return (
    <TitularPortalContent
      orgId={orgId}
      personId={personId}
      email={authUser.email}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onLogout={logout}
    />
  )
}

// Separado para poder usar hooks después del guard
function TitularPortalContent({
  orgId,
  personId,
  email,
  activeTab,
  setActiveTab,
  onLogout,
}: {
  orgId: string
  personId: string
  email: string
  activeTab: TitularTab
  setActiveTab: (t: TitularTab) => void
  onLogout: () => void
}) {
  const queryClient = useQueryClient()
  const [editOpen,  setEditOpen]  = useState(false)
  const [editRut,   setEditRut]   = useState("")
  const [editPhone, setEditPhone] = useState("")

  const { data: personData, isLoading } = useQuery({
    queryKey: ["person-me", orgId, personId],
    queryFn: () => personsApi.getById(orgId, personId).then((r) => r.data),
    enabled: !!orgId && !!personId,
  })

  const { data: pendingData } = useQuery({
    queryKey: ["consents-pending", orgId, personId],
    queryFn: () => complianceApi.getPendingConsents(orgId, personId).then((r) => r.data ?? []),
    enabled: !!orgId && !!personId,
    refetchOnWindowFocus: true,
  })

  const updateMutation = useMutation({
    mutationFn: () => {
      const p = personData?.data
      if (!p) throw new Error("Perfil no cargado")
      return personsApi.update(orgId, personId, {
        firstName: p.firstName,
        lastName:  p.lastName,
        email:     p.email     ?? undefined,
        position:  p.position  ?? undefined,
        rut:       editRut.trim()   || undefined,
        phone:     editPhone.trim() || undefined,
      })
    },
    onSuccess: () => {
      toast.success("Datos actualizados correctamente.")
      queryClient.invalidateQueries({ queryKey: ["person-me", orgId, personId] })
      setEditOpen(false)
    },
    onError: () => toast.error("Error al actualizar. Intenta nuevamente."),
  })

  // Validación de dígito verificador desactivada temporalmente
  const editRutValid = true /* editRut.trim() === "" || validateRut(editRut) */

  function openEdit() {
    const p = personData?.data
    setEditRut(p?.rut ?? "")
    setEditPhone(p?.phone ?? "")
    setEditOpen(true)
  }

  const pendingConsentsCount = pendingData?.length ?? 0
  const person = personData?.data

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const displayName  = person?.fullName ?? email
  const displayRut   = person?.rut ?? "—"
  const lastAccess   = new Date().toLocaleDateString("es-CL", {
    day: "2-digit", month: "long", year: "numeric",
  })

  function handleArcoSolicitudCreated() {
    setActiveTab("seguimiento")
  }

  return (
    <>
      <Toaster position="bottom-right" />

      {/* Modal: editar datos personales */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-foreground">Editar mis datos</p>
              <button onClick={() => setEditOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>RUT</Label>
                <Input
                  placeholder="12.345.678-9"
                  value={editRut}
                  onChange={(e) => setEditRut(formatRut(e.target.value))}
                  disabled={updateMutation.isPending}
                />
                {!editRutValid && (
                  <p className="text-xs text-destructive">RUT inválido</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Teléfono</Label>
                <Input
                  placeholder="+56 9 1234 5678"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  disabled={updateMutation.isPending}
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setEditOpen(false)} disabled={updateMutation.isPending}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending || !editRutValid}>
                {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Guardar
              </Button>
            </div>
          </div>
        </div>
      )}

      <TitularPortalLayout
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userName={displayName}
        email={email}
        onLogout={onLogout}
        pendingConsentsCount={pendingConsentsCount}
      >
        {activeTab === "inicio" && (
          <>
            {displayRut === "—" && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-center justify-between gap-3 mb-2">
                <p className="text-sm text-amber-700">
                  Tu perfil está incompleto. Agrega tu RUT para poder usar todas las funciones.
                </p>
                <button
                  onClick={openEdit}
                  className="shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors"
                >
                  <Pencil className="w-3 h-3" />
                  Actualizar
                </button>
              </div>
            )}
            <TitularInicio
              organizationId={orgId}
              dataSubjectId={personId}
              name={displayName}
              rut={displayRut}
              email={email}
              onNavigate={setActiveTab}
            />
          </>
        )}
        {activeTab === "consentimientos" && (
          <TitularConsentimientos
            dataSubjectId={personId}
            organizationId={orgId}
          />
        )}
        {activeTab === "arco" && (
          <TitularArco
            rut={displayRut}
            email={email}
            organizationId={orgId}
            dataSubjectId={personId}
            onSolicitudCreated={handleArcoSolicitudCreated}
          />
        )}
        {activeTab === "seguimiento" && (
          <TitularSeguimiento
            organizationId={orgId}
            dataSubjectId={personId}
          />
        )}
      </TitularPortalLayout>
    </>
  )
}

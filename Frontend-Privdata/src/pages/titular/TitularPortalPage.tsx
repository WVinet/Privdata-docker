import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Toaster } from "sonner"
import { Loader2 } from "lucide-react"
import { personsApi } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import TitularPortalLayout, { type TitularTab } from "@/components/titular/TitularPortalLayout"
import TitularInicio from "@/components/titular/TitularInicio"
import TitularConsentimientos from "@/components/titular/TitularConsentimientos"
import TitularArco from "@/components/titular/TitularArco"
import TitularSeguimiento from "@/components/titular/TitularSeguimiento"

export default function TitularPortalPage() {
  const { getUser, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TitularTab>("inicio")

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
  const { data: personData, isLoading } = useQuery({
    queryKey: ["person-me", orgId, personId],
    queryFn: () => personsApi.getById(orgId, personId).then((r) => r.data),
    enabled: !!orgId && !!personId,
  })

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
      <TitularPortalLayout
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userName={displayName}
        rut={displayRut}
        lastAccess={lastAccess}
        onLogout={onLogout}
      >
        {activeTab === "inicio" && (
          <TitularInicio
            data={{
              name: displayName,
              rut: displayRut,
              email,
              lastAccess,
              solicitudes: [],
              consents: [],
            }}
            onNavigate={setActiveTab}
          />
        )}
        {activeTab === "consentimientos" && (
          <TitularConsentimientos consents={[]} />
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

import { useState } from "react"
import { Toaster } from "sonner"
import { mockTitularPortal } from "@/lib/mock-data"
import TitularPortalLayout, { type TitularTab } from "@/components/titular/TitularPortalLayout"
import TitularInicio from "@/components/titular/TitularInicio"
import TitularConsentimientos from "@/components/titular/TitularConsentimientos"
import TitularArco from "@/components/titular/TitularArco"
import TitularSeguimiento from "@/components/titular/TitularSeguimiento"

// En producción, este dato vendría de una llamada a la API:
// const { data } = useQuery({ queryKey: ['titular', id], queryFn: () => api.get(`/titular/${id}`) })
const data = mockTitularPortal

export default function TitularPortalPage() {
  const [activeTab, setActiveTab] = useState<TitularTab>("inicio")

  function handleArcoSolicitudCreated() {
    setActiveTab("seguimiento")
  }

  return (
    <>
      <Toaster position="bottom-right" />
      <TitularPortalLayout
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userName={data.name}
        rut={data.rut}
        lastAccess={data.lastAccess}
      >
        {activeTab === "inicio" && (
          <TitularInicio data={data} onNavigate={setActiveTab} />
        )}
        {activeTab === "consentimientos" && (
          <TitularConsentimientos consents={data.consents} />
        )}
        {activeTab === "arco" && (
          <TitularArco
            rut={data.rut}
            email={data.email}
            onSolicitudCreated={handleArcoSolicitudCreated}
          />
        )}
        {activeTab === "seguimiento" && (
          <TitularSeguimiento solicitudes={data.solicitudes} />
        )}
      </TitularPortalLayout>
    </>
  )
}

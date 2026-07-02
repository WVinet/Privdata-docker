import { Outlet, Navigate } from "react-router-dom"
import { AppSidebar } from "@/components/AppSidebar"
import { useAuth } from "@/hooks/use-auth"
import { useState } from "react"
import { Menu } from "lucide-react"
import { Toaster } from "sonner"

export function AppLayout() {
  const { isAuthenticated, getUser } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  const user = getUser()
  if (user?.status === "PENDING") {
    return <Navigate to="/completar-perfil" replace />
  }

  const authorities = user?.authorities ?? []

  // Cuentas de auditor de la Agencia no pertenecen a este portal — usan Frontend-Agencia
  if (authorities.includes("ROLE_AGENCY_AUDITOR")) {
    sessionStorage.removeItem("privdata_token")
    sessionStorage.removeItem("privdata_user")
    return <Navigate to="/login" replace />
  }

  const isEndUser =
    authorities.includes("ROLE_END_USER") ||
    // Fallback: no tiene ningún permiso de gestión interna
    (!authorities.some((a) =>
      ["USER_VIEW", "ARCO_RESOLVE", "RAT_VIEW", "AUDIT_VIEW"].includes(a)
    ) && authorities.some((a) => a.startsWith("ARCO_")))

  if (isEndUser) {
    return <Navigate to="/portal" replace />
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        {/* Header — mobile: hamburguesa + logo | desktop: título del sistema */}
        <header className="h-14 border-b border-border flex items-center px-4 md:px-6 shrink-0 bg-card gap-3">
          {/* Botón hamburguesa — solo mobile */}
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo mobile — visible solo cuando no hay sidebar */}
          <div className="md:hidden flex items-center gap-2">
            <div
              className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-black"
              style={{
                background: "hsl(var(--primary))",
                color: "hsl(var(--primary-foreground))",
              }}
            >
              PD
            </div>
            <span className="text-sm font-semibold text-foreground">PrivData</span>
          </div>

          {/* Acento + título — solo desktop */}
          <div
            className="hidden md:block w-1 h-5 rounded-full"
            style={{ background: "hsl(var(--primary))" }}
          />
          <p className="hidden md:block text-sm text-muted-foreground">
            Sistema de Gestión — Protección de Datos Personales · Ley 21.719
          </p>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
      <Toaster richColors position="top-right" />
    </div>
  )
}

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { AppLayout } from "@/components/AppLayout"

// Públicas
import LoginPage from "@/pages/LoginPage"
import ForgotPasswordPage from "@/pages/ForgotPasswordPage"
import NotFound from "@/pages/NotFound"

// Titular
import TitularPortalPage from "@/pages/titular/TitularPortalPage"
import CompleteProfilePage from "@/pages/titular/CompleteProfilePage"

// Admin — módulos operativos
import DashboardPage from "@/pages/admin/DashboardPage"
import TitularesPage from "@/pages/admin/TitularesPage"
import ConsentsPage from "@/pages/admin/ConsentsPage"
import ArcoPage from "@/pages/admin/ArcoPage"
import AuditPage from "@/pages/admin/AuditPage"
import DeactivatedAccountsPage from "@/pages/admin/DeactivatedAccountsPage"
import RatPage from "@/pages/admin/RatPage"
import TercerosPage from "@/pages/admin/TercerosPage"

// Admin — mantenedores
import OrganizacionPage   from "@/pages/admin/OrganizacionPage"
import DepartamentosPage  from "@/pages/admin/DepartamentosPage"
import CargosPage         from "@/pages/admin/CargosPage"
import UsersPage from "@/pages/admin/UsersPage"

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Rutas públicas */}
          <Route path="/login"                  element={<LoginPage />} />
          <Route path="/recuperar-contrasena"   element={<ForgotPasswordPage />} />

          {/* Rutas del titular */}
          <Route path="/portal"            element={<TitularPortalPage />} />
          <Route path="/completar-perfil"  element={<CompleteProfilePage />} />

          {/* Rutas admin (AppLayout verifica auth y rol) */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard"       element={<DashboardPage />} />
            <Route path="/titulares"       element={<TitularesPage />} />
            <Route path="/consentimientos" element={<ConsentsPage />} />
            <Route path="/arco"            element={<ArcoPage />} />
            <Route path="/rat"             element={<RatPage />} />
            <Route path="/cuentas-desactivadas" element={<DeactivatedAccountsPage />} />
            <Route path="/auditoria"       element={<AuditPage />} />

            <Route path="/compliance/terceros" element={<TercerosPage />} />

            <Route path="/admin/organizacion"   element={<OrganizacionPage />} />
            <Route path="/admin/departamentos" element={<DepartamentosPage />} />
            <Route path="/admin/cargos"        element={<CargosPage />} />
            <Route path="/admin/usuarios"      element={<UsersPage />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App

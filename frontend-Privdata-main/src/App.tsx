import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { AppLayout } from "@/components/AppLayout"
import LoginPage from "@/pages/LoginPage"
import DashboardPage from "@/pages/DashboardPage"
import UsersPage from "@/pages/UsersPage"
import TitularesPage from "@/pages/TitularesPage"
import ConsentsPage from "@/pages/ConsentsPage"
import ArcoPage from "@/pages/ArcoPage"
import AuditPage from "@/pages/AuditPage"
import TitularPortalPage from "@/pages/TitularPortalPage"
import NotFound from "@/pages/NotFound"
import RolesPage from "@/pages/RolesPage"

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Redirect raíz a login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Ruta pública */}
          <Route path="/login" element={<LoginPage />} />

          {/* Portal del Titular — layout propio, sin auth de admin */}
          <Route path="/portal" element={<TitularPortalPage />} />

          {/* Rutas protegidas (AppLayout verifica auth) */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard"       element={<DashboardPage />} />
            <Route path="/usuarios"        element={<UsersPage />} />
            <Route path="/titulares"       element={<TitularesPage />} />
            <Route path="/consentimientos" element={<ConsentsPage />} />
            <Route path="/arco"            element={<ArcoPage />} />
            <Route path="/auditoria"       element={<AuditPage />} />
            <Route path="/roles" element={<RolesPage />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App

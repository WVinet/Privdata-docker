import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { AppLayout } from "@/components/AppLayout"

import LoginPage from "@/pages/LoginPage"
import NotFound from "@/pages/NotFound"
import ReclamosPage from "@/pages/ReclamosPage"
import SolicitudesPage from "@/pages/SolicitudesPage"
import HistorialPage from "@/pages/HistorialPage"

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/solicitudes" replace />} />

          <Route path="/login" element={<LoginPage />} />

          <Route element={<AppLayout />}>
            <Route path="/solicitudes" element={<SolicitudesPage />} />
            <Route path="/reclamos" element={<ReclamosPage />} />
            <Route path="/historial" element={<HistorialPage />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App

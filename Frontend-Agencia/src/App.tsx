import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { AppLayout } from "@/components/AppLayout"

import LoginPage from "@/pages/LoginPage"
import NotFound from "@/pages/NotFound"
import ReclamosPage from "@/pages/ReclamosPage"
import HistorialPage from "@/pages/HistorialPage"

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />

          <Route path="/login" element={<LoginPage />} />

          <Route element={<AppLayout />}>
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

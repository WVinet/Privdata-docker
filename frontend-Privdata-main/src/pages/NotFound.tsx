import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-center px-4">
      <h1 className="text-6xl font-bold text-foreground">404</h1>
      <p className="text-xl text-muted-foreground mt-2">Página no encontrada</p>
      <p className="text-sm text-muted-foreground mt-1 mb-6">
        La ruta que buscas no existe en este sistema.
      </p>
      <Button asChild>
        <Link to="/dashboard">Volver al Dashboard</Link>
      </Button>
    </div>
  )
}

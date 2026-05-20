import { useLocation, Link } from "react-router-dom"
import {
  LayoutDashboard,
  Users,
  UserCheck,
  FileCheck,
  ClipboardList,
  DatabaseZap,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { useState } from "react"
import { ShieldCheck } from "lucide-react"

interface NavItem {
  label: string
  path: string
  icon: React.ElementType
}

const navItems: NavItem[] = [
  { label: "Dashboard",          path: "/dashboard",        icon: LayoutDashboard },
  { label: "Usuarios",           path: "/usuarios",         icon: Users },
  { label: "Titulares",          path: "/titulares",        icon: UserCheck },
  { label: "Consentimientos",    path: "/consentimientos",  icon: FileCheck },
  { label: "Solicitudes ARCO",   path: "/arco",             icon: ClipboardList },
  { label: "Auditoría",          path: "/auditoria",        icon: DatabaseZap },
  { label: "Roles y permisos", path: "/roles", icon: ShieldCheck },
]

interface AppSidebarProps {
  /** Mobile drawer: open state */
  mobileOpen?: boolean
  /** Mobile drawer: close callback */
  onMobileClose?: () => void
}

export function AppSidebar({ mobileOpen = false, onMobileClose }: AppSidebarProps) {
  const location = useLocation()
  const { logout, getUser } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const user = getUser()

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <aside
      className={cn(
        "flex flex-col h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300",
        mobile ? "w-72" : collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-sidebar-border shrink-0">
        {(!collapsed || mobile) && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-black shrink-0 bg-sidebar-primary text-sidebar-primary-foreground">
              PD
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-sidebar-accent-foreground leading-tight">PrivData</p>
              <p className="text-xs text-sidebar-foreground/60 leading-tight">Ley 21.719</p>
            </div>
          </div>
        )}
        {collapsed && !mobile && (
          <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-black mx-auto bg-sidebar-primary text-sidebar-primary-foreground">
            PD
          </div>
        )}
        {mobile ? (
          <button
            onClick={onMobileClose}
            className="p-1 rounded hover:bg-sidebar-accent transition-colors text-sidebar-foreground/60 hover:text-sidebar-accent-foreground ml-auto"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => setCollapsed((c) => !c)}
            className={cn(
              "p-1 rounded hover:bg-sidebar-accent transition-colors text-sidebar-foreground/60 hover:text-sidebar-accent-foreground",
              collapsed && "mx-auto mt-0"
            )}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4">
        {(!collapsed || mobile) && (
          <p className="px-4 mb-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/40">
            Módulos
          </p>
        )}
        <ul className="space-y-1 px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            const Icon = item.icon
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={mobile ? onMobileClose : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                    collapsed && !mobile && "justify-center px-2"
                  )}
                  title={collapsed && !mobile ? item.label : undefined}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {(!collapsed || mobile) && <span>{item.label}</span>}
                </Link>
              </li>
            )
          })}
        </ul>

        {/*
          ── MANTENEDORES (próximas versiones) ──────────────────────────────
          Aquí se agregarán los módulos de mantenimiento cuando estén listos:
          - Roles          → /admin/roles
          - Permisos       → /admin/permisos
          - Configuración  → /admin/configuracion
          Mantener esta sección separada de los módulos operativos de arriba.
          ──────────────────────────────────────────────────────────────────
        */}
      </nav>

      {/* DEV — Acceso al Portal Titular (solo desarrollo) */}
      <div className="border-t border-sidebar-border px-2 py-2 shrink-0">
        <Link
          to="/portal"
          onClick={mobile ? onMobileClose : undefined}
          title="Portal Titular (DEV)"
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-md text-xs transition-colors text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            collapsed && !mobile && "justify-center px-2"
          )}
        >
          <Eye className="w-4 h-4 shrink-0" />
          {(!collapsed || mobile) && (
            <>
              <span>Portal Titular</span>
              <span
                className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded"
                style={{
                  background: "hsl(var(--sidebar-primary))",
                  color: "hsl(var(--sidebar-primary-foreground))",
                }}
              >
                DEV
              </span>
            </>
          )}
        </Link>
      </div>

      {/* Footer — usuario */}
      <div className="border-t border-sidebar-border p-3 shrink-0">
        {collapsed && !mobile ? (
          <button
            onClick={logout}
            className="w-full flex justify-center p-2 rounded hover:bg-sidebar-accent transition-colors text-sidebar-foreground/60 hover:text-destructive"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center text-xs font-bold text-white shrink-0">
              {user?.email ? user.email[0].toUpperCase() : "??"}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-semibold text-sidebar-accent-foreground truncate">{user?.email}</p>
              <p className="text-xs text-sidebar-foreground/50 truncate capitalize">
                {user?.authorities?.find((a) => a.startsWith("ROLE_"))?.replace("ROLE_", "").toLowerCase() ?? "usuario"}
              </p>
            </div>
            <button
              onClick={logout}
              className="p-1 rounded hover:bg-sidebar-accent transition-colors text-sidebar-foreground/60 hover:text-destructive"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  )

  return (
    <>
      {/* Desktop sidebar — oculto en mobile */}
      <div className="hidden md:flex h-screen shrink-0">
        <SidebarContent />
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onMobileClose}
          />
          {/* Drawer panel */}
          <div className="relative z-50 flex h-full">
            <SidebarContent mobile />
          </div>
        </div>
      )}
    </>
  )
}

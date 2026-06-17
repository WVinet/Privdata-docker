import { useLocation, Link } from "react-router-dom"
import { Inbox, History, LogOut, ChevronLeft, ChevronRight, X, Landmark } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { useState } from "react"

interface NavItem {
  label: string
  path: string
  icon: React.ElementType
}

const navItems: NavItem[] = [
  { label: "Reclamos",  path: "/reclamos",  icon: Inbox },
  { label: "Historial", path: "/historial", icon: History },
]

function NavLink({ item, collapsed, mobile, onMobileClose }: {
  item: NavItem
  collapsed: boolean
  mobile: boolean
  onMobileClose?: () => void
}) {
  const location = useLocation()
  const isActive = location.pathname === item.path
  const Icon = item.icon
  return (
    <li>
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
}

interface AppSidebarProps {
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export function AppSidebar({ mobileOpen = false, onMobileClose }: AppSidebarProps) {
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
            <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 bg-sidebar-primary text-sidebar-primary-foreground">
              <Landmark className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-sidebar-accent-foreground leading-tight">Agencia</p>
              <p className="text-xs text-sidebar-foreground/60 leading-tight">Protección de Datos</p>
            </div>
          </div>
        )}
        {collapsed && !mobile && (
          <div className="w-6 h-6 rounded-md flex items-center justify-center mx-auto bg-sidebar-primary text-sidebar-primary-foreground">
            <Landmark className="w-4 h-4" />
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
        <div>
          {(!collapsed || mobile) && (
            <p className="px-4 mb-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/40">
              Solicitudes ARCO
            </p>
          )}
          <ul className="space-y-1 px-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                item={item}
                collapsed={collapsed}
                mobile={mobile}
                onMobileClose={onMobileClose}
              />
            ))}
          </ul>
        </div>
      </nav>

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
              <p className="text-xs text-sidebar-foreground/50 truncate">Auditor</p>
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
      <div className="hidden md:flex h-screen shrink-0">
        <SidebarContent />
      </div>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onMobileClose}
          />
          <div className="relative z-50 flex h-full">
            <SidebarContent mobile />
          </div>
        </div>
      )}
    </>
  )
}

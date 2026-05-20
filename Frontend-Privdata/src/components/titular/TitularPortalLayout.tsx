import { useState, type ReactNode } from "react"
import { Home, Bell, Scale, ClipboardList, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"

export type TitularTab = "inicio" | "consentimientos" | "arco" | "seguimiento"

interface TitularPortalLayoutProps {
  activeTab: TitularTab
  onTabChange: (tab: TitularTab) => void
  userName: string
  rut: string
  lastAccess: string
  children: ReactNode
}

const navItems: { id: TitularTab; label: string; Icon: React.ElementType }[] = [
  { id: "inicio",          label: "Inicio",          Icon: Home },
  { id: "consentimientos", label: "Consentimientos",  Icon: Bell },
  { id: "arco",            label: "Derechos ARCO",    Icon: Scale },
  { id: "seguimiento",     label: "Seguimiento",      Icon: ClipboardList },
]

function SidebarContent({
  activeTab,
  onTabChange,
  userName,
  rut,
  lastAccess,
  onClose,
}: Omit<TitularPortalLayoutProps, "children"> & { onClose?: () => void }) {
  const formattedAccess = new Date(lastAccess).toLocaleString("es-CL", {
    dateStyle: "short",
    timeStyle: "short",
  })

  return (
    <div className="flex flex-col h-full" style={{ background: "hsl(var(--primary))" }}>
      {/* Brand */}
      <div
        className="flex items-center justify-between px-5 py-4 border-b"
        style={{ borderColor: "hsl(var(--primary-foreground) / 0.12)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0"
            style={{ background: "hsl(var(--accent))", color: "hsl(var(--accent-foreground))" }}
          >
            PD
          </div>
          <div>
            <p className="text-sm font-bold leading-tight" style={{ color: "hsl(var(--primary-foreground))" }}>
              PrivData
            </p>
            <p className="text-xs leading-tight" style={{ color: "hsl(var(--primary-foreground) / 0.55)" }}>
              Ley 21.719
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg lg:hidden"
            style={{ color: "hsl(var(--primary-foreground) / 0.7)" }}
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        <p
          className="px-3 mb-2 text-xs font-semibold uppercase tracking-widest"
          style={{ color: "hsl(var(--primary-foreground) / 0.4)" }}
        >
          Mi portal
        </p>
        {navItems.map(({ id, label, Icon }) => {
          const isActive = activeTab === id
          return (
            <button
              key={id}
              onClick={() => { onTabChange(id); onClose?.() }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left"
              )}
              style={{
                background: isActive ? "hsl(var(--primary-foreground) / 0.15)" : "transparent",
                color: isActive
                  ? "hsl(var(--primary-foreground))"
                  : "hsl(var(--primary-foreground) / 0.6)",
              }}
              onMouseEnter={(e) => {
                if (!isActive)
                  (e.currentTarget as HTMLElement).style.background =
                    "hsl(var(--primary-foreground) / 0.08)"
              }}
              onMouseLeave={(e) => {
                if (!isActive)
                  (e.currentTarget as HTMLElement).style.background = "transparent"
              }}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{label}</span>
              {isActive && (
                <span
                  className="ml-auto w-1.5 h-1.5 rounded-full"
                  style={{ background: "hsl(var(--accent))" }}
                />
              )}
            </button>
          )
        })}
      </nav>

      {/* Titular footer */}
      <div
        className="px-4 py-4 border-t"
        style={{ borderColor: "hsl(var(--primary-foreground) / 0.12)" }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0"
            style={{ background: "hsl(var(--accent))", color: "hsl(var(--accent-foreground))" }}
          >
            {userName.split(" ").map((n) => n[0]).slice(0, 2).join("")}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold truncate" style={{ color: "hsl(var(--primary-foreground))" }}>
              {userName}
            </p>
            <p className="text-xs font-mono" style={{ color: "hsl(var(--primary-foreground) / 0.55)" }}>
              {rut}
            </p>
          </div>
        </div>
        <p className="text-xs" style={{ color: "hsl(var(--primary-foreground) / 0.4)" }}>
          Último acceso: {formattedAccess}
        </p>
      </div>
    </div>
  )
}

export default function TitularPortalLayout({
  activeTab,
  onTabChange,
  userName,
  rut,
  lastAccess,
  children,
}: TitularPortalLayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "hsl(var(--background))" }}>
      {/* Sidebar desktop lg+ */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 h-screen overflow-y-auto">
        <SidebarContent
          activeTab={activeTab}
          onTabChange={onTabChange}
          userName={userName}
          rut={rut}
          lastAccess={lastAccess}
        />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-64 z-50 shadow-2xl">
            <SidebarContent
              activeTab={activeTab}
              onTabChange={onTabChange}
              userName={userName}
              rut={rut}
              lastAccess={lastAccess}
              onClose={() => setDrawerOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* Columna derecha: header + contenido */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header
          className="flex items-center justify-between px-5 h-14 shrink-0"
          style={{
            background: "hsl(var(--primary))",
            borderBottom: "1px solid hsl(var(--primary-foreground) / 0.12)",
          }}
        >
          {/* Hamburguesa — solo < lg */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-1.5 rounded-lg lg:hidden"
            style={{ color: "hsl(var(--primary-foreground))" }}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Brand mobile */}
          <div className="flex items-center gap-2 lg:hidden">
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-black"
              style={{ background: "hsl(var(--accent))", color: "hsl(var(--accent-foreground))" }}
            >
              PD
            </div>
            <span className="font-bold text-sm" style={{ color: "hsl(var(--primary-foreground))" }}>
              PrivData
            </span>
          </div>

          {/* Título de sección — solo lg+ */}
          <div className="hidden lg:flex items-center gap-3">
            <div
              className="w-1 h-5 rounded-full"
              style={{ background: "hsl(var(--accent))" }}
            />
            <span className="text-sm font-semibold" style={{ color: "hsl(var(--primary-foreground))" }}>
              {navItems.find((n) => n.id === activeTab)?.label ?? "Portal Titular"}
            </span>
          </div>

          {/* User badge */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
            style={{
              background: "hsl(var(--primary-foreground) / 0.12)",
              color: "hsl(var(--primary-foreground))",
            }}
          >
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: "hsl(var(--accent))", color: "hsl(var(--accent-foreground))" }}
            >
              {userName.split(" ").map((n) => n[0]).slice(0, 2).join("")}
            </div>
            <span className="font-medium hidden sm:inline">{userName}</span>
          </div>
        </header>

        {/* Contenido — flex-1, sin max-w */}
        <main className="flex-1 overflow-y-auto p-5 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

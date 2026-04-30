import { NavLink as RouterNavLink, type NavLinkProps } from "react-router-dom"
import { cn } from "@/lib/utils"

interface AppNavLinkProps extends Omit<NavLinkProps, "className"> {
  className?: string
  activeClassName?: string
}

export function NavLink({ className, activeClassName, children, ...props }: AppNavLinkProps) {
  return (
    <RouterNavLink
      className={({ isActive }) =>
        cn(className, isActive && (activeClassName ?? ""))
      }
      {...props}
    >
      {children}
    </RouterNavLink>
  )
}

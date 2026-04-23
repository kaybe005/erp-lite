"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Package,
  Truck,
  ShoppingCart,
  ClipboardList,
  Users,
  LogOut,
  ChevronLeft,
  Menu,
  AlertTriangle,
  BarChart3,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/products", label: "Products", icon: Package },
  { href: "/reorder", label: "Reorder List", icon: AlertTriangle },
  { href: "/suppliers", label: "Suppliers", icon: Truck },
  { href: "/purchase-orders", label: "Purchase Orders", icon: ShoppingCart },
  { href: "/sales-orders", label: "Sales Orders", icon: ClipboardList },
  { href: "/users", label: "Users", icon: Users, adminOnly: true },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [collapsed, setCollapsed] = useState(false)

  const filteredNavItems = navItems.filter(
    (item) => !item.adminOnly || session?.user?.role === "ADMIN"
  )

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 shrink-0",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className={cn(
        "flex items-center h-16 border-b border-sidebar-border px-3",
        collapsed ? "justify-center" : "justify-between px-4"
      )}>
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center shadow-sm shrink-0">
              <Package className="w-4 h-4 text-sidebar-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight truncate">ERP Lite</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="shrink-0 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2.5 space-y-0.5 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                collapsed && "justify-center px-0"
              )}
            >
              <item.icon className={cn("w-5 h-5 shrink-0 transition-transform group-hover:scale-105", isActive && "text-sidebar-primary-foreground")} />
              {!collapsed && <span className="font-medium text-sm">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className="p-2.5 border-t border-sidebar-border">
        {!collapsed && session?.user && (
          <div className="mb-2 px-3 py-2 rounded-lg bg-sidebar-accent/50">
            <p className="text-sm font-medium truncate">{session.user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-sidebar-accent text-sidebar-accent-foreground font-medium">
              {session.user.role}
            </span>
          </div>
        )}
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all",
            collapsed && "justify-center px-0"
          )}
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span className="text-sm">Logout</span>}
        </Button>
      </div>
    </aside>
  )
}

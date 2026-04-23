"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command"
import {
  LayoutDashboard,
  Package,
  Truck,
  ShoppingCart,
  ClipboardList,
  Users,
  AlertTriangle,
  Plus,
  BarChart3,
} from "lucide-react"

const navigationItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, group: "Pages" },
  { label: "Analytics", href: "/analytics", icon: BarChart3, group: "Pages" },
  { label: "Products", href: "/products", icon: Package, group: "Pages" },
  { label: "Reorder List", href: "/reorder", icon: AlertTriangle, group: "Pages" },
  { label: "Suppliers", href: "/suppliers", icon: Truck, group: "Pages" },
  { label: "Purchase Orders", href: "/purchase-orders", icon: ShoppingCart, group: "Pages" },
  { label: "Sales Orders", href: "/sales-orders", icon: ClipboardList, group: "Pages" },
  { label: "Users", href: "/users", icon: Users, group: "Pages" },
]

const quickActions = [
  { label: "New Purchase Order", href: "/purchase-orders/new", icon: ShoppingCart, group: "Quick Actions" },
  { label: "New Sales Order", href: "/sales-orders/new", icon: ClipboardList, group: "Quick Actions" },
  { label: "New Product", href: "/products/new", icon: Package, group: "Quick Actions" },
  { label: "New Supplier", href: "/suppliers/new", icon: Truck, group: "Quick Actions" },
]

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const openPalette = useCallback(() => setOpen(true), [])

  useEffect(() => {
    // Keyboard shortcut: Cmd+K / Ctrl+K
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }

    // Custom event from header button
    function handleCustomEvent() {
      setOpen(true)
    }

    document.addEventListener("keydown", handleKeyDown)
    window.addEventListener("cmdk:open", handleCustomEvent)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("cmdk:open", handleCustomEvent)
    }
  }, [])

  function navigate(href: string) {
    setOpen(false)
    router.push(href)
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen} showCloseButton={false}>
      <CommandInput placeholder="Search pages, actions…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Quick Actions">
          {quickActions.map((item) => (
            <CommandItem
              key={item.href}
              value={item.label}
              onSelect={() => navigate(item.href)}
              className="gap-2 cursor-pointer"
            >
              <div className="p-1 rounded bg-primary/10">
                <Plus className="w-3.5 h-3.5 text-primary" />
              </div>
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Navigation">
          {navigationItems.map((item) => (
            <CommandItem
              key={item.href}
              value={item.label}
              onSelect={() => navigate(item.href)}
              className="gap-2 cursor-pointer"
            >
              <item.icon className="w-4 h-4 text-muted-foreground" />
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}

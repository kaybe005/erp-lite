"use client"

import { useSession } from "next-auth/react"
import { useTheme } from "next-themes"
import { Bell, Moon, Sun, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useEffect, useState } from "react"

interface HeaderProps {
  title: string
  description?: string
}

export function Header({ title, description }: HeaderProps) {
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const initials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  function openCommandPalette() {
    window.dispatchEvent(new CustomEvent("cmdk:open"))
  }

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between h-16 px-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* Search trigger */}
          <Button
            variant="ghost"
            size="sm"
            className="hidden md:flex items-center gap-2 text-muted-foreground hover:text-foreground px-3 h-9 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/60 transition-all"
            onClick={openCommandPalette}
          >
            <Search className="w-3.5 h-3.5" />
            <span className="text-xs">Search…</span>
            <kbd className="ml-1 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              ⌘K
            </kbd>
          </Button>

          {/* Mobile search icon */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={openCommandPalette}>
            <Search className="w-5 h-5" />
          </Button>

          {/* Dark mode toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="text-muted-foreground hover:text-foreground"
          >
            {mounted ? (
              theme === "dark" ? (
                <Sun className="w-5 h-5 transition-transform hover:rotate-12" />
              ) : (
                <Moon className="w-5 h-5 transition-transform hover:-rotate-12" />
              )
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </Button>

          {/* Bell */}
          <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
            <Bell className="w-5 h-5" />
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full ml-1">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {session?.user?.name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {session?.user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <span className="text-xs px-2 py-0.5 rounded-full bg-secondary">
                  {session?.user?.role}
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

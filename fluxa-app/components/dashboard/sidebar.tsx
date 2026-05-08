'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  Settings,
  Sun,
  Moon,
  Zap,
  LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { LogoutDialog } from '@/components/dashboard/logout-dialog'

const navItems = [
  { href: '/dashboard', label: 'Visão Geral', icon: LayoutDashboard },
  { href: '/dashboard/charges', label: 'Cobranças', icon: Receipt },
  { href: '/dashboard/wallet', label: 'Carteira', icon: Wallet },
  { href: '/dashboard/settings', label: 'Configurações', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  return (
    <>
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-sidebar">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold text-sidebar-foreground">Fluxa</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href))

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-primary'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Footer: Theme Toggle + Logout */}
          <div className="border-t border-sidebar-border p-4 space-y-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:text-sidebar-foreground"
            >
              {mounted && theme === 'dark' ? (
                <>
                  <Sun className="h-5 w-5" />
                  Modo Claro
                </>
              ) : (
                <>
                  <Moon className="h-5 w-5" />
                  Modo Escuro
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLogoutOpen(true)}
              className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:text-destructive"
            >
              <LogOut className="h-5 w-5" />
              Sair
            </Button>
          </div>
        </div>
      </aside>

      <LogoutDialog open={logoutOpen} onOpenChange={setLogoutOpen} />
    </>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Menu, Bell, Sun, Moon, X, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MobileNav } from './mobile-nav'

interface HeaderProps {
  title?: string
}

export function Header({ title }: HeaderProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => setMounted(true), [])

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6 lg:px-8">
        {/* Mobile menu button */}
        <div className="flex items-center gap-4 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileNavOpen(true)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Abrir menu</span>
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">Fluxa</span>
          </div>
        </div>

        {/* Title - hidden on mobile */}
        <div className="hidden lg:block">
          {title && (
            <h1 className="text-lg font-semibold text-foreground">{title}</h1>
          )}
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="hidden md:flex"
          >
            {mounted && theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
            <span className="sr-only">Alternar tema</span>
          </Button>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary" />
            <span className="sr-only">Notificações</span>
          </Button>
        </div>
      </header>

      {/* Mobile Navigation */}
      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
    </>
  )
}

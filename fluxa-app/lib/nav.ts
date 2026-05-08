import { LayoutDashboard, Receipt, Wallet, Settings } from 'lucide-react'

export const navItems = [
  { href: '/dashboard', label: 'Visão Geral', icon: LayoutDashboard },
  { href: '/dashboard/charges', label: 'Cobranças', icon: Receipt },
  { href: '/dashboard/wallet', label: 'Carteira', icon: Wallet },
  { href: '/dashboard/settings', label: 'Configurações', icon: Settings },
]

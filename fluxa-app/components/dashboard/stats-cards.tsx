'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import { formatBRL } from '@/lib/data'
import { ChargeStats } from '@/lib/types'

interface StatsCardsProps {
  stats: ChargeStats
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Total em Cobranças',
      value: formatBRL(stats.totalBRL),
      description: `${stats.total} cobranças criadas`,
      icon: DollarSign,
    },
    {
      title: 'Cobranças Pagas',
      value: formatBRL(stats.paidBRL),
      description: 'Pagamentos confirmados',
      icon: CheckCircle2,
    },
    {
      title: 'Cobranças Pendentes',
      value: formatBRL(stats.pendingBRL),
      description: 'Aguardando pagamento',
      icon: AlertCircle,
    },
    {
      title: 'Pendentes',
      value: stats.pending.toString(),
      description: 'cobranças aguardando',
      icon: Clock,
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">{card.value}</div>
            <p className="text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

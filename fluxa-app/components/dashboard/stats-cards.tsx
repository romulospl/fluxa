'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, DollarSign, Clock, CheckCircle2, RefreshCw } from 'lucide-react'
import { formatBRL } from '@/lib/data'
import { cn } from '@/lib/utils'

interface StatsCardsProps {
  stats: {
    total: number
    pending: number
    paid: number
    converting: number
    completed: number
    totalBRL: number
    completedBRL: number
  }
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Total em Cobranças',
      value: formatBRL(stats.totalBRL),
      description: `${stats.total} cobranças criadas`,
      icon: DollarSign,
      trend: '+12.5%',
      trendUp: true,
    },
    {
      title: 'Convertido',
      value: formatBRL(stats.completedBRL),
      description: `${stats.completed} finalizadas`,
      icon: CheckCircle2,
      trend: '+8.2%',
      trendUp: true,
    },
    {
      title: 'Pendentes',
      value: stats.pending.toString(),
      description: 'Aguardando pagamento',
      icon: Clock,
      trend: '-2',
      trendUp: false,
    },
    {
      title: 'Em Conversão',
      value: stats.converting.toString(),
      description: 'Processando cripto',
      icon: RefreshCw,
      trend: '+1',
      trendUp: true,
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
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className={cn(
                'flex items-center gap-0.5',
                card.trendUp ? 'text-success' : 'text-destructive'
              )}>
                {card.trendUp ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {card.trend}
              </span>
              <span>{card.description}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

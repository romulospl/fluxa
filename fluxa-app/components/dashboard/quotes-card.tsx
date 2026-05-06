'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'
import { mockQuotes, formatBRL } from '@/lib/data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function QuotesCard() {
  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-card-foreground">Cotações em Tempo Real</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockQuotes.map((quote) => (
            <div 
              key={quote.symbol}
              className="flex items-center justify-between rounded-lg bg-secondary/30 p-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                  {quote.symbol.charAt(0)}
                </div>
                <div>
                  <div className="font-medium text-card-foreground">{quote.asset}</div>
                  <div className="text-sm text-muted-foreground">{quote.symbol}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-card-foreground">
                  {formatBRL(quote.priceInBRL)}
                </div>
                <div className={cn(
                  'flex items-center justify-end gap-1 text-sm',
                  quote.change24h >= 0 ? 'text-success' : 'text-destructive'
                )}>
                  {quote.change24h >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {quote.change24h >= 0 ? '+' : ''}{quote.change24h}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

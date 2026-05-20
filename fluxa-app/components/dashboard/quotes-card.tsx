'use client'

import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface BinanceTicker {
  symbol: string
  price: string
}

interface CoinPrice {
  label: string
  symbol: string
  brl: number
}

const COIN_MAP: Record<string, { label: string; symbol: string }> = {
  BTCUSDT: { label: 'Bitcoin', symbol: 'BTC' },
  ETHUSDT: { label: 'Ethereum', symbol: 'ETH' },
  XLMUSDT: { label: 'Stellar', symbol: 'XLM' },
  USDCUSDT: { label: 'USD Coin', symbol: 'USDC' },
}

const API_URL =
  'https://api.binance.com/api/v3/ticker/price?symbols=%5B%22BTCUSDT%22,%22ETHUSDT%22,%22XLMUSDT%22,%22USDCUSDT%22,%22USDTBRL%22%5D'

const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function parsePrices(tickers: BinanceTicker[]): CoinPrice[] {
  const rates: Record<string, number> = {}
  for (const t of tickers) rates[t.symbol] = parseFloat(t.price)

  const usdtBrl = rates['USDTBRL'] ?? 1

  return Object.entries(COIN_MAP).map(([pair, meta]) => ({
    label: meta.label,
    symbol: meta.symbol,
    brl: (rates[pair] ?? 0) * usdtBrl,
  }))
}

export function QuotesCard() {
  const [coins, setCoins] = useState<CoinPrice[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState(false)

  const fetchPrices = useCallback(async (showSpinner = false) => {
    if (showSpinner) setIsRefreshing(true)
    try {
      const res = await axios.get(API_URL)
      const data: BinanceTicker[] = res.data
      setCoins(parsePrices(data))
      setError(false)
    } catch {
      setError(true)
    } finally {
      if (showSpinner) setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchPrices()
  }, [fetchPrices])

  const loading = coins.length === 0 && !error

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-card-foreground">Cotações em Tempo Real</CardTitle>
        <button
          onClick={() => fetchPrices(true)}
          disabled={isRefreshing}
          className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
          aria-label="Atualizar cotações"
        >
          <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
        </button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-secondary/30 p-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-10" />
                  </div>
                </div>
                <Skeleton className="h-4 w-24" />
              </div>
            ))
            : error && coins.length === 0
              ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Não foi possível carregar as cotações.
                </p>
              )
              : coins.map((coin) => (
                <div
                  key={coin.symbol}
                  className="flex items-center justify-between rounded-lg bg-secondary/30 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                      {coin.symbol.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-card-foreground">{coin.label}</div>
                      <div className="text-sm text-muted-foreground">{coin.symbol}</div>
                    </div>
                  </div>
                  <div className="font-medium text-card-foreground">
                    {brl.format(coin.brl)}
                  </div>
                </div>
              ))
          }
        </div>

      </CardContent>
    </Card>
  )
}

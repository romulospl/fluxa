'use client'

import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { RefreshCw } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface Prices {
  bitcoin: { brl: number }
  ethereum: { brl: number }
  stellar: { brl: number }
  'usd-coin': { brl: number }
}

const COINS = [
  {
    id: 'bitcoin' as const,
    label: 'Bitcoin',
    symbol: 'BTC',
    color: 'bg-orange-500',
    textColor: 'text-orange-500',
  },
  {
    id: 'ethereum' as const,
    label: 'Ethereum',
    symbol: 'ETH',
    color: 'bg-indigo-500',
    textColor: 'text-indigo-500',
  },
  {
    id: 'stellar' as const,
    label: 'Stellar',
    symbol: 'XLM',
    color: 'bg-sky-500',
    textColor: 'text-sky-500',
  },
  {
    id: 'usd-coin' as const,
    label: 'USD Coin',
    symbol: 'USDC',
    color: 'bg-blue-600',
    textColor: 'text-blue-600',
  },
]

const REFRESH_INTERVAL = 60_000

const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 6,
})

export function CryptoPrices() {
  const [prices, setPrices] = useState<Prices | null>(null)
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState(false)

  const fetchPrices = useCallback(async (showSpinner = false) => {
    if (showSpinner) setIsRefreshing(true)
    try {
      const res = await axios.get(
        'https://api.coingecko.com/api/v3/simple/price?ids=stellar,usd-coin,bitcoin,ethereum&vs_currencies=brl'
      )
      const data: Prices = res.data
      setPrices(data)
      setUpdatedAt(new Date())
      setError(false)
    } catch {
      setError(true)
    } finally {
      if (showSpinner) setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchPrices()
    const timer = setInterval(() => fetchPrices(), REFRESH_INTERVAL)
    return () => clearInterval(timer)
  }, [fetchPrices])

  const loading = prices === null && !error

  return (
    <section className="border-t border-border py-20">
      <div className="mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="mb-10 flex flex-col items-center gap-2 text-center">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Ao vivo
            </span>
          </div>
          <h2 className="text-3xl font-bold text-foreground">
            Cotações em Tempo Real
          </h2>
          <p className="text-muted-foreground text-sm">
            Preços atualizados automaticamente a cada minuto via CoinGecko.
          </p>
        </div>

        {/* Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {COINS.map((coin) => (
            <div
              key={coin.id}
              className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3"
            >
              {/* Coin identity */}
              <div className="flex items-center gap-3">
                <div className={cn('flex h-9 w-9 items-center justify-center rounded-full text-white text-xs font-bold shrink-0', coin.color)}>
                  {coin.symbol.slice(0, 1)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-card-foreground leading-none">
                    {coin.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{coin.symbol}</p>
                </div>
              </div>

              {/* Price */}
              {loading ? (
                <Skeleton className="h-7 w-32" />
              ) : error && !prices ? (
                <span className="text-sm text-muted-foreground">Indisponível</span>
              ) : (
                <p className={cn('text-xl font-bold', coin.textColor)}>
                  {prices ? brl.format(prices[coin.id].brl) : '—'}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Footer: last update + manual refresh */}
        <div className="mt-6 flex items-center justify-center gap-3 text-xs text-muted-foreground">
          {updatedAt && (
            <span>
              Atualizado às{' '}
              {updatedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
          <button
            onClick={() => fetchPrices(true)}
            disabled={isRefreshing || loading}
            className="flex items-center gap-1 hover:text-foreground transition-colors disabled:opacity-40"
            aria-label="Atualizar cotações"
          >
            <RefreshCw className={cn('h-3 w-3', isRefreshing && 'animate-spin')} />
            Atualizar
          </button>
        </div>
      </div>
    </section>
  )
}

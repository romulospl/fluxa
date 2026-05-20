'use client'

import { useState, useEffect, useCallback } from 'react'
import api from '@/lib/api'
import { ArrowDownLeft, ArrowUpRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { WalletChargeDialog } from './wallet-charge-dialog'
import type { WalletTransaction, WalletTransactionCharge } from '@/lib/types'

interface Props {
  walletAddress: string
}

interface FetchResult {
  transactions: WalletTransaction[]
  nextCursor: string | null
  hasMore: boolean
}

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function WalletTransactionsList({ walletAddress }: Props) {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedTx, setSelectedTx] = useState<WalletTransaction | null>(null)

  const fetchPage = useCallback(async (cursor: string | null, append: boolean) => {
    const url = cursor
      ? `/api/wallet/transactions?cursor=${encodeURIComponent(cursor)}`
      : '/api/wallet/transactions'

    try {
      const res = await api.get(url, { withCredentials: true })
      const data: FetchResult = res.data

      setTransactions((prev) => (append ? [...prev, ...data.transactions] : data.transactions))
      setNextCursor(data.nextCursor)
      setHasMore(data.hasMore)
    } catch (err: any) {
      throw new Error(err.response?.data?.error ?? 'Erro ao buscar transações')
    }
  }, [])

  useEffect(() => {
    setIsLoading(true)
    setError(null)
    fetchPage(null, false)
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false))
  }, [walletAddress, fetchPage])

  const handleLoadMore = async () => {
    if (!nextCursor) return
    setIsLoadingMore(true)
    try {
      await fetchPage(nextCursor, true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoadingMore(false)
    }
  }

  const openDialog = (tx: WalletTransaction) => {
    setSelectedTx(tx)
    setDialogOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">{error}</p>
    )
  }

  if (transactions.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Nenhuma transação USDC encontrada.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <ul className="divide-y divide-border">
        {transactions.map((tx) => (
          <li key={tx.id} className="flex items-center gap-3 py-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
              {tx.direction === 'in' ? (
                <ArrowDownLeft className="h-4 w-4 text-success" />
              ) : (
                <ArrowUpRight className="h-4 w-4 text-destructive" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-medium">
                  {parseFloat(tx.amount).toFixed(6)} USDC
                </span>
                {tx.isFluxaTransaction && (
                  <Badge variant="default" className="h-5 px-1.5 text-xs">
                    Fluxa
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{formatDateTime(tx.createdAt)}</p>
            </div>

            {tx.isFluxaTransaction && tx.charge && (
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 text-xs"
                onClick={() => openDialog(tx)}
              >
                Ver cobrança
              </Button>
            )}
          </li>
        ))}
      </ul>

      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Carregando...
              </>
            ) : (
              'Carregar mais'
            )}
          </Button>
        </div>
      )}

      {selectedTx?.charge && (
        <WalletChargeDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          hash={selectedTx.hash}
          charge={selectedTx.charge as WalletTransactionCharge}
          transactionDate={selectedTx.createdAt}
        />
      )}
    </div>
  )
}

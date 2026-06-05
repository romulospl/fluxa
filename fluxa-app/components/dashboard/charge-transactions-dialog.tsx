'use client'

import { useState, useEffect } from 'react'
import api from '@/lib/api'
import { ExternalLink, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { shortenHash, getExplorerUrl } from '@/lib/data'
import { STATUS_CONFIG } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ChargeTransaction {
  id: string
  status: string
  hash: string | null
  occurredAt: string
}

interface Props {
  chargeId: string
  chargeNumber: number
  chargeDescription: string
  children: React.ReactNode
}

function formatDateTime(dateStr: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr))
}

export function ChargeTransactionsDialog({
  chargeId,
  chargeNumber,
  chargeDescription,
  children,
}: Props) {
  const [open, setOpen] = useState(false)
  const [transactions, setTransactions] = useState<ChargeTransaction[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setIsLoading(true)
    api.get(`/api/charges/${chargeId}/transactions`, { withCredentials: true })
      .then((r) => r.data)
      .then((data) => setTransactions(Array.isArray(data) ? data : []))
      .catch(() => setTransactions([]))
      .finally(() => setIsLoading(false))
  }, [open, chargeId])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-sm" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-base leading-snug">
            Histórico de transações
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            #{chargeNumber} — {chargeDescription}
          </p>
        </DialogHeader>

        <div className="mt-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : transactions.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Nenhuma transação registrada.
            </p>
          ) : (
            <ol className="relative ml-3 space-y-5 border-l border-border">
              {[...transactions].reverse().map((tx, i) => {
                const isFirst = i === 0
                const statusConfig = STATUS_CONFIG[tx.status as keyof typeof STATUS_CONFIG]

                return (
                  <li key={tx.id} className="ml-5">
                    <span
                      className={cn(
                        'absolute -left-1.5 flex h-3 w-3 items-center justify-center rounded-full border border-background',
                        isFirst ? 'bg-primary' : 'bg-muted-foreground/50',
                      )}
                    />
                    <div className="flex flex-col gap-1">
                      <span
                        className={cn(
                          'inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium',
                          statusConfig?.bgColor ?? 'bg-muted',
                          statusConfig?.color ?? 'text-muted-foreground',
                        )}
                      >
                        {statusConfig?.label ?? tx.status}
                      </span>
                      <time className="text-xs text-muted-foreground">
                        {formatDateTime(tx.occurredAt)}
                      </time>
                      {tx.hash ? (
                        <a
                          href={getExplorerUrl(tx.hash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 font-mono text-xs text-primary hover:underline"
                        >
                          {shortenHash(tx.hash)}
                          <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground/60">
                          Hash pendente
                        </span>
                      )}
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { ExternalLink } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { STATUS_CONFIG } from '@/lib/types'
import { formatBRL, getExplorerUrl, shortenHash } from '@/lib/data'
import { cn } from '@/lib/utils'
import type { WalletTransactionCharge } from '@/lib/types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  hash: string
  charge: WalletTransactionCharge
}

export function WalletChargeDialog({ open, onOpenChange, hash, charge }: Props) {
  const statusConfig = STATUS_CONFIG[charge.status as keyof typeof STATUS_CONFIG]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base leading-snug">
            Cobrança #{charge.number}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{charge.description}</p>
        </DialogHeader>

        <div className="mt-1 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Valor em BRL</span>
            <span className="font-medium">{formatBRL(charge.amountBrl)}</span>
          </div>

          {charge.amountUsdc !== null && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Valor em USDC</span>
              <span className="font-mono font-medium">
                {charge.amountUsdc!.toFixed(6)} USDC
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Status</span>
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                statusConfig?.bgColor ?? 'bg-muted',
                statusConfig?.color ?? 'text-muted-foreground',
              )}
            >
              {statusConfig?.label ?? charge.status}
            </span>
          </div>

          {charge.paidAt && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Pago em</span>
              <span>
                {new Intl.DateTimeFormat('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                }).format(new Date(charge.paidAt))}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Hash</span>
            <a
              href={getExplorerUrl(hash)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 font-mono text-xs text-primary hover:underline"
            >
              {shortenHash(hash)}
              <ExternalLink className="h-3 w-3 flex-shrink-0" />
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

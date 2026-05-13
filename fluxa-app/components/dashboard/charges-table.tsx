'use client'

import { ExternalLink, History } from 'lucide-react'
import { Charge, STATUS_CONFIG } from '@/lib/types'
import { formatBRL, formatCrypto, formatDate } from '@/lib/data'
import { ChargeTransactionsDialog } from '@/components/dashboard/charge-transactions-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ChargesTableProps {
  charges: Charge[]
  onViewCharge?: (charge: Charge) => void
}

export function ChargesTable({ charges, onViewCharge }: ChargesTableProps) {

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-card-foreground">Cobranças Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-sm text-muted-foreground">
                <th className="pb-3 pr-4 font-medium">Descrição</th>
                <th className="pb-3 pr-4 font-medium">Valor (BRL)</th>
                <th className="hidden pb-3 pr-4 font-medium sm:table-cell">Cripto</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
                <th className="hidden pb-3 pr-4 font-medium md:table-cell">Data</th>
                <th className="pb-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {charges.map((charge) => {
                const statusConfig = STATUS_CONFIG[charge.status]

                return (
                  <tr key={charge.id} className="border-b border-border/50 last:border-0">
                    <td className="py-4 pr-4">
                      <div className="font-medium text-card-foreground">
                        <span className="mr-1.5 text-xs text-muted-foreground">#{charge.number}</span>
                        {charge.description}
                      </div>
                      <ChargeTransactionsDialog
                        chargeId={charge.id}
                        chargeNumber={charge.number}
                        chargeDescription={charge.description}
                      >
                        <button className="mt-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                          <History className="h-3 w-3" />
                          Histórico
                        </button>
                      </ChargeTransactionsDialog>
                    </td>
                    <td className="py-4 pr-4 font-medium text-card-foreground">
                      {formatBRL(charge.amountBRL)}
                    </td>
                    <td className="hidden py-4 pr-4 sm:table-cell">
                      {charge.amountCrypto ? (
                        <span className="font-mono text-sm text-primary">
                          {formatCrypto(charge.amountCrypto, charge.cryptoAsset ?? '')}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-4 pr-4">
                      <div className="flex flex-col gap-1">
                        <span className={cn(
                          'inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                          statusConfig.bgColor,
                          statusConfig.color
                        )}>
                          {statusConfig.label}
                        </span>
                        {charge.paymentMethod && (
                          <span className="inline-flex w-fit items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                            {charge.paymentMethod === 'PIX' ? 'PIX' : 'Boleto'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="hidden py-4 pr-4 text-sm text-muted-foreground md:table-cell">
                      {formatDate(charge.createdAt)}
                    </td>
                    <td className="py-4">
                      {charge.paymentUrl ? (
                        <a
                          href={charge.paymentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 text-muted-foreground hover:text-foreground"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Ver
                          </Button>
                        </a>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewCharge?.(charge)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          Ver
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

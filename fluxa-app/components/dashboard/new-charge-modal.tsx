'use client'

import { useState, useEffect } from 'react'
import { AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Charge } from '@/lib/types'

interface NewChargeModalProps {
  open: boolean
  onClose: () => void
  onSuccess: (charge: Charge) => void
}

function defaultDueDate() {
  const d = new Date()
  d.setDate(d.getDate() + 3)
  return d.toISOString().split('T')[0]
}

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

const FEE_PERCENT = Number(process.env.NEXT_PUBLIC_FLUXA_FEE_PERCENT ?? '10')

export function NewChargeModal({ open, onClose, onSuccess }: NewChargeModalProps) {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [billingType, setBillingType] = useState<'BOLETO' | 'PIX'>('BOLETO')
  const [dueDate, setDueDate] = useState(defaultDueDate)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [usdcRate, setUsdcRate] = useState<number | null>(null)

  useEffect(() => {
    if (!open) return
    fetch('/api/exchange/rate')
      .then((r) => r.json())
      .then((d) => setUsdcRate(d.rate ?? null))
      .catch(() => setUsdcRate(null))
  }, [open])

  const handleAmountChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '')
    const formatted = (parseInt(numericValue || '0') / 100).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    setAmount(formatted === '0,00' ? '' : formatted)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const numAmount = parseFloat(amount.replace(/\./g, '').replace(',', '.'))

    if (!numAmount || numAmount < 10) {
      setError('O valor mínimo é R$ 10,00')
      return
    }

    if (!description.trim()) {
      setError('Informe uma descrição')
      return
    }

    if (!dueDate) {
      setError('Informe a data de vencimento')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/charges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          amountBrl: numAmount,
          description: description.trim(),
          billingType,
          dueDate,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error ?? 'Erro ao criar cobrança')
        return
      }

      const charge: Charge = {
        id: data.id,
        number: data.number,
        description: data.description,
        amountBRL: data.amountBrl,
        status: data.status,
        paymentMethod: data.paymentMethod ?? null,
        paymentUrl: data.paymentUrl ?? null,
        createdAt: new Date(data.createdAt),
        paidAt: data.paidAt ? new Date(data.paidAt) : undefined,
      }

      setAmount('')
      setDescription('')
      setBillingType('BOLETO')
      setDueDate(defaultDueDate())
      onSuccess(charge)
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Cobrança</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Valor (BRL)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                R$
              </span>
              <Input
                id="amount"
                type="text"
                placeholder="0,00"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="pl-10 text-lg"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              type="text"
              placeholder="Ex: Consultoria de Software"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                setError('')
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Vencimento</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              min={todayStr()}
              onChange={(e) => {
                setDueDate(e.target.value)
                setError('')
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo de pagamento</Label>
            <div className="flex gap-3">
              {(['BOLETO', 'PIX'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setBillingType(type)}
                  className={`flex-1 rounded-md border px-4 py-2 text-sm font-medium transition-colors ${billingType === type
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-muted-foreground hover:text-foreground'
                    }`}
                >
                  {type === 'BOLETO' ? 'Boleto' : 'PIX'}
                </button>
              ))}
            </div>
          </div>

          {(() => {
            const numAmount = parseFloat(amount.replace(/\./g, '').replace(',', '.'))
            const hasAmount = numAmount > 0
            const feeAmount = hasAmount ? numAmount * FEE_PERCENT / 100 : 0
            const netBrl = hasAmount ? numAmount - feeAmount : 0
            const netUsdc = hasAmount && usdcRate ? netBrl / usdcRate : null
            const fmtBrl = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            return (
              <div className="rounded-md border bg-muted/40 px-3 py-2.5 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Taxa Fluxa ({FEE_PERCENT}%)</span>
                  <span>{hasAmount ? `− R$ ${fmtBrl(feeAmount)}` : `${FEE_PERCENT}% do valor`}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Você vai receber aproximadamente</span>
                  <span className="font-semibold text-foreground">
                    {netUsdc !== null
                      ? `${netUsdc.toFixed(6)} USDC`
                      : hasAmount
                        ? `≈ R$ ${fmtBrl(netBrl)} em USDC`
                        : '—'}
                  </span>
                </div>
              </div>
            )
          })()}

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Criando...' : 'Criar Cobrança'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

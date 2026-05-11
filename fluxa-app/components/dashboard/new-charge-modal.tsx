'use client'

import { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface NewChargeModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: { amountBRL: number; description: string; billingType: 'BOLETO' | 'PIX' }) => void
}

export function NewChargeModal({ open, onClose, onSubmit }: NewChargeModalProps) {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [billingType, setBillingType] = useState<'BOLETO' | 'PIX'>('BOLETO')
  const [error, setError] = useState('')

  const handleAmountChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '')
    const formatted = (parseInt(numericValue || '0') / 100).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    setAmount(formatted === '0,00' ? '' : formatted)
    setError('')
  }

  const handleSubmit = (e: React.FormEvent) => {
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

    onSubmit({
      amountBRL: numAmount,
      description: description.trim(),
      billingType,
    })

    setAmount('')
    setDescription('')
    setBillingType('BOLETO')
    setError('')
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
            <Label>Tipo de pagamento</Label>
            <div className="flex gap-3">
              {(['BOLETO', 'PIX'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setBillingType(type)}
                  className={`flex-1 rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                    billingType === type
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {type === 'BOLETO' ? 'Boleto' : 'PIX'}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              Criar Cobrança
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

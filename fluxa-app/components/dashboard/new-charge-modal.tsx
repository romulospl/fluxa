'use client'

import { useState, useMemo } from 'react'
import { X, AlertCircle } from 'lucide-react'
import { CRYPTO_ASSETS } from '@/lib/types'
import { mockQuotes, formatBRL, calculateCryptoAmount } from '@/lib/data'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface NewChargeModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: { amountBRL: number; description: string; cryptoAsset: string }) => void
}

export function NewChargeModal({ open, onClose, onSubmit }: NewChargeModalProps) {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [selectedAsset, setSelectedAsset] = useState('BTC')
  const [error, setError] = useState('')

  const estimatedCrypto = useMemo(() => {
    const numAmount = parseFloat(amount.replace(/\D/g, '')) / 100
    if (!numAmount || isNaN(numAmount)) return null
    
    const quote = mockQuotes.find(q => q.symbol === selectedAsset)
    if (!quote) return null
    
    return calculateCryptoAmount(numAmount, quote.priceInBRL)
  }, [amount, selectedAsset])

  const selectedQuote = mockQuotes.find(q => q.symbol === selectedAsset)

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
      cryptoAsset: selectedAsset,
    })

    // Reset form
    setAmount('')
    setDescription('')
    setSelectedAsset('BTC')
    setError('')
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-card-foreground">Nova Cobrança</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
            <span className="sr-only">Fechar</span>
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount Input */}
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

          {/* Description Input */}
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

          {/* Crypto Asset Selection */}
          <div className="space-y-2">
            <Label htmlFor="crypto">Receber em</Label>
            <Select value={selectedAsset} onValueChange={setSelectedAsset}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CRYPTO_ASSETS.map((asset) => (
                  <SelectItem key={asset.symbol} value={asset.symbol}>
                    <span className="flex items-center gap-2">
                      <span className="text-lg">{asset.icon}</span>
                      <span>{asset.asset}</span>
                      <span className="text-muted-foreground">({asset.symbol})</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Estimate */}
          {estimatedCrypto && selectedQuote && (
            <div className="rounded-lg bg-secondary/50 p-4">
              <div className="text-sm text-muted-foreground">Estimativa de recebimento</div>
              <div className="mt-1 text-xl font-semibold text-primary">
                ≈ {estimatedCrypto.toFixed(selectedAsset === 'BTC' ? 8 : selectedAsset === 'ETH' ? 6 : 2)} {selectedAsset}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Cotação atual: {formatBRL(selectedQuote.priceInBRL)} / {selectedAsset}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              Criar Cobrança
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

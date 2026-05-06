'use client'

import { useState } from 'react'
import { Copy, Check, ExternalLink, Wallet, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { validateWalletAddress } from '@/lib/data'

export default function WalletPage() {
  const [walletAddress, setWalletAddress] = useState('0x742d35Cc6634C0532925a3b844Bc9e7595f00000')
  const [isEditing, setIsEditing] = useState(false)
  const [newAddress, setNewAddress] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const copyAddress = async () => {
    await navigator.clipboard.writeText(walletAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSaveAddress = () => {
    if (!validateWalletAddress(newAddress)) {
      setError('Endereço de carteira inválido')
      return
    }
    setWalletAddress(newAddress)
    setIsEditing(false)
    setNewAddress('')
    setError('')
  }

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 10)}...${address.slice(-8)}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Carteira Digital</h1>
        <p className="text-muted-foreground">
          Configure seu endereço para recebimento dos ativos digitais
        </p>
      </div>

      {/* Current Wallet */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <Wallet className="h-5 w-5 text-primary" />
            Endereço de Recebimento
          </CardTitle>
          <CardDescription>
            Todos os ativos convertidos serão enviados para este endereço
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isEditing ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg bg-secondary/50 p-4">
                <div className="flex-1 font-mono text-sm text-card-foreground">
                  <span className="hidden sm:inline">{walletAddress}</span>
                  <span className="sm:hidden">{shortenAddress(walletAddress)}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={copyAddress}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  <span className="sr-only">Copiar endereço</span>
                </Button>
                <a
                  href={`https://etherscan.io/address/${walletAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0"
                >
                  <Button variant="ghost" size="icon">
                    <ExternalLink className="h-4 w-4" />
                    <span className="sr-only">Ver no explorer</span>
                  </Button>
                </a>
              </div>
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                Alterar Endereço
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newAddress">Novo Endereço</Label>
                <Input
                  id="newAddress"
                  placeholder="0x... ou endereço Bitcoin"
                  value={newAddress}
                  onChange={(e) => {
                    setNewAddress(e.target.value)
                    setError('')
                  }}
                  className="font-mono"
                />
                {error && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false)
                    setNewAddress('')
                    setError('')
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={handleSaveAddress}>Salvar</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base text-card-foreground">Redes Suportadas</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary" />
                Ethereum (ETH, USDT, USDC)
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-chart-2" />
                Bitcoin (BTC)
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-chart-3" />
                Polygon (MATIC, USDT)
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base text-card-foreground">Importante</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Verifique o endereço antes de salvar</li>
              <li>• Use sempre a rede correta</li>
              <li>• Transações são irreversíveis</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

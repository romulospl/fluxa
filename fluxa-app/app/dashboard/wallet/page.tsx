'use client'

import { useState, useEffect } from 'react'
import { Copy, Check, Wallet, AlertCircle, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingButton } from '@/components/ui/loading-button'
import { validateWalletAddress } from '@/lib/data'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { toastSuccess, toastError } from '@/lib/toast'
import { WalletTransactionsList } from '@/components/dashboard/wallet-transactions-list'

const STELLAR_ADDRESS_REGEX = /^G[A-Z2-7]{55}$/

export default function WalletPage() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [newAddress, setNewAddress] = useState('')
  const [error, setError] = useState('')
  const [usdcBalance, setUsdcBalance] = useState<string | null>(null)
  const [isLoadingBalance, setIsLoadingBalance] = useState(false)
  const { copy, isCopied } = useCopyToClipboard()

  useEffect(() => {
    async function loadWallet() {
      try {
        const res = await fetch('/api/users/current')
        if (!res.ok) return
        const data = await res.json()
        setWalletAddress(data.walletAddress ?? '')
      } finally {
        setIsLoadingUser(false)
      }
    }
    loadWallet()
  }, [])

  useEffect(() => {
    if (!walletAddress || !STELLAR_ADDRESS_REGEX.test(walletAddress)) return
    async function loadBalance() {
      setIsLoadingBalance(true)
      try {
        const res = await fetch('/api/wallet/balance')
        if (!res.ok) return
        const data = await res.json()
        setUsdcBalance(data.balance)
      } finally {
        setIsLoadingBalance(false)
      }
    }
    loadBalance()
  }, [walletAddress])

  const handleSaveAddress = async () => {
    const trimmedAddress = newAddress.trim()
    if (!validateWalletAddress(trimmedAddress)) {
      setError('Endereço de carteira inválido')
      return
    }
    setIsSaving(true)
    try {
      const res = await fetch('/api/users/wallet', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: trimmedAddress }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar endereço')
      setWalletAddress(data.walletAddress)
      setIsEditing(false)
      setNewAddress('')
      setError('')
      toastSuccess('Endereço de carteira atualizado!')
    } catch (err: any) {
      toastError(err.message || 'Erro ao salvar endereço')
    } finally {
      setIsSaving(false)
    }
  }

  const shortenAddress = (address: string) =>
    `${address.slice(0, 10)}...${address.slice(-8)}`

  if (isLoadingUser) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Carteira Digital</h1>
        <p className="text-muted-foreground">
          Configure seu endereço para recebimento dos ativos digitais
        </p>
      </div>

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
              {walletAddress ? (
                <div className="flex items-center gap-3 rounded-lg bg-secondary/50 p-4">
                  <div className="flex-1 font-mono text-sm text-card-foreground">
                    <span className="hidden sm:inline">{walletAddress}</span>
                    <span className="sm:hidden">{shortenAddress(walletAddress)}</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => copy(walletAddress)} className="shrink-0">
                    {isCopied() ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                    <span className="sr-only">Copiar endereço</span>
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum endereço cadastrado.</p>
              )}
              <Button variant="outline" onClick={() => { setNewAddress(walletAddress ?? ''); setIsEditing(true) }}>
                {walletAddress ? 'Alterar Endereço' : 'Adicionar Endereço'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newAddress">Novo Endereço</Label>
                <Input
                  id="newAddress"
                  placeholder="0x... endereço da carteira"
                  value={newAddress}
                  onChange={(e) => { setNewAddress(e.target.value); setError('') }}
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
                <Button variant="outline" onClick={() => { setIsEditing(false); setNewAddress(''); setError('') }} disabled={isSaving}>
                  Cancelar
                </Button>
                <LoadingButton loading={isSaving} loadingText="Salvando..." onClick={handleSaveAddress}>
                  Salvar
                </LoadingButton>
              </div>
            </div>
          )}

          <div className="mt-6 space-y-1.5 text-[11px] leading-relaxed text-muted-foreground/60">
            <p>• Verifique o endereço antes de salvar. Transações são irreversíveis.</p>
            <p>• A carteira precisa estar em trust line para USDC (rede Stellar).</p>
          </div>
        </CardContent>
      </Card>

      {walletAddress && STELLAR_ADDRESS_REGEX.test(walletAddress) && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              Saldo USDC
            </CardTitle>
            {/* <CardDescription>Saldo disponível</CardDescription> */}
          </CardHeader>
          <CardContent>
            {isLoadingBalance ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Consultando saldo...</span>
              </div>
            ) : (
              <p className="text-3xl font-bold text-foreground">
                {usdcBalance !== null
                  ? `${parseFloat(usdcBalance).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 7 })} USDC`
                  : '—'}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {walletAddress && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base text-card-foreground">
              Histórico de Transações
            </CardTitle>
            <CardDescription>
              Transações USDC na rede Stellar. As originadas pelo Fluxa exibem a cobrança correspondente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WalletTransactionsList walletAddress={walletAddress} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export type ChargeStatus = 'pending' | 'paid' | 'converting' | 'completed'

export interface Charge {
  id: string
  description: string
  amountBRL: number
  amountCrypto?: number
  cryptoAsset: string
  status: ChargeStatus
  createdAt: Date
  paidAt?: Date
  completedAt?: Date
  txHash?: string
  paymentLink?: string
}

export interface User {
  id: string
  name: string
  email: string
  walletAddress: string
  createdAt: Date
}

export interface CryptoQuote {
  asset: string
  symbol: string
  priceInBRL: number
  change24h: number
}

export const CRYPTO_ASSETS = [
  { asset: 'Bitcoin', symbol: 'BTC', icon: '₿' },
  { asset: 'Ethereum', symbol: 'ETH', icon: 'Ξ' },
  { asset: 'USDT', symbol: 'USDT', icon: '₮' },
  { asset: 'USDC', symbol: 'USDC', icon: '$' },
] as const

export const STATUS_CONFIG: Record<ChargeStatus, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'Pendente', color: 'text-warning', bgColor: 'bg-warning/10' },
  paid: { label: 'Pago', color: 'text-chart-2', bgColor: 'bg-chart-2/10' },
  converting: { label: 'Em Conversão', color: 'text-chart-1', bgColor: 'bg-chart-1/10' },
  completed: { label: 'Finalizado', color: 'text-success', bgColor: 'bg-success/10' },
}

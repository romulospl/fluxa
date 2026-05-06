import { Charge, CryptoQuote } from './types'

// Mock data para demonstração
export const mockCharges: Charge[] = [
  {
    id: '1',
    description: 'Consultoria de Software',
    amountBRL: 5000,
    amountCrypto: 0.0082,
    cryptoAsset: 'BTC',
    status: 'completed',
    createdAt: new Date('2024-01-15'),
    paidAt: new Date('2024-01-16'),
    completedAt: new Date('2024-01-16'),
    txHash: '0x8f4e3b2a1c9d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1',
  },
  {
    id: '2',
    description: 'Desenvolvimento de API',
    amountBRL: 12500,
    amountCrypto: 3.85,
    cryptoAsset: 'ETH',
    status: 'converting',
    createdAt: new Date('2024-01-18'),
    paidAt: new Date('2024-01-19'),
  },
  {
    id: '3',
    description: 'Design de Interface',
    amountBRL: 3200,
    cryptoAsset: 'USDT',
    status: 'paid',
    createdAt: new Date('2024-01-20'),
    paidAt: new Date('2024-01-21'),
  },
  {
    id: '4',
    description: 'Manutenção Mensal',
    amountBRL: 2800,
    cryptoAsset: 'BTC',
    status: 'pending',
    createdAt: new Date('2024-01-22'),
  },
  {
    id: '5',
    description: 'Auditoria de Segurança',
    amountBRL: 8500,
    cryptoAsset: 'ETH',
    status: 'pending',
    createdAt: new Date('2024-01-23'),
  },
]

export const mockQuotes: CryptoQuote[] = [
  { asset: 'Bitcoin', symbol: 'BTC', priceInBRL: 610000, change24h: 2.5 },
  { asset: 'Ethereum', symbol: 'ETH', priceInBRL: 16200, change24h: -1.2 },
  { asset: 'USDT', symbol: 'USDT', priceInBRL: 5.02, change24h: 0.1 },
  { asset: 'USDC', symbol: 'USDC', priceInBRL: 5.01, change24h: -0.05 },
]

export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatCrypto(value: number, symbol: string): string {
  const decimals = symbol === 'BTC' ? 8 : symbol === 'ETH' ? 6 : 2
  return `${value.toFixed(decimals)} ${symbol}`
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function shortenHash(hash: string): string {
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`
}

export function getExplorerUrl(txHash: string, network: string = 'ethereum'): string {
  const explorers: Record<string, string> = {
    bitcoin: 'https://blockstream.info/tx/',
    ethereum: 'https://etherscan.io/tx/',
    polygon: 'https://polygonscan.com/tx/',
  }
  return `${explorers[network] || explorers.ethereum}${txHash}`
}

export function validateWalletAddress(address: string): boolean {
  // Validação básica para endereços Ethereum (0x...)
  const ethRegex = /^0x[a-fA-F0-9]{40}$/
  // Validação básica para endereços Bitcoin (começando com 1, 3 ou bc1)
  const btcRegex = /^(1|3)[a-zA-HJ-NP-Z0-9]{25,34}$|^bc1[a-zA-HJ-NP-Z0-9]{39,59}$/
  
  return ethRegex.test(address) || btcRegex.test(address)
}

export function calculateCryptoAmount(brlAmount: number, cryptoPrice: number): number {
  return brlAmount / cryptoPrice
}

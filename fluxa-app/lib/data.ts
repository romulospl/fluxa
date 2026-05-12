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
    externalHash: '09e58bfaad2e007132a8dc4dd0db6632cc4789b943cea55f923388073aa67b1f',
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

export function getExplorerUrl(txHash: string, network: string = 'stellar-testnet'): string {
  const explorers: Record<string, string> = {
    'stellar-testnet': 'https://stellar.expert/explorer/testnet/tx/',
    'stellar-mainnet': 'https://stellar.expert/explorer/public/tx/',
    bitcoin: 'https://blockstream.info/tx/',
    ethereum: 'https://etherscan.io/tx/',
    polygon: 'https://polygonscan.com/tx/',
  }
  return `${explorers[network] ?? explorers['stellar-testnet']}${txHash}`
}

export function validateWalletAddress(address: string): boolean {
  if (!address) return false
  const addr = address.trim()

  // Ethereum / EVM (0x...) - case insensitive
  const ethRegex = /^0x[a-fA-F0-9]{40}$/i
  
  // Bitcoin (1, 3, bc1) - case insensitive bc1
  const btcRegex = /^(1|3)[a-zA-HJ-NP-Z0-9]{25,34}$|^bc1[a-z0-9]{39,59}$/i
  
  // Stellar (G...)
  const stellarRegex = /^G[A-Z2-7]{55}$/
  
  // Solana (Base58, 32-44 chars)
  const solanaRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
  
  // Tron (T...)
  const tronRegex = /^T[a-zA-HJ-NP-Z0-9]{33}$/

  return (
    ethRegex.test(addr) ||
    btcRegex.test(addr) ||
    stellarRegex.test(addr) ||
    solanaRegex.test(addr) ||
    tronRegex.test(addr)
  )
}

export function calculateCryptoAmount(brlAmount: number, cryptoPrice: number): number {
  return brlAmount / cryptoPrice
}

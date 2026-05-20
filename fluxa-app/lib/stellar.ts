import axios from 'axios'

export class TrustlineError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TrustlineError'
  }
}

export const STELLAR_ADDRESS_REGEX = /^G[A-Z2-7]{55}$/

const HORIZON_URLS: Record<string, string> = {
  testnet: 'https://horizon-testnet.stellar.org',
  mainnet: 'https://horizon.stellar.org',
}

const USDC_ISSUER_MAINNET = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN'
const USDC_ISSUER_TESTNET = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'

function getHorizonUrl(): string {
  const network = process.env.STELLAR_NETWORK ?? 'testnet'
  return HORIZON_URLS[network] ?? HORIZON_URLS.testnet
}

function getUsdcIssuer(): string {
  const network = process.env.STELLAR_NETWORK ?? 'testnet'
  return network === 'mainnet' ? USDC_ISSUER_MAINNET : USDC_ISSUER_TESTNET
}

export async function validateUsdcTrustline(walletAddress: string): Promise<void> {
  try {
    const res = await axios.get(`${getHorizonUrl()}/accounts/${walletAddress}`, {
      headers: { Accept: 'application/json' },
    })
    const account = res.data

    const usdcIssuer = getUsdcIssuer()

    const hasTrustline = (account.balances as any[]).some(
      (b) => b.asset_code === 'USDC' && b.asset_issuer === usdcIssuer
    )

    if (!hasTrustline) {
      throw new TrustlineError(
        'A carteira não possui trustline de USDC ativo. Ative o trustline para USDC antes de cadastrar.'
      )
    }
  } catch (err: any) {
    if (err.response?.status === 404) {
      throw new TrustlineError(
        'Carteira Stellar não encontrada na rede. Certifique-se de que a conta foi ativada com XLM.'
      )
    }
    if (err instanceof TrustlineError) throw err
    throw new Error(`Erro ao consultar a rede Stellar (status ${err.response?.status || 'desconhecido'})`)
  }
  const usdcIssuer = getUsdcIssuer()

  const hasTrustline = (account.balances as any[]).some(
    (b) => b.asset_code === 'USDC' && b.asset_issuer === usdcIssuer
  )

  if (!hasTrustline) {
    throw new TrustlineError(
      'A carteira não possui trustline de USDC ativo. Ative o trustline para USDC antes de cadastrar.'
    )
  }
}

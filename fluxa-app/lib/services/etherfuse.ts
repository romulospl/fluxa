import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'

const ETHERFUSE_API_KEY = process.env.ETHERFUSE_API_KEY || ''
const BASE_URL = process.env.ETHERFUSE_BASE_URL || 'https://api.sand.etherfuse.com'
const BLOCKCHAIN = 'stellar'
const TARGET_ASSET = 'USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'

// IDs persistidos no .env que representam a Fluxa já aprovada (KYB)
const getOrgUuid = () => process.env.ETHERFUSE_ORG_UUID
const getWalletUuid = () => process.env.ETHERFUSE_WALLET_UUID
const getBankAccountUuid = () => process.env.ETHERFUSE_BANK_ACCOUNT_UUID
const getWalletPublicKey = () => process.env.ETHERFUSE_WALLET_PUBLIC_KEY

// Erro tipado da Etherfuse, expondo o `type` para que os chamadores possam
// decidir se a falha é transitória (ex.: FailedToGetQuote) e vale retry.
export class EtherfuseApiError extends Error {
  type?: string
  constructor(message: string, type?: string) {
    super(message)
    this.name = 'EtherfuseApiError'
    this.type = type
  }
}

async function etherfuseRequest(method: 'GET' | 'POST', path: string, data?: any) {
  if (!ETHERFUSE_API_KEY) throw new Error('ETHERFUSE_API_KEY não configurada')

  try {
    const res = await axios({
      method,
      url: `${BASE_URL}${path}`,
      headers: {
        'Authorization': ETHERFUSE_API_KEY,
        'Content-Type': 'application/json',
      },
      data,
    })
    return res.data
  } catch (err: any) {
    const errorData = err.response?.data
    console.error(`[Etherfuse] Erro na API (${path}):`, JSON.stringify(errorData))
    throw new EtherfuseApiError(
      errorData?.message || `Erro na API da Etherfuse: ${err.response?.statusText}`,
      errorData?.type,
    )
  }
}

export interface QuoteResponse {
  quoteId: string
  destinationAmount: string
  exchangeRate: string
  feeAmount: string
  expiresAt: string
}

export async function createQuote(amountBrl: number): Promise<QuoteResponse> {
  const orgUuid = getOrgUuid()
  const walletPub = getWalletPublicKey()
  if (!orgUuid || !walletPub) throw new Error('ETHERFUSE_ORG_UUID ou ETHERFUSE_WALLET_PUBLIC_KEY não configurada')
  if (!Number.isFinite(amountBrl) || amountBrl <= 0) throw new Error(`Valor de cotação inválido: ${amountBrl}`)

  const quoteId = uuidv4()

  const payload = {
    quoteId,
    customerId: orgUuid,
    blockchain: BLOCKCHAIN,
    quoteAssets: {
      type: 'onramp',
      sourceAsset: 'BRL',
      targetAsset: TARGET_ASSET,
    },
    sourceAmount: amountBrl.toFixed(2), // Valor real líquido da cobrança (BRL, 2 casas), enviado como string
    walletAddress: walletPub, // A carteira da empresa para onde vai o onramp inicial
  }

  // O motor de cotação da Etherfuse pode retornar FailedToGetQuote de forma
  // transitória ("Please try again later") quando não consegue precificar o par.
  // Reusa o mesmo quoteId entre tentativas e aplica backoff exponencial.
  const MAX_ATTEMPTS = 4
  let response: any
  for (let attempt = 1; ; attempt++) {
    try {
      response = await etherfuseRequest('POST', '/ramp/quote', payload)
      break
    } catch (err) {
      const transient = err instanceof EtherfuseApiError && err.type === 'FailedToGetQuote'
      if (!transient || attempt >= MAX_ATTEMPTS) throw err
      const delayMs = 1000 * 2 ** (attempt - 1) // 1s, 2s, 4s
      console.warn(`[Etherfuse] Cotação falhou (FailedToGetQuote), tentativa ${attempt}/${MAX_ATTEMPTS}. Repetindo em ${delayMs}ms...`)
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }

  // A API pode retornar um objeto de erro com tipo
  if (response.type && response.message) {
    throw new Error(`Falha ao criar cotação: ${response.message}`)
  }

  return {
    quoteId,
    destinationAmount: response.destinationAmount,
    exchangeRate: response.exchangeRate,
    feeAmount: response.feeAmount,
    expiresAt: response.expiresAt,
  }
}

export interface OrderResponse {
  orderId: string
  depositClabe: string
  depositAmount: string
  depositBankName: string
  depositAccountHolder: string
}

export async function createOrder(quoteId: string): Promise<OrderResponse> {
  const bankAccountUuid = getBankAccountUuid()
  const walletUuid = getWalletUuid()

  if (!bankAccountUuid || !walletUuid) {
    throw new Error('ETHERFUSE_BANK_ACCOUNT_UUID ou ETHERFUSE_WALLET_UUID ausentes no .env')
  }

  const orderId = uuidv4()

  const payload = {
    orderId,
    bankAccountId: bankAccountUuid,
    cryptoWalletId: walletUuid,
    quoteId,
  }

  const response = await etherfuseRequest('POST', '/ramp/order', payload)

  return {
    orderId,
    depositClabe: response.onramp?.depositClabe,
    depositAmount: response.onramp?.depositAmount,
    depositBankName: response.onramp?.depositBankName,
    depositAccountHolder: response.onramp?.depositAccountHolder,
  }
}

export async function getOrderStatus(orderId: string) {
  return etherfuseRequest('GET', `/ramp/order/${orderId}`)
}

export async function simulateFiatReceived(orderId: string) {
  return etherfuseRequest('POST', '/ramp/order/fiat_received', { orderId })
}

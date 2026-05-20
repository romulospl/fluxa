import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import axios from 'axios'
import { getUserFromToken } from '@/lib/services/auth'

const HORIZON_URLS: Record<string, string> = {
  testnet: 'https://horizon-testnet.stellar.org',
  mainnet: 'https://horizon.stellar.org',
}
const STELLAR_ADDRESS_REGEX = /^G[A-Z2-7]{55}$/
const USDC_ISSUER_MAINNET = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN'
const USDC_ISSUER_TESTNET = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'

function getHorizonUrl() {
  const network = process.env.STELLAR_NETWORK ?? 'testnet'
  return HORIZON_URLS[network] ?? HORIZON_URLS.testnet
}

function getUsdcIssuer() {
  const network = process.env.STELLAR_NETWORK ?? 'testnet'
  return network === 'mainnet' ? USDC_ISSUER_MAINNET : USDC_ISSUER_TESTNET
}

async function resolveToken(request: Request): Promise<string | null> {
  const authHeader = request.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    if (token) return token
  }
  const cookieStore = await cookies()
  return cookieStore.get('fluxa-token')?.value || null
}

/**
 * @swagger
 * /api/wallet/balance:
 *   get:
 *     tags:
 *       - Carteira
 *     summary: Retorna o saldo USDC da carteira Stellar do usuário
 *     description: Consulta o saldo de USDC na rede Stellar via Horizon API usando o endereço de carteira cadastrado pelo usuário.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Saldo retornado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 balance:
 *                   type: string
 *                   example: "42.5000000"
 *       400:
 *         description: Carteira não cadastrada ou não é um endereço Stellar
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Conta não encontrada na rede Stellar
 *       500:
 *         description: Erro interno do servidor
 */
export async function GET(request: Request) {
  try {
    const token = await resolveToken(request)
    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 })
    }

    const user = await getUserFromToken(token)
    const { walletAddress } = user

    if (!walletAddress) {
      return NextResponse.json({ error: 'Nenhum endereço de carteira cadastrado' }, { status: 400 })
    }

    if (!STELLAR_ADDRESS_REGEX.test(walletAddress)) {
      return NextResponse.json(
        { error: 'Somente carteiras Stellar (G...) têm saldo disponível' },
        { status: 400 }
      )
    }

    try {
      const horizonRes = await axios.get(`${getHorizonUrl()}/accounts/${walletAddress}`, {
        headers: { Accept: 'application/json' },
      })
      const horizonData = horizonRes.data

      const usdcIssuer = getUsdcIssuer()
      const usdcBalance = (horizonData.balances as any[]).find(
        (b) => b.asset_code === 'USDC' && b.asset_issuer === usdcIssuer
      )

      return NextResponse.json({ balance: usdcBalance?.balance ?? '0' })
    } catch (err: any) {
      if (err.response?.status === 404) {
        return NextResponse.json({ balance: '0' })
      }
      throw new Error(`Horizon API retornou status ${err.response?.status}`)
    }
  } catch (error: any) {
    console.error('Erro na rota GET /api/wallet/balance:', error)

    if (error.message === 'Token inválido ou expirado') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    return NextResponse.json({ error: 'Erro ao buscar saldo da carteira' }, { status: 500 })
  }
}

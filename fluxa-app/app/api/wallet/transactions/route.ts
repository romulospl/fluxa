import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getUserFromToken } from '@/lib/services/auth'
import { db } from '@/lib/db'

const HORIZON_URLS: Record<string, string> = {
  testnet: 'https://horizon-testnet.stellar.org',
  mainnet: 'https://horizon.stellar.org',
}
const STELLAR_ADDRESS_REGEX = /^G[A-Z2-7]{55}$/
const PAGE_LIMIT = 10

function getHorizonUrl() {
  const network = process.env.STELLAR_NETWORK ?? 'testnet'
  return HORIZON_URLS[network] ?? HORIZON_URLS.testnet
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
 * /api/wallet/transactions:
 *   get:
 *     tags:
 *       - Carteira
 *     summary: Lista transações USDC da carteira Stellar do usuário
 *     description: Busca o histórico de pagamentos USDC na rede Stellar via Horizon API. Transações originadas pelo Fluxa são enriquecidas com dados da cobrança correspondente.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *         description: Cursor de paginação do Stellar Horizon
 *     responses:
 *       200:
 *         description: Lista de transações retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transactions:
 *                   type: array
 *                   items:
 *                     type: object
 *                 nextCursor:
 *                   type: string
 *                   nullable: true
 *                 hasMore:
 *                   type: boolean
 *       400:
 *         description: Carteira não cadastrada ou não é um endereço Stellar
 *       401:
 *         description: Não autorizado
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
        { error: 'Somente carteiras Stellar (G...) têm histórico disponível' },
        { status: 400 }
      )
    }

    const { searchParams } = new URL(request.url)
    const cursor = searchParams.get('cursor')

    const horizonParams = new URLSearchParams({ order: 'desc', limit: String(PAGE_LIMIT) })
    if (cursor) horizonParams.set('cursor', cursor)

    const horizonRes = await fetch(
      `${getHorizonUrl()}/accounts/${walletAddress}/payments?${horizonParams}`,
      { headers: { Accept: 'application/json' }, next: { revalidate: 0 } }
    )

    if (horizonRes.status === 404) {
      return NextResponse.json({ transactions: [], nextCursor: null, hasMore: false })
    }

    if (!horizonRes.ok) {
      throw new Error(`Horizon API retornou status ${horizonRes.status}`)
    }

    const horizonData = await horizonRes.json()
    const records: any[] = horizonData._embedded?.records ?? []

    const usdcPayments = records.filter((r) => r.type === 'payment' && r.asset_code === 'USDC')

    const nextLink: string | undefined = horizonData._links?.next?.href
    const nextCursor = nextLink ? new URL(nextLink).searchParams.get('cursor') : null
    const hasMore = records.length >= PAGE_LIMIT

    if (usdcPayments.length === 0) {
      return NextResponse.json({ transactions: [], nextCursor, hasMore })
    }

    const hashes = usdcPayments.map((r) => r.transaction_hash as string).filter(Boolean)

    const fluxaTxs = await db.chargeTransaction.findMany({
      where: { hash: { in: hashes } },
      include: {
        charge: {
          select: {
            id: true,
            number: true,
            description: true,
            amountBrl: true,
            amountUsdc: true,
            status: true,
            paidAt: true,
          },
        },
      },
    })

    const fluxaByHash = new Map(fluxaTxs.map((tx) => [tx.hash, tx]))

    const transactions = usdcPayments.map((r) => {
      const fluxaTx = fluxaByHash.get(r.transaction_hash)
      return {
        id: r.id as string,
        hash: r.transaction_hash as string,
        pagingToken: r.paging_token as string,
        amount: r.amount as string,
        direction: (r.to === walletAddress ? 'in' : 'out') as 'in' | 'out',
        from: r.from as string,
        to: r.to as string,
        createdAt: r.created_at as string,
        isFluxaTransaction: !!fluxaTx,
        charge: fluxaTx
          ? {
              id: fluxaTx.charge.id,
              number: fluxaTx.charge.number,
              description: fluxaTx.charge.description,
              amountBrl: Number(fluxaTx.charge.amountBrl),
              amountUsdc: fluxaTx.charge.amountUsdc ? Number(fluxaTx.charge.amountUsdc) : null,
              status: fluxaTx.charge.status,
              paidAt: fluxaTx.charge.paidAt?.toISOString() ?? null,
            }
          : undefined,
      }
    })

    return NextResponse.json({ transactions, nextCursor, hasMore })
  } catch (error: any) {
    console.error('Erro na rota GET /api/wallet/transactions:', error)

    if (error.message === 'Token inválido ou expirado') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    return NextResponse.json({ error: 'Erro ao buscar transações da carteira' }, { status: 500 })
  }
}

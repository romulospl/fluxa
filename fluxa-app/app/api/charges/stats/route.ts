import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getChargeStats } from '@/lib/services/charges'

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
 * /api/charges/stats:
 *   get:
 *     tags:
 *       - Cobrança
 *     summary: Retorna estatísticas agregadas das cobranças do usuário
 *     description: >
 *       Calcula via agregação no banco de dados os totais de cobranças por status
 *       para o usuário autenticado. Cobre todas as cobranças, não apenas a página atual.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Estatísticas retornadas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   description: Total de cobranças criadas
 *                 totalBRL:
 *                   type: number
 *                   description: Soma de todos os valores em BRL
 *                 paidBRL:
 *                   type: number
 *                   description: Soma em BRL das cobranças pagas (status paid, converting ou completed)
 *                 pendingBRL:
 *                   type: number
 *                   description: Soma em BRL das cobranças pendentes
 *                 pending:
 *                   type: integer
 *                   description: Quantidade de cobranças pendentes
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
export async function GET(request: Request) {
  try {
    const token = await resolveToken(request)
    if (!token) return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 })

    const stats = await getChargeStats(token)
    return NextResponse.json(stats)
  } catch (error: any) {
    if (error.message === 'Token inválido ou expirado') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Erro na rota GET /api/charges/stats:', error)
    return NextResponse.json({ error: 'Erro interno ao buscar estatísticas' }, { status: 500 })
  }
}

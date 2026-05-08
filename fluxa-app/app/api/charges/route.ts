import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { listCharges } from '@/lib/services/charges'

async function resolveToken(request: Request): Promise<string | null> {
  const authHeader = request.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) return authHeader.substring(7)
  const cookieStore = await cookies()
  return cookieStore.get('fluxa-token')?.value || null
}

/**
 * @swagger
 * /api/charges:
 *   get:
 *     tags:
 *       - Cobrança
 *     summary: Lista as cobranças do usuário autenticado
 *     description: Retorna uma lista paginada de cobranças vinculadas ao usuário autenticado, ordenadas por data de criação decrescente.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Quantidade de itens por página
 *     responses:
 *       200:
 *         description: Lista de cobranças retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       description:
 *                         type: string
 *                       amountBrl:
 *                         type: number
 *                       asaasId:
 *                         type: string
 *                         nullable: true
 *                       status:
 *                         type: string
 *                       paymentMethod:
 *                         type: string
 *                         nullable: true
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       paidAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
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

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '10', 10)))

    const result = await listCharges(token, { page, limit })
    return NextResponse.json(result)
  } catch (error: any) {
    if (error.message === 'Token inválido ou expirado') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    console.error('Erro na rota GET /api/charges:', error)

    const errorMessage =
      process.env.NODE_ENV === 'development'
        ? `Erro: ${error.message || 'Erro desconhecido'}`
        : 'Erro interno ao buscar cobranças'

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { listChargeTransactions } from '@/lib/services/charges'

async function resolveToken(request: Request): Promise<string | null> {
  const authHeader = request.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    if (token) return token
  }

  const cookieStore = await cookies()
  return cookieStore.get('fluxa-token')?.value ?? null
}

/**
 * @swagger
 * /api/charges/{id}/transactions:
 *   get:
 *     tags:
 *       - Cobrança
 *     summary: Lista o histórico de transações de uma cobrança
 *     description: Retorna todas as transações registradas para a cobrança, ordenadas da mais antiga para a mais recente.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da cobrança
 *     responses:
 *       200:
 *         description: Histórico de transações retornado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                   status:
 *                     type: string
 *                   hash:
 *                     type: string
 *                     nullable: true
 *                   occurredAt:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Cobrança não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await resolveToken(request)
    if (!token) return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 })

    const { id } = await params
    const transactions = await listChargeTransactions(token, id)
    return NextResponse.json(transactions)
  } catch (error: any) {
    if (error.message === 'Token inválido ou expirado') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    if (error.statusCode === 404) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    return NextResponse.json({ error: 'Erro interno ao buscar transações' }, { status: 500 })
  }
}

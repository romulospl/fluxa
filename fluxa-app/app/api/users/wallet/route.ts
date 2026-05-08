import { NextResponse } from 'next/server'
import { updateWalletAddress } from '@/lib/services/auth'
import { cookies } from 'next/headers'

async function resolveToken(request: Request): Promise<string | null> {
  const authHeader = request.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) return authHeader.substring(7)
  const cookieStore = await cookies()
  return cookieStore.get('fluxa-token')?.value || null
}

/**
 * @swagger
 * /api/users/wallet:
 *   patch:
 *     tags:
 *       - Usuário
 *     summary: Atualiza o endereço de carteira do usuário autenticado
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - walletAddress
 *             properties:
 *               walletAddress:
 *                 type: string
 *                 example: "0xAbc123..."
 *     responses:
 *       200:
 *         description: Carteira atualizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 walletAddress:
 *                   type: string
 *       400:
 *         description: Campo walletAddress ausente
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
export async function PATCH(request: Request) {
  try {
    const token = await resolveToken(request)
    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 })
    }

    const body = await request.json()
    const { walletAddress } = body

    if (!walletAddress) {
      return NextResponse.json({ error: 'walletAddress é obrigatório' }, { status: 400 })
    }

    const result = await updateWalletAddress(token, walletAddress)
    return NextResponse.json(result, { status: 200 })
  } catch (error: any) {
    if (
      error.message === 'Token inválido ou expirado' ||
      error.message === 'Usuário não encontrado'
    ) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    console.error('Erro na rota PATCH /api/users/wallet:', error)

    const errorMessage = process.env.NODE_ENV === 'development'
      ? `Erro: ${error.message || 'Erro desconhecido'}`
      : 'Erro interno ao atualizar a carteira'

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

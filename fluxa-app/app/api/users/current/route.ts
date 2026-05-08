import { NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/services/auth'
import { cookies } from 'next/headers'

/**
 * @swagger
 * /api/users/current:
 *   get:
 *     tags:
 *       - Usuário
 *     summary: Obtém os dados do usuário autenticado
 *     description: Retorna as informações do usuário autenticado a partir do token JWT enviado no header Authorization ou via cookie.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do usuário retornados com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 email:
 *                   type: string
 *                   format: email
 *                 name:
 *                   type: string
 *                   nullable: true
 *                 cnpj:
 *                   type: string
 *                   nullable: true
 *                 walletAddress:
 *                   type: string
 *                   nullable: true
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 address:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     zipCode:
 *                       type: string
 *                     street:
 *                       type: string
 *                     number:
 *                       type: string
 *                     complement:
 *                       type: string
 *                       nullable: true
 *                     neighborhood:
 *                       type: string
 *                     city:
 *                       type: string
 *                     state:
 *                       type: string
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization')
    let token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null

    if (!token) {
      const cookieStore = await cookies()
      token = cookieStore.get('fluxa-token')?.value || null
    }

    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 })
    }

    const user = await getUserFromToken(token)
    return NextResponse.json(user, { status: 200 })
  } catch (error: any) {
    if (error.message === 'Token inválido ou expirado' || error.message === 'Usuário não encontrado') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    console.error('Erro na rota GET /api/users/current:', error)

    const errorMessage = process.env.NODE_ENV === 'development'
      ? `Erro: ${error.message || 'Erro desconhecido'}`
      : 'Erro interno ao buscar dados do usuário'

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

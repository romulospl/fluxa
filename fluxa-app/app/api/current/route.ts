import { NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/services/auth'
import { cookies } from 'next/headers'

/**
 * @swagger
 * /api/current:
 *   get:
 *     summary: Obtém os dados do usuário atual
 *     description: Retorna as informações do usuário autenticado a partir do token JWT enviado no header Authorization ou via cookie.
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
 *                 email:
 *                   type: string
 *                 name:
 *                   type: string
 *                 walletAddress:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Não autorizado (token ausente, inválido ou expirado)
 *       500:
 *         description: Erro interno do servidor
 */
export async function GET(request: Request) {
  try {
    // 1. Tenta obter o token do header Authorization
    const authHeader = request.headers.get('Authorization')
    let token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null

    // 2. Se não estiver no header, tenta obter do cookie
    if (!token) {
      const cookieStore = await cookies()
      token = cookieStore.get('fluxa-token')?.value || null
    }

    if (!token) {
      return NextResponse.json(
        { error: 'Token não fornecido' },
        { status: 401 }
      )
    }

    // 3. Busca o usuário pelo token
    const user = await getUserFromToken(token)

    return NextResponse.json(user, { status: 200 })
  } catch (error: any) {
    if (error.message === 'Token inválido ou expirado' || error.message === 'Usuário não encontrado') {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    console.error('Erro na rota /api/current:', error)
    
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? `Erro: ${error.message || 'Erro desconhecido'}`
      : 'Erro interno ao buscar dados do usuário'

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

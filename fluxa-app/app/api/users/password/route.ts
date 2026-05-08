import { NextResponse } from 'next/server'
import { changePassword } from '@/lib/services/auth'
import { cookies } from 'next/headers'

async function resolveToken(request: Request): Promise<string | null> {
  const authHeader = request.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) return authHeader.substring(7)
  const cookieStore = await cookies()
  return cookieStore.get('fluxa-token')?.value || null
}

/**
 * @swagger
 * /api/users/password:
 *   patch:
 *     tags:
 *       - Usuário
 *     summary: Altera a senha do usuário autenticado
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: senhaAtual123
 *               newPassword:
 *                 type: string
 *                 example: novaSenha456
 *     responses:
 *       200:
 *         description: Senha alterada com sucesso
 *       400:
 *         description: Campos obrigatórios ausentes ou nova senha muito curta
 *       401:
 *         description: Não autorizado ou senha atual incorreta
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
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'currentPassword e newPassword são obrigatórios' }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'A nova senha deve ter ao menos 6 caracteres' }, { status: 400 })
    }

    await changePassword(token, { currentPassword, newPassword })
    return NextResponse.json({ message: 'Senha alterada com sucesso' }, { status: 200 })
  } catch (error: any) {
    if (
      error.message === 'Token inválido ou expirado' ||
      error.message === 'Usuário não encontrado' ||
      error.message === 'Senha atual incorreta'
    ) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    console.error('Erro na rota PATCH /api/users/password:', error)

    const errorMessage = process.env.NODE_ENV === 'development'
      ? `Erro: ${error.message || 'Erro desconhecido'}`
      : 'Erro interno ao alterar a senha'

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

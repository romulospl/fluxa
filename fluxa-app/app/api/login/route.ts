import { NextResponse } from 'next/server'
import { loginUser } from '@/lib/services/auth'

/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: Autentica um usuário
 *     description: Realiza o login do usuário verificando e-mail e senha.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                 token:
 *                   type: string
 *       401:
 *         description: E-mail ou senha incorretos
 *       400:
 *         description: E-mail e senha são obrigatórios
 *       500:
 *         description: Erro interno
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Chama a camada de serviço para processar o login
    const result = await loginUser({ email, password })

    const response = NextResponse.json(result, { status: 200 })

    // Define o cookie com o token
    response.cookies.set('fluxa-token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1 dia
      path: '/',
    })

    return response
  } catch (error: any) {
    // Tratamento de erros de negócio conhecidos
    if (error.message === 'E-mail ou senha incorretos') {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    console.error('Erro na rota de login:', error)

    const errorMessage = process.env.NODE_ENV === 'development' 
      ? `Erro: ${error.message || 'Erro desconhecido'}`
      : 'Erro interno ao processar o login'

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

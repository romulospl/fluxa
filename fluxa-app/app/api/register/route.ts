import { NextResponse } from 'next/server'
import { registerUser } from '@/lib/services/auth'

/**
 * @swagger
 * /api/register:
 *   post:
 *     summary: Registra um novo usuário
 *     description: Cria uma nova conta de usuário com e-mail e senha.
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
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *       400:
 *         description: E-mail e senha são obrigatórios, ou E-mail já cadastrado
 *       500:
 *         description: Erro interno
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Chama a camada de serviço para processar o cadastro
    const user = await registerUser({ name, email, password })

    return NextResponse.json(
      { message: 'Usuário criado com sucesso', user },
      { status: 201 }
    )
  } catch (error: any) {
    // Tratamento de erros de negócio conhecidos
    if (error.message === 'Este e-mail já está cadastrado') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    console.error('Erro na rota de cadastro:', error)

    // Em desenvolvimento, podemos retornar o erro detalhado para facilitar o debug
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? `Erro: ${error.message || 'Erro desconhecido'}`
      : 'Erro interno ao processar o cadastro'

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}


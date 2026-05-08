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
 *               walletAddress:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
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
 *       400:
 *         description: E-mail e senha são obrigatórios, ou E-mail já cadastrado
 *       500:
 *         description: Erro interno
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, password, walletAddress } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Chama a camada de serviço para processar o cadastro
    const user = await registerUser({ name, email, password, walletAddress })

    return NextResponse.json(
      user,
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


import { NextResponse } from 'next/server'
import { registerUser, updateUser } from '@/lib/services/auth'
import { cookies } from 'next/headers'

async function resolveToken(request: Request): Promise<string | null> {
  const authHeader = request.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) return authHeader.substring(7)
  const cookieStore = await cookies()
  return cookieStore.get('fluxa-token')?.value || null
}

/**
 * @swagger
 * /api/users:
 *   post:
 *     tags:
 *       - Usuário
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
 *               cnpj:
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
    const { name, email, password, walletAddress, cnpj, address } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email e senha são obrigatórios' }, { status: 400 })
    }

    const user = await registerUser({ name, email, password, walletAddress, cnpj, address })
    return NextResponse.json(user, { status: 201 })
  } catch (error: any) {
    if (error.message === 'Este e-mail já está cadastrado') {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.error('Erro na rota POST /api/users:', error)

    const errorMessage = process.env.NODE_ENV === 'development'
      ? `Erro: ${error.message || 'Erro desconhecido'}`
      : 'Erro interno ao processar o cadastro'

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

/**
 * @swagger
 * /api/users:
 *   put:
 *     tags:
 *       - Usuário
 *     summary: Atualiza os dados do usuário autenticado
 *     description: Substitui nome, e-mail e endereço completo do usuário autenticado.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: João da Silva
 *               email:
 *                 type: string
 *                 format: email
 *                 example: joao@exemplo.com
 *               address:
 *                 type: object
 *                 properties:
 *                   zipCode:
 *                     type: string
 *                     example: "01310100"
 *                   street:
 *                     type: string
 *                     example: Avenida Paulista
 *                   number:
 *                     type: string
 *                     example: "1000"
 *                   complement:
 *                     type: string
 *                     nullable: true
 *                     example: Apto 42
 *                   neighborhood:
 *                     type: string
 *                     example: Bela Vista
 *                   city:
 *                     type: string
 *                     example: São Paulo
 *                   state:
 *                     type: string
 *                     example: SP
 *     responses:
 *       200:
 *         description: Dados atualizados com sucesso
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

export async function PUT(request: Request) {
  try {
    const token = await resolveToken(request)
    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, address } = body

    const updated = await updateUser(token, { name, email, address })
    return NextResponse.json(updated, { status: 200 })
  } catch (error: any) {
    if (error.message === 'Token inválido ou expirado' || error.message === 'Usuário não encontrado') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    console.error('Erro na rota PUT /api/users:', error)

    const errorMessage = process.env.NODE_ENV === 'development'
      ? `Erro: ${error.message || 'Erro desconhecido'}`
      : 'Erro interno ao atualizar dados do usuário'

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

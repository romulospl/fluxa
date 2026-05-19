import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { listCharges, createCharge } from '@/lib/services/charges'

async function resolveToken(request: Request): Promise<string | null> {
  const authHeader = request.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    if (token) {
      console.log('Token resolvido via Authorization Header')
      return token
    }
  }

  const cookieStore = await cookies()
  const token = cookieStore.get('fluxa-token')?.value || null
  if (token) {
    console.log('Token resolvido via Cookie (fluxa-token)')
  } else {
    console.log('Nenhum token encontrado (Header ou Cookie)')
  }
  return token
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
 *                       amountUsdc:
 *                         type: number
 *                         nullable: true
 *                         description: Valor total em USDC gerado pela conversão
 *                       feePercent:
 *                         type: number
 *                         description: Taxa Fluxa aplicada (%)
 *                       feeBrl:
 *                         type: number
 *                         description: Valor em BRL retido pela Fluxa como taxa
 *                       externalId:
 *                         type: string
 *                         nullable: true
 *                       status:
 *                         type: string
 *                       paymentMethod:
 *                         type: string
 *                         enum: [BOLETO, PIX]
 *                         nullable: true
 *                       paymentUrl:
 *                         type: string
 *                         nullable: true
 *                         description: URL da página de pagamento no Asaas
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
/**
 * @swagger
 * /api/charges:
 *   post:
 *     tags:
 *       - Cobrança
 *     summary: Cria uma nova cobrança (boleto ou PIX) no Asaas
 *     description: Cria um cliente no Asaas (se necessário), gera um boleto ou PIX e registra a cobrança vinculada ao usuário autenticado.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - description
 *               - amountBrl
 *             properties:
 *               description:
 *                 type: string
 *                 example: Pagamento referente ao pedido #123
 *               amountBrl:
 *                 type: number
 *                 example: 250.00
 *               billingType:
 *                 type: string
 *                 enum: [BOLETO, PIX]
 *                 default: BOLETO
 *                 description: Tipo de cobrança (boleto ou PIX)
 *     responses:
 *       201:
 *         description: Cobrança criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 description:
 *                   type: string
 *                 amountBrl:
 *                   type: number
 *                 amountUsdc:
 *                   type: number
 *                   nullable: true
 *                   description: Valor total em USDC gerado pela conversão
 *                 feePercent:
 *                   type: number
 *                   description: Taxa Fluxa aplicada (%)
 *                 feeBrl:
 *                   type: number
 *                   description: Valor em BRL retido pela Fluxa como taxa
 *                 externalId:
 *                   type: string
 *                   description: ID do pagamento no Asaas (pay_...)
 *                 status:
 *                   type: string
 *                   example: pending
 *                 paymentMethod:
 *                   type: string
 *                   enum: [BOLETO, PIX]
 *                   example: BOLETO
 *                 paymentUrl:
 *                   type: string
 *                   nullable: true
 *                   description: URL da página de pagamento no Asaas
 *                   example: https://sandbox.asaas.com/i/abc123
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 paidAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *       400:
 *         description: Campos obrigatórios ausentes, inválidos ou usuário sem nome/CNPJ
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
export async function POST(request: Request) {
  try {
    const token = await resolveToken(request)
    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 })
    }

    const body = await request.json()
    const { description, amountBrl, billingType, dueDate } = body

    if (!description || amountBrl === undefined || amountBrl === null) {
      return NextResponse.json({ error: 'description e amountBrl são obrigatórios' }, { status: 400 })
    }

    const parsed = Number(amountBrl)
    if (isNaN(parsed) || parsed <= 0) {
      return NextResponse.json({ error: 'amountBrl deve ser um número positivo' }, { status: 400 })
    }

    if (billingType !== undefined && billingType !== 'BOLETO' && billingType !== 'PIX') {
      return NextResponse.json({ error: 'billingType deve ser BOLETO ou PIX' }, { status: 400 })
    }

    if (!dueDate || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      return NextResponse.json({ error: 'dueDate é obrigatório no formato YYYY-MM-DD' }, { status: 400 })
    }

    const today = new Date().toISOString().split('T')[0]
    if (dueDate < today) {
      return NextResponse.json({ error: 'dueDate não pode ser uma data no passado' }, { status: 400 })
    }

    const charge = await createCharge(token, { description, amountBrl: parsed, billingType, dueDate })
    return NextResponse.json(charge, { status: 201 })
  } catch (error: any) {
    console.error('Erro na rota POST /api/charges:', error)

    if (error.message === 'Token inválido ou expirado') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    if (error.statusCode) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }

    const status = error.name === 'PrismaClientKnownRequestError' || error.name === 'PrismaClientValidationError' ? 400 : 500
    const message = process.env.NODE_ENV === 'development' ? error.message : 'Erro interno ao criar cobrança'

    return NextResponse.json({ error: message }, { status })
  }
}

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
    console.error('Erro na rota GET /api/charges:', error)

    if (error.message === 'Token inválido ou expirado') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    // Tratamento mais limpo para erros internos
    const status = error.name === 'PrismaClientKnownRequestError' || error.name === 'PrismaClientValidationError' ? 400 : 500
    const message = process.env.NODE_ENV === 'development' ? error.message : 'Erro interno ao buscar cobranças'

    return NextResponse.json({ error: message }, { status })
  }
}

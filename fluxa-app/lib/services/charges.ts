import { db } from '@/lib/db'
import { verifyToken } from '@/lib/services/auth'

const ASAAS_BASE_URL = 'https://sandbox.asaas.com/api/v3'

async function asaasPost(path: string, body: object) {
  const token = process.env.ASAAS_TOKEN_API
  if (!token) throw new Error('ASAAS_TOKEN_API não configurado')

  const res = await fetch(`${ASAAS_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      access_token: token,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    const description = body?.errors?.[0]?.description ?? `Asaas API error (${res.status})`
    const err = Object.assign(new Error(description), { statusCode: res.status })
    throw err
  }

  return res.json()
}

export async function createCharge(
  token: string,
  { description, amountBrl, billingType = 'BOLETO', dueDate }: {
    description: string
    amountBrl: number
    billingType?: 'BOLETO' | 'PIX'
    dueDate: string
  }
) {
  const decoded = await verifyToken(token)

  const user = await db.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true, name: true, cnpj: true, externalReference: true },
  })

  if (!user) throw new Error('Usuário não encontrado')
  if (!user.name || !user.cnpj) {
    throw new Error('Usuário precisa ter nome e CNPJ cadastrados para criar cobranças')
  }

  let customerRef = user.externalReference

  if (!customerRef) {
    const customer = await asaasPost('/customers', {
      name: user.name,
      cpfCnpj: user.cnpj,
    })

    customerRef = customer.id as string

    await db.user.update({
      where: { id: user.id },
      data: { externalReference: customerRef },
    })
  }

  const payment = await asaasPost('/payments', {
    customer: customerRef,
    billingType,
    value: amountBrl,
    dueDate,
    description,
  })

  const charge = await db.charge.create({
    data: {
      userId: user.id,
      description,
      amountBrl,
      externalId: payment.id as string,
      status: 'pending',
      paymentMethod: billingType,
      paymentUrl: (payment.invoiceUrl as string) ?? null,
      dueDate: new Date(dueDate),
    },
    select: {
      id: true,
      description: true,
      amountBrl: true,
      externalId: true,
      status: true,
      paymentMethod: true,
      paymentUrl: true,
      dueDate: true,
      createdAt: true,
      paidAt: true,
    },
  })

  return charge
}

export async function markChargeAsPaid(externalId: string, paymentDate: string) {
  await db.charge.updateMany({
    where: { externalId },
    data: {
      status: 'paid',
      paidAt: new Date(paymentDate),
    },
  })
}

export async function listCharges(
  token: string,
  { page = 1, limit = 10 }: { page?: number; limit?: number }
) {
  const decoded = await verifyToken(token)

  const skip = (page - 1) * limit

  const [charges, total] = await Promise.all([
    db.charge.findMany({
      where: { userId: decoded.userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        description: true,
        amountBrl: true,
        externalId: true,
        status: true,
        paymentMethod: true,
        paymentUrl: true,
        createdAt: true,
        paidAt: true,
      },
    }),
    db.charge.count({ where: { userId: decoded.userId } }),
  ])

  return {
    data: charges,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

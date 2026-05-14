import { db } from '@/lib/db'
import { verifyToken } from '@/lib/services/auth'
import { recordChargeOnStellar, updateChargeStatusOnStellar } from '@/lib/services/stellar'
import { getUsdcBrlRate, brlToUsdc } from '@/lib/services/exchange'
import { enqueueUsdcTransfer } from '@/lib/queue'

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
    select: { id: true, name: true, cnpj: true, externalReference: true, walletAddress: true },
  })

  if (!user) throw new Error('Usuário não encontrado')
  if (!user.name || !user.cnpj) {
    throw new Error('Usuário precisa ter nome e CNPJ cadastrados para criar cobranças')
  }
  if (!user.walletAddress) {
    throw new Error('Usuário precisa ter endereço de carteira Stellar cadastrado para criar cobranças')
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

  const usdcRate = await getUsdcBrlRate()
  const amountUsdc = brlToUsdc(amountBrl, usdcRate)
  const feePercent = parseFloat(process.env.FLUXA_FEE_PERCENT ?? '10')
  const feeUsdc = amountUsdc * feePercent / 100

  const payment = await asaasPost('/payments', {
    customer: customerRef,
    billingType,
    value: amountBrl,
    dueDate,
    description,
  })

  const { charge, transactionId } = await db.$transaction(async (tx) => {
    const last = await tx.charge.findFirst({
      where: { userId: user.id },
      orderBy: { number: 'desc' },
      select: { number: true },
    })
    const nextNumber = (last?.number ?? 0) + 1

    const charge = await tx.charge.create({
      data: {
        number: nextNumber,
        userId: user.id,
        description,
        amountBrl,
        amountUsdc,
        feePercent,
        feeUsdc,
        externalId: payment.id as string,
        status: 'pending',
        paymentMethod: billingType,
        paymentUrl: (payment.invoiceUrl as string) ?? null,
        dueDate: new Date(dueDate),
      },
      select: {
        id: true,
        number: true,
        description: true,
        amountBrl: true,
        amountUsdc: true,
        feePercent: true,
        feeUsdc: true,
        externalId: true,
        status: true,
        paymentMethod: true,
        paymentUrl: true,
        dueDate: true,
        createdAt: true,
        paidAt: true,
      },
    })

    const transaction = await tx.chargeTransaction.create({
      data: {
        chargeId: charge.id,
        status: 'pending',
        occurredAt: charge.createdAt,
      },
      select: { id: true },
    })

    return { charge, transactionId: transaction.id }
  })

  // Fire-and-forget: registra on-chain sem bloquear a resposta
  recordChargeOnStellar({ ...charge, userId: user.id, amountBrl: charge.amountBrl.toString() })
    .then(async (txHash) => {
      await db.chargeTransaction.update({
        where: { id: transactionId },
        data: { hash: txHash },
      })
      console.log(`[Stellar] charge ${charge.id} registrado: ${txHash}`)
    })
    .catch((err: Error) => {
      console.error(`[Stellar] Falha ao registrar charge ${charge.id}:`, err.message)
    })

  return charge
}

export async function markChargeAsPaid(externalId: string, paymentDate: string) {
  const charges = await db.charge.findMany({
    where: { externalId },
    select: {
      id: true,
      amountBrl: true,
      feePercent: true,
      transactions: {
        where: { hash: { not: null } },
        select: { hash: true },
        take: 1,
      },
    },
  })

  // Asaas sends paymentDate as YYYY-MM-DD only — no time component. Any fixed
  // time (midnight, noon UTC) converts incorrectly in BRT. The webhook fires at
  // the moment of confirmation, so the server clock is the accurate timestamp.
  const paidAt = new Date()

  await db.charge.updateMany({
    where: { externalId },
    data: { status: 'paid', paidAt, transferStatus: 'transfer_pending' },
  })

  for (const charge of charges) {
    const feeAmountBrl = Number(charge.amountBrl) * Number(charge.feePercent) / 100

    const transaction = await db.chargeTransaction.create({
      data: {
        chargeId: charge.id,
        status: 'paid',
        feeAmountBrl,
        occurredAt: paidAt,
      },
      select: { id: true },
    })

    if (charge.transactions.length) {
      updateChargeStatusOnStellar(charge.id, 'paid')
        .then(async (txHash) => {
          await db.chargeTransaction.update({
            where: { id: transaction.id },
            data: { hash: txHash },
          })
          console.log(`[Stellar] status de ${charge.id} atualizado para paid: ${txHash}`)
        })
        .catch((err: Error) => {
          console.error(`[Stellar] Falha ao atualizar status ${charge.id}:`, err.message)
        })
    }

    enqueueUsdcTransfer(charge.id)
      .then(() => console.log(`[Queue] Job usdc-transfer enfileirado para cobrança ${charge.id}`))
      .catch((err: Error) => console.error(`[Queue] Falha ao enfileirar transferência para ${charge.id}:`, err.message))
  }
}

export async function listChargeTransactions(token: string, chargeId: string) {
  const decoded = await verifyToken(token)

  const charge = await db.charge.findFirst({
    where: { id: chargeId, userId: decoded.userId },
    select: { id: true },
  })

  if (!charge) throw Object.assign(new Error('Cobrança não encontrada'), { statusCode: 404 })

  return db.chargeTransaction.findMany({
    where: { chargeId },
    orderBy: { occurredAt: 'asc' },
    select: {
      id: true,
      status: true,
      hash: true,
      amountBrl: true,
      amountUsdc: true,
      feeAmountBrl: true,
      occurredAt: true,
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
        number: true,
        description: true,
        amountBrl: true,
        amountUsdc: true,
        feePercent: true,
        feeUsdc: true,
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

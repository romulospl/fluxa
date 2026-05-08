import { db } from '@/lib/db'
import { verifyToken } from '@/lib/services/auth'
export async function createCharge(
  token: string,
  {
    description,
    amountBrl,
    paymentMethod,
  }: {
    description: string
    amountBrl: number
    paymentMethod?: string
  }
) {
  const decoded = await verifyToken(token)

  const charge = await db.charge.create({
    data: {
      userId: decoded.userId,
      description,
      amountBrl,
      status: 'pending',
      paymentMethod: paymentMethod ?? null,
    },
    select: {
      id: true,
      description: true,
      amountBrl: true,
      externalId: true,
      status: true,
      paymentMethod: true,
      createdAt: true,
      paidAt: true,
    },
  })

  return charge
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

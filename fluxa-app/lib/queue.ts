import { PgBoss } from 'pg-boss'
import { db } from '@/lib/db'
import { transferUsdc } from '@/lib/services/stellar'

const QUEUE_NAME = 'usdc-transfer'

let boss: PgBoss | null = null

async function getQueue(): Promise<PgBoss> {
  if (!boss) {
    boss = new PgBoss(process.env.DATABASE_URL!)
    await boss.start()
  }
  return boss
}

export async function enqueueUsdcTransfer(chargeId: string): Promise<void> {
  const queue = await getQueue()
  await queue.createQueue(QUEUE_NAME)
  await queue.send(QUEUE_NAME, { chargeId })
}

export async function startUsdcTransferWorker(): Promise<void> {
  const queue = await getQueue()

  await queue.createQueue(QUEUE_NAME)

  await queue.work<{ chargeId: string }>(QUEUE_NAME, async (jobs) => {
    const { chargeId } = jobs[0].data

    const charge = await db.charge.findUnique({
      where: { id: chargeId },
      select: {
        id: true,
        amountBrl: true,
        amountUsdc: true,
        user: { select: { walletAddress: true } },
      },
    })

    if (!charge) throw new Error(`Cobrança ${chargeId} não encontrada`)
    if (!charge.user.walletAddress) throw new Error(`Cobrança ${chargeId} sem endereço de carteira`)
    if (!charge.amountUsdc) throw new Error(`Cobrança ${chargeId} sem amountUsdc`)

    // Formata com 7 casas decimais (limite da Stellar)
    const amount = Number(charge.amountUsdc).toFixed(7)

    const txHash = await transferUsdc(charge.user.walletAddress, amount)

    await db.$transaction([
      db.charge.update({
        where: { id: chargeId },
        data: { transferStatus: 'completed' },
      }),
      db.chargeTransaction.create({
        data: {
          chargeId,
          status: 'transfer_completed',
          hash: txHash,
          amountBrl: charge.amountBrl,
          amountUsdc: charge.amountUsdc,
          occurredAt: new Date(),
        },
      }),
    ])

    console.log(`[Queue] USDC transferido para cobrança ${chargeId}: ${txHash}`)
  })

  console.log('[Queue] Worker usdc-transfer iniciado')
}

import { PgBoss } from 'pg-boss'
import { db } from '../lib/db'
import { getUsdcBrlRate, brlToUsdc } from '../lib/services/exchange'

const CHARGE_ID = process.argv[2]
if (!CHARGE_ID) {
  console.error('Uso: npx tsx scripts/retry-transfer.ts <chargeId>')
  process.exit(1)
}

async function main() {
  const charge = await db.charge.findUnique({
    where: { id: CHARGE_ID },
    select: { id: true, amountBrl: true, amountUsdc: true, status: true },
  })

  if (!charge) {
    console.error('Cobrança não encontrada:', CHARGE_ID)
    process.exit(1)
  }

  console.log('Cobrança encontrada:', charge)

  let amountUsdc = charge.amountUsdc ? Number(charge.amountUsdc) : null

  if (!amountUsdc) {
    const rate = await getUsdcBrlRate()
    amountUsdc = brlToUsdc(Number(charge.amountBrl), rate)
    console.log(`Cotação atual: ${rate} BRL/USDC → ${amountUsdc.toFixed(7)} USDC`)

    await db.charge.update({
      where: { id: CHARGE_ID },
      data: { amountUsdc, transferStatus: 'transfer_pending' },
    })
    console.log('amountUsdc atualizado no banco.')
  }

  const boss = new PgBoss(process.env.DATABASE_URL!)
  await boss.start()
  await boss.createQueue('usdc-transfer')
  await boss.send('usdc-transfer', { chargeId: CHARGE_ID })
  await boss.stop()

  console.log('Job re-enfileirado com sucesso. Aguarde o worker processar.')
}

main()
  .catch((err) => { console.error(err); process.exit(1) })
  .finally(() => db.$disconnect())

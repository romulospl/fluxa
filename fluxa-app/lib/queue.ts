import axios from 'axios'
import { PgBoss } from 'pg-boss'
import { db } from '@/lib/db'
import { transferUsdc } from '@/lib/services/stellar'
import { v4 as uuidv4 } from 'uuid'

const USDC_TRANSFER_QUEUE = 'usdc-transfer'
const HYBRID_ONRAMP_QUEUE = 'hybrid-onramp'
const ASAAS_BASE_URL = 'https://sandbox.asaas.com/api/v3'

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
  await queue.createQueue(USDC_TRANSFER_QUEUE)
  await queue.send(USDC_TRANSFER_QUEUE, { chargeId })
}

export async function enqueueHybridOnramp(chargeId: string): Promise<void> {
  const queue = await getQueue()
  await queue.createQueue(HYBRID_ONRAMP_QUEUE)
  // retryLimit: 0 — uma falha (ex: timeout) NÃO deve reenfileirar e criar uma nova
  // quote/order na Etherfuse para a mesma wallet. Múltiplas ordens concorrentes para
  // a mesma wallet poluem o sandbox e travam todas em 'funded'.
  await queue.send(HYBRID_ONRAMP_QUEUE, { chargeId }, { retryLimit: 0 })
}

export async function startUsdcTransferWorker(): Promise<void> {
  const queue = await getQueue()

  await queue.createQueue(USDC_TRANSFER_QUEUE)

  await queue.work<{ chargeId: string }>(USDC_TRANSFER_QUEUE, async (jobs) => {
    const { chargeId } = jobs[0].data

    const charge = await db.charge.findUnique({
      where: { id: chargeId },
      select: {
        id: true,
        amountBrl: true,
        amountUsdc: true,
        transferStatus: true,
        user: { select: { walletAddress: true } },
      },
    })

    if (!charge) throw new Error(`Cobrança ${chargeId} não encontrada`)
    if (charge.transferStatus === 'completed') {
      console.log(`[Queue] Cobrança ${chargeId} já transferida, ignorando retry`)
      return
    }
    if (!charge.user.walletAddress) throw new Error(`Cobrança ${chargeId} sem endereço de carteira`)
    if (!charge.amountUsdc) throw new Error(`Cobrança ${chargeId} sem amountUsdc`)

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
          amountUsdc: Number(charge.amountUsdc),
          occurredAt: new Date(),
        },
      }),
    ])

    console.log(`\n======================================================================`)
    console.log(`[Queue] USDC transferido para cobrança ${chargeId}: ${txHash}`)
    
    try {
      const horizonRes = await axios.get(`https://horizon-testnet.stellar.org/accounts/${charge.user.walletAddress}`)
      const usdcBalance = horizonRes.data.balances.find((b: any) => b.asset_code === 'USDC')?.balance || '0.00'
      console.log(`🎉 [SUCESSO TOTAL] O USDC BATEU NA SUA CARTEIRA DA ALBEDO!`)
      console.log(`   ▶ Carteira Destino: ${charge.user.walletAddress}`)
      console.log(`   ▶ Quantidade Enviada: ${amount} USDC`)
      console.log(`   ▶ Seu saldo atual de USDC: ${usdcBalance}`)
      console.log(`   ▶ Veja na blockchain: https://stellar.expert/explorer/testnet/tx/${txHash}`)
    } catch (e) {
      console.log(`🎉 [SUCESSO TOTAL] O USDC BATEU NA SUA CARTEIRA! (Falha ao ler saldo da Horizon)`)
      console.log(`   ▶ Veja na blockchain: https://stellar.expert/explorer/testnet/tx/${txHash}`)
    }
    console.log(`======================================================================\n`)
  })

  console.log('[Queue] Worker usdc-transfer iniciado')
}

export async function startHybridOnrampWorker(): Promise<void> {
  const queue = await getQueue()

  await queue.createQueue(HYBRID_ONRAMP_QUEUE)

  await queue.work<{ chargeId: string }>(HYBRID_ONRAMP_QUEUE, async (jobs) => {
    const { chargeId } = jobs[0].data

    const charge = await db.charge.findUnique({
      where: { id: chargeId },
      select: { id: true, amountBrl: true, feeBrl: true, transferStatus: true },
    })

    if (!charge) throw new Error(`Cobrança ${chargeId} não encontrada`)

    // Optimistic lock: atomically claim the job — only one runner proceeds
    const claimed = await db.charge.updateMany({
      where: { id: chargeId, transferStatus: 'transfer_pending' },
      data: { transferStatus: 'onramp_in_progress' },
    })

    if (claimed.count === 0) {
      console.log(`[Queue] Cobrança ${chargeId} já em processamento (status: ${charge.transferStatus}), ignorando`)
      return
    }

    const { createQuote, createOrder, getOrderStatus, simulateFiatReceived } = await import('@/lib/services/etherfuse')

    try {
      const netBrl = Number(charge.amountBrl) - Number(charge.feeBrl)
      const quote = await createQuote(netBrl)
      const order = await createOrder(quote.quoteId)

      const asaasToken = process.env.ASAAS_TOKEN_API
      if (!asaasToken) throw new Error('ASAAS_TOKEN_API não configurado')

      // [INÍCIO DO MOCK PARA SANDBOX]
      // A chamada real ao Asaas foi comentada para evitar o erro de validação de chave PIX no Sandbox,
      // pois a Etherfuse devolve uma CLABE mexicana e o Asaas rejeita transações PIX para chaves inválidas ou inexistentes.
      // Para ver o código de Produção, consulte o arquivo .romulo/limite-sandbox-pix.md
      
      /*
      const transferRes = await axios.post(
        `${ASAAS_BASE_URL}/transfers`,
        {
          value: Number(order.depositAmount),
          operationType: 'PIX',
          pixAddressKey: order.depositClabe,
          pixAddressKeyType: 'EVP',
          description: `Onramp Etherfuse - Cobrança ${chargeId}`,
        },
        {
          headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            access_token: asaasToken,
          },
        }
      )
      const asaasTransferId = transferRes.data.id as string
      */

      // Simulando que o Asaas aceitou a transferência
      const asaasTransferId = `mock_transfer_${uuidv4()}`
      console.log(`\n======================================================================`)
      console.log(`▶ FASE 1: ONRAMP INICIADO (BRL → USDC)`)
      console.log(`  - Cobrança: ${chargeId}`)
      console.log(`  - Valor Líquido: R$ ${netBrl.toFixed(2)}`)
      console.log(`✔ [Mock Sandbox] Transferência Asaas aceita: ${asaasTransferId}`)
      // [FIM DO MOCK PARA SANDBOX]

      await db.$transaction([
        db.charge.update({
          where: { id: chargeId },
          data: { transferStatus: 'onramp_initiated' },
        }),
        db.chargeTransaction.create({
          data: {
            chargeId,
            status: 'onramp_initiated',
            etherfuseQuoteId: quote.quoteId,
            etherfuseOrderId: order.orderId,
            asaasTransferId,
            amountBrl: netBrl,
            occurredAt: new Date(),
          },
        }),
      ])

      console.log(`✔ Ordem Etherfuse Criada: ${order.orderId}`)

      // [INÍCIO ESPECÍFICO DE SANDBOX]
      // Espera o sandbox terminar de provisionar a ordem antes de simular o fiat.
      // O axios dispara o fiat_received milissegundos após a ordem voltar, rápido demais
      // para a máquina de estados assíncrona do sandbox (que no bash tem o overhead do curl/jq).
      // Sem esse respiro a ordem trava eternamente em 'funded'.
      await new Promise(resolve => setTimeout(resolve, 2500))

      // Simula que a Etherfuse recebeu o fiat (para a Ordem não ficar presa em 'created' no sandbox)
      await simulateFiatReceived(order.orderId)
      console.log(`✔ [Mock Sandbox] Depósito Fiat simulado na Etherfuse`)
      // [FIM ESPECÍFICO DE SANDBOX]

      // Espera antes do primeiro poll, espelhando o `sleep 4` do script bash funcional
      await new Promise(resolve => setTimeout(resolve, 4000))

      // 4. Polling Etherfuse Order Status
      let isEtherfuseDone = false
      const etherfuseWaitTime = 10 * 60 * 1000 // 10 minutos máximo
      const startEthTime = Date.now()

      console.log(`\n▶ FASE 2: AGUARDANDO LIQUIDAÇÃO ETHERFUSE`)
      console.log(`  - Ordem: ${order.orderId}`)
      
      let attempt = 1;
      while (Date.now() - startEthTime < etherfuseWaitTime) {
        const currentOrder = await getOrderStatus(order.orderId)
        console.log(`  Tentativa ${attempt} — status: ${currentOrder.status}`)
        
        if (currentOrder.status === 'completed') {
          isEtherfuseDone = true
          break
        }
        if (['failed', 'refunded', 'canceled'].includes(currentOrder.status)) {
          throw new Error(`Ordem na Etherfuse falhou com status: ${currentOrder.status}`)
        }
        // Espera 5 segundos antes da próxima checagem
        await new Promise(resolve => setTimeout(resolve, 5000))
        attempt++
      }

      if (isEtherfuseDone) {
        await db.chargeTransaction.create({
          data: {
            chargeId,
            status: 'etherfuse_onramp_completed',
            occurredAt: new Date(),
          },
        })
        
        await enqueueUsdcTransfer(chargeId)
        console.log(`✔ ONRAMP CONCLUÍDO!`)
        console.log(`▶ FASE 3: TRANSFERÊNCIA USDC ENFILEIRADA PARA O USUÁRIO FINAL`)
        console.log(`======================================================================\n`)
      } else {
        throw new Error(`Timeout aguardando a Etherfuse finalizar a Ordem ${order.orderId}`)
      }

    } catch (err: any) {
      const message: string = err.message ?? ''
      if (err.isAxiosError) console.error('[Axios Error]', err.response?.data)
      else console.error('[Error]', err)

      if (message.includes('pending onramp order already exists')) {
        // Etherfuse already has a pending order — mark for manual review, do not retry
        await db.charge.update({
          where: { id: chargeId },
          data: { transferStatus: 'onramp_conflict' },
        })
        console.warn(`[Queue] Conflito de onramp para cobrança ${chargeId}: ordem já existe na Etherfuse. Marcado como onramp_conflict.`)
        return
      }

      // Revert lock so the job can be retried on transient errors
      await db.charge.update({
        where: { id: chargeId },
        data: { transferStatus: 'transfer_pending' },
      })
      throw err
    }
  })

  console.log('[Queue] Worker hybrid-onramp iniciado')
}

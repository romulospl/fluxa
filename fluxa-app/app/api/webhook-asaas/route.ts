import { markChargeAsPaid } from '@/lib/services/charges'

const PAYMENT_EVENTS = new Set(['PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED'])

/**
 * @swagger
 * /api/webhook-asaas:
 *   post:
 *     tags: [Webhook]
 *     summary: Recebe eventos do Asaas
 *     description: Processa eventos de pagamento enviados pelo Asaas e atualiza o status das cobranças no banco.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Payload enviado pelo Asaas
 *     responses:
 *       200:
 *         description: Evento recebido com sucesso
 *       401:
 *         description: Token inválido
 */
export async function POST(request: Request) {
  const webhookToken = process.env.ASAAS_WEBHOOK_TOKEN
  const incomingToken = request.headers.get('asaas-access-token')

  if (!webhookToken || incomingToken !== webhookToken) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { event, payment } = body

  if (PAYMENT_EVENTS.has(event) && payment?.id && payment?.paymentDate) {
    try {
      await markChargeAsPaid(payment.id, payment.paymentDate)
    } catch (err) {
      console.error('[webhook-asaas] Erro ao atualizar cobrança:', payment.id, err)
    }
  }

  return Response.json({ received: true })
}

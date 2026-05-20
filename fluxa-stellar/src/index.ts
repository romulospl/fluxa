import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { recordCharge, updateChargeStatus, transferUsdc } from './stellar'
import { getUsdcBrlRate } from './exchange'

const VALID_STATUSES = ['pending', 'paid', 'cancelled', 'overdue'] as const
type ChargeStatus = (typeof VALID_STATUSES)[number]

function authMiddleware(req: Request): Response | null {
  const serviceSecret = process.env.STELLAR_SERVICE_SECRET
  if (!serviceSecret) return null

  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${serviceSecret}`) {
    return new Response(JSON.stringify({ error: 'Não autorizado' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    })
  }
  return null
}

const app = new Hono()

app.use('*', async (c, next) => {
  const denied = authMiddleware(c.req.raw)
  if (denied) return denied
  await next()
})

app.get('/exchange-rate', async (c) => {
  try {
    const rate = await getUsdcBrlRate()
    return c.json({ rate })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    console.error('[Stellar] Falha ao consultar taxa Reflector:', message)
    return c.json({ error: message }, 500)
  }
})

app.post('/charges', async (c) => {
  let body: { id: string; userId: string; number: number; amountBrl: string | number; description: string; createdAt: string }

  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Body inválido' }, 400)
  }

  const { id, userId, number, amountBrl, description, createdAt } = body

  if (!id || !userId || number === undefined || amountBrl === undefined || !description || !createdAt) {
    return c.json({ error: 'Campos obrigatórios: id, userId, number, amountBrl, description, createdAt' }, 400)
  }

  try {
    const txHash = await recordCharge({
      id,
      userId,
      number,
      amountBrl,
      description,
      createdAt: new Date(createdAt),
    })
    console.log(`[Stellar] charge ${id} registrado: ${txHash}`)
    return c.json({ txHash })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    console.error(`[Stellar] Falha ao registrar charge ${id}:`, message)
    return c.json({ error: message }, 500)
  }
})

app.patch('/charges/:id/status', async (c) => {
  const chargeId = c.req.param('id')
  let body: { status: string }

  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Body inválido' }, 400)
  }

  const { status } = body

  if (!VALID_STATUSES.includes(status as ChargeStatus)) {
    return c.json({ error: `Status inválido. Valores aceitos: ${VALID_STATUSES.join(', ')}` }, 400)
  }

  try {
    const txHash = await updateChargeStatus(chargeId, status as ChargeStatus)
    console.log(`[Stellar] status de ${chargeId} atualizado para ${status}: ${txHash}`)
    return c.json({ txHash })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    console.error(`[Stellar] Falha ao atualizar status ${chargeId}:`, message)
    return c.json({ error: message }, 500)
  }
})

app.post('/transfers', async (c) => {
  let body: { to: string; amount: string }

  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Body inválido' }, 400)
  }

  const { to, amount } = body

  if (!to || !amount) {
    return c.json({ error: 'Campos obrigatórios: to, amount' }, 400)
  }

  try {
    const txHash = await transferUsdc(to, amount)
    console.log(`[Stellar] ${amount} USDC transferido para ${to}: ${txHash}`)
    return c.json({ txHash })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    console.error(`[Stellar] Falha na transferência para ${to}:`, message)
    return c.json({ error: message }, 500)
  }
})

const port = Number(process.env.PORT ?? 3001)

serve({ fetch: app.fetch, port }, () => {
  console.log(`fluxa-stellar rodando em http://localhost:${port}`)
})

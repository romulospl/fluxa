import axios from 'axios'

function getServiceConfig() {
  const serviceUrl = process.env.STELLAR_SERVICE_URL
  const serviceSecret = process.env.STELLAR_SERVICE_SECRET
  if (!serviceUrl) throw new Error('STELLAR_SERVICE_URL não configurado')
  return { serviceUrl: serviceUrl.replace(/\/$/, ''), serviceSecret }
}

async function stellarPost(path: string, body: object): Promise<{ txHash: string }> {
  const { serviceUrl, serviceSecret } = getServiceConfig()

  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (serviceSecret) headers['authorization'] = `Bearer ${serviceSecret}`

  try {
    const res = await axios({
      method: path.includes('/status') ? 'PATCH' : 'POST',
      url: `${serviceUrl}${path}`,
      headers,
      data: body,
    })
    return res.data
  } catch (err: any) {
    const data = err.response?.data
    throw new Error(data?.error ?? `fluxa-stellar error (${err.response?.status})`)
  }
}

export async function recordChargeOnStellar(charge: {
  id: string
  userId: string
  number: number
  amountBrl: string | number
  description: string
  createdAt: Date
}): Promise<string> {
  const { txHash } = await stellarPost('/charges', {
    ...charge,
    createdAt: charge.createdAt.toISOString(),
  })
  return txHash
}

export async function updateChargeStatusOnStellar(
  chargeId: string,
  status: 'pending' | 'paid' | 'cancelled' | 'overdue',
): Promise<string> {
  const { txHash } = await stellarPost(`/charges/${chargeId}/status`, { status })
  return txHash
}

export async function transferUsdc(to: string, amount: string): Promise<string> {
  const { txHash } = await stellarPost('/transfers', { to, amount })
  return txHash
}

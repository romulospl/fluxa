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

  const res = await fetch(`${serviceUrl}${path}`, {
    method: path.includes('/status') ? 'PATCH' : 'POST',
    headers,
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => null)
    throw new Error(data?.error ?? `fluxa-stellar error (${res.status})`)
  }

  return res.json()
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

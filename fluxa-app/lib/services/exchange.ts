const STELLAR_SERVICE_URL = process.env.STELLAR_SERVICE_URL ?? 'http://localhost:3001'
const STELLAR_SERVICE_SECRET = process.env.STELLAR_SERVICE_SECRET!

export async function getUsdcBrlRate(): Promise<number> {
  const res = await fetch(`${STELLAR_SERVICE_URL}/exchange-rate`, {
    headers: { Authorization: `Bearer ${STELLAR_SERVICE_SECRET}` },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(`Stellar service: ${body.error ?? res.statusText}`)
  }

  const { rate } = await res.json()
  return rate
}

export function brlToUsdc(amountBrl: number, rate: number): number {
  return amountBrl / rate
}

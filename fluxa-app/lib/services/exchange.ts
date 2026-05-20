import axios from 'axios'

const STELLAR_SERVICE_URL = process.env.STELLAR_SERVICE_URL ?? 'http://localhost:3001'
const STELLAR_SERVICE_SECRET = process.env.STELLAR_SERVICE_SECRET!

export async function getUsdcBrlRate(): Promise<number> {
  try {
    const res = await axios.get(`${STELLAR_SERVICE_URL}/exchange-rate`, {
      headers: { Authorization: `Bearer ${STELLAR_SERVICE_SECRET}` },
    })
    return res.data.rate
  } catch (err: any) {
    const data = err.response?.data
    throw new Error(`Stellar service: ${data?.error ?? err.response?.statusText}`)
  }
}

export function brlToUsdc(amountBrl: number, rate: number): number {
  return amountBrl / rate
}

export async function getUsdcBrlRate(): Promise<number> {
  const res = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=USDCBRL')
  if (!res.ok) throw new Error(`Binance API error (${res.status})`)
  const data = await res.json() as { symbol: string; price: string }
  return parseFloat(data.price)
}

export function brlToUsdc(amountBrl: number, rate: number): number {
  return amountBrl / rate
}

import { NextResponse } from 'next/server'
import { getUsdcBrlRate } from '@/lib/services/exchange'

/**
 * @swagger
 * /api/exchange/rate:
 *   get:
 *     tags:
 *       - Câmbio
 *     summary: Retorna a cotação atual de USDC em BRL
 *     description: Busca o preço atual do par USDC/BRL via Binance.
 *     responses:
 *       200:
 *         description: Cotação retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 rate:
 *                   type: number
 *                   example: 5.87
 *       500:
 *         description: Erro ao buscar cotação
 */
export async function GET() {
  try {
    const rate = await getUsdcBrlRate()
    return NextResponse.json({ rate })
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar cotação' }, { status: 500 })
  }
}

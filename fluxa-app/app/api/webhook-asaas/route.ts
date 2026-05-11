/**
 * @swagger
 * /api/webhook-asaas:
 *   post:
 *     tags: [Webhook]
 *     summary: Recebe eventos do Asaas
 *     description: Endpoint de teste para inspecionar o payload dos webhooks enviados pelo Asaas. Todos os dados recebidos são exibidos no console do servidor.
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
 *       500:
 *         description: Erro interno do servidor
 */
export async function POST(request: Request) {
  const body = await request.json();
  const headers = Object.fromEntries(request.headers.entries());

  console.log('=== ASAAS WEBHOOK RECEBIDO ===');
  console.log('Headers:', JSON.stringify(headers, null, 2));
  console.log('Body:', JSON.stringify(body, null, 2));
  console.log('==============================');

  return Response.json({ received: true });
}

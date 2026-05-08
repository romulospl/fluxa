import { NextResponse } from 'next/server'

/**
 * @swagger
 * /api/logout:
 *   post:
 *     tags:
 *       - Autenticação
 *     summary: Encerra a sessão do usuário autenticado
 *     description: Remove o cookie de autenticação, encerrando a sessão do usuário.
 *     responses:
 *       200:
 *         description: Logout realizado com sucesso
 */
export async function POST() {
  const response = NextResponse.json({ success: true }, { status: 200 })
  
  response.cookies.set('fluxa-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })

  return response
}

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const PUBLIC_ROUTES = ['/', '/login', '/register']
const PUBLIC_API_ROUTES = ['/api/login', '/api/webhook-asaas']

function isPublicApiRoute(request: NextRequest): boolean {
  const { pathname, method } = request.nextUrl
  if (PUBLIC_API_ROUTES.includes(pathname)) return true
  // POST /api/users é público (cadastro); outros métodos requerem autenticação
  if (pathname === '/api/users' && request.method === 'POST') return true
  return false
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const authHeader = request.headers.get('Authorization')
  const token =
    authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : request.cookies.get('fluxa-token')?.value

  // 1. Permite rotas estáticas e do sistema
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('favicon.ico')
  ) {
    return NextResponse.next()
  }

  // 2. Permite rotas públicas (Páginas e APIs)
  if (PUBLIC_ROUTES.includes(pathname) || isPublicApiRoute(request)) {
    // Se o usuário já está logado e tenta ir para login/register, redireciona para dashboard
    if (token && (pathname === '/' || pathname === '/login' || pathname === '/register')) {
      try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')
        await jwtVerify(token, secret)
        return NextResponse.redirect(new URL('/dashboard', request.url))
      } catch (e) {
        // Token inválido, limpa o cookie e deixa seguir para login
        const response = NextResponse.next()
        response.cookies.delete('fluxa-token')
        return response
      }
    }
    return NextResponse.next()
  }

  // 3. Protege todas as outras rotas
  if (!token) {
    const loginUrl = new URL('/login', request.url)
    // Opcional: Adicionar o redirecionamento original para voltar depois do login
    // loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')
    await jwtVerify(token, secret)
    return NextResponse.next()
  } catch (error) {
    // Token inválido ou expirado
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('fluxa-token')
    return response
  }
}

// Configuração opcional para definir exatamente quais caminhos o middleware deve rodar
// Por padrão, roda em tudo.
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes) -> we handle them inside middleware
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}

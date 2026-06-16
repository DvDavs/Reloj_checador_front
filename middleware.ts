import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware simplificado: solo verifica existencia del token de autenticación.
 *
 * La autorización granular (permisos por ruta) se maneja en:
 * - Frontend: componentes RequirePermission y Can
 * - Backend: @PreAuthorize en cada endpoint
 *
 * Esto evita problemas de incompatibilidad entre librerías JWT (jose vs jjwt)
 * y la necesidad de sincronizar JWT_SECRET entre frontend y backend.
 */
export async function middleware(request: NextRequest) {
  const authToken = request.cookies.get('authToken')?.value;
  const { pathname } = request.nextUrl;

  const isLoginPage = pathname.startsWith('/login');
  const publicPaths = ['/login', '/reloj-checador', '/lanzador', '/ads/'];
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  // Si tiene token y está en login, redirigir a inicio
  if (authToken && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Si no tiene token y no es ruta pública, redirigir a login
  if (!authToken && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|Logo_ITO.png|favicon.ico).*)'],
};

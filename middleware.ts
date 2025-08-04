// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get('authToken')?.value;
  const { pathname } = request.nextUrl;

  const isLoginPage = pathname.startsWith('/login');
  const publicPaths = ['/login', '/reloj-checador', '/lanzador'];
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  // Si el usuario TIENE token y trata de ir a la página de login,
  // redirígelo al dashboard principal.
  if (authToken && isLoginPage) {
    return NextResponse.redirect(new URL('/empleados', request.url));
  }

  // Si el usuario NO tiene token y NO está en una ruta pública,
  // redirígelo a la página de login.
  if (!authToken && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // En cualquier otro caso, permite que la solicitud continúe.
  return NextResponse.next();
}

// Configuración para que el middleware se aplique a las rutas necesarias
export const config = {
  matcher: [
    /*
     * Coincide con todas las rutas de solicitud excepto las que comienzan con:
     * - api (rutas de API de Next.js)
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)
     * - Logo_ITO.png (tu logo)
     * - favicon.ico (icono de favicon)
     */
    '/((?!api|_next/static|_next/image|Logo_ITO.png|favicon.ico).*)',
  ],
};

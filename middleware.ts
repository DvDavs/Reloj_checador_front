// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get('authToken')?.value;
  const { pathname } = request.nextUrl;

  // La página de login es la única ruta pública para un usuario no autenticado
  const isPublicPath = pathname === '/login';

  // Si el usuario no tiene token y no está en la página de login,
  // redirígelo a la página de login.
  if (!authToken && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Si el usuario TIENE token y trata de ir a la página de login,
  // redirígelo al dashboard principal para evitar que inicie sesión de nuevo.
  if (authToken && isPublicPath) {
    return NextResponse.redirect(new URL('/empleados', request.url));
  }

  // Si ninguna de las condiciones anteriores se cumple, permite que la solicitud continúe.
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

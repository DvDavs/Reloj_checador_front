import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const ROUTE_PERMISSIONS: Array<{ pattern: RegExp; permission: string }> = [
  {
    pattern: /^\/configuracion\/usuarios\/(registrar|editar)/,
    permission: 'usuario:write',
  },
  { pattern: /^\/configuracion\/usuarios/, permission: 'usuario:read' },
  {
    pattern: /^\/configuracion\/roles\/(registrar|editar)/,
    permission: 'rol:write',
  },
  { pattern: /^\/configuracion\/roles/, permission: 'rol:read' },
  { pattern: /^\/configuracion\/permisos/, permission: 'rol:read' },
];

export async function middleware(request: NextRequest) {
  const authToken = request.cookies.get('authToken')?.value;
  const { pathname } = request.nextUrl;

  const isLoginPage = pathname.startsWith('/login');
  const publicPaths = ['/login', '/reloj-checador', '/lanzador', '/ads/'];
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  if (authToken && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (!authToken && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (authToken && !isPublicPath) {
    const matchedRoute = ROUTE_PERMISSIONS.find(({ pattern }) =>
      pattern.test(pathname)
    );
    if (matchedRoute) {
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
      try {
        const { payload } = await jwtVerify(
          authToken,
          new TextEncoder().encode(secret)
        );
        const permissions = (payload.permissions as string[] | undefined) ?? [];
        if (!permissions.includes(matchedRoute.permission)) {
          return NextResponse.redirect(
            new URL('/?error=forbidden', request.url)
          );
        }
      } catch {
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('authToken');
        return response;
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|Logo_ITO.png|favicon.ico).*)'],
};

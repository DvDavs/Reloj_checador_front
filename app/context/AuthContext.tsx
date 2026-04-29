'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { AuthUser, LoginRequest, LoginResponse } from '@/lib/types/authTypes';
import { apiClient, setupInterceptors } from '@/lib/apiClient';

interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthUser | null;
  token: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (...permissions: string[]) => boolean;
  hasAllPermissions: (...permissions: string[]) => boolean;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (mounted) return;

    setMounted(true);

    const initializeAuth = async () => {
      try {
        if (typeof window !== 'undefined') {
          let storedToken = Cookies.get('authToken');

          if (!storedToken) {
            storedToken = localStorage.getItem('authToken') ?? undefined;
            if (storedToken) {
              try {
                Cookies.set('authToken', storedToken, {
                  expires: 1,
                  path: '/',
                  sameSite: 'lax',
                });
              } catch (e) {
                console.error('❌ Error al restaurar cookie:', e);
              }
            }
          }

          const storedRoles = localStorage.getItem('userRoles');
          const storedPermissions = localStorage.getItem('userPermissions');
          const storedUsername = localStorage.getItem('username');

          console.log(
            '[AuthContext] 🔄 initializeAuth - storedPermissions en localStorage:',
            storedPermissions
          );
          if (storedPermissions) {
            const parsedPermissions = JSON.parse(storedPermissions);
            console.log(
              '[AuthContext] 🔄 initializeAuth - parsedPermissions:',
              parsedPermissions
            );
            console.log(
              '[AuthContext] 🔄 initializeAuth - tipo del primer permiso:',
              parsedPermissions.length > 0 ? typeof parsedPermissions[0] : 'N/A'
            );
          }

          if (storedToken && storedRoles) {
            const parsedRoles = JSON.parse(storedRoles);
            const parsedPermissions: string[] = storedPermissions
              ? JSON.parse(storedPermissions)
              : [];
            const permissionsSet = new Set(parsedPermissions);
            console.log(
              '[AuthContext] 🔄 initializeAuth - Set reconstruido. Tamaño:',
              permissionsSet.size,
              'Contenido:',
              Array.from(permissionsSet)
            );

            setToken(storedToken);
            setUser({
              username: storedUsername || '',
              roles: new Set(parsedRoles),
              permissions: permissionsSet,
            });
            apiClient.defaults.headers.common['Authorization'] =
              `Bearer ${storedToken}`;
          } else if (storedToken && !storedRoles) {
            // Stale cookie with no localStorage data — clear and redirect to login
            Cookies.remove('authToken', { path: '/' });
            localStorage.removeItem('authToken');
            localStorage.removeItem('userPermissions');
            localStorage.removeItem('username');
            window.location.replace('/login');
            return;
          }
        }
      } catch (error) {
        if (typeof window !== 'undefined') {
          Cookies.remove('authToken', { path: '/' });
          localStorage.removeItem('authToken');
          localStorage.removeItem('userRoles');
          localStorage.removeItem('userPermissions');
          localStorage.removeItem('username');
          window.location.replace('/login');
          return;
        }
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      console.warn('Auth initialization timeout, forcing completion');
      setIsLoading(false);
    }, 2000);

    initializeAuth().finally(() => {
      clearTimeout(timeoutId);
    });

    return () => clearTimeout(timeoutId);
  }, [mounted]);

  const login = async (credentials: LoginRequest) => {
    console.log('[AuthContext] 🔐 Iniciando login con credenciales:', {
      username: credentials.username,
    });

    const response = await apiClient.post<LoginResponse>(
      '/api/auth/login',
      credentials
    );

    console.log(
      '[AuthContext] 📡 Respuesta completa del servidor:',
      response.data
    );

    const { token: authToken, roles, permissions, username } = response.data;

    console.log('[AuthContext] 🔑 roles extraídos:', roles);
    console.log('[AuthContext] 🔑 permissions extraídos:', permissions);
    console.log(
      '[AuthContext] 🔑 Tipo de permissions:',
      typeof permissions,
      Array.isArray(permissions) ? '(es array)' : '(NO es array)'
    );

    if (permissions && permissions.length > 0) {
      console.log('[AuthContext] 🔑 Primer permiso:', permissions[0]);
      console.log(
        '[AuthContext] 🔑 Tipo del primer permiso:',
        typeof permissions[0]
      );
    }

    localStorage.setItem('userRoles', JSON.stringify(roles));
    localStorage.setItem('userPermissions', JSON.stringify(permissions ?? []));
    console.log(
      '[AuthContext] 💾 userPermissions guardado en localStorage:',
      localStorage.getItem('userPermissions')
    );
    if (username) {
      localStorage.setItem('username', username);
    }

    localStorage.setItem('authToken', authToken);

    const isProduction = process.env.NODE_ENV === 'production';
    const isHttps = window.location.protocol === 'https:';

    const cookieOptions: Cookies.CookieAttributes = {
      expires: 1,
      path: '/',
    };

    if (isProduction && isHttps) {
      cookieOptions.secure = true;
      cookieOptions.sameSite = 'lax';
    } else {
      cookieOptions.sameSite = 'lax';
    }

    let cookieSaved = false;
    try {
      Cookies.set('authToken', authToken, cookieOptions);
      const verifyToken = Cookies.get('authToken');
      if (verifyToken === authToken) {
        cookieSaved = true;
      } else {
        Cookies.set('authToken', authToken);
        cookieSaved = Cookies.get('authToken') === authToken;
      }
    } catch (error) {
      console.error('❌ Error al guardar cookie:', error);
      try {
        Cookies.set('authToken', authToken);
        cookieSaved = Cookies.get('authToken') === authToken;
      } catch (e) {
        console.error('❌ Error crítico al guardar cookie:', e);
      }
    }

    if (!cookieSaved) {
      console.warn(
        '⚠️ La cookie no se pudo guardar, pero el token está en localStorage'
      );
    }

    const permissionsSet = new Set(permissions ?? []);
    console.log(
      '[AuthContext] 🧩 Set de permisos creado. Tamaño:',
      permissionsSet.size
    );
    console.log(
      '[AuthContext] 🧩 Contenido del Set:',
      Array.from(permissionsSet)
    );
    console.log(
      '[AuthContext] 🧩 Tipo del primer elemento del Set (si existe):',
      permissionsSet.size > 0 ? typeof Array.from(permissionsSet)[0] : 'N/A'
    );

    setToken(authToken);
    setUser({
      username,
      roles: new Set(roles),
      permissions: permissionsSet,
    });
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;

    setTimeout(() => {
      window.location.href = '/';
    }, 100);
  };

  const logout = useCallback(() => {
    localStorage.removeItem('userRoles');
    localStorage.removeItem('userPermissions');
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    Cookies.remove('authToken', { path: '/' });

    setToken(null);
    setUser(null);
    delete apiClient.defaults.headers.common['Authorization'];
    router.push('/login');
  }, [router]);

  useEffect(() => {
    if (mounted) {
      setupInterceptors(logout);
    }
  }, [logout, mounted]);

  const hasPermission = useCallback(
    (permission: string) => user?.permissions.has(permission) ?? false,
    [user]
  );

  const hasAnyPermission = useCallback(
    (...permissions: string[]) =>
      permissions.some((p) => user?.permissions.has(p) ?? false),
    [user]
  );

  const hasAllPermissions = useCallback(
    (...permissions: string[]) =>
      permissions.every((p) => user?.permissions.has(p) ?? false),
    [user]
  );

  const hasRole = useCallback(
    (role: string) => user?.roles.has(role) ?? false,
    [user]
  );

  const value: AuthContextType = {
    isAuthenticated: !!token,
    user,
    token,
    login,
    logout,
    isLoading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

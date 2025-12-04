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
import { LoginRequest, LoginResponse } from '@/lib/types/authTypes';
import { apiClient, setupInterceptors } from '@/lib/apiClient';

interface AuthContextType {
  isAuthenticated: boolean;
  user: { roles: Set<string>; username?: string } | null;
  token: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<{
    roles: Set<string>;
    username?: string;
  } | null>(null);
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
          const storedUsername = localStorage.getItem('username');

          if (storedToken && storedRoles) {
            setToken(storedToken);
            setUser({
              roles: new Set(JSON.parse(storedRoles)),
              username: storedUsername || undefined,
            });
            apiClient.defaults.headers.common['Authorization'] =
              `Bearer ${storedToken}`;
          }
        }
      } catch (error) {
        if (typeof window !== 'undefined') {
          Cookies.remove('authToken');
          localStorage.removeItem('authToken');
          localStorage.removeItem('userRoles');
          localStorage.removeItem('username');
        }
      } finally {
        setIsLoading(false);
      }
    };

    // Timeout de seguridad para evitar carga infinita
    const timeoutId = setTimeout(() => {
      console.warn('Auth initialization timeout, forcing completion');
      setIsLoading(false);
    }, 2000); // 2 segundos máximo

    initializeAuth().finally(() => {
      clearTimeout(timeoutId);
    });

    return () => clearTimeout(timeoutId);
  }, [mounted]);

  const login = async (credentials: LoginRequest) => {
    const response = await apiClient.post<LoginResponse>(
      '/api/auth/login',
      credentials
    );
    const { token: authToken, roles, username } = response.data;

    localStorage.setItem('userRoles', JSON.stringify(roles));
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
      console.warn(
        '⚠️ El middleware puede no funcionar correctamente sin la cookie'
      );
    }

    setToken(authToken);
    setUser({ roles: new Set(roles), username });
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;

    setTimeout(() => {
      window.location.href = '/';
    }, 100);
  };

  const logout = useCallback(() => {
    localStorage.removeItem('userRoles');
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

  const value = {
    isAuthenticated: !!token,
    user,
    token,
    login,
    logout,
    isLoading,
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

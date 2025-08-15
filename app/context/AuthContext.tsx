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
    if (mounted) return; // Evitar re-inicialización

    setMounted(true);

    const initializeAuth = async () => {
      try {
        // Solo acceder a localStorage/cookies después de montar
        if (typeof window !== 'undefined') {
          const storedToken = Cookies.get('authToken');
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
        console.error('Error initializing auth:', error);
        // Si hay error, limpiar datos corruptos
        if (typeof window !== 'undefined') {
          Cookies.remove('authToken');
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
    Cookies.set('authToken', authToken, {
      expires: 1,
      secure: process.env.NODE_ENV === 'production',
    });

    setToken(authToken);
    setUser({ roles: new Set(roles), username });
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;

    router.push('/');
  };

  const logout = useCallback(() => {
    localStorage.removeItem('userRoles');
    Cookies.remove('authToken');

    setToken(null);
    setUser(null);
    delete apiClient.defaults.headers.common['Authorization'];
    router.push('/login');
  }, [router]);

  // Configurar interceptores después de que logout esté definido
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

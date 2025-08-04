'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { LoginRequest, LoginResponse } from '@/lib/types/authTypes';
import { apiClient, setupInterceptors } from '@/lib/apiClient';

interface AuthContextType {
  isAuthenticated: boolean;
  user: { roles: Set<string> } | null;
  token: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<{ roles: Set<string> } | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedToken = Cookies.get('authToken');
    const storedRoles = localStorage.getItem('userRoles');
    if (storedToken && storedRoles) {
      setToken(storedToken);
      setUser({ roles: new Set(JSON.parse(storedRoles)) });
      apiClient.defaults.headers.common['Authorization'] =
        `Bearer ${storedToken}`;
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginRequest) => {
    const response = await apiClient.post<LoginResponse>(
      '/api/auth/login',
      credentials
    );
    const { token: authToken, roles } = response.data;

    localStorage.setItem('userRoles', JSON.stringify(roles));
    Cookies.set('authToken', authToken, {
      expires: 1,
      secure: process.env.NODE_ENV === 'production',
    });

    setToken(authToken);
    setUser({ roles: new Set(roles) });
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
    setupInterceptors(logout);
  }, [logout]);

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

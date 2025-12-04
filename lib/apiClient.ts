import axios from 'axios';

/**
 * Detecta dinámicamente la URL base de la API basándose en el hostname actual.
 *
 * ESTRATEGIA DE CONFIGURACIÓN:
 *
 * 1. PRODUCCIÓN/SAAS (Recomendado):
 *    - Configurar NEXT_PUBLIC_API_BASE_URL en variables de entorno
 *    - Ejemplo: NEXT_PUBLIC_API_BASE_URL=https://api.tudominio.com
 *    - Esto permite frontend y backend en diferentes dominios/hosts
 *
 * 2. DESARROLLO LOCAL:
 *    - Si no hay variable de entorno, detecta automáticamente:
 *    - localhost/127.0.0.1 → http://localhost:8080
 *    - IPs de red local → http://[IP]:8080 (útil para pruebas en LAN)
 *
 * 3. MODO AUTO (Mismo dominio):
 *    - Si frontend y backend están en el mismo dominio pero diferentes puertos
 *    - Usa el mismo protocolo y hostname del frontend con puerto 8080
 *
 * @returns La URL base de la API
 */
export const getBaseUrl = () => {
  // En el servidor (SSR), usar variable de entorno o localhost por defecto
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
  }

  // PRIORIDAD 1: Variable de entorno (PRODUCCIÓN/SAAS)
  // Útil cuando frontend y backend están en diferentes dominios/hosts
  // Ejemplo: NEXT_PUBLIC_API_BASE_URL=https://api.tudominio.com
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }

  // PRIORIDAD 2: Detección automática (DESARROLLO/RED LOCAL)
  const hostname = window.location.hostname;
  const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';

  // Para localhost o 127.0.0.1, usar localhost
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:8080';
  }

  // Para IPs de red local (10.x.x.x, 192.168.x.x, etc.), usar la misma IP con puerto 8080
  // Esto permite acceso desde otros dispositivos en la misma red durante desarrollo
  // En producción, esto NO debería ejecutarse si NEXT_PUBLIC_API_BASE_URL está configurado
  return `${protocol}//${hostname}:8080`;
};

const API_BASE_URL = getBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de request para agregar automáticamente el token de autenticación
// Esto asegura que el token se incluya en todas las peticiones, incluso si
// se crea una nueva instancia del cliente o si el token cambia
apiClient.interceptors.request.use(
  (config) => {
    // Solo ejecutar en el cliente (navegador)
    if (typeof window !== 'undefined') {
      let token: string | null = null;

      // Estrategia 1: Intentar obtener el token de la cookie primero
      const cookies = document.cookie.split(';');
      const authCookie = cookies.find((cookie) =>
        cookie.trim().startsWith('authToken=')
      );

      if (authCookie) {
        token = authCookie.split('=')[1]?.trim() || null;
      }

      // Estrategia 2: Si no hay cookie, intentar obtener de localStorage
      if (!token) {
        token = localStorage.getItem('authToken');
      }

      // Estrategia 3: Fallback al header común configurado manualmente
      if (!token) {
        const commonAuth = apiClient.defaults.headers.common['Authorization'];
        if (commonAuth && typeof commonAuth === 'string') {
          // Extraer el token del formato "Bearer <token>"
          const match = commonAuth.match(/Bearer\s+(.+)/);
          if (match) {
            token = match[1];
          }
        }
      }

      // Agregar el token al header si se encontró
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Variable para rastrear si estamos en un cambio de tema
let isThemeChanging = false;

// Función para marcar inicio de cambio de tema
export const markThemeChangeStart = () => {
  isThemeChanging = true;
  setTimeout(() => {
    isThemeChanging = false;
  }, 1000); // 1 segundo de gracia
};

// --- FUNCIÓN PARA CONFIGURAR INTERCEPTORES ---
// Esta función configurará el interceptor. Le pasaremos la función de logout desde nuestro AuthContext.
export const setupInterceptors = (logout: () => void) => {
  // Limpiar interceptores existentes para evitar duplicados
  apiClient.interceptors.response.clear();

  apiClient.interceptors.response.use(
    // Si la respuesta es exitosa (2xx), simplemente la devolvemos.
    (response) => response,
    // Si la respuesta es un error...
    (error) => {
      // Verificamos si el error es un 401 (Unauthorized)
      if (error.response && error.response.status === 401) {
        // NO hacer logout durante cambios de tema
        if (isThemeChanging) {
          return Promise.reject(error);
        }

        // Solo hacer logout si es un error de autenticación real en endpoints protegidos
        const isAuthEndpoint = error.config?.url?.includes('/auth/');
        const isApiEndpoint = error.config?.url?.includes('/api/');

        if (
          isAuthEndpoint ||
          (isApiEndpoint && !error.config?.url?.includes('/public'))
        ) {
          // Usar setTimeout para evitar problemas de timing
          setTimeout(() => logout(), 100);
        }
      }
      // Rechazamos la promesa para que el .catch() del componente original aún pueda manejar el error si es necesario.
      return Promise.reject(error);
    }
  );
};

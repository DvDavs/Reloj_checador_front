import axios from 'axios';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

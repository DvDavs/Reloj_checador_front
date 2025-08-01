import axios from 'axios';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- FUNCIÓN PARA CONFIGURAR INTERCEPTORES ---
// Esta función configurará el interceptor. Le pasaremos la función de logout desde nuestro AuthContext.
export const setupInterceptors = (logout: () => void) => {
  apiClient.interceptors.response.use(
    // Si la respuesta es exitosa (2xx), simplemente la devolvemos.
    (response) => response,
    // Si la respuesta es un error...
    (error) => {
      // Verificamos si el error es un 401 (Unauthorized)
      if (error.response && error.response.status === 401) {
        console.log('Token expirado o inválido. Cerrando sesión...');
        logout(); // Llama a la función de logout que limpia todo
      }
      // Rechazamos la promesa para que el .catch() del componente original aún pueda manejar el error si es necesario.
      return Promise.reject(error);
    }
  );
};

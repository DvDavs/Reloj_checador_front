/**
 * Genera u obtiene un ID de sesión único para el navegador actual,
 * almacenado en localStorage. Se usa para reservar lectores de huellas.
 */
export function getBrowserSessionId(): string {
    const storageKey = 'browserSessionId';
    let sessionId = localStorage.getItem(storageKey);
    if (!sessionId) {
      // Genera un ID simple y aleatorio
      sessionId = `session_${Math.random().toString(36).substring(2, 15)}`;
      try {
        localStorage.setItem(storageKey, sessionId);
      } catch (e) {
        console.error("Error guardando sessionId en localStorage:", e);
        // Fallback si localStorage no está disponible o lleno
        return `temp_${Math.random().toString(36).substring(2, 10)}`;
      }
    }
    return sessionId;
  }
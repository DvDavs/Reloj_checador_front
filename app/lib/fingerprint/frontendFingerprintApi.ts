/**
 * Cliente API para los endpoints de /api/v1/frontend-fingerprint/
 * Usa el mismo getBaseUrl() que el apiClient existente del proyecto.
 */

import { getBaseUrl } from '@/lib/apiClient';

// =====================================================================
// Tipos de respuesta
// =====================================================================

export interface TestFormatResponse {
  success: boolean;
  fmdCreated: boolean;
  identified: boolean;
  employeeName?: string;
  format: string;
  errorMessage?: string;
}

export interface FrontendIdentifyResponse {
  identificado: boolean;
  empleadoId?: number;
  nombreCompleto?: string;
  rfc?: string;
  accion?: string;
  statusCode?: string;
  statusType?: string;
  data?: Record<string, unknown>;
  attendanceState?: {
    type: string;
    readerName: string;
    employeeData: Record<string, unknown>;
    dailyWorkSessions: Record<string, unknown>[];
    nextRecommendedActionBackend: string;
    activeSessionIdBackend: number | null;
    justCompletedSessionIdBackend: number | null;
  };
}

export interface FrontendEnrollResponse {
  success: boolean;
  huellaId?: number;
  empleadoId?: number;
  nombreDedo?: string;
  error?: string;
}

// =====================================================================
// Funciones de API
// =====================================================================

/**
 * Fase 0: Prueba de compatibilidad de formato.
 */
export async function testImportFormat(
  sampleData: string,
  sampleFormat: 'intermediate' | 'png'
): Promise<TestFormatResponse> {
  const res = await fetch(
    `${getBaseUrl()}/api/v1/frontend-fingerprint/test-import`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sampleData, sampleFormat }),
    }
  );
  return res.json();
}

/**
 * Fase 1.1: Identificar empleado y registrar asistencia.
 */
export async function identifyFingerprint(
  sampleData: string,
  sampleFormat: 'intermediate' | 'png',
  deviceName: string
): Promise<FrontendIdentifyResponse> {
  const res = await fetch(
    `${getBaseUrl()}/api/v1/frontend-fingerprint/identify`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sampleData, sampleFormat, deviceName }),
    }
  );
  return res.json();
}

/**
 * Obtiene el token JWT de autenticación del navegador.
 * Busca primero en cookies, luego en localStorage.
 */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;

  // 1. Buscar en cookie
  const cookies = document.cookie.split(';');
  const authCookie = cookies.find((c) => c.trim().startsWith('authToken='));
  if (authCookie) {
    return authCookie.split('=')[1]?.trim() || null;
  }

  // 2. Buscar en localStorage
  return localStorage.getItem('authToken');
}

/**
 * Fase 1.2: Enrollment de huella (4 muestras).
 * REQUIERE autenticación ADMIN (JWT).
 */
export async function enrollFingerprint(
  samples: string[],
  sampleFormat: 'intermediate' | 'png',
  empleadoId: number,
  nombreDedo: string
): Promise<FrontendEnrollResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Incluir token JWT para el endpoint protegido
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(
    `${getBaseUrl()}/api/v1/frontend-fingerprint/enroll`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ samples, sampleFormat, empleadoId, nombreDedo }),
    }
  );
  return res.json();
}

/**
 * Servicio wrapper tipado para el WebSDK de DigitalPersona.
 * Carga los scripts del SDK, expone métodos tipados y maneja eventos.
 */

// =====================================================================
// Tipos del SDK
// =====================================================================

export enum SampleFormat {
  Raw = 1,
  Intermediate = 2,
  Compressed = 3,
  PngImage = 5,
}

export enum QualityCode {
  Good = 0,
  NoImage = 1,
  TooLight = 2,
  TooDark = 3,
  TooNoisy = 4,
  LowContrast = 5,
  NotEnoughFeatures = 6,
  NotCentered = 7,
  NotAFinger = 8,
  TooHigh = 9,
  TooLow = 10,
  TooLeft = 11,
  TooRight = 12,
  TooStrange = 13,
  TooFast = 14,
  TooSkewed = 15,
  TooShort = 16,
  TooSlow = 17,
  ReverseMotion = 18,
  PressureTooHard = 19,
  PressureTooLight = 20,
  WetFinger = 21,
  FakeFinger = 22,
  TooSmall = 23,
  RotatedTooMuch = 24,
}

export interface DeviceInfo {
  DeviceID: string;
  [key: string]: unknown;
}

export interface SamplesAcquiredEvent {
  deviceUid: string;
  sampleFormat: SampleFormat;
  /**
   * Muestras capturadas. El WebSDK puede devolver:
   * - Un string base64url (muestra única)
   * - Un array de strings base64url
   * - Un objeto con Samples/Items (evitar "[object Object]")
   */
  samples: string | string[] | Record<string, unknown>;
}

export interface QualityReportedEvent {
  deviceUid: string;
  quality: QualityCode;
}

export interface ErrorOccurredEvent {
  deviceUid: string;
  error: number;
}

export interface DeviceEvent {
  deviceUid: string;
}

// =====================================================================
// Interfaz del SDK global (window.Fingerprint)
// =====================================================================

interface FingerprintWebApi {
  enumerateDevices(): Promise<string[]>;
  getDeviceInfo(deviceId: string): Promise<DeviceInfo>;
  startAcquisition(
    sampleFormat: SampleFormat,
    deviceId?: string
  ): Promise<void>;
  stopAcquisition(deviceId?: string): Promise<void>;
  on(event: string, handler: (data: unknown) => void): FingerprintWebApi;
  off(event: string, handler?: (data: unknown) => void): FingerprintWebApi;
}

declare global {
  interface Window {
    Fingerprint?: {
      WebApi: new () => FingerprintWebApi;
    };
  }
}

// =====================================================================
// Carga de scripts
// =====================================================================

const SDK_SCRIPTS = [
  '/lib/es6-shim.js',
  '/lib/websdk.client.bundle.min.js',
  '/lib/fingerprint.sdk.min.js',
] as const;

let sdkLoaded = false;
let sdkLoadPromise: Promise<void> | null = null;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(new Error('document no disponible (SSR)'));
      return;
    }
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
    document.head.appendChild(script);
  });
}

export async function loadSdk(): Promise<void> {
  if (sdkLoaded) return;
  if (sdkLoadPromise) return sdkLoadPromise;

  sdkLoadPromise = (async () => {
    for (const src of SDK_SCRIPTS) {
      await loadScript(src);
    }
    sdkLoaded = true;
  })();

  return sdkLoadPromise;
}

export function createWebApi(): FingerprintWebApi {
  if (!window.Fingerprint?.WebApi) {
    throw new Error(
      'WebSDK no disponible. Asegúrate de que el agente DigitalPersona esté ejecutándose.'
    );
  }
  return new window.Fingerprint.WebApi();
}

/**
 * Convierte base64url a base64 estándar.
 * El WebSDK devuelve muestras en base64url; el backend espera base64 estándar.
 */
export function base64UrlToBase64(base64url: string): string {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4;
  if (pad === 2) base64 += '==';
  else if (pad === 3) base64 += '=';
  return base64;
}

/** Regex para validar base64url (A-Za-z0-9_- y opcional =) */
const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+=*$/;

/** Busca recursivamente el primer string que parezca base64url en un objeto */
function findBase64InObject(obj: unknown): string | null {
  if (typeof obj === 'string') {
    return obj.length > 50 && BASE64URL_PATTERN.test(obj) ? obj : null;
  }
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = findBase64InObject(item);
      if (found) return found;
    }
    return null;
  }
  if (obj && typeof obj === 'object') {
    for (const v of Object.values(obj)) {
      const found = findBase64InObject(v);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Extrae la primera muestra base64 estándar de un evento SamplesAcquired.
 *
 * El WebSDK puede devolver `samples` como string, array, u objeto con estructura variable.
 */
export function extractSampleBase64(
  samples: string | string[] | Record<string, unknown>
): string | null {
  if (!samples) return null;

  let raw: string | null = null;

  if (typeof samples === 'string') {
    const trimmed = samples.trim();
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(samples);
        raw =
          findBase64InObject(parsed) ??
          (Array.isArray(parsed) ? parsed[0] : null);
      } catch {
        raw =
          trimmed.length > 50 && BASE64URL_PATTERN.test(trimmed)
            ? trimmed
            : null;
      }
    } else {
      raw = trimmed.length > 10 ? trimmed : null;
    }
  } else if (Array.isArray(samples)) {
    raw =
      samples.length > 0 && typeof samples[0] === 'string' ? samples[0] : null;
  } else if (typeof samples === 'object' && samples !== null) {
    raw = findBase64InObject(samples);
  }

  if (!raw || raw.length < 10) {
    console.warn(
      '[WebSDK] No se pudo extraer muestra válida. Tipo:',
      typeof samples,
      'keys:',
      typeof samples === 'object' && samples ? Object.keys(samples) : '-'
    );
    return null;
  }

  const base64 = base64UrlToBase64(raw);
  console.log('[WebSDK] Muestra extraída:', base64.length, 'chars base64');
  return base64;
}

export type { FingerprintWebApi };

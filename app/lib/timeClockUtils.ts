import type { ScanState } from './types/timeClockTypes';

export const getUserFriendlyMessage = (
  code: string | undefined,
  data: Record<string, any> | undefined,
  nombreEmpleado?: string
) => {
  if (!code) return 'Estado desconocido';

  switch (code) {
    // Códigos de éxito (2xx)
    case '200':
      return 'Entrada Registrada';
    case '201':
      return 'Salida registrada';
    case '202':
      return 'Entrada con retardo';
    case '203':
      return 'Regla aplicada';

    // Códigos de información (3xx)
    case '300': {
      const minWait = data?.minWaitMinutes || 5;
      return `Espera ${minWait} min para reintentar`;
    }
    case '301':
      return 'Entrada ya registrada';
    case '302':
      return 'Salida ya registrada';
    case '303':
      return 'Múltiples horarios hoy - consulta con el administrador';
    case '304':
      return 'Regla especial aplicada - consulta con el administrador';
    case '399':
      return 'Jornadas del día completas';

    // Códigos de error de reglas de negocio (4xx)
    case '400':
      return 'Huella no reconocida';
    case '401':
      return 'Fuera de horario permitido';
    case '402':
      return 'Sin horario asignado';
    case '403':
      return 'Empleado no encontrado';
    case '404':
      return 'Regla no aplicable';
    case '405':
      return 'Conflicto de reglas';
    case '406':
      return 'Salida no registrada - Sin entrada';
    case '407':
      return 'Sin permiso de usar número de tarjeta';

    // Código especial para FR - se guarda pero se muestra como error
    case 'FR':
      return 'Registro fuera de rango';

    // Códigos de error técnicos (5xx)
    case '500':
      return 'Error de lector';
    case '501':
      return 'Error de autenticación del dispositivo';
    case '502':
      return 'Error de base de datos';
    case '503':
      return 'Error de configuración';

    default:
      return 'Estado desconocido';
  }
};

export const getStyleClassesForCode = (
  code: string | undefined
): {
  panel: string;
  icon: string;
  timeBox: string;
  text: string;
  bgColor: string;
} => {
  const neutral = {
    panel: 'bg-app-dark border-app-brand/35',
    icon: 'text-app-brand-muted',
    timeBox: 'bg-app-elevated text-app-on-dark border-app-brand/40',
    text: 'text-app-on-dark',
    bgColor: 'bg-app-brand/15',
  };

  if (!code) {
    return neutral;
  }

  if (code === 'FR') {
    return {
      panel: 'bg-red-900/50 border-red-500',
      icon: 'text-red-500',
      timeBox: 'bg-app-elevated text-app-on-dark border-app-brand/40',
      text: 'text-red-400',
      bgColor: 'bg-red-500/20',
    };
  }

  if (code.startsWith('2')) {
    if (code === '202') {
      return {
        panel: 'bg-yellow-900/50 border-yellow-500',
        icon: 'text-yellow-500',
        timeBox: 'bg-yellow-500/30 text-yellow-300 border-yellow-500',
        text: 'text-yellow-400',
        bgColor: 'bg-yellow-500/20',
      };
    }
    return {
      panel: 'bg-app-brand/25 border-app-brand-muted/50',
      icon: 'text-app-brand-muted',
      timeBox: 'bg-app-brand/30 text-app-on-dark border-app-brand-muted/50',
      text: 'text-app-on-dark',
      bgColor: 'bg-app-brand/15',
    };
  }

  if (code.startsWith('3')) {
    return {
      panel: 'bg-app-brand-secondary/20 border-app-brand-secondary/55',
      icon: 'text-app-brand-muted',
      timeBox:
        'bg-app-brand-secondary/25 text-app-on-dark border-app-brand-muted/45',
      text: 'text-app-on-dark',
      bgColor: 'bg-app-brand-secondary/15',
    };
  }

  if (code.startsWith('4')) {
    return {
      panel: 'bg-red-900/50 border-red-500',
      icon: 'text-red-500',
      timeBox: 'bg-app-elevated text-app-on-dark border-app-brand/40',
      text: 'text-red-400',
      bgColor: 'bg-red-500/20',
    };
  }

  if (code.startsWith('5')) {
    return {
      panel: 'bg-red-900/50 border-red-500',
      icon: 'text-red-500',
      timeBox: 'bg-app-elevated text-app-on-dark border-app-brand/40',
      text: 'text-red-400',
      bgColor: 'bg-red-500/20',
    };
  }

  return neutral;
};

export const formatTime = (timeString: string | null): string => {
  if (!timeString) return '—';
  try {
    // Si es formato "yyyy-MM-dd HH:mm:ss", extraer la parte de hora
    if (timeString.includes(' ')) {
      return timeString.split(' ')[1].substring(0, 5); // "HH:mm"
    }
    // Si ya es formato "HH:mm:ss", solo tomar "HH:mm"
    return timeString.substring(0, 5); // "HH:mm"
  } catch (e) {
    return '—';
  }
};

export const formatCurrentTime = (date: Date = new Date()): string => {
  return `${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes()
  ).padStart(2, '0')}`;
};

export type TimeclockScanColor =
  | 'success'
  | 'info'
  | 'warning'
  | 'error'
  | 'idle'
  | 'neutral';

export const getScanColor = (
  state: ScanState,
  statusCode?: string
): TimeclockScanColor => {
  if (statusCode === 'FR') return 'error';

  if (statusCode) {
    if (statusCode.startsWith('2')) {
      if (statusCode === '202') return 'warning';
      return 'success';
    }
    if (statusCode.startsWith('3')) return 'info';
    if (statusCode.startsWith('4') || statusCode.startsWith('5'))
      return 'error';
  }

  if (state === 'success') return 'success';
  if (state === 'failed') return 'error';
  if (state === 'idle' || state === 'ready') return 'idle';
  return 'neutral';
};

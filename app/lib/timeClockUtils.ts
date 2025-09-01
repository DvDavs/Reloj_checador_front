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
  if (!code) {
    // Estado por defecto cuando no hay código
    return {
      panel: 'bg-zinc-900 border-zinc-800',
      icon: 'text-zinc-500',
      timeBox: 'bg-zinc-800 text-zinc-400 border-zinc-700',
      text: 'text-zinc-300',
      bgColor: 'bg-zinc-700/20',
    };
  }

  // Código especial FR - se trata como error visualmente
  if (code === 'FR') {
    return {
      panel: 'bg-red-900/50 border-red-500',
      icon: 'text-red-500',
      timeBox: 'bg-zinc-800 text-zinc-400 border-zinc-700', // Neutral en errores
      text: 'text-red-400',
      bgColor: 'bg-red-500/20',
    };
  }

  // Códigos de éxito (2xx)
  if (code.startsWith('2')) {
    // Caso especial para retardo (202)
    if (code === '202') {
      return {
        panel: 'bg-yellow-900/50 border-yellow-500',
        icon: 'text-yellow-500',
        timeBox: 'bg-yellow-500/30 text-yellow-300 border-yellow-500',
        text: 'text-yellow-400',
        bgColor: 'bg-yellow-500/20',
      };
    }
    // Otros éxitos (200, 201, 203)
    return {
      panel: 'bg-green-900/50 border-green-500',
      icon: 'text-green-500',
      timeBox: 'bg-green-500/30 text-green-300 border-green-500',
      text: 'text-green-400',
      bgColor: 'bg-green-500/20',
    };
  }

  // Códigos de información (3xx)
  if (code.startsWith('3')) {
    return {
      panel: 'bg-blue-900/50 border-blue-500',
      icon: 'text-blue-500',
      timeBox: 'bg-blue-500/30 text-blue-300 border-blue-500',
      text: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
    };
  }

  // Códigos de error de reglas de negocio (4xx)
  if (code.startsWith('4')) {
    return {
      panel: 'bg-red-900/50 border-red-500',
      icon: 'text-red-500',
      timeBox: 'bg-zinc-800 text-zinc-400 border-zinc-700', // Neutral en errores
      text: 'text-red-400',
      bgColor: 'bg-red-500/20',
    };
  }

  // Códigos de error técnicos (5xx)
  if (code.startsWith('5')) {
    return {
      panel: 'bg-red-900/50 border-red-500',
      icon: 'text-red-500',
      timeBox: 'bg-zinc-800 text-zinc-400 border-zinc-700', // Neutral en errores técnicos
      text: 'text-red-400',
      bgColor: 'bg-red-500/20',
    };
  }

  // Para cualquier otro código o formato inesperado, usar estilo neutral
  return {
    panel: 'bg-zinc-900 border-zinc-800',
    icon: 'text-zinc-500',
    timeBox: 'bg-zinc-800 text-zinc-400 border-zinc-700',
    text: 'text-zinc-300',
    bgColor: 'bg-zinc-700/20',
  };
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

export const getScanColor = (state: ScanState, statusCode?: string) => {
  // Si hay un código de estado, usar el mapeo de estilos basado en código
  if (statusCode) {
    // Caso especial para FR - se trata como failed
    if (statusCode === 'FR') {
      return 'red';
    }

    const styles = getStyleClassesForCode(statusCode);

    // Extraer el color base sin el prefijo "text-" y el sufijo "-500"
    const colorMatch = styles.icon.match(/text-(\w+)-\d+/);
    if (colorMatch && colorMatch[1]) {
      return colorMatch[1]; // Devuelve "green", "red", "blue", etc.
    }
  }

  if (state === 'success') return 'green';
  if (state === 'failed') return 'red';
  // Estados idle/ready ahora usan anaranjado en lugar de azul
  if (state === 'idle' || state === 'ready') return 'orange';
  return 'blue'; // Color neutro para otros estados
};

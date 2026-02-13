# Lectura de Lectores de Huella – Proceso de Captura y Checado

Documento técnico que describe el funcionamiento detallado de los lectores de huella dactilar: descubrimiento, reserva, **modo checador** (lectura para entrada/salida) y **modo enrolamiento** (captura para registro de huellas).

---

## 1. Descubrimiento de Lectores

### 1.1 APIs de descubrimiento

| API | Método | Descripción |
|-----|--------|-------------|
| `{baseUrl}/api/v1/multi-fingerprint/readers` | GET | Lista de lectores **disponibles** (no reservados). Usado en lanzador, admin y asignar huella. |
| `{baseUrl}/api/v1/multi-fingerprint/auto-select` | GET | Lista de **todos** los lectores conocidos (incluye reservados). Usado en asignar huella para mostrar estado. |
| `{baseUrl}/api/v1/multi-fingerprint/readers/reserved` | GET | Lista de lectores actualmente **reservados** con `readerName` y `sessionId`. Usado en monitoreo. |

### 1.2 Identificación de sesión

- **`browserSessionId`:** ID de sesión del navegador (persistido en `localStorage`). Se usa en **modo enrolamiento** y para reservas por sesión.
- **`instanceId`:** UUID único por ventana/pestaña del reloj checador. Se usa en **modo checador** para asociar reserva y tópico STOMP.

---

## 2. Modo Checador (Lectura para Entrada/Salida)

Flujo usado en `/reloj-checador` para checar entradas y salidas con huella.

### 2.1 Secuencia de inicialización

```
1. Usuario abre /reloj-checador?reader=...&sessionId=...
2. TimeClock genera instanceId (UUID) por ventana
3. useStompTimeClock:
   a) Conecta a WebSocket: {baseUrl}/ws-fingerprint
      - Header: X-Browser-Session-ID = sessionId
   b) Tras onConnect:
      - POST /api/v1/multi-fingerprint/reserve
        Body: { readerId, instanceId }
      - POST /api/v1/multi-fingerprint/start-clock-mode
        Body: { readerId, instanceId }
      - Suscribe a /topic/fingerprint-events/{instanceId}
   c) Listo para recibir eventos de lectura
```

### 2.2 Reserva y liberación (modo checador)

| Acción | API | Body/Params |
|--------|-----|-------------|
| Reservar | POST `{baseUrl}/api/v1/multi-fingerprint/reserve` | `{ readerId, instanceId }` |
| Iniciar modo checador | POST `{baseUrl}/api/v1/multi-fingerprint/start-clock-mode` | `{ readerId, instanceId }` |
| Liberar | POST `{baseUrl}/api/v1/multi-fingerprint/release` | `{ instanceId }` |

- La liberación se hace explícitamente al desmontar el componente y con `navigator.sendBeacon` en `beforeunload`.

### 2.3 Eventos STOMP (modo checador)

**Tópico:** `/topic/fingerprint-events/{instanceId}`

**Tipos de mensaje:**

1. **BackendChecadorEvent** (respuesta inmediata):
   ```json
   {
     "readerName": "string",
     "identificado": boolean,
     "empleadoId": number (opcional),
     "nombreCompleto": "string" (opcional),
     "rfc": "string" (opcional),
     "errorMessage": "string" (opcional),
     "accion": "entrada" | "salida" | "E" | "S",
     "statusCode": "string",
     "statusType": "string",
     "data": {}
   }
   ```

2. **FullAttendanceStateEvent** (estado completo de asistencia):
   ```json
   {
     "type": "FULL_ATTENDANCE_STATE_UPDATE",
     "readerName": "string",
     "employeeData": { /* EmpleadoDto */ },
     "dailyWorkSessions": [ /* JornadaEstadoDto */ ],
     "nextRecommendedActionBackend": "entrada" | "salida" | "ALL_COMPLETE" | "NO_ACTION",
     "activeSessionIdBackend": number | null,
     "justCompletedSessionIdBackend": number | null
   }
   ```

### 2.4 Flujo de lectura (checado)

1. Usuario coloca el dedo en el lector.
2. El backend procesa la huella y envía eventos por STOMP.
3. El frontend recibe `BackendChecadorEvent` o `FullAttendanceStateEvent`.
4. TimeClock actualiza UI: ScannerPanel, ShiftsPanel, AttendanceDetails.
5. Se reproduce feedback de audio (éxito/error).
6. Se muestra el historial de escaneos recientes.

---

## 3. Modo Enrolamiento (Captura para Registro de Huellas)

Flujo usado en `/empleados/asignar-huella` para registrar huellas de empleados.

### 3.1 Secuencia de reserva (por sesión)

```
1. Usuario selecciona empleado y lector
2. Usuario selecciona dedo (HandSelector: 1-10)
   - 1: Pulgar Derecho ... 5: Meñique Derecho
   - 6: Pulgar Izquierdo ... 10: Meñique Izquierdo
3. Al seleccionar dedo disponible:
   - POST /api/v1/multi-fingerprint/reserve/{readerName}?sessionId={browserSessionId}
   - POST /api/v1/multi-fingerprint/enroll/start/{readerName}?sessionId={browserSessionId}
   - Backend devuelve { sessionId: "enroll-uuid" }
4. Estado: ready_to_capture
```

### 3.2 Proceso de captura (4 pasos)

Se requieren **4 capturas** del mismo dedo para generar la plantilla biométrica.

| Paso | Estado | Acción del usuario | API |
|------|--------|--------------------|-----|
| 1 | `ready_to_capture` | Coloca dedo | Usuario pulsa "Capturar" o el backend detecta dedo |
| 2 | `capturing` | Mantiene dedo | POST `enroll/capture/{readerName}/{enrollmentSessionId}` |
| 3 | `capture_success` | Retira y vuelve a colocar | Repetir hasta 4 capturas |
| 4 | `enroll_complete` | — | Backend devuelve `{ complete: true, template: "base64..." }` |

### 3.3 APIs de enrolamiento

| API | Método | Parámetros | Body/Respuesta |
|-----|--------|------------|----------------|
| Reservar lector | POST `reserve/{readerName}` | `?sessionId={browserSessionId}` | — |
| Iniciar enrolamiento | POST `enroll/start/{readerName}` | `?sessionId={browserSessionId}` | `{ sessionId: "enroll-uuid" }` |
| Capturar huella | POST `enroll/capture/{readerName}/{enrollmentSessionId}` | — | `{ complete: boolean, remaining?: number, template?: string }` |
| Liberar lector | POST `release/{readerName}` | `?sessionId={browserSessionId}` | — |

### 3.4 Estados del proceso de captura

```
idle
  → reserving (reservar lector)
  → starting_enroll (iniciar enrolamiento)
  → ready_to_capture (listo para capturar)
  → capturing (capturando...)
  → capture_success (captura OK, repetir)
  → capture_failed (error, reintentar)
  → enroll_complete (4 capturas OK)
  → saving (guardando en servidor)
  → save_success | save_failed
```

### 3.5 Guardado de la huella

Tras `enroll_complete` con `template`:

```
POST /api/empleados/{empleadoId}/huellas
Body: {
  nombreDedo: "PULGAR DERECHO",
  templateBase64: "base64..."
}
```

### 3.6 Vista previa de imagen (WebSocket)

Durante el enrolamiento, el frontend se suscribe a imágenes de la huella en tiempo real:

- **Tópico:** `/topic/fingerprints/{browserSessionId}/{readerName}`
- **Mensaje:** `{ base64Image: "..." }`
- Se muestra en la UI para orientar al usuario (posición del dedo).

---

## 4. WebSocket (SockJS + STOMP)

### 4.1 Endpoint

```
{baseUrl}/ws-fingerprint
```

- SockJS como transporte.
- STOMP como protocolo de mensajería.

### 4.2 Headers de conexión

| Modo | Header | Valor |
|------|--------|-------|
| Checador | `X-Browser-Session-ID` | `sessionId` de la URL |
| Enrolamiento (imágenes) | `login`, `passcode` | `guest` (configuración actual) |

### 4.3 Tópicos STOMP

| Tópico | Uso |
|--------|-----|
| `/topic/fingerprint-events/{instanceId}` | Eventos de checado (reloj). |
| `/topic/fingerprints/{browserSessionId}/{readerName}` | Imágenes de captura durante enrolamiento. |

---

## 5. Mapeo de Dedos (HandSelector)

| Índice | Nombre |
|--------|--------|
| 1 | PULGAR DERECHO |
| 2 | ÍNDICE DERECHO |
| 3 | MEDIO DERECHO |
| 4 | ANULAR DERECHO |
| 5 | MEÑIQUE DERECHO |
| 6 | PULGAR IZQUIERDO |
| 7 | ÍNDICE IZQUIERDO |
| 8 | MEDIO IZQUIERDO |
| 9 | ANULAR IZQUIERDO |
| 10 | MEÑIQUE IZQUIERDO |

---

## 6. Diferencias entre Modo Checador y Modo Enrolamiento

| Aspecto | Modo Checador | Modo Enrolamiento |
|---------|---------------|-------------------|
| Contexto | `/reloj-checador` | `/empleados/asignar-huella` |
| Identificador | `instanceId` (UUID por ventana) | `browserSessionId` + `enrollmentSessionId` |
| Reserva | `reserve` con `readerId` + `instanceId` | `reserve/{readerName}?sessionId=` |
| Inicio | `start-clock-mode` | `enroll/start/{readerName}` |
| Lectura | Eventos continuos por STOMP | Capturas explícitas vía `enroll/capture` |
| Cantidad de lecturas | 1 por checada | 4 por dedo para generar plantilla |
| Tópico STOMP | `fingerprint-events/{instanceId}` | `fingerprints/{sessionId}/{readerName}` (imágenes) |
| Liberación | `release` con `{ instanceId }` | `release/{readerName}?sessionId=` |

---

## 7. Resumen de Rutas API (Lectores de Huella)

```
GET  /api/v1/multi-fingerprint/readers           # Lectores disponibles
GET  /api/v1/multi-fingerprint/auto-select      # Todos los lectores
GET  /api/v1/multi-fingerprint/readers/reserved  # Lectores reservados

POST /api/v1/multi-fingerprint/reserve                      # Checador (body: readerId, instanceId)
POST /api/v1/multi-fingerprint/reserve/{readerName}         # Enrolamiento (?sessionId=)
POST /api/v1/multi-fingerprint/start-clock-mode             # Activar modo checador
POST /api/v1/multi-fingerprint/release                      # Checador (body: instanceId)
POST /api/v1/multi-fingerprint/release/{readerName}         # Enrolamiento (?sessionId=)
POST /api/v1/multi-fingerprint/readers/release              # Monitoreo (?readerName=)

POST /api/v1/multi-fingerprint/enroll/start/{readerName}    # Iniciar enrolamiento
POST /api/v1/multi-fingerprint/enroll/capture/{readerName}/{enrollmentSessionId}  # Capturar

WS   {baseUrl}/ws-fingerprint                   # WebSocket SockJS+STOMP
```

---

*Documento generado a partir del análisis del repositorio Reloj_checador_front. Referencias: `useStompTimeClock.ts`, `asignar-huella/page.tsx`, `TimeClock.tsx`.*

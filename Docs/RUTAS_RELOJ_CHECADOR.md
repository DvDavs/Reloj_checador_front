# Informe: Rutas absolutas del Reloj Checador

Este documento describe todas las rutas absolutas relacionadas con la **lectura del reloj checador** en el proyecto: rutas de la aplicación (frontend), APIs del backend, WebSocket/STOMP y rutas internas de Next.js.

---

## 1. Rutas de la aplicación (Frontend – Next.js)

Base: URL donde se sirve el frontend (ej. `https://tudominio.com` o `http://localhost:3000`).

| Ruta absoluta | Descripción |
|---------------|-------------|
| `/reloj-checador` | Página principal del reloj checador. Muestra la interfaz de lectura (huella/PIN) y recibe eventos en tiempo real. Ruta **pública** (definida en `middleware.ts`). |
| `/reloj-checador?reader=...&sessionId=...` | Misma página con parámetros: `reader` (nombre del lector) y `sessionId` (sesión del navegador). Usada al abrir desde lanzador o panel admin. |
| `/lanzador` | Lanzador de sesiones: permite seleccionar un lector e iniciar una ventana de reloj checador. Ruta **pública**. |
| `/reloj-checador-old` | Versión antigua del reloj checador (legacy). |
| `/ads/` | Recursos de publicidad mostrados en el panel del reloj (`AdvertisingPanel`). Ruta **pública**. |

**Referencias en código:** `middleware.ts`, `app/layouts/main-layout.tsx`, `app/lanzador/page.tsx`, `app/admin/page.tsx`, `app/reloj-checador/page.tsx`, `app/reloj-checador-old/page.tsx`.

---

## 2. URL base de la API (Backend)

Todas las rutas de API del backend usan la misma base, obtenida con `getBaseUrl()` en `lib/apiClient.ts`:

- **Variable de entorno:** `NEXT_PUBLIC_API_BASE_URL`
- **Valor por defecto (desarrollo):** `http://localhost:8080`
- En cliente, si no hay variable de entorno: detección por `hostname` (localhost → `http://localhost:8080`, IP de red → `http://{hostname}:8080`).

---

## 3. Rutas de API – Huella y lectores (multi-fingerprint)

Usadas para listar lectores, reservar, iniciar modo checador y liberar. Base: `{baseUrl}` = `getBaseUrl()`.

| Ruta absoluta | Método | Descripción |
|---------------|--------|-------------|
| `{baseUrl}/api/v1/multi-fingerprint/readers` | GET | Lista de lectores de huella disponibles. Usado en lanzador y panel admin. |
| `{baseUrl}/api/v1/multi-fingerprint/readers/reserved` | GET | Lectores actualmente reservados. Usado en monitoreo. |
| `{baseUrl}/api/v1/multi-fingerprint/reserve` | POST | Reserva un lector para la sesión (body: `readerId`, `instanceId`). Se llama tras conectar el WebSocket. |
| `{baseUrl}/api/v1/multi-fingerprint/start-clock-mode` | POST | Inicia el modo checador en el lector (body: `readerId`, `instanceId`). Activa la lectura de huella. |
| `{baseUrl}/api/v1/multi-fingerprint/release` | POST | Libera el lector al cerrar o abandonar la sesión (body: `instanceId`). También se usa con `navigator.sendBeacon` en `beforeunload`. |

**Referencias:** `app/hooks/useStompTimeClock.ts`, `app/lanzador/page.tsx`, `app/admin/page.tsx`, `app/admin/monitoreo/page.tsx`.

---

## 4. WebSocket y STOMP (eventos en tiempo real)

Conexión y suscripción para recibir eventos de lectura del checador (huella, respuestas inmediatas).

| Ruta / recurso | Tipo | Descripción |
|----------------|------|-------------|
| `{baseUrl}/ws-fingerprint` | WebSocket (SockJS) | Endpoint de conexión STOMP. Header `X-Browser-Session-ID` con el ID de sesión del navegador. |
| `/topic/fingerprint-events/{instanceId}` | Tópico STOMP | Suscripción a eventos del lector asociado a `instanceId`. Los mensajes son `BackendChecadorEvent` o `FullAttendanceStateEvent`. |

**Referencias:** `app/hooks/useStompTimeClock.ts`.

---

## 5. Rutas de API – Registro de checadas (PIN pad y tarjeta)

Usadas durante la lectura/checado: envío de checada por PIN y consulta de empleado por tarjeta.

| Ruta absoluta | Método | Descripción |
|---------------|--------|-------------|
| `{baseUrl}/api/registros/pinpad` | POST | Envía la checada por teclado numérico (PIN/tarjeta). Body: `{ tarjeta: number }`. Header: `X-API-Key` (deviceKey). |
| `{baseUrl}/api/empleados/tarjeta/{numeroTarjeta}` | GET | Busca empleado por número de tarjeta. Usado en el reloj para mostrar datos al checar por tarjeta. |

**Referencias:** `lib/api/pinpad-api.ts`, `app/components/timeclock/TimeClock.tsx`.

---

## 6. Ruta interna de Next.js (mismo origen)

Llamadas desde el frontend al mismo host (sin usar `getBaseUrl()`).

| Ruta absoluta | Método | Descripción |
|---------------|--------|-------------|
| `/api/ads` | GET | Sirve la configuración o recursos de anuncios para el panel del reloj. Llamada con `fetch('/api/ads', { cache: 'no-store' })`. |

**Referencias:** `app/components/timeclock/AdvertisingPanel.tsx`.

---

## 7. Resumen en listas

### Rutas de aplicación (frontend)

```
/reloj-checador
/reloj-checador?reader=...&sessionId=...
/lanzador
/reloj-checador-old
/ads/
```

### Rutas de API (base = getBaseUrl(), ej. http://localhost:8080)

```
{baseUrl}/api/v1/multi-fingerprint/readers
{baseUrl}/api/v1/multi-fingerprint/readers/reserved
{baseUrl}/api/v1/multi-fingerprint/reserve
{baseUrl}/api/v1/multi-fingerprint/start-clock-mode
{baseUrl}/api/v1/multi-fingerprint/release
{baseUrl}/api/registros/pinpad
{baseUrl}/api/empleados/tarjeta/{numeroTarjeta}
```

### WebSocket y tópicos STOMP

```
{baseUrl}/ws-fingerprint
/topic/fingerprint-events/{instanceId}
```

### Ruta interna Next.js

```
/api/ads
```

---

## 8. Flujo típico de lectura del reloj checador

1. Usuario abre **`/lanzador`** o desde admin con **`/reloj-checador?reader=...&sessionId=...`**.
2. Frontend obtiene lectores con **GET** `{baseUrl}/api/v1/multi-fingerprint/readers`.
3. Se abre la página del reloj; se conecta a **`{baseUrl}/ws-fingerprint`** y se suscribe a **`/topic/fingerprint-events/{instanceId}`**.
4. Tras conectar: **POST** `{baseUrl}/api/v1/multi-fingerprint/reserve` y **POST** `{baseUrl}/api/v1/multi-fingerprint/start-clock-mode`.
5. Lectura por **huella**: eventos llegan por STOMP. Lectura por **PIN/tarjeta**: **GET** `{baseUrl}/api/empleados/tarjeta/{numeroTarjeta}` y **POST** `{baseUrl}/api/registros/pinpad`.
6. Al cerrar o salir: **POST** `{baseUrl}/api/v1/multi-fingerprint/release` (y opcionalmente `sendBeacon` en `beforeunload`).

---

*Documento generado a partir del análisis del repositorio Reloj_checador_front. Fecha de referencia: febrero 2025.*

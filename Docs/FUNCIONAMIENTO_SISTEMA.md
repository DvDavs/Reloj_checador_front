# Funcionamiento Actual del Sistema - Reloj Checador - Frontend

Documento de referencia que describe el funcionamiento completo del sistema de control de asistencia del Instituto Tecnológico de Oaxaca.

---

## 1. Descripción General

Sistema de control de asistencia basado en **Next.js v15** con TypeScript, que integra:

- **Reloj checador biométrico** (huella dactilar y PIN/tarjeta)
- **Gestión de empleados** y horarios asignados
- **Control de asistencia** con consolidación y corrección de estatus
- **Reportes** en múltiples formatos (Excel, CSV, PDF, Word)
- **Justificaciones** de faltas y permisos
- **Chequeos** y registro manual de entradas/salidas

### Tecnologías Principales

| Área | Tecnología |
|------|------------|
| Framework | Next.js |
| Lenguaje | TypeScript |
| UI | React, Shadcn UI, Tailwind CSS |
| Formularios | React Hook Form + Zod |
| HTTP | Axios |
| Estado | Zustand |
| Tiempo real | StompJS + SockJS (WebSockets) |
| Tablas | TanStack Table |

---

## 2. Arquitectura y Flujo de la Aplicación

### 2.1 Estructura de Layout

```
RootLayout (layout.tsx)
├── ThemeProvider
├── ThemeNavigationBlocker
├── NavigationTracker
├── NavigationGuard
├── AuthProvider
├── MainLayout
│   ├── Sidebar (si ruta no es login/reloj-checador)
│   └── main → children
└── Toaster
```

- **Páginas sin layout completo:** `/login`, `/reloj-checador` (sin sidebar, contenido a pantalla completa).
- **Resto de rutas:** Sidebar + contenido principal.

### 2.2 Autenticación

**Flujo de login:**

1. Usuario ingresa credenciales en `/login`.
2. `AuthContext.login()` envía POST a `/api/auth/login`.
3. Recibe `token`, `roles`, `username`.
4. Guarda token en `localStorage` y cookie `authToken`.
5. Cookie se usa para validación en middleware.
6. Redirección a `/` (home).

**Middleware:**

- Valida cookie `authToken` en cada petición.
- Rutas públicas: `/login`, `/reloj-checador`, `/lanzador`, `/ads/`.
- Sin token y ruta no pública → redirección a `/login`.
- Con token e intento de ir a `/login` → redirección a `/`.

**Logout:**

- Elimina token de `localStorage` y cookie.
- Borra header `Authorization` de `apiClient`.
- Redirige a `/login`.

---

## 3. Reloj Checador (Lectura Biométrica)

### 3.1 Flujo General

1. **Lanzamiento:** Usuario abre `/admin` o `/lanzador`.
2. **Selección de lector:** Se listan lectores disponibles (`GET /api/v1/multi-fingerprint/readers`).
3. **Apertura de ventana:** Se abre nueva ventana con `/reloj-checador?reader=...&sessionId=...`.
4. **Conexión WebSocket:** Conexión a `{baseUrl}/ws-fingerprint` (SockJS + STOMP).
5. **Reserva e inicio:** POST `reserve` y POST `start-clock-mode` con `instanceId`.
6. **Suscripción:** Al tópico `/topic/fingerprint-events/{instanceId}`.
7. **Lectura:** Usuario pone huella o ingresa PIN/tarjeta.
8. **Eventos:** Backend envía `BackendChecadorEvent` o `FullAttendanceStateEvent` por STOMP.
9. **Cierre:** POST `release` al cerrar o salir; `sendBeacon` en `beforeunload`.

### 3.2 Componente TimeClock

**Subcomponentes:**

- **HeaderClock:** Reloj en tiempo real.
- **ScannerPanel:** Área de lectura de huella (indicador visual).
- **ShiftsPanel:** Jornadas del día y acción recomendada (entrada/salida).
- **AttendanceDetails:** Detalle de asistencia del empleado.
- **AdvertisingPanel:** Anuncios/publicidad (fetch a `/api/ads`).
- **PinPadOverlay:** Entrada por PIN/tarjeta cuando el empleado lo permite.

**Estados de escaneo:**

- `idle`, `scanning`, `success`, `failed`, `ready`.
- Mensajes de usuario según `statusCode` y `statusType` del backend.

**Modos de checado:**

1. **Huella:** Eventos vía STOMP.
2. **PIN/tarjeta:** 
   - Búsqueda: `GET /api/empleados/tarjeta/{numeroTarjeta}`.
   - Registro: `POST /api/registros/pinpad` con `X-API-Key` (deviceKey).

### 3.3 Eventos STOMP

**BackendChecadorEvent (respuesta inmediata):**

```typescript
{
  readerName, identificado, empleadoId?, nombreCompleto?,
  rfc?, errorMessage?, accion?, statusCode?, statusType?, data?
}
```

**FullAttendanceStateEvent (estado completo):**

```typescript
{
  type: 'FULL_ATTENDANCE_STATE_UPDATE',
  readerName, employeeData, dailyWorkSessions,
  nextRecommendedActionBackend, activeSessionIdBackend,
  justCompletedSessionIdBackend?
}
```

---

## 4. Gestión de Empleados

### 4.1 Funcionalidades

| Ruta | Función |
|------|---------|
| `/empleados` | Lista de empleados con búsqueda, ordenamiento, paginación. Ver detalles, editar, horarios asignados. |
| `/empleados/registrar` | Alta de empleado (datos personales, departamento, foto). |
| `/empleados/editar/[id]` | Edición de empleado existente. |
| `/empleados/asignar-huella` | Registro de huellas dactilares con lectores biométricos. |

### 4.2 Asignación de Huellas

- Lista de lectores: `GET /api/v1/multi-fingerprint/readers`.
- Auto-selección: `POST /api/v1/multi-fingerprint/auto-select`.
- Reserva: `POST /api/v1/multi-fingerprint/reserve/{readerName}`.
- Liberación: `POST /api/v1/multi-fingerprint/release/{readerName}`.
- Inicio de enrolamiento: `POST /api/v1/multi-fingerprint/enroll/start/{readerName}`.
- Captura: `POST /api/v1/multi-fingerprint/enroll/capture/{readerName}`.
- Guardado: `POST /api/empleados/{id}/huellas`.

---

## 5. Gestión de Horarios

### 5.1 Plantillas de Horarios

| Ruta | Función |
|------|---------|
| `/horarios/plantillas` | Lista de plantillas. |
| `/horarios/plantillas/registrar` | Crear plantilla. |
| `/horarios/plantillas/editar/[id]` | Editar plantilla. |

**APIs:** `GET/POST /api/horarios`, `PUT /api/horarios/{id}`, `DELETE /api/horarios/{id}`.

### 5.2 Horarios Asignados

| Ruta | Función |
|------|---------|
| `/horarios/asignados` | Lista de asignaciones empleado–horario. |
| `/horarios/asignados/registrar` | Asignar horario a empleado (wizard). |
| `/horarios/asignados/editar/[id]` | Editar asignación. |

**APIs:** `GET/POST /api/horarios-asignados`, `PUT /api/horarios-asignados/{id}`, `DELETE /api/horarios-asignados/{id}`.

---

## 6. Control de Asistencia

### 6.1 Vista Principal (`/asistencias`)

**Dos modos:**

1. **Gestión:** Buscar asistencias consolidadas con filtros (fecha, empleado, tarjeta, departamento, estatus). Ver detalle de registros, cambiar estatus, agregar justificaciones inline.
2. **Consolidación:** Consolidación manual de estatus por fecha.

**APIs principales:**

- `buscarAsistenciasConsolidadas` → `GET /api/asistencias/buscar`
- `getEstatusDisponibles` → `GET /api/asistencias/estatus/disponibles`
- `buscarRegistrosDetalle` → `GET /api/registros-detalle`
- Cambio de estatus: `PUT /api/asistencias/{id}/estatus`
- Consolidación: `POST /api/estatus-asistencia/consolidar/{fecha}`

---

## 7. Justificaciones

### 7.1 Funcionalidades (`/justificaciones`)

| Vista | Función |
|-------|---------|
| Gestión | Consulta y filtrado de justificaciones registradas. |
| Crear | Alta de justificación individual o masiva. |

**APIs:** `GET /api/justificaciones`, `POST /api/justificaciones`, ` POST /api/justificaciones/masivo`, `GET /api/justificaciones/tipos`, `GET /api/justificaciones/paginated`.

---

## 8. Chequeos

### 8.1 Funcionalidades (`/chequeos`)

| Vista | Función |
|-------|---------|
| Gestión | Filtros y corrección de registros (entradas/salidas). |
| Registro Manual | Alta manual de entradas o salidas. |

**APIs:** `GET /api/registros-detalle`, `POST /api/registros/manual`, `GET /api/reglas-estatus/claves`, etc.

---

## 9. Reportes

### 9.1 Funcionalidades (`/reportes`)

- **Tipos:** Asistencia completa o por jornadas.
- **Filtros:** Fecha, departamento, empleado, estatus, tipo de registro, etc.
- **Formatos:** XLSX, CSV, PDF, DOCX.
- **APIs:** `GET /api/reportes/asistencias`, `GET /api/reportes/registros`, `GET /api/asistencias/estatus/disponibles`.

---

## 10. Panel de Administración

### 10.1 Rutas Admin

| Ruta | Función |
|------|---------|
| `/admin` | Panel principal: listar lectores, lanzar reloj checador en nueva ventana. |
| `/admin/monitoreo` | Sesiones activas: lectores reservados, liberación forzada. |
| `/admin/herramientas` | Centralización de herramientas: justificaciones, registros, corrección de estatus, consolidación. |

### 10.2 Monitoreo de Sesiones

- Lista: `GET /api/v1/multi-fingerprint/readers/reserved`.
- Liberación: `POST /api/v1/multi-fingerprint/readers/release?readerName=...`.
- Actualización automática cada 10 segundos.

---

## 11. Lanzador y Acceso Público

### 11.1 Lanzador (`/lanzador`)

- Ruta pública (sin login).
- Permite seleccionar lector y abrir reloj checador.
- Usa `GET /api/v1/multi-fingerprint/readers`.
- Abre ventana con `/reloj-checador?reader=...&sessionId=...`.

### 11.2 Command Palette

- Atajo de teclado (generalmente `Ctrl+K` o `Cmd+K`).
- Búsqueda rápida de rutas: Inicio, Reloj Checador, Monitoreo, Empleados, Horarios, Reportes, etc.

---

## 12. Configuración de API

### 12.1 URL Base

- `getBaseUrl()` en `lib/apiClient.ts`.
- Variable: `NEXT_PUBLIC_API_BASE_URL`.
- Por defecto: `http://localhost:8080`.
- En cliente: si no hay variable, se usa hostname (localhost → 8080, IP de red → mismo host:8080).

### 12.2 Interceptores

- Interceptor de `apiClient` para respuestas 401.
- Ante 401: logout automático y redirección a `/login`.

---

## 13. Resumen de Rutas de la Aplicación

| Ruta | Descripción |
|------|-------------|
| `/` | Inicio (accesos rápidos a Reloj, Empleados, Huellas). |
| `/login` | Login (público). |
| `/admin` | Panel de reloj checador. |
| `/admin/monitoreo` | Sesiones activas. |
| `/admin/herramientas` | Herramientas administrativas. |
| `/reloj-checador` | Reloj checador (público con parámetros). |
| `/lanzador` | Lanzador de sesiones (público). |
| `/empleados` | Lista de empleados. |
| `/empleados/registrar` | Alta de empleado. |
| `/empleados/editar/[id]` | Editar empleado. |
| `/empleados/asignar-huella` | Asignar huellas. |
| `/horarios/plantillas` | Plantillas de horarios. |
| `/horarios/plantillas/registrar` | Crear plantilla. |
| `/horarios/plantillas/editar/[id]` | Editar plantilla. |
| `/horarios/asignados` | Horarios asignados. |
| `/horarios/asignados/registrar` | Asignar horario. |
| `/horarios/asignados/editar/[id]` | Editar asignación. |
| `/asistencias` | Control de asistencia. |
| `/justificaciones` | Justificaciones. |
| `/chequeos` | Gestión de chequeos. |
| `/reportes` | Reportes. |

---

## 14. Temas y UI

- **ThemeProvider:** Tema light/dark del sistema.
- **ThemeToggle:** Cambio de tema.
- **ThemeNavigationBlocker:** Bloquea navegación durante cambio de tema.
- **NavigationTracker:** Rastrea navegación para UX.

---

*Documento generado a partir del análisis del repositorio Reloj_checador_front. Fecha de referencia: febrero 2025.*

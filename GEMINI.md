# Guía del Proyecto para Gemini

Este documento proporciona una descripción general del proyecto para el asistente de IA Gemini, con el objetivo de facilitar la colaboración y el desarrollo.

## Descripción General

Este es un proyecto de Next.js v15.2.4 con TypeScript, diseñado para ser un sistema de reloj checador. La interfaz de usuario se construye con React y componentes de Shadcn UI, estilizados con Tailwind CSS.

## Tecnologías Clave

- **Framework:** Next.js
- **Lenguaje:** TypeScript
- **UI:** React, Shadcn UI, Tailwind CSS
- **Gestión de Formularios:** React Hook Form con Zod para validación
- **Peticiones a API:** Axios
- **Gestión de Estado:** Zustand
- **Comunicación en Tiempo Real:** StompJS y SockJS para WebSockets
- **Tablas de Datos:** TanStack Table
- **Linting y Formato:** ESLint y Prettier

## Estructura del Proyecto

- `app/`: Contiene las rutas y las vistas principales de la aplicación.
- `components/`: Componentes de la interfaz de usuario reutilizables.
- `lib/`: Utilidades, hooks personalizados y lógica de API.
- `public/`: Archivos estáticos como imágenes y logos.
- `styles/`: Estilos globales.

## Comandos del Proyecto

- `npm run dev`: Inicia el servidor de desarrollo.
- `npm run build`: Compila la aplicación para producción.
- `npm run start`: Inicia el servidor de producción.
- `npm run lint`: Ejecuta ESLint para analizar el código.

## Convenciones de Codificación

- **Estilo:** Se utiliza Prettier para formatear el código automáticamente. Las reglas están definidas en `.prettierrc`.
- **Calidad del Código:** ESLint se utiliza para detectar problemas en el código. La configuración se encuentra en `.eslintrc.json`.
- **Commits:** Antes de cada commit, `husky` y `lint-staged` ejecutan Prettier y ESLint para asegurar que el código cumpla con los estándares de calidad.

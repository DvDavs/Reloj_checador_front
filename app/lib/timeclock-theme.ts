/**
 * Clases Tailwind alineadas con los tokens globales (`app/globals.css` → --app-*).
 * No dupliques hex aquí: edita solo las variables `--app-*` en `globals.css`.
 */
export const tcPanel = {
  surface: 'bg-app-dark',
  surfaceElevated: 'bg-app-elevated',
  border: 'border-app-brand-muted/40',
  borderStrong: 'border-app-brand/40',
  text: 'text-app-on-dark',
  textMuted: 'text-app-brand-muted',
} as const;

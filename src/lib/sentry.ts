import * as Sentry from '@sentry/react';

// Inert unless VITE_SENTRY_DSN is set -- call initSentry() once, as early
// as possible in main.tsx, before rendering the app.
const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;

export function initSentry(): void {
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
  });
}

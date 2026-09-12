import * as Sentry from '@sentry/node';
import type { Express } from 'express';

// Inert unless SENTRY_DSN is set -- this app ships with error monitoring
// wired up, but doesn't require a Sentry account to run. Import this
// module before anything else in index.ts so init happens as early as
// possible.
const dsn = process.env.SENTRY_DSN;

export const sentryEnabled = !!dsn;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.1
  });
  console.log('✓ Sentry error monitoring enabled');
}

export function setupSentryErrorHandler(app: Express): void {
  if (!dsn) return;
  Sentry.setupExpressErrorHandler(app);
}

export function captureException(error: unknown): void {
  if (!dsn) return;
  Sentry.captureException(error);
}

import express from 'express';
import cors from 'cors';
import { setupSentryErrorHandler, captureException } from './lib/sentry.js';
import authRoutes from './routes/auth.js';
import applicationRoutes from './routes/applications.js';
import instanceRoutes from './routes/instances.js';
import containerRoutes from './routes/containers.js';
import pipelineRoutes from './routes/pipelines.js';
import progressRoutes from './routes/progress.js';
import imageRoutes from './routes/images.js';
import ticketRoutes from './routes/tickets.js';
import scenarioRoutes from './routes/scenarios.js';
import dashboardRoutes from './routes/dashboard.js';
import networkingRoutes from './routes/networking.js';
import alertRoutes from './routes/alerts.js';
import gameStateRoutes from './routes/gameState.js';
import paymentRoutes from './routes/payment.js';
import terraformRoutes from './routes/terraform.js';
import ansibleRoutes from './routes/ansible.js';
import vaultRoutes from './routes/vault.js';
import gitopsRoutes from './routes/gitops.js';
import monitoringRoutes from './routes/monitoring.js';
import profileRoutes from './routes/profile.js';
import adminRoutes from './routes/admin.js';
import notificationRoutes from './routes/notifications.js';
import leaderboardRoutes from './routes/leaderboard.js';
import certificateRoutes from './routes/certificates.js';
import referralRoutes from './routes/referral.js';

const app = express();

// Trust the first proxy hop (e.g. the ngrok tunnel already in the CORS
// allowlist below) so express-rate-limit reads the real client IP from
// X-Forwarded-For instead of throwing or rate-limiting everyone as one IP.
app.set('trust proxy', 1);

const configuredOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = [
  'http://localhost:8080',
  'http://localhost:5173',
  'https://arlen-microseismical-daintily.ngrok-free.dev',
  ...configuredOrigins
].filter(Boolean) as string[];

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const matchesAllowedOrigin = (origin: string, allowedOrigin: string) => {
  if (allowedOrigin.includes('*')) {
    const pattern = `^${allowedOrigin.split('*').map(escapeRegex).join('.*')}$`;
    return new RegExp(pattern).test(origin);
  }

  return origin === allowedOrigin || origin.startsWith(allowedOrigin);
};

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.some((allowed) => matchesAllowedOrigin(origin, allowed))) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ 
    message: 'CloudOps Simulator API',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/instances', instanceRoutes);
app.use('/api/containers', containerRoutes);
app.use('/api/pipelines', pipelineRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/scenarios', scenarioRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/networking', networkingRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/game-state', gameStateRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/terraform', terraformRoutes);
app.use('/api/ansible', ansibleRoutes);
app.use('/api/vault', vaultRoutes);
app.use('/api/gitops', gitopsRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/referral', referralRoutes);

// A no-op if SENTRY_DSN isn't set -- must be registered after all routes
// but before the app's own final error handler below, per Sentry's setup
// requirements for Express.
setupSentryErrorHandler(app);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  captureException(err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

export default app;
import express from 'express';
import cors from 'cors';
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

const app = express();

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

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

export default app;
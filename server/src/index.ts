import 'dotenv/config';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Fastify from 'fastify';
import cors from '@fastify/cors';

import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import { readFileSync } from 'fs';
import authRoutes from './routes/auth.js';
import listsRoutes from './routes/lists.js';
import storesRoutes from './routes/stores.js';
import optimizeRoutes from './routes/optimize.js';
import missionsRoutes from './routes/missions.js';
import historyRoutes from './routes/history.js';
import preferencesRoutes from './routes/preferences.js';
import parseRoutes from './routes/parse.js';
import subscriptionRoutes from './routes/subscription.js';
import { connectDatabase, disconnectDatabase } from './lib/prisma.js';
import { seedDatabase } from './seed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = parseInt(process.env['PORT'] ?? '4000', 10);
const HOST = process.env['HOST'] ?? '0.0.0.0';
const JWT_SECRET = process.env['JWT_SECRET'] ?? 'dev-secret-change-in-production';

const app = Fastify({
  logger: {
    level: process.env['LOG_LEVEL'] ?? 'info',
  },
});

await app.register(cors, {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

await app.register(jwt, {
  secret: JWT_SECRET,
  sign: { algorithm: 'HS256' },
});

await app.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
});

await app.register(authRoutes);
await app.register(listsRoutes);
await app.register(storesRoutes);
await app.register(optimizeRoutes);
await app.register(missionsRoutes);
await app.register(historyRoutes);
await app.register(preferencesRoutes);
await app.register(parseRoutes);
await app.register(subscriptionRoutes);

app.get('/api/v1/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Serve app.html from project root
const appHtmlPath = join(__dirname, '..', '..', 'app.html');
app.get('/', async (_request, reply) => {
  try {
    const html = readFileSync(appHtmlPath, 'utf-8');
    return reply.type('text/html').send(html);
  } catch {
    return reply.status(404).send({ error: 'app.html not found' });
  }
});

app.setErrorHandler((error: Error & { statusCode?: number; code?: string }, _request, reply) => {
  app.log.error(error);
  const statusCode = error.statusCode ?? 500;
  const code = error.code ?? 'INTERNAL_ERROR';
  reply.status(statusCode).send({
    success: false,
    error: {
      code,
      message: process.env['NODE_ENV'] === 'production'
        ? 'An unexpected error occurred'
        : error.message,
    },
  });
});

// Connect to database and seed
await connectDatabase();
await seedDatabase(app.log);

try {
  await app.listen({ port: PORT, host: HOST });
  app.log.info(`Server running on http://${HOST}:${PORT}`);
} catch (err) {
  app.log.fatal(err);
  await disconnectDatabase();
  process.exit(1);
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  await app.close();
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await app.close();
  await disconnectDatabase();
  process.exit(0);
});

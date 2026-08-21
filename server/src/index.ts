import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
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

const PORT = parseInt(process.env['PORT'] ?? '3000', 10);
const HOST = process.env['HOST'] ?? '0.0.0.0';
const JWT_SECRET = process.env['JWT_SECRET'] ?? 'dev-secret-change-in-production';

const app = Fastify({
  logger: {
    level: process.env['LOG_LEVEL'] ?? 'info',
  },
});

await app.register(cors, {
  origin: process.env['CORS_ORIGIN'] ?? true,
  credentials: true,
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

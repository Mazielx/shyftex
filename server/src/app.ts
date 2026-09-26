/**
 * Fastify application factory.
 *
 * This module is transport-agnostic on purpose: it registers plugins and routes
 * and returns a ready instance, but it never calls `listen()`. That lets the same
 * app be served by a long-running Node process (local dev, Docker, Render) and by
 * a Vercel serverless function, where binding a port is meaningless.
 *
 * @vercel/node expects the entrypoint to default-export the Fastify instance.
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import Fastify, { type FastifyInstance } from 'fastify';
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
import { prisma } from './lib/prisma.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * True when running inside a Vercel function (build or runtime).
 * Detected via the platform env vars rather than a build flag so the same bundle
 * behaves correctly in both environments.
 */
export const isServerless = process.env['VERCEL'] === '1' || process.env['VERCEL_ENV'] !== undefined;

/** Fail fast: JWT_SECRET is required, especially in production. */
function readJwtSecret(): string {
  const secret = process.env['JWT_SECRET'];
  if (!secret) {
    throw new Error(
      'JWT_SECRET environment variable is required. Generate one with: openssl rand -hex 32',
    );
  }
  if (secret === 'dev-secret-change-in-production') {
    throw new Error('JWT_SECRET must not be the default dev value. Generate a real secret.');
  }
  return secret;
}

/**
 * Resolve the CORS allow-list from the environment.
 *
 * `CORS_ORIGIN` accepts a comma-separated list of exact origins. When it is
 * unset (or `*`) we fall back to reflecting the request origin, which is the
 * pre-existing local-development behaviour. Production must always set it —
 * reflecting arbitrary origins is a credential-leak footgun.
 */
function resolveCorsOrigin(): boolean | string[] {
  const raw = process.env['CORS_ORIGIN']?.trim();
  if (!raw || raw === '*') {
    return true;
  }
  const origins = raw
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
  return origins.length > 0 ? origins : true;
}

export async function buildApp(): Promise<FastifyInstance> {
  const jwtSecret = readJwtSecret();

  const app = Fastify({
    logger: {
      level: process.env['LOG_LEVEL'] ?? 'info',
    },
    // Vercel terminates TLS at the edge and forwards the real client IP in
    // X-Forwarded-For. Without this, `request.ip` is the proxy's address, which
    // would collapse rate limiting into a single shared bucket.
    trustProxy: true,
  });

  app.register(cors, {
    origin: resolveCorsOrigin(),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.register(jwt, {
    secret: jwtSecret,
    sign: { algorithm: 'HS256' },
  });

  app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  app.register(authRoutes);
  app.register(listsRoutes);
  app.register(storesRoutes);
  app.register(optimizeRoutes);
  app.register(missionsRoutes);
  app.register(historyRoutes);
  app.register(preferencesRoutes);
  app.register(parseRoutes);
  app.register(subscriptionRoutes);

  app.get('/api/v1/health', async (_request, reply) => {
    try {
      // Verify DB connectivity
      await prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', database: 'connected', timestamp: new Date().toISOString() };
    } catch {
      return reply.status(503).send({
        status: 'error',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Serve app.html from the project root (only present when the repository is
  // deployed; the handler degrades to a 404 JSON body when it is not).
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
    return reply.status(statusCode).send({
      success: false,
      error: {
        code,
        message: process.env['NODE_ENV'] === 'production'
          ? 'An unexpected error occurred'
          : error.message,
      },
    });
  });

  await app.ready();
  return app;
}

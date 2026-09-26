import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

/**
 * Neon (free tier) allows only a handful of concurrent connections per branch,
 * and a serverless runtime reuses one process across many invocations. Keep the
 * pool deliberately small and share a single client per process.
 */
const DEFAULT_POOL_MAX = 2;
const MAX_POOL_MAX = 10;

function readPoolMax(): number {
  const raw = process.env['DATABASE_POOL_MAX'];
  if (!raw) {
    return DEFAULT_POOL_MAX;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return DEFAULT_POOL_MAX;
  }
  return Math.min(parsed, MAX_POOL_MAX);
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env['DATABASE_URL'];
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const adapter = new PrismaPg(
    {
      connectionString,
      max: readPoolMax(),
    },
    {
      // Neon closes idle pooled sessions on its side. Without these listeners
      // the resulting 'error' events are unhandled and would tear down the lambda.
      onPoolError: (err: Error) => {
        console.error('[prisma] idle pool error', err.message);
      },
      onConnectionError: (err: Error) => {
        console.error('[prisma] connection error', err.message);
      },
    },
  );

  return new PrismaClient({ adapter });
}

/**
 * Cache the client on `globalThis`.
 *
 * A warm serverless container re-evaluates modules on some runtimes and a dev
 * server reloads them on every file change; without this cache each evaluation
 * would build a new pool and leak the previous one until the DB refuses new
 * connections. `globalThis` survives both.
 */
const globalForPrisma = globalThis as unknown as { __shyftexPrisma?: PrismaClient };

export const prisma: PrismaClient = globalForPrisma.__shyftexPrisma ?? createPrismaClient();
globalForPrisma.__shyftexPrisma = prisma;

export async function connectDatabase(): Promise<void> {
  await prisma.$connect();
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}

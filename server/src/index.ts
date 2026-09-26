/**
 * Entrypoint for both runtimes:
 *  - local dev / Docker / Render: starts a real HTTP server on $PORT
 *  - Vercel serverless: only default-exports the ready Fastify instance
 *
 * `@vercel/node` imports the default export, so this module must not bind a port
 * when running on Vercel.
 */
import 'dotenv/config';
import { buildApp, isServerless } from './app.js';
import { connectDatabase, disconnectDatabase } from './lib/prisma.js';
import { seedDatabase } from './seed.js';

const PORT = parseInt(process.env['PORT'] ?? '4000', 10);
const HOST = process.env['HOST'] ?? '0.0.0.0';

/** Demo stores are only seeded when explicitly asked for — never in production. */
function shouldSeed(): boolean {
  const flag = process.env['SEED_ON_START'];
  if (flag !== undefined) {
    return flag === 'true' || flag === '1';
  }
  return process.env['NODE_ENV'] !== 'production';
}

const app = await buildApp();

// On Vercel the module-level await above is the end of setup: the function
// handler is invoked with an already-ready instance. Seeding and listening are
// long-lived-process concerns only.
if (!isServerless) {
  await connectDatabase();
  if (shouldSeed()) {
    await seedDatabase(app.log);
  }

  try {
    await app.listen({ port: PORT, host: HOST });
    app.log.info(`Server running on http://${HOST}:${PORT}`);
  } catch (err) {
    app.log.fatal(err);
    await disconnectDatabase();
    process.exit(1);
  }

  // Graceful shutdown (long-lived runtimes only)
  process.on('SIGTERM', () => {
    void (async () => {
      await app.close();
      await disconnectDatabase();
      process.exit(0);
    })();
  });

  process.on('SIGINT', () => {
    void (async () => {
      await app.close();
      await disconnectDatabase();
      process.exit(0);
    })();
  });
}

export default app;

/**
 * Vercel serverless entrypoint.
 *
 * Vercel compiles every file under `api/` into a Node serverless function and
 * hands each invocation to the default export as a `(req, res)` handler.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { buildApp } from '../src/app.js';

/**
 * The app is built once per container and reused by every warm invocation.
 *
 * It is held as a promise rather than awaited at module scope on purpose: the
 * Vercel launcher loads this file with `require()`, and Node refuses to
 * `require()` an ESM graph containing a top-level await
 * (ERR_REQUIRE_ASYNC_MODULE). Awaiting here instead keeps the module
 * synchronously loadable while the async boot still happens exactly once.
 */
const appPromise = buildApp();

export default async function handler(
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  const app = await appPromise;
  // Idempotent: resolves immediately once booted, so warm requests pay nothing.
  await app.ready();
  // Bridge the raw Node request into Fastify's router.
  app.server.emit('request', request, response);
}
